// Clicks through the live site like a visitor, on a phone and a computer, in EN, PL and ES.
// kontrola.js checks files and links; this checks what only shows up in a real browser:
// search (quick list, Enter, results page), language list, phone menu, card pages, console errors,
// then opens every page in the sitemap on a phone.
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
      // results page follows typing: clearing empties it, a new word fills it again
      await p.fill('#sq', ''); await p.waitForTimeout(400);
      if (await p.$$eval('#sres li', l => l.length)) fail(`${tag} wyniki`, 'po skasowaniu zostają stare');
      await p.type('#sq', 'glp1', { delay: 40 }); await p.waitForTimeout(600);
      if (!(await p.$$eval('#sres li', l => l.length))) fail(`${tag} wyniki`, 'pisanie nic nie pokazuje');
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
  // every page in the sitemap, opened on a phone: loads, has a heading, no script error, no sideways scroll
  const xml = await (await fetch(BASE + '/sitemap.xml')).text();
  const urls = [...xml.matchAll(/<loc>https:\/\/pepsafe\.info([^<]*)<\/loc>/g)].map(m => m[1] || '/');
  const c = await b.newContext(devices.phone);
  let done = 0;
  for (let i = 0; i < urls.length; i += 6) await Promise.all(urls.slice(i, i + 6).map(async u => {
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    try {
      // one retry: a single slow answer from the host is not a broken page
      const r = await p.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => p.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 45000 }));
      if (!r || r.status() >= 400) fail(u, 'HTTP ' + (r && r.status()));
      await p.waitForTimeout(400);
      const [h1, wide] = await p.evaluate(() => [!!document.querySelector('h1'), document.documentElement.scrollWidth > innerWidth + 2]);
      if (!h1) fail(u, 'brak nagłówka');
      if (wide) fail(u, 'strona wystaje w bok na telefonie');
      if (errs.length) fail(u, 'błąd skryptu: ' + errs[0]);
    } catch (e) { fail(u, e.message.split('\n')[0]); }
    done++; await p.close();
  }));
  console.log(`otwarto ${done} stron z mapy strony`);
  await b.close();
  console.log(bad.length ? `test strony: ${bad.length} problemów\n - ` + bad.join('\n - ') : 'test strony: wszystko działa (telefon i komputer, EN/PL/ES)');
  process.exit(bad.length ? 1 : 0);
})();
