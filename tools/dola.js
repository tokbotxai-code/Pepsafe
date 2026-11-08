// Finishes a square image made by the owner in an external generator: hides the generator's watermark and stray
// micro-text, adds a PepSafe badge and a bottom band with one fact line and the source, output 1080x1350 (4:5).
// Usage: node tools/dola.js <spec.json>   spec: [{in, out, fact, src, head?, cut?}]  (cut = fraction from the bottom to black out)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const LOGO = '<svg width="54" height="54" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#93A4AF" stroke-width="2.2" fill="none"/><circle cx="6" cy="24" r="4.6" fill="#6FA3E8"/><circle cx="14" cy="10" r="4.6" fill="#3CCFA9"/><circle cx="22" cy="22" r="4.6" fill="#FF9A66"/><circle cx="29" cy="8" r="4.6" fill="#C58BE0"/></svg>';

const page = s => `<!doctype html><html><body style="margin:0;width:1080px;height:1350px;background:#0a0c0f;overflow:hidden;position:relative;font-family:Inter,sans-serif">
<img src="data:image/png;base64,${fs.readFileSync(s.in).toString('base64')}" style="position:absolute;left:0;top:0;width:1080px;height:1080px">
<div style="position:absolute;left:0;right:0;top:0;height:80px;background:linear-gradient(#0a0c0f,rgba(10,12,15,0))"></div>
${s.cut ? `<div style="position:absolute;left:0;right:0;top:${Math.round(1080 * (1 - s.cut)) - 120}px;height:${Math.round(1080 * s.cut) + 120}px;background:linear-gradient(rgba(10,12,15,0),#0a0c0f 120px)"></div>` : ''}
<div style="position:absolute;left:0;right:0;top:1000px;height:80px;background:linear-gradient(rgba(10,12,15,0),#0a0c0f)"></div>
<div style="position:absolute;right:0;top:982px;width:300px;height:98px;background:linear-gradient(rgba(10,12,15,0),#0a0c0f 22px)"></div>
<div style="position:absolute;right:28px;top:22px;display:flex;align-items:center;gap:12px;font:800 34px Inter;color:#fff;text-shadow:0 2px 12px #000">${LOGO}PepSafe</div>
<div style="position:absolute;left:60px;right:60px;top:1090px;bottom:40px;display:flex;flex-direction:column;justify-content:center;gap:14px">
${s.head ? `<div style="font:900 64px/1.02 Inter;color:#fff;text-transform:uppercase">${esc(s.head)}</div>` : ''}
<div style="font:600 ${s.head ? 34 : 40}px/1.3 Inter;color:#E6EEF2">${esc(s.fact)}</div>
<div style="display:flex;justify-content:space-between;font:600 26px Inter;color:#93A4AF"><span>Source: ${esc(s.src)}</span><span style="color:#3CCFA9;font-weight:800">pepsafe.info</span></div>
</div></body></html>`;

(async () => {
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const s of spec) {
    const dir = path.join(root, 'tiktok', s.out); fs.mkdirSync(dir, { recursive: true });
    await pg.setContent(page(s)); await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(dir, 'post.jpg'), type: 'jpeg', quality: 90 });
    console.log('dola:', s.out);
  }
  await br.close();
})();
