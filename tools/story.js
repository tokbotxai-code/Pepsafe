// Stories 9:16 for Instagram + Facebook (never TikTok: they show substance names).
// Each story is a short animated MP4 (moving particles, pulsing pepsafe.info sticker, calm music), built from the site's data.
// Usage: node tools/story.js [YYYY-MM-DD] [type|random] [count]
//   types: daily (Peptide of the day), myth, glossary, faq, trick, card (random catalog entry), promo (the site itself)
//   random picks different types and topics each day (seeded by the date, so a re-run gives the same stories).
// Output: tiktok/<date>-story-<n>-<type>-en/story.mp4 + story.jpg (still), and the list of folders on stdout.
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const date = process.argv[2] || new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
const want = process.argv[3] || 'random', count = Number(process.argv[4] || 1);

// catalog and data blocks, read the same way as tools/reel.js
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const a = lines.findIndex(l => /^var ST=\{A:/.test(l)), b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const box = { window: {}, document: {}, console }; vm.createContext(box);
vm.runInContext('var D=[];function E(n,a,s,c,cat,f,d,m,u,ev,w){D.push({n,s})}', box);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
const block = name => {
  const i = lines.findIndex(l => l.startsWith(`var ${name}=[`)); if (i < 0) return [];
  let src = '', depth = 0;
  for (let k = i; k < lines.length; k++) { src += lines[k] + '\n'; for (const ch of lines[k].replace(/"(?:\\.|[^"\\])*"/g, '')) { if (ch === '[') depth++; if (ch === ']') depth--; } if (depth <= 0) break; }
  try { vm.runInContext(src.replace(`var ${name}=`, `this.${name}=`), box); } catch { return []; }
  return box[name] || [];
};
const DAILY = block('DAILY'), MYTHS = block('MYTHS'), GL = block('GL'), FAQ = block('FAQ'), TRICKS = block('TRICKS');

const AVOID = /\b(inject\w*|dose\w*|dosing|buy\w*|vials?|shops?|cycles?|protocols?|stacks?|syringes?|banned|prohibited)\b/i;
const ok = (...s) => s.every(x => x && !AVOID.test(x));
const first = (t, n = 2, max = 230) => String(t).split(/(?<!\b(?:e\.g|i\.e|vs|approx|Dr|St)\.)(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter(s => s.length < max && ok(s)).slice(0, n);
let seed = [...date].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 2147483647, 7);
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = arr => arr[Math.floor(rnd() * arr.length)];

const THEMES = [
  { bg: '#070D11', fg: '#E6EEF2', ac: '#3CCFA9', glow: '60,207,169' },
  { bg: '#0D0A1A', fg: '#F1ECFF', ac: '#C58BE0', glow: '197,139,224' },
  { bg: '#140B07', fg: '#FFF1E8', ac: '#FF9A3C', glow: '255,154,60' },
  { bg: '#06101E', fg: '#E8F1FF', ac: '#6FA3E8', glow: '111,163,232' },
  { bg: '#F4F1EA', fg: '#121417', ac: '#E5532D', glow: '229,83,45' },
];
const TONE = { A: '#3CCFA9', R: '#6FA3E8', P: '#6FA3E8', U: '#FF9A66', C: '#F2B134', N: '#9AA8B3' };

// each builder returns {kick, title, sub, body:[...], pill} or null when nothing usable
const B = {
  daily() {
    const d = DAILY.find(e => e.date === date) || DAILY.filter(e => e.date <= date).sort((x, y) => y.date < x.date ? -1 : 1)[0];
    const t = d && box.EN[d.n], e = d && box.D.find(x => x.n === d.n); if (!t || !e) return null;
    return { kick: 'PEPTIDE OF THE DAY', title: t[0], sub: t[1], body: first(d.en), pill: box.ST_EN[e.s] || e.s, tone: TONE[e.s] };
  },
  card() {
    const pool = box.D.filter(e => box.EN[e.n] && ok(box.EN[e.n][0], box.EN[e.n][1]));
    for (let i = 0; i < 20; i++) {
      const e = pick(pool), t = box.EN[e.n], body = first(t[2] || t[3] || '', 2);
      if (body.length) return { kick: 'FROM THE CATALOG', title: t[0], sub: t[1], body, pill: box.ST_EN[e.s] || e.s, tone: TONE[e.s] };
    }
    return null;
  },
  myth() {
    const m = pick(MYTHS.filter(x => ok(x[1], x[4]))); if (!m) return null;
    return { kick: m[2] === 't' ? 'TRUE OR FALSE?' : 'MYTH VS FACT', title: '“' + m[1] + '”', big: false, body: first(m[4], 2), pill: m[2] === 't' ? 'TRUE' : m[2] === 'f' ? 'FALSE' : 'IT DEPENDS' };
  },
  glossary() {
    const g = pick(GL.filter(x => x.en && ok(...x.en))); if (!g) return null;
    return { kick: 'WORD OF THE DAY', title: g.en[0], body: first(g.en[1], 2, 260), pill: 'Glossary' };
  },
  faq() {
    const f = pick(FAQ.filter(x => x[0] && x[0].en && ok(x[0].en, x[1].en))); if (!f) return null;
    return { kick: 'YOU ASKED', title: f[0].en, big: false, body: first(f[1].en, 2), pill: 'FAQ' };
  },
  trick() {
    const t = pick(TRICKS.filter(x => ok(x.t[1], x.d[1]))); if (!t) return null;
    return { kick: 'MARKETING TRICK', title: t.t[1], big: false, body: first(t.d[1], 2), pill: 'Spot it' };
  },
  promo() {
    return { kick: 'PEPSAFE.INFO', title: pick(['200+ peptides. One honest catalog.', 'Approved or not? Check in 10 seconds.', 'Facts, status and sources. No hype.']),
      big: false, body: ['Status, research and real sources for every entry.', 'Free, no sign-up, in English and Polish.'], pill: 'Free' };
  },
};
const TYPES = ['daily', 'myth', 'glossary', 'faq', 'trick', 'card', 'promo'];

function page(s, th) {
  const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const ac = s.tone || th.ac, big = s.big !== false && s.title.length < 18;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:${th.bg};overflow:hidden;font-family:Inter,sans-serif;color:${th.fg};position:relative}
canvas{position:absolute;inset:0}
#brand{position:absolute;left:70px;top:120px;display:flex;align-items:center;gap:18px;font:800 46px Inter}
.w{position:absolute;left:70px;right:70px;top:290px;bottom:330px;display:flex;flex-direction:column;justify-content:center;gap:34px}
.k{font:800 38px Inter;letter-spacing:.18em;color:${ac}}
.t{font:900 ${big ? 128 : 76}px/${big ? 1 : 1.12} Inter;letter-spacing:-.02em}
.s{font:600 40px/1.3 Inter;opacity:.7;margin-top:28px;letter-spacing:0}
.f{display:flex;flex-direction:column;gap:26px}
.f p{font:600 44px/1.32 Inter;background:${th.bg}d0;border-left:8px solid ${ac};padding:24px 30px;border-radius:14px}
.p{align-self:flex-start;font:800 40px Inter;padding:14px 34px;border-radius:999px;border:5px solid ${ac};color:${ac};background:${th.bg}}
#st{position:absolute;left:50%;bottom:170px;transform:translateX(-50%);display:flex;align-items:center;gap:18px;background:#fff;color:#111;font:800 46px Inter;padding:26px 46px;border-radius:26px;box-shadow:0 10px 40px rgba(0,0,0,.45);white-space:nowrap}
#st i{display:inline-block;width:54px;height:54px;border-radius:50%;background:${ac};color:#fff;font:900 36px/54px Inter;text-align:center;font-style:normal}
#ar{position:absolute;left:50%;bottom:300px;transform:translateX(-50%);font:900 60px Inter;color:${ac}}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<div id="brand"><svg width="78" height="78" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#93A4AF" stroke-width="2.2" fill="none"/><circle cx="6" cy="24" r="4.6" fill="#6FA3E8"/><circle cx="14" cy="10" r="4.6" fill="#3CCFA9"/><circle cx="22" cy="22" r="4.6" fill="#FF9A66"/><circle cx="29" cy="8" r="4.6" fill="#C58BE0"/></svg>PepSafe</div>
<div class="w"><div class="k">${esc(s.kick)}</div><div class="t">${esc(s.title)}${s.sub ? '<div class="s">' + esc(s.sub) + '</div>' : ''}</div>
<div class="f">${s.body.map(x => '<p>' + esc(x) + '</p>').join('')}</div>
${s.pill ? '<div class="p">' + esc(s.pill) + '</div>' : ''}</div>
<div id="ar">↓</div><div id="st"><i>↗</i>pepsafe.info · link in bio</div>
<script>
const x=document.getElementById('c').getContext('2d'),ST=document.getElementById('st'),AR=document.getElementById('ar');
const COL=['#6FA3E8','#3CCFA9','#FF9A66','#C58BE0'];let sd=${Math.floor(rnd() * 1e6) + 1};const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
const P=[...Array(55)].map(()=>({x:r()*1080,y:r()*1920,z:.3+r()*1.2,c:COL[Math.floor(r()*4)],p:r()*6.28}));
window.frame=t=>{x.clearRect(0,0,1080,1920);const g=x.createRadialGradient(800,650+Math.sin(t)*60,40,800,650,950);g.addColorStop(0,'rgba(${th.glow},.22)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,1080,1920);
 const q=P.map(p=>({X:p.x+Math.sin(t*.6*p.z+p.p)*40,Y:(p.y-t*30*p.z+1920*3)%1920,z:p.z,c:p.c}));
 x.lineWidth=2;for(let i=0;i<q.length;i++)for(let j=i+1;j<q.length;j++){const d=Math.hypot(q[i].X-q[j].X,q[i].Y-q[j].Y);if(d<170){x.strokeStyle='rgba(147,164,175,'+(0.18*(1-d/170))+')';x.beginPath();x.moveTo(q[i].X,q[i].Y);x.lineTo(q[j].X,q[j].Y);x.stroke();}}
 for(const p of q){x.globalAlpha=.14+.22*p.z/1.5;x.fillStyle=p.c;x.beginPath();x.arc(p.X,p.Y,6+10*p.z,0,6.28);x.fill();}x.globalAlpha=1;
 const s=1+.06*Math.max(0,Math.sin(t*5));ST.style.transform='translateX(-50%) scale('+s+') rotate('+(Math.sin(t*2.5)*2)+'deg)';AR.style.transform='translateX(-50%) translateY('+(Math.abs(Math.sin(t*4))*-24)+'px)';};
</script></body></html>`;
}

(async () => {
  const order = want === 'random' ? [...TYPES].sort(() => rnd() - .5) : [want];
  const made = [], br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  const FPS = 24, SEC = 6;
  for (const type of order) {
    if (made.length >= count) break;
    if (!B[type]) { console.error('unknown type', type); process.exit(1); }
    const s = B[type](); if (!s || !s.body.length) continue;
    const th = pick(THEMES), dir = path.join(root, 'tiktok', `${date}-story-${made.length + 1}-${type}-en`);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await pg.setContent(page(s, th)); await pg.waitForTimeout(250);
    const fr = path.join(dir, 'frames'); fs.mkdirSync(fr);
    for (let i = 0; i < FPS * SEC; i++) { await pg.evaluate(t => window.frame(t), i / FPS); await pg.screenshot({ path: path.join(fr, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 88 }); }
    fs.copyFileSync(path.join(fr, 'f0012.jpg'), path.join(dir, 'story.jpg'));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(fr, 'f%04d.jpg'), '-stream_loop', '-1', '-i', path.join(root, 'tiktok', 'music-calm.m4a'),
      '-filter_complex', `[1:a]volume=0.35,atrim=0:${SEC},afade=t=out:st=${SEC - 1}:d=1[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-c:a', 'aac', '-t', String(SEC), '-movflags', '+faststart', path.join(dir, 'story.mp4')]);
    fs.rmSync(fr, { recursive: true });
    made.push(path.relative(root, dir)); console.log('story:', path.relative(root, dir), '|', s.title);
  }
  await br.close();
})();
