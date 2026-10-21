// Renders a motion film (1080x1920 MP4) from a post.json spec: glowing amino-acid beads that drift, turn and
// refold from slide to slide, with the voiceover shown as 2-3 word captions timed to each spoken word.
// Usage: node tiktok/film.js tiktok/<folder>   ->  pepsafe-<folder>-film.mp4
// Voiceover: ElevenLabs "Jessica", one call per film (cached in vo.mp3 + vo.json, so re-renders cost nothing).
// Without ELEVENLABS_API_KEY, or with "vo": false, captions follow an even reading pace over the music alone.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');

const dir = path.resolve(process.argv[2]);
const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
const FPS = 30, W = 1080, H = 1920;
const OUTRO = post.outro !== undefined ? post.outro : 'More at pepsafe.info';

// one line per slide; the last one ends with the site, as in make.js
const lines = post.slides.map((s, i) => {
  let t = s.vo !== undefined && s.vo !== false ? s.vo : [s.big, s.title, s.text].filter(Boolean).join('. ');
  if (i === post.slides.length - 1 && OUTRO && !new RegExp(OUTRO.replace(/\./g, '\\.'), 'i').test(t))
    t = t.replace(/[.\s]*$/, '') + '. ' + OUTRO;
  return t.trim();
});

async function voice() {
  const mp3 = path.join(dir, 'vo.mp3'), js = path.join(dir, 'vo.json'), text = lines.join(' ');
  if (fs.existsSync(mp3) && fs.existsSync(js) && JSON.parse(fs.readFileSync(js)).text === text)
    return { mp3, ...JSON.parse(fs.readFileSync(js)) };
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key || post.vo === false) return null;
  const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/cgSgspJ2msm6clMCkdW9/with-timestamps', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
  });
  if (!r.ok) { console.error('voiceover failed:', r.status, (await r.text()).slice(0, 200)); return null; }
  const d = await r.json();
  fs.writeFileSync(mp3, Buffer.from(d.audio_base64, 'base64'));
  const al = d.alignment, words = [];
  let cur = null;
  al.characters.forEach((c, i) => {
    if (/\s/.test(c)) { cur = null; return; }
    if (!cur) { cur = { w: '', s: al.character_start_times_seconds[i] }; words.push(cur); }
    cur.w += c; cur.e = al.character_end_times_seconds[i];
  });
  fs.writeFileSync(js, JSON.stringify({ text, words }));
  return { mp3, text, words };
}

// words without a voice: an even reading pace, a little slower than speech
function paced() {
  const words = []; let t = 0.2;
  lines.forEach(l => { l.split(/\s+/).forEach(w => { words.push({ w, s: t, e: t + 0.32 }); t += 0.36; }); t += 0.35; });
  return words;
}

// captions: 2-3 words, broken at punctuation; each chunk stays until the next one starts
function chunks(words) {
  const out = []; let c = [];
  const flush = () => { if (c.length) out.push({ words: c, s: c[0].s }); c = []; };
  words.forEach((w, i) => { c.push(w); const nx = words[i + 1];
    if (/[.,?!:;]$/.test(w.w) || (c.length >= 3 && !(c.length === 3 && nx && /[.,?!:;]$/.test(nx.w)))) flush(); });
  flush();
  out.forEach((c, i) => { c.e = i < out.length - 1 ? out[i + 1].s : c.words[c.words.length - 1].e + 0.6; });
  // one accent word per chunk: the longest real word
  out.forEach(c => { let best = -1, len = 3; c.words.forEach((w, i) => { const n = w.w.replace(/[^\w]/g, '').length; if (n > len) { len = n; best = i; } }); c.hi = best; });
  return out;
}

