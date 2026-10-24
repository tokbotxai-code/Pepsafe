// Full-site search: one text index per language (assets/szukaj-<lang>.json) and a results page
// <lang>/search.html built from that language's 404 page. Run after tools/v4.js and tools/es.js.
// The magnifier's Enter key opens the results page, so a query finds cards, articles, comparisons,
// glossary, FAQ, alerts and guides, not only catalog names.
const fs = require('fs'), path = require('path');
const OUT = process.env.PEP_OUT ? path.resolve(process.env.PEP_OUT) : path.join(__dirname, '..');
const LANGS = { en: '', pl: '.pl', es: '.es' };
const SKIP = /^(404|thanks|free-thanks|saved|search)\.html$/;
const TXT = {
  en: { title: 'Search', kick: 'Search the whole site', ph: 'Type a name, brand, symptom or topic', btn: 'Search' },
  pl: { title: 'Szukaj', kick: 'Szukaj w całej stronie', ph: 'Wpisz nazwę, markę, objaw albo temat', btn: 'Szukaj' },
  es: { title: 'Buscar', kick: 'Buscar en toda la web', ph: 'Escribe un nombre, una marca, un síntoma o un tema', btn: 'Buscar' }
};

const strip = h => h.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();
const list = (dir, re) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => re.test(f)).map(f => path.join(dir, f)) : [];

for (const [lang, suf] of Object.entries(LANGS)) {
  const files = [
    ...list(path.join(OUT, lang), /\.html$/).filter(f => !SKIP.test(path.basename(f))),
    ...list(path.join(OUT, lang, 't'), /\.html$/),
    ...list(path.join(OUT, 'p'), suf ? new RegExp('^[a-z0-9-]+\\' + suf + '\\.html$') : /^[a-z0-9-]+\.html$/).filter(f => !/^(index|faq)\./.test(path.basename(f)))
  ];
  const idx = [];
  for (const f of files) {
    const h = fs.readFileSync(f, 'utf8');
    const rel = '/' + path.relative(OUT, f).split(path.sep).join('/');
    const title = strip((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || h.match(/<title>([\s\S]*?)<\/title>/) || ['', rel])[1]).replace(/ \| PepSafe$/, '');
    // breadcrumbs, buttons and the page title itself would only add noise to the snippets
    const main = (h.match(/<main[\s\S]*?<\/main>/) || [h])[0]
      .replace(/<(nav|button|h1)\b[\s\S]*?<\/\1>/g, ' ').replace(/<(p|div) class="[^"]*(crumb|kick)[^"]*"[\s\S]*?<\/\1>/g, ' ');
    const k = rel.startsWith('/p/') ? 'c' : /\/t\//.test(rel) ? 'a' : /\/vs-/.test(rel) ? 'v' : 'p';
    idx.push({ u: rel, t: title, k, x: strip(main).slice(0, 8000) });
  }
  fs.writeFileSync(path.join(OUT, 'assets', `szukaj-${lang}.json`), JSON.stringify(idx));

  // results page = this language's 404 page with the head section swapped
  const src = path.join(OUT, lang, '404.html');
  if (!fs.existsSync(src)) continue;
  const T = TXT[lang];
  let h = fs.readFileSync(src, 'utf8')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${T.title} | PepSafe</title>`)
    .replace(/<section class="page-head[\s\S]*?<\/section>/, `<section class="page-head paper">
  <div class="wrap narrow">
    <p class="kick">${T.kick}</p>
    <form class="sform" action="/${lang}/search.html" role="search">
      <input id="sq" name="q" type="search" placeholder="${T.ph}" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search">
      <button class="btn" type="submit">${T.btn}</button>
    </form>
    <div id="sres" data-lang="${lang}" aria-live="polite"></div>
  </div>
</section>`);
  fs.writeFileSync(path.join(OUT, lang, 'search.html'), h);
  console.log(`szukaj ${lang}: ${idx.length} stron w indeksie`);
}
