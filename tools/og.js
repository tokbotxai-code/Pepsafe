// Buduje obrazek pokazywany przy udostepnianiu linku (1200x630), po jednym na jezyk.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// liczba wpisow prosto z katalogu, zeby obrazek nie klamal po kazdym dodaniu substancji
const N = (fs.readFileSync(path.join(__dirname, '..', 'dane.html'), 'utf8').match(/^E\(/gm) || []).length;
const OUT = path.join(__dirname, '..', 'src');
const T = {
  en: { h: 'Peptide facts,<br>not sales.', p: `${N} substances · status, evidence, warnings`, d: 'pepsafe.info' },
  pl: { h: 'Fakty o peptydach,<br>bez sprzedaży.', p: `${N} substancji · status, dowody, ostrzeżenia`, d: 'pepsafe.info' }
};
const page = t => `<!doctype html><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;700&display=swap');
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#F6F6F3;font-family:'Inter Tight',system-ui;display:flex;
  flex-direction:column;justify-content:center;padding:84px;position:relative;overflow:hidden}
.blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.42}
.b1{width:520px;height:520px;background:#2F6DB5;right:-120px;top:-150px}
.b2{width:420px;height:420px;background:#0A7C66;right:120px;bottom:-180px}
.b3{width:300px;height:300px;background:#C2410C;right:-60px;bottom:120px;opacity:.3}
h1{font-size:72px;line-height:1.04;letter-spacing:-.035em;font-weight:700;color:#14171A;position:relative}
p{font-size:28px;color:#5C6560;margin-top:26px;font-weight:500;position:relative}
.d{position:absolute;left:84px;bottom:72px;font-size:26px;font-weight:700;color:#14171A;display:flex;align-items:center;gap:14px}
svg{display:block}
</style>
<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
<h1>${t.h}</h1><p>${t.p}</p>
<div class="d"><svg width="38" height="38" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#8A918D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="24" r="4.5" fill="#2F6DB5"/><circle cx="14" cy="10" r="4.5" fill="#0A7C66"/><circle cx="22" cy="22" r="4.5" fill="#C2410C"/><circle cx="29" cy="8" r="4.5" fill="#8B3FA8"/></svg>${t.d}</div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [lang, t] of Object.entries(T)) {
    await p.setContent(page(t)); await p.waitForTimeout(900);
    const f = path.join(OUT, `og-${lang}.png`);
    await p.screenshot({ path: f });
    console.log('zapisano', path.relative(process.cwd(), f), (fs.statSync(f).size / 1024).toFixed(0) + ' kB');
  }
  await b.close();
})();
