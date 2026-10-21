// Catalog cards for Instagram and Facebook: one 4:5 JPG per substance, built from dane.html (English fields),
// with a ready caption that links to the substance's own page. Not for TikTok (it names the substance).
// Usage: node tools/karty.js [N]   -> the next N substances without a card yet (default 8),
//        node tools/karty.js --name "Semaglutyd"   -> one card for a given catalog name.
// Output: tiktok/karta-<slug>/karta.jpg + caption.txt + karta.json (name, slug, url). A card folder that exists is never redone.
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const a = lines.findIndex(l => /^var ST=\{A:/.test(l)), b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const box = { window: {}, document: {}, console }; vm.createContext(box);
vm.runInContext('var D=[];function E(n,a,s,c,cat,f,d,m,u,ev,w,q,wa){D.push({n,a,s,c,cat,f,d,m,u,ev,w})}', box);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
const { D, EN, ST_EN } = box;

const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// words the platforms read as facilitating use; a sentence with any of them stays off the card and the caption
const AVOID = /\b(inject\w*|dose\w*|dosing|buy\w*|vials?|shops?|cycles?|protocols?|stacks?|syringes?|purchase\w*)\b/i;
// split only where a new sentence starts (capital letter after the stop), so "e.g." and "11.2%" stay whole
const sentences = t => String(t || '').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“„(])/).filter(Boolean);
const clean = (t, n) => sentences(t).map(s => s.trim()).filter(s => !AVOID.test(s)).slice(0, n).join(' ');
const TONE = { A: '#3CCFA9', R: '#6FA3E8', P: '#6FA3E8', U: '#FF9A66', C: '#F2B134', N: '#9AA8B3' };

function card(e) {
  const t = EN[e.n]; if (!t) return null;
  const [name, cls, d, m, , ev] = t;
  const what = clean(d, 2), how = clean(m, 1), proof = clean(ev, 1);
  if (!what && !how) return null;
  // the class line is printed as is, so an avoided word there (e.g. "vial") rules the card out
  if (AVOID.test(cls) || AVOID.test(name)) { console.log('avoided word, skipped:', name); return null; }
  const s = slug(name), status = ST_EN[e.s] || e.s;
  // the caption never opens with the name: it starts from the class, the name comes after
  const nameRe = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const lead = [what, how].map(x => sentences(x)[0]).find(x => x && !nameRe.test(x)) || `A closer look at one ${cls.toLowerCase()}.`;
  const caption = `${lead.trim()} 🔬\n\n${name} — ${cls}. Status: ${status}.${proof ? ' Evidence: ' + proof : ''}\n\n` +
    `The full card, with sources: pepsafe.info/p/${s}.html\n\nEducational content, not medical advice. More at pepsafe.info\n\n` +
    `#peptides #science #health #facts #pepsafe`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;background:#0B1419;color:#E6EEF2;font-family:Inter,sans-serif;position:relative;overflow:hidden}
.glow{position:absolute;width:900px;height:900px;right:-300px;top:-300px;border-radius:50%;background:radial-gradient(circle,${TONE[e.s]}33,transparent 65%)}
.brand{position:absolute;left:80px;top:72px;font:800 40px "Inter Display",Inter;display:flex;gap:16px;align-items:center}
.wrap{position:absolute;left:80px;right:80px;top:200px;bottom:170px;display:flex;flex-direction:column;gap:30px}
.cls{font:600 32px Inter;letter-spacing:.12em;text-transform:uppercase;color:#93A4AF}
h1{font:800 96px/1.02 "Inter Display",Inter;letter-spacing:-.02em}
.pill{align-self:flex-start;font:800 36px Inter;padding:12px 28px;border-radius:999px;border:4px solid ${TONE[e.s]};color:${TONE[e.s]}}
h3{font:700 28px Inter;letter-spacing:.1em;text-transform:uppercase;color:${TONE[e.s]};margin-bottom:10px}
p{font:500 37px/1.36 Inter;color:#C9D6DD}
.foot{position:absolute;left:80px;right:80px;bottom:70px;display:flex;justify-content:space-between;font:600 30px Inter;color:#93A4AF}
.foot b{color:#3CCFA9}
</style></head><body><div class="glow"></div>
<div class="brand"><svg width="56" height="56" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#93A4AF" stroke-width="2" fill="none"/><circle cx="6" cy="24" r="4.5" fill="#6FA3E8"/><circle cx="14" cy="10" r="4.5" fill="#3CCFA9"/><circle cx="22" cy="22" r="4.5" fill="#FF9A66"/><circle cx="29" cy="8" r="4.5" fill="#C58BE0"/></svg>PepSafe</div>
<div class="wrap"><div class="cls">${esc(cls)}</div><h1>${esc(name)}</h1><div class="pill">${esc(status)}</div>
${what ? `<div><h3>What it is</h3><p>${esc(what)}</p></div>` : ''}${how ? `<div><h3>How it works</h3><p>${esc(how)}</p></div>` : ''}${proof ? `<div><h3>Evidence</h3><p>${esc(proof)}</p></div>` : ''}</div>
<div class="foot"><span>Educational, not medical advice</span><b>pepsafe.info/p/${esc(s)}</b></div></body></html>`;
  return { name, s, html, caption };
}

(async () => {
  const args = process.argv.slice(2), byName = args[0] === '--name' ? args[1] : null;
  const n = byName ? 1 : Number(args[0] || 8);
  const todo = [];
  for (const e of D) {
    if (byName && e.n !== byName) continue;
    const c = card(e); if (!c) continue;
    if (fs.existsSync(path.join(root, 'tiktok', 'karta-' + c.s))) continue;
    todo.push(c); if (todo.length >= n) break;
  }
  if (!todo.length) { console.log('nothing to do'); return; }
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const c of todo) {
    const dir = path.join(root, 'tiktok', 'karta-' + c.s); fs.mkdirSync(dir, { recursive: true });
    await pg.setContent(c.html); await pg.waitForTimeout(100);
    // text must fit: if the column runs into the footer, the card is skipped rather than published cut off
    const over = await pg.evaluate(() => { const w = document.querySelector('.wrap'); return w.scrollHeight > w.clientHeight + 2; });
    if (over) { fs.rmSync(dir, { recursive: true }); console.log('too long, skipped:', c.name); continue; }
    const png = path.join(dir, 'karta.png'); await pg.screenshot({ path: png });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', path.join(dir, 'karta.jpg')]); fs.unlinkSync(png);
    fs.writeFileSync(path.join(dir, 'caption.txt'), c.caption + '\n');
    fs.writeFileSync(path.join(dir, 'karta.json'), JSON.stringify({ name: c.name, slug: c.s, url: `https://pepsafe.info/tiktok/karta-${c.s}/karta.jpg` }, null, 1));
    console.log('card:', c.name, '->', 'tiktok/karta-' + c.s);
  }
  await br.close();
})();
