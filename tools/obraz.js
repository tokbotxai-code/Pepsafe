// Single dramatic image post for TikTok (in the style of the owner's Dola examples): a free generated background
// (Pollinations, abstract/anatomy only, no people's faces needed) + our own headline and fact, so spelling and facts stay ours.
// TikTok gets it as a photo post with autoAddMusic. Never put substance names in the headline, line or caption.
// Usage: node tools/obraz.js <folder> "<image prompt>" "<HEADLINE>" "<one-line fact>"
// Output: tiktok/<folder>/obraz.jpg (1080x1920)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const [folder, prompt, head, line] = process.argv.slice(2);
if (!folder || !prompt || !head || !line) { console.error('usage: node tools/obraz.js <folder> "<prompt>" "<HEADLINE>" "<fact>"'); process.exit(1); }
const dir = path.join(root, 'tiktok', folder); fs.mkdirSync(dir, { recursive: true });
const bg = path.join(dir, 'tlo.jpg');

// the free service allows one image per ~45 s; retry a few times and check we really got a JPEG
const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt + ', dramatic cinematic lighting, highly detailed, no text, no letters, no words') +
  '?width=1080&height=1920&nologo=true&model=flux&seed=' + Math.floor(Math.random() * 1e6);
for (let i = 0; i < 4; i++) {
  try { execFileSync('curl', ['-s', '-m', '180', '-o', bg, url]); } catch {}
  if (fs.existsSync(bg) && fs.readFileSync(bg).slice(0, 2).toString('hex') === 'ffd8') break;
  if (i === 3) { console.error('image service failed'); process.exit(1); }
  execFileSync('sleep', ['50']);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;background:#0b0b0b;font-family:Inter,sans-serif;overflow:hidden;position:relative">
<img src="data:image/jpeg;base64,${fs.readFileSync(bg).toString('base64')}" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.35) 0%,rgba(0,0,0,0) 18%,rgba(0,0,0,0) 45%,rgba(11,11,11,.9) 66%,#0b0b0b 80%)"></div>
<div style="position:absolute;left:70px;top:110px;font:800 46px Inter;color:#fff">PepSafe</div>
<div style="position:absolute;left:80px;right:80px;top:1290px;height:3px;background:linear-gradient(90deg,transparent,#e5322d,transparent)"></div>
<div style="position:absolute;left:60px;right:60px;top:1330px;text-align:center;font:900 92px/1 Inter;text-transform:uppercase;color:#fff;letter-spacing:-1px">${esc(head)}</div>
<div style="position:absolute;left:90px;right:90px;top:1600px;text-align:center;font:600 44px/1.3 Inter;color:#ddd">${esc(line)}</div>
<div style="position:absolute;left:0;right:0;bottom:90px;text-align:center;font:800 38px Inter;color:#e5322d">pepsafe.info</div>
</body></html>`;
(async () => {
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(html); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(dir, 'obraz.jpg'), type: 'jpeg', quality: 90 });
  await br.close(); fs.unlinkSync(bg);
  console.log('obraz:', path.relative(root, path.join(dir, 'obraz.jpg')));
})();
