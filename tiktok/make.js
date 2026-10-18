// Renders a TikTok slide set (1080x1920 PNG) and a silent MP4 slideshow from a post.json spec.
// Usage: node tiktok/make.js tiktok/<folder>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const dir = path.resolve(process.argv[2]);
const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const css = `
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;background:#0B1419;color:#E6EEF2;font-family:Inter,"DejaVu Sans",sans-serif;overflow:hidden;position:relative}
.chain{position:absolute;opacity:.18}
.wrap{position:absolute;left:90px;right:170px;top:230px;bottom:420px;display:flex;flex-direction:column;justify-content:center;gap:44px}
.kick{font:600 38px Inter;letter-spacing:.14em;text-transform:uppercase;color:#3CCFA9}
h1{font:800 104px/1.04 "Inter Display",Inter;letter-spacing:-.02em}
h2{font:800 84px/1.08 "Inter Display",Inter;letter-spacing:-.015em}
p{font:500 50px/1.38 Inter;color:#C9D6DD}
.big{font:900 340px/0.9 "Inter Display",Inter;color:#3CCFA9;letter-spacing:-.04em}
.verdict{display:inline-block;align-self:flex-start;font:800 64px Inter;padding:14px 34px;border-radius:18px}
.no{background:#3A1E14;color:#FF8A5C;border:4px solid #FF8A5C}
.yes{background:#12332D;color:#3CCFA9;border:4px solid #3CCFA9}
.part{background:#3A2F12;color:#F2B134;border:4px solid #F2B134}
ul{list-style:none;display:flex;flex-direction:column;gap:30px;padding:0}
li{font:600 52px/1.3 Inter;padding-left:64px;position:relative}
li:before{content:"";position:absolute;left:0;top:18px;width:30px;height:30px;border-radius:50%;background:#FF8A5C}
.brand{position:absolute;left:90px;top:120px;display:flex;align-items:center;gap:20px;font:800 46px "Inter Display",Inter}
.brand small{font:500 28px Inter;color:#93A4AF;display:block;letter-spacing:.02em}
.foot{position:absolute;left:90px;right:170px;bottom:330px;font:500 30px Inter;color:#93A4AF}
.page{position:absolute;right:170px;top:136px;font:600 32px Inter;color:#93A4AF}
.cta{font:900 110px/1 "Inter Display",Inter;color:#3CCFA9}
`;
const logo = `<svg width="64" height="64" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#93A4AF" stroke-width="2" fill="none"/><circle cx="6" cy="24" r="4.5" fill="#6FA3E8"/><circle cx="14" cy="10" r="4.5" fill="#3CCFA9"/><circle cx="22" cy="22" r="4.5" fill="#FF9A66"/><circle cx="29" cy="8" r="4.5" fill="#C58BE0"/></svg>`;
function chain(seed) {
  const cols = ['#6FA3E8', '#3CCFA9', '#FF9A66', '#C58BE0', '#9AA8B3']; let pts = '', dots = '';
  for (let i = 0; i < 9; i++) { const x = 60 + i * 120, y = 140 + Math.sin(i * 0.9 + seed) * 70; pts += (i ? ' L' : 'M') + x + ' ' + y; dots += `<circle cx="${x}" cy="${y}" r="26" fill="${cols[(i + seed) % 5]}"/>`; }
  return `<svg class="chain" style="left:0;bottom:120px" width="1080" height="300"><path d="${pts}" stroke="#93A4AF" stroke-width="6" fill="none"/>${dots}</svg>`;
}
function slide(s, i, n) {
  let body = '';
  if (s.kicker) body += `<div class="kick">${esc(s.kicker)}</div>`;
  if (s.big) body += `<div class="big">${esc(s.big)}</div>`;
  if (s.verdict) body += `<div class="verdict ${s.tone || 'no'}">${esc(s.verdict)}</div>`;
  if (s.title) body += s.hero ? `<h1>${esc(s.title)}</h1>` : `<h2>${esc(s.title)}</h2>`;
  if (s.text) body += `<p>${esc(s.text)}</p>`;
  if (s.list) body += `<ul>${s.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (s.cta) body += `<div class="cta">${esc(s.cta)}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="brand">${logo}<div>PepSafe<small>${esc(post.tagline || 'Fakty o peptydach, bez ściemy')}</small></div></div>
<div class="page">${i + 1}/${n}</div><div class="wrap">${body}</div>
${s.foot ? `<div class="foot">${esc(s.foot)}</div>` : ''}${chain(i)}</body></html>`;
}

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const files = [];
  for (let i = 0; i < post.slides.length; i++) {
    await p.setContent(slide(post.slides[i], i, post.slides.length)); await p.waitForTimeout(150);
    const f = path.join(dir, `slide-${String(i + 1).padStart(2, '0')}.png`); await p.screenshot({ path: f }); files.push(f);
  }
  await b.close();
  // silent MP4: each slide shown for its own duration with a short crossfade
  const dur = post.slides.map(s => s.seconds || 3.5), fade = 0.4, args = ['-y'];
  files.forEach((f, i) => args.push('-loop', '1', '-t', String(dur[i]), '-i', f));
  let filter = '', last = '[0:v]', off = 0;
  for (let i = 1; i < files.length; i++) {
    off += dur[i - 1] - fade;
    filter += `${last}[${i}:v]xfade=transition=fade:duration=${fade}:offset=${off.toFixed(2)}[v${i}];`; last = `[v${i}]`;
  }
  filter += `${last}format=yuv420p[out]`;
  args.push('-filter_complex', filter, '-map', '[out]', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', path.join(dir, 'pepsafe-' + path.basename(dir) + '.mp4'));
  execFileSync('ffmpeg', args, { stdio: 'ignore' });
  fs.writeFileSync(path.join(dir, 'caption.txt'), post.caption + '\n');
  console.log('done', files.length, 'slides');
})();
