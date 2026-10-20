// Builds /pl/ and /en/ as separate, language-pinned copies of the homepage.
// The app is one index.html that picks a language in JavaScript, so a crawler only ever sees one
// version and the other language has no address of its own. These copies give each language a real URL.
// Usage: node tools/jezyki.js   (run after any change to index.html, before tools/strony.js)
const fs = require('fs'), path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const META = {
  pl: {
    title: 'PepSafe: fakty o peptydach, bez sprzedaży i bez dawek z internetu',
    desc: 'Katalog ponad 100 peptydów: status prawny, mechanizm, siła dowodów i ostrzeżenia o łączeniu. Treść edukacyjna, nie porada medyczna. Nic nie sprzedajemy.',
    ogTitle: 'PepSafe: fakty o peptydach, bez ściemy', locale: 'pl_PL', alt: 'en_GB'
  },
  en: {
    title: 'PepSafe: peptide facts, no sales, no internet doses',
    desc: 'A catalog of 100+ peptides: legal status, mechanism, strength of evidence and combination warnings. Educational only, not medical advice. Nothing is for sale.',
    ogTitle: 'PepSafe: peptide facts, no hype', locale: 'en_GB', alt: 'pl_PL'
  }
};

const HREF = l => `<link rel="canonical" href="https://pepsafe.info/${l}/">
<link rel="alternate" hreflang="pl" href="https://pepsafe.info/pl/">
<link rel="alternate" hreflang="en" href="https://pepsafe.info/en/">
<link rel="alternate" hreflang="x-default" href="https://pepsafe.info/">`;

function build(l) {
  const m = META[l];
  let h = src;

  // pin the language instead of guessing it from the browser or localStorage
  const pick = 'var sv=null;try{sv=new URLSearchParams(location.search).get("lang");}catch(e){}';
  if (!h.includes(pick)) throw new Error('nie znaleziono wyboru języka w index.html');
  h = h.replace(pick, `var sv="${l}";`);

  // one canonical address per language, and a reciprocal hreflang set
  h = h.replace(/<link rel="canonical"[^>]*>\n(<link rel="alternate" type="application\/rss\+xml"[^>]*>\n)?<link rel="alternate" hreflang="pl"[^>]*>\n<link rel="alternate" hreflang="en"[^>]*>\n<link rel="alternate" hreflang="x-default"[^>]*>/,
    (full, rss) => HREF(l) + (rss ? '\n' + rss.trim() : ''));
  if (!h.includes(`canonical" href="https://pepsafe.info/${l}/"`)) throw new Error('nie podmieniono nagłówków kanonicznych');

  // on a language-pinned page the switch has to change the address, otherwise a reload undoes it
  const sl = 'function setLang(l){lang=l;';
  if (!h.includes(sl)) throw new Error('nie znaleziono setLang');
  h = h.replace(sl, `function setLang(l){if(l!=="${l}"){location.href="/"+l+"/"+location.hash;return;}lang=l;`);

  h = h.replace(/<title>[^<]*<\/title>/, `<title>${m.title}</title>`);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${m.desc}$2`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${m.ogTitle}$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${m.desc}$2`);
  h = h.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${m.locale}$2`);
  h = h.replace(/(<meta property="og:locale:alternate" content=")[^"]*(")/, `$1${m.alt}$2`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1https://pepsafe.info/${l}/$2`);
  h = h.replace(/<html lang="[^"]*"/, `<html lang="${l}"`);

  const dir = path.join(root, l);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), h);
  return h.length;
}

for (const l of ['pl', 'en']) console.log(`/${l}/index.html — ${build(l)} znakow`);

// the root keeps auto-detection and points at both language versions
let r = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
r = r.replace(/<link rel="alternate" hreflang="pl"[^>]*>/, '<link rel="alternate" hreflang="pl" href="https://pepsafe.info/pl/">')
  .replace(/<link rel="alternate" hreflang="en"[^>]*>/, '<link rel="alternate" hreflang="en" href="https://pepsafe.info/en/">');
fs.writeFileSync(path.join(root, 'index.html'), r);
console.log('/index.html — hreflang wskazuje na /pl/ i /en/');