(async () => {
  const v = await voice();
  const words = v ? v.words : paced();
  const caps = chunks(words);
  // slide boundaries: the start of each line's first word
  const counts = lines.map(l => l.split(/\s+/).length), starts = []; let k = 0;
  counts.forEach(n => { starts.push(words[Math.min(k, words.length - 1)].s); k += n; });
  const total = (v ? Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v.mp3]).toString()) : words[words.length - 1].e) + 0.9;
  const frames = Math.ceil(total * FPS);

  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="${W}" height="${H}"></canvas></body></html>`);
  await p.evaluate(({ caps, starts, total, W, H }) => {
    const cv = document.getElementById('c'), x = cv.getContext('2d');
    const N = 16, GOLD = '255,196,107', TEAL = '#3CCFA9';
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // shapes the chain moves between, one per slide; each returns bead i of N in 3D (centred near 0)
    const fold = []; { let px = 0, py = 0, pz = 0; for (let i = 0; i < N; i++) { fold.push([px, py, pz]); const a = rnd() * 6.28, e = rnd() * 3.14; px += Math.cos(a) * Math.sin(e) * 105; py += Math.cos(e) * 105; pz += Math.sin(a) * Math.sin(e) * 105; } const c = fold.reduce((s, q) => [s[0] + q[0] / N, s[1] + q[1] / N, s[2] + q[2] / N], [0, 0, 0]); fold.forEach(q => { q[0] -= c[0]; q[1] -= c[1]; q[2] -= c[2]; }); }
    const SH = [
      i => [((i % 2) ? 170 : -170) + (i - N / 2) * 6, (i - N / 2) * 70, (i % 2) ? 40 : -40],                         // zigzag strand
      i => [Math.sin(i * 0.7) * 250, (i - N / 2) * 66, Math.cos(i * 0.7) * 60],                 // loose wave
      i => [Math.cos(i * 0.75) * 250, (i - N / 2) * 56, Math.sin(i * 0.75) * 250],                // helix
      i => fold[i].map(q => q * 1.1),                                                             // folded ball
      i => { const a = i / N * 6.283; return [Math.cos(a) * 340, Math.sin(a) * 440, Math.sin(a * 2) * 90]; } // closed loop
    ];
    const bokeh = []; for (let i = 0; i < 60; i++) bokeh.push([rnd() * W, rnd() * H, 6 + rnd() * 28, rnd() * 0.5 + 0.1, rnd() * 6.28]);
    // everything costly is drawn once: the backdrop, one soft dot, and a glass bead at four levels of focus
    const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; };
    const BG = mk(W, H, g => { const r = g.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.45, H * 0.75); r.addColorStop(0, '#13202a'); r.addColorStop(1, '#030507'); g.fillStyle = r; g.fillRect(0, 0, W, H); });
    const DOT = mk(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${GOLD},1)`); r.addColorStop(1, `rgba(${GOLD},0)`); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
    const R0 = 90, PAD = 40, SZ = (R0 + PAD) * 2;
    const BEAD = [0, 3, 6, 10].map(bl => mk(SZ, SZ, g => {
      g.filter = bl ? `blur(${bl}px)` : 'none'; const c = SZ / 2, r = R0;
      const glass = g.createRadialGradient(c - r * 0.3, c - r * 0.35, r * 0.1, c, c, r);
      glass.addColorStop(0, 'rgba(255,255,255,0.20)'); glass.addColorStop(0.55, 'rgba(160,190,210,0.08)'); glass.addColorStop(1, 'rgba(220,235,245,0.30)');
      g.fillStyle = glass; g.beginPath(); g.arc(c, c, r, 0, 6.283); g.fill();
      const core = g.createRadialGradient(c, c, 0, c, c, r * 0.62);
      core.addColorStop(0, 'rgba(255,248,225,1)'); core.addColorStop(0.35, `rgba(${GOLD},0.95)`); core.addColorStop(1, `rgba(${GOLD},0)`);
      g.globalCompositeOperation = 'lighter'; g.fillStyle = core; g.beginPath(); g.arc(c, c, r * 0.62, 0, 6.283); g.fill();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(235,245,255,0.35)'; g.lineWidth = 2.5; g.beginPath(); g.arc(c, c, r, 0, 6.283); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(c - r * 0.38, c - r * 0.42, r * 0.18, r * 0.1, -0.6, 0, 6.283); g.fill();
    }));
    const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
    const font = s => `800 ${s}px "Inter Display", Inter, sans-serif`;

    window.draw = t => {
      // background and drifting bokeh
      x.drawImage(BG, 0, 0);
      bokeh.forEach(([bx, by, r, a, ph]) => {
        const yy = (by - t * 18 * a * 3 + H) % H, xx = bx + Math.sin(t * 0.4 + ph) * 20;
        x.globalAlpha = a * 0.5; x.drawImage(DOT, xx - r, yy - r, r * 2, r * 2);
      });
      x.globalAlpha = 1;
      // which shape: blend from the previous slide's shape over the first 0.9 s of each slide
      let si = 0; while (si < starts.length - 1 && t >= starts[si + 1]) si++;
      const m = ease((t - starts[si]) / 0.9), A = SH[Math.max(0, si - 1) % SH.length], B = SH[si % SH.length];
      const ry = t * 0.32, rx = 0.25 + Math.sin(t * 0.3) * 0.12, cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const grow = si === 0 ? ease(t / 1.2) : 1;   // the strand assembles in the first second
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = A(i), bb = B(i), q = si === 0 ? bb : [a[0] + (bb[0] - a[0]) * m, a[1] + (bb[1] - a[1]) * m, a[2] + (bb[2] - a[2]) * m];
        q[1] += Math.sin(t * 1.3 + i * 0.5) * 8;
        let X = q[0] * cy + q[2] * sy, Z = -q[0] * sy + q[2] * cy, Y = q[1] * cx - Z * sx; Z = q[1] * sx + Z * cx;
        const f = 1100 / (1100 + Z + 200);
        pts.push({ x: W / 2 + X * f, y: H * 0.39 + Y * f, s: f, z: Z, i, on: i < grow * N });
      }
      // bonds, then beads far to near, with soft focus on the far ones
      x.lineCap = 'round';
      for (let i = 1; i < N; i++) {
        const p0 = pts[i - 1], p1 = pts[i]; if (!p1.on) continue;
        x.strokeStyle = `rgba(${GOLD},0.55)`; x.lineWidth = 11 * (p0.s + p1.s) / 2;
        x.beginPath(); x.moveTo(p0.x, p0.y); x.lineTo(p1.x, p1.y); x.stroke();
      }
      pts.filter(q => q.on).sort((a, b) => b.z - a.z).forEach(q => {
        const blur = Math.max(0, (q.z + 60) / 60), lv = blur < 0.6 ? 0 : blur < 2.5 ? 1 : blur < 5 ? 2 : 3;
        const k = 76 * q.s / R0, d = SZ * k;
        x.drawImage(BEAD[lv], q.x - d / 2, q.y - d / 2, d, d);
      });
      // brand, top left
      x.globalAlpha = 0.9; x.font = font(44); x.fillStyle = '#E6EEF2'; x.textBaseline = 'middle'; x.textAlign = 'left';
      [['#6FA3E8', 0], ['#3CCFA9', 1], ['#FF9A66', 2], ['#C58BE0', 3]].forEach(([c, j]) => { x.fillStyle = c; x.beginPath(); x.arc(96 + j * 20, 150 + (j % 2 ? -12 : 12), 9, 0, 6.283); x.fill(); });
      x.fillStyle = '#E6EEF2'; x.fillText('PepSafe', 186, 150); x.globalAlpha = 1;
      // caption chunk
      const c = caps.find(c => t >= c.s && t < c.e);
      if (c) {
        const pop = 0.9 + 0.1 * ease((t - c.s) / 0.12), size = 98;
        x.save(); x.translate(W / 2, H * 0.66); x.scale(pop, pop);
        x.font = font(size); x.textAlign = 'left';
        const parts = c.words.map(w => w.w.toUpperCase()), gap = size * 0.28;
        // wrap to two rows if the chunk is too wide
        let rows = [parts], widths = () => rows.map(r => r.reduce((s, w) => s + x.measureText(w).width, 0) + gap * (r.length - 1));
        if (widths()[0] > W - 140 && parts.length > 1) rows = [parts.slice(0, Math.ceil(parts.length / 2)), parts.slice(Math.ceil(parts.length / 2))];
        const ws = widths(); let idx = 0;
        rows.forEach((r, ri) => {
          let xx = -ws[ri] / 2; const yy = (ri - (rows.length - 1) / 2) * size * 1.08;
          r.forEach(w => {
            x.shadowColor = 'rgba(0,0,0,0.75)'; x.shadowBlur = 24;
            x.lineWidth = 10; x.strokeStyle = 'rgba(0,0,0,0.55)'; x.strokeText(w, xx, yy);
            x.fillStyle = idx === c.hi ? TEAL : '#FFFFFF'; x.fillText(w, xx, yy); x.shadowBlur = 0;
            xx += x.measureText(w).width + gap; idx++;
          });
        });
        x.restore();
      }
      // closing card: the address
      const endIn = ease((t - (total - 1.8)) / 0.4);
      if (endIn > 0) { x.globalAlpha = endIn; x.font = font(88); x.textAlign = 'center'; x.fillStyle = TEAL; x.fillText('pepsafe.info', W / 2, H * 0.79); x.globalAlpha = 1; }
    };
  }, { caps, starts, total, W, H });

  const out = path.join(dir, 'pepsafe-' + path.basename(dir) + '-film.mp4'), silent = out.replace(/\.mp4$/, '.v.mp4');
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = 0; f < frames; f++) {
    const url = await p.evaluate(t => { window.draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.92); }, f / FPS);
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();

  // sound: the voice on top, the calm track quiet underneath, faded out at the end
  const music = path.join(__dirname, 'music-calm.m4a'), a = ['-y', '-i', silent];
  let f = '', mix = '', n = 0;
  if (v) { a.push('-i', v.mp3); f += `[${++n}:a]adelay=150|150,volume=1.1[s${n}];`; mix += `[s${n}]`; }
  if (fs.existsSync(music)) { a.push('-stream_loop', '-1', '-i', music); f += `[${++n}:a]volume=${v ? 0.14 : 0.5}[s${n}];`; mix += `[s${n}]`; }
  if (n) {
    f += `${mix}amix=inputs=${n}:duration=longest:normalize=0[m];[m]atrim=0:${total.toFixed(2)},afade=t=out:st=${(total - 1).toFixed(2)}:d=1[out]`;
    a.push('-filter_complex', f, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', out);
    execFileSync('ffmpeg', a, { stdio: 'ignore' }); fs.unlinkSync(silent);
  } else fs.renameSync(silent, out);
  console.log('done', path.basename(out), total.toFixed(1) + ' s', v ? '+ lektor' : '(bez lektora)');
})();
