// Clicks through the live site like a visitor, on a phone and a computer, in EN, PL and ES.
// kontrola.js checks files and links; this checks what only shows up in a real browser:
// search (quick list, Enter, results page), language list, phone menu, card pages, console errors.
// Usage: node tools/test-strony.js [base URL]   (default https://pepsafe.info). Exit code 1 = something broke.
const { chromium } = require('playwright');
const BASE = (process.argv[2] || 'https://pepsafe.info').replace(/\/$/, '');
const bad = [];
const fail = (what, why) => bad.push(`${what}: ${why}`);

(async () => {
  const b = await chromium.launch();
  const devices = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, pc: { viewport: { width: 1300, height: 800 } } };
  for (const [dev, opt] of Object.entries(devices)) for (const [L, q, card] of [['en', 'glp1', 'semaglutide'], ['pl', 'reta', 'retatrutide'], ['es', 'tirzepatida', 'tirzepatide']]) {
    const c = await b.newContext(opt), p = await c.newPage(), tag = `${dev} ${L}`;
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const go = async u => { const r = await p.goto(BASE + u + (u.includes('?') ? '&' : '?') + 't=' + Date.now()); if (!r || r.status() >= 400) fail(`${tag} ${u}`, 'HTTP ' + (r && r.status())); await p.waitForTimeout(700); };
    try {
      // every tab in the menu opens
      await go(`/${L}/`);
      const tabs = await p.$$eval('.links a, .menufoot ~ * a, #menu a', a => [...new Set(a.map(x => x.getAttribute('href')))].filter(h => h && h.startsWith('/') ));
      for (const t of tabs.slice(0, 14)) { const r = await p.request.get(BASE + t); if (r.status() >= 400) fail(`${tag} zakładka ${t}`, 'HTTP ' + r.status()); }
      // quick search list, click the first result
      await go(`/${L}/`);
      await p.click('#find'); await p.waitForTimeout(400); await p.keyboard.type(q, { delay: 40 }); await p.waitForTimeout(400);
      const n = await p.$$eval('.findlist li', l => l.length);
      if (n < 2) fail(`${tag} lupa "${q}"`, 'brak podpowiedzi');
      await p.click('.findlist li a'); await p.waitForTimeout(800);
      if (/404|not found|nie znaleziono|no encontrada/i.test(await p.title())) fail(`${tag} lupa "${q}" → klik`, '404 ' + p.url());
      // Enter opens the whole-site results
      await go(`/${L}/catalog.html`);
      await p.click('#find'); await p.waitForTimeout(400); await p.keyboard.type(q, { delay: 40 }); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
      if (!p.url().includes(`/${L}/search.html`)) fail(`${tag} Enter "${q}"`, 'nie otworzył wyników: ' + p.url());
      if (!(await p.$$eval('#sres li', l => l.length))) fail(`${tag} wyniki "${q}"`, 'pusta lista');
      // catalog filter
      await go(`/${L}/catalog.html`);
      await p.fill('#q', card.slice(0, 5)); await p.waitForTimeout(500);
      if (!(await p.$$eval('.entry', e => e.filter(x => x.offsetParent).length))) fail(`${tag} katalog`, 'filtr nic nie pokazuje');
      // language list has three working links
      const langs = await p.$$eval('.lp a', a => a.map(x => x.getAttribute('href')));
      if (langs.length !== 3) fail(`${tag} lista języków`, langs.length + ' linków');
      for (const h of langs) { const r = await p.request.get(BASE + h); if (r.status() >= 400) fail(`${tag} język ${h}`, 'HTTP ' + r.status()); }
      // card page in this language
      await go(`/p/${card}${L === 'en' ? '' : '.' + L}.html`);
      if (!(await p.$('h1'))) fail(`${tag} karta ${card}`, 'brak nagłówka');
      if (errs.length) fail(tag, 'błąd skryptu: ' + errs[0]);
    } catch (e) { fail(tag, e.message.split('\n')[0]); }
    await c.close();
  }
  await b.close();
  console.log(bad.length ? `test strony: ${bad.length} problemów\n - ` + bad.join('\n - ') : 'test strony: wszystko działa (telefon i komputer, EN/PL/ES)');
  process.exit(bad.length ? 1 : 0);
})();
