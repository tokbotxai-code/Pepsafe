// Instagram + Facebook image for a site article (4:5 JPG, same look as the catalog cards). Not for TikTok.
// Usage: node tools/artykul-post.js <folder under tiktok/> "<kicker>" "<title>" "<point>|<point>|<point>" "<url shown at the bottom>"
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const [dir, kicker, title, points, url] = process.argv.slice(2);
if (!url) { console.log('usage: node tools/artykul-post.js <folder> "<kicker>" "<title>" "p1|p2|p3" "<url>"'); process.exit(1); }
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;background:#0B1419;color:#E6EEF2;font-family:Inter,sans-serif;position:relative;overflow:hidden}
.glow{position:absolute;width:900px;height:900px;right:-300px;top:-300px;border-radius:50%;background:radial-gradient(circle,#3CCFA933,transparent 65%)}
.brand{position:absolute;left:80px;top:72px;font:800 40px "Inter Display",Inter}
.wrap{position:absolute;left:80px;right:80px;top:200px;bottom:170px;display:flex;flex-direction:column;gap:34px}
.k{font:600 32px Inter;letter-spacing:.12em;text-transform:uppercase;color:#93A4AF}
h1{font:800 92px/1.04 "Inter Display",Inter;letter-spacing:-.02em}
.pt{display:flex;gap:22px;align-items:flex-start}.pt i{flex:none;width:18px;height:18px;border-radius:50%;background:#3CCFA9;margin-top:22px}
p{font:500 42px/1.34 Inter;color:#C9D6DD}
.foot{position:absolute;left:80px;right:80px;bottom:70px;display:flex;justify-content:space-between;font:600 30px Inter;color:#93A4AF}.foot b{color:#3CCFA9}
</style></head><body><div class="glow"></div><div class="brand">PepSafe</div>
<div class="wrap"><div class="k">${esc(kicker)}</div><h1>${esc(title)}</h1>${points.split('|').map(x => `<div class="pt"><i></i><p>${esc(x)}</p></div>`).join('')}</div>
<div class="foot"><span>Educational, not medical advice</span><b>${esc(url)}</b></div></body></html>`;
(async () => {
  const out = path.join(__dirname, '..', 'tiktok', dir); fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1350 } });
  await pg.setContent(html); await pg.waitForTimeout(150);
  if (await pg.evaluate(() => { const w = document.querySelector('.wrap'); return w.scrollHeight > w.clientHeight + 2; })) { console.log('text too long for the card'); process.exit(1); }
  const png = path.join(out, 'post.png'); await pg.screenshot({ path: png });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', path.join(out, 'post.jpg')]); fs.unlinkSync(png);
  await br.close(); console.log('ok', path.join(out, 'post.jpg'));
})();
