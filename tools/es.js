// Spanish edition, built from the finished English pages (run after tools/v4.js).
// The English text of every page is swapped segment by segment using the translation memory in tools/es-tm.json
// ({"English segment": "Spanish segment"}), then links, language tags and alternates are rewritten.
// Usage: node tools/es.js --missing   -> writes tools/es-missing.json (segments still without a translation)
//        node tools/es.js             -> builds /es/*, /es/t/*, /p/<slug>.es.html, assets/dane-es.js, adds es to sitemap and hreflang
// A page is built only when all its segments are translated; the rest are listed and skipped.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const OUT = process.env.PEP_OUT ? path.resolve(process.env.PEP_OUT) : root;
const SITE = 'https://pepsafe.info';
const TM_FILE = path.join(__dirname, 'es-tm.json');
const TM = fs.existsSync(TM_FILE) ? JSON.parse(fs.readFileSync(TM_FILE, 'utf8')) : {};
const missingMode = process.argv.includes('--missing');
// Spanish of the longer write-ups lives next to the EN/PL text in opisy.json ("es" paragraphs, same order as "en")
{
  const OP = path.join(root, 'opisy.json');
  if (fs.existsSync(OP)) for (const o of Object.values(JSON.parse(fs.readFileSync(OP, 'utf8'))))
    (o.en || []).forEach((p, i) => { if (o.es && o.es[i]) TM[p.replace(/\s+/g, " ").trim()] = o.es[i]; });
  TM['In depth'] = TM['In depth'] || 'En detalle';
}

// EN->ES pairs of the steroids section, written by tools/sterydy.js during the v4 build
{
  const f = path.join(__dirname, 'sterydy-tm.json');
  if (fs.existsSync(f)) Object.assign(TM, JSON.parse(fs.readFileSync(f, 'utf8')));
  TM['Steroids'] = TM['Steroids'] || 'Esteroides';
}

const ATTRS = ['title', 'alt', 'placeholder', 'aria-label', 'data-busy', 'data-off', 'data-on', 'data-base', 'data-report', 'value'];
const META = /<meta (name|property)="(description|og:title|og:description|twitter:title|twitter:description)" content="([^"]*)">/g;
const norm = s => s.replace(/\s+/g, ' ').trim();
const hasWords = s => /[A-Za-z]{2}/.test(s);

function list(dir, filter) { return fs.existsSync(dir) ? fs.readdirSync(dir).filter(filter).map(f => path.join(dir, f)) : []; }
// Polish source titles and product names that the generator still puts on English pages (tools/pl-en.json):
// swap them on the English pages first, so the English and the Spanish editions both read right
const PLEN = fs.existsSync(path.join(__dirname, 'pl-en.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'pl-en.json'), 'utf8')) : {};
const enFiles = [...list(path.join(OUT, 'en'), f => f.endsWith('.html')), ...list(path.join(OUT, 'en', 't'), f => f.endsWith('.html')),
  ...list(path.join(OUT, 'p'), f => /^[^.]+\.html$/.test(f)), path.join(OUT, 'index.html')].filter(f => fs.existsSync(f));
for (const f of enFiles) {
  let h = fs.readFileSync(f, 'utf8'), h0 = h;
  for (const [pl, en] of Object.entries(PLEN).sort((a, b) => b[0].length - a[0].length)) if (h.includes(pl)) h = h.split(pl).join(en);
  if (h !== h0) fs.writeFileSync(f, h);
}
for (const [pl, en] of Object.entries(PLEN)) if (TM[pl] && !TM[en]) TM[en] = TM[pl];

const pages = [
  ...list(path.join(OUT, 'en'), f => f.endsWith('.html') && f !== 'search.html').map(f => [f, 'es/' + path.basename(f)]),
  ...list(path.join(OUT, 'en', 't'), f => f.endsWith('.html')).map(f => [f, 'es/t/' + path.basename(f)]),
  ...list(path.join(OUT, 'p'), f => /^[^.]+\.html$/.test(f) && f !== 'index.html' && !f.startsWith('faq')).map(f => [f, 'p/' + path.basename(f, '.html') + '.es.html'])
];

const need = new Set();
function tr(s, miss) {
  const k = norm(s); if (!k || !hasWords(k)) return s;
  if (TM[k] != null) { const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0]; return lead + TM[k] + trail; }
  miss.add(k); return s;
}

function translate(html, miss) {
  // text between tags, outside script/style
  let out = '', i = 0;
  const re = /<(script|style)\b[\s\S]*?<\/\1>|<[^>]+>/g; let m;
  while ((m = re.exec(html))) {
    out += tr(html.slice(i, m.index), miss);
    let tag = m[0];
    if (!/^<(script|style)/i.test(tag)) {
      tag = tag.replace(new RegExp(`\\s(${ATTRS.join('|')})="([^"]*)"`, 'g'), (all, a, v) => {
        if (a === 'value' && !/type="(submit|button)"/.test(tag)) return all;
        return ` ${a}="${tr(v, miss)}"`;
      });
    } else if (/application\/ld\+json/.test(tag)) {
      tag = tag.replace(/"(name|description|text)":"((?:[^"\\]|\\.)*)"/g, (all, k, v) => {
        const src = norm(JSON.parse('"' + v + '"'));
        let t = TM[src];
        if (!t && src.includes(' — ')) { const [x, y] = src.split(' — '); if (TM[y]) t = (TM[x] || x) + ' — ' + TM[y]; }
        return t ? `"${k}":${JSON.stringify(t)}` : all;
      });
    }
    out += tag; i = re.lastIndex;
  }
  out += tr(html.slice(i), miss);
  return out.replace(META, (all, k, n, v) => `<meta ${k}="${n}" content="${tr(v, miss)}">`);
}

function relink(html, dest) {
  return html
    .replace(/<html lang="en"/, '<html lang="es"')
    .replace(/content="en_GB"/, 'content="es_ES"')
    .replace(/(href|src)="\/en\//g, '$1="/es/')
    .replace(/href="(\.\.\/)?en\//g, 'href="$1es/')
    .replace(/href="((?:\.\.\/)*|\/)p\/([a-z0-9-]+)\.html"/g, (a, pre, s) => `href="${pre}p/${s}.es.html"`)
    .replace(/assets\/dane-en\.js/g, 'assets/dane-es.js')
    // structured data, form redirects and the signup tag point at the Spanish pages too
    .replace(/(<script type="application\/ld\+json">[\s\S]*?<\/script>)/g, j => j
      .replace(/https:\/\/pepsafe\.info\/en\//g, `${SITE}/es/`)
      .replace(/https:\/\/pepsafe\.info\/p\/([a-z0-9-]+)\.html/g, `${SITE}/p/$1.es.html`))
    .replace(/(name="_next" value=")https:\/\/pepsafe\.info\/en\//g, `$1${SITE}/es/`)
    .replace(/data-next="\/en\//g, 'data-next="/es/')
    .replace(/newsletter signup \(en\)/g, 'newsletter signup (es)')
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}/${dest}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}/${dest}">`);
}

const built = [], skipped = [];
for (const [src, dest] of pages) {
  const miss = new Set();
  const enUrl = '/' + path.relative(OUT, src).split(path.sep).join('/');
  // language switch: the English page links only to Polish, the Spanish one gets both
  const html = relink(translate(fs.readFileSync(src, 'utf8'), miss), dest)
    .replace(/<a class="lang" href="([^"]*)">PL<\/a>/g, `<a class="lang" href="${enUrl}">EN</a><a class="lang" href="$1">PL</a>`);
  miss.forEach(x => need.add(x));
  if (missingMode) continue;
  if (miss.size) { skipped.push(dest + ' (' + miss.size + ')'); continue; }
  fs.mkdirSync(path.dirname(path.join(OUT, dest)), { recursive: true });
  fs.writeFileSync(path.join(OUT, dest), html);
  built.push(dest);
}

if (missingMode) {
  fs.writeFileSync(path.join(__dirname, 'es-missing.json'), JSON.stringify([...need], null, 1));
  console.log(`es: ${need.size} segmentow bez tlumaczenia -> tools/es-missing.json`);
  process.exit(0);
}

// search: Spanish words next to the English ones, so both "semaglutida" and "semaglutide" find the entry
const LOW = Object.entries(TM).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]).filter(([k, v]) => k !== v && k.length > 3);
const SHORT = new Map(LOW.filter(([k]) => k.length < 40));
function addEs(t) {
  const extra = new Set();
  for (const w of t.split(/[\s,;]+/)) if (SHORT.has(w)) extra.add(SHORT.get(w));
  for (const [k, v] of LOW) if (k.length > 15 && t.includes(k)) extra.add(v);
  return extra.size ? t + ' ' + [...extra].join(' ') : t;
}
for (const d of built) {
  const f = path.join(OUT, d);
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/ data-n="([^"]*)"/g, (all, v) => ` data-n="${addEs(v).replace(/"/g, '&quot;')}"`));
}

// data file for search and the overlap checker
const dataEn = fs.readFileSync(path.join(OUT, 'assets', 'dane-en.js'), 'utf8');
fs.writeFileSync(path.join(OUT, 'assets', 'dane-es.js'), dataEn.replace(/"((?:[^"\\]|\\.)*)"/g, (all, v) => {
  let s; try { s = JSON.parse('"' + v + '"'); } catch (e) { return all; }
  if (/^[a-z0-9]/.test(s) && s.length > 30 && s === s.toLowerCase()) return JSON.stringify(addEs(s));
  let t = TM[norm(s)];
  // shortened texts ("…") in the data file: cut the Spanish of the full sentence to a similar length
  if (!t && s.endsWith('…')) {
    const pre = s.slice(0, -1).trim(), full = Object.keys(TM).find(k => k.length > pre.length && k.startsWith(pre));
    if (full) { const v = TM[full], cut = v.slice(0, Math.max(pre.length, 40)); t = cut.slice(0, cut.lastIndexOf(' ')).replace(/[ ,.;:]+$/, '') + '…'; }
  }
  return t ? JSON.stringify(t) : all;
}).replace(/lang:\s*"en"|"lang":"en"/, m => m.replace('en', 'es')));

// hreflang es on the English and Polish twins of every built page, and es urls in the sitemap
const esOf = {};
for (const d of built) esOf[d.startsWith('p/') ? d.replace('.es.html', '.html') : d.replace(/^es\//, 'en/')] = d;
const addAlt = (file, enPath) => {
  const p = path.join(OUT, file); if (!fs.existsSync(p) || !esOf[enPath]) return;
  let h = fs.readFileSync(p, 'utf8'); if (h.includes('hreflang="es"')) return;
  h = h.replace(/(<link rel="alternate" hreflang="x-default")/, `<link rel="alternate" hreflang="es" href="${SITE}/${esOf[enPath]}">\n$1`);
  fs.writeFileSync(p, h);
};
// one switch on every page: EN · PL · ES, with the current language marked instead of linked
function langSwitch(file, cur, urls) {
  const p = path.join(OUT, file); if (!fs.existsSync(p)) return;
  const h = fs.readFileSync(p, 'utf8');
  const NAME = { EN: 'English', PL: 'Polski', ES: 'Español' };
  const sw = `<details class="lp"><summary aria-label="Language">🌐 ${cur} ▾</summary><ul>` +
    ['EN', 'PL', 'ES'].map(L => `<li><a class="lang${L === cur ? ' on" aria-current="true' : ''}" data-l="${L.toLowerCase()}" href="${urls[L]}">${NAME[L]}</a></li>`).join('') + '</ul></details>';
  let out = h.replace(/(?:<span class="lang on"[^>]*>[A-Z]{2}<\/span>|<a class="lang" href="[^"]*">[A-Z]{2}<\/a>)+/g, sw);
  // phone menu footer: all three languages as plain links
  out = out.replace(/(<p class="menufoot">)<a href="[^"]*">(?:EN|PL)<\/a>/, '$1' + ['EN', 'PL', 'ES'].map(L => L === cur ? `<b>${NAME[L]}</b>` : `<a href="${urls[L]}" data-l="${L.toLowerCase()}">${NAME[L]}</a>`).join(' · '));
  // home page only: first visit goes to the visitor's browser language; a choice made in the list wins
  if (file === 'index.html' && !out.includes('pep-lang'))
    out = out.replace('</head>', `<script>try{if(!localStorage.getItem('pep-lang')){var l=(navigator.languages&&navigator.languages[0]||navigator.language||'').slice(0,2).toLowerCase();if(l==='pl')location.replace('/pl/');else if(l==='es')location.replace('/es/');}}catch(e){}</script>\n</head>`);
  fs.writeFileSync(p, out);
}
for (const enPath of Object.keys(esOf)) {
  const plPath = enPath.startsWith('p/') ? enPath.replace('.html', '.pl.html') : enPath.replace(/^en\//, 'pl/');
  const urls = { EN: '/' + enPath, PL: '/' + plPath, ES: '/' + esOf[enPath] };
  langSwitch(enPath, 'EN', urls); langSwitch(plPath, 'PL', urls); langSwitch(esOf[enPath], 'ES', urls);
  if (enPath === 'en/index.html') langSwitch('index.html', 'EN', { EN: '/', PL: '/pl/', ES: '/es/' });
  if (enPath === 'en/404.html') langSwitch('404.html', 'EN', { EN: '/', PL: '/pl/', ES: '/es/' });
}
if (esOf['en/index.html']) addAlt('index.html', 'en/index.html');
for (const enPath of Object.keys(esOf)) {
  addAlt(enPath, enPath);
  addAlt(enPath.startsWith('p/') ? enPath.replace('.html', '.pl.html') : enPath.replace(/^en\//, 'pl/'), enPath);
  addAlt(esOf[enPath], enPath);
}
const sm = path.join(OUT, 'sitemap.xml');
if (fs.existsSync(sm)) {
  let x = fs.readFileSync(sm, 'utf8');
  const add = built.filter(d => !x.includes(`/${d}<`)).map(d => `  <url><loc>${SITE}/${d}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`);
  x = x.replace('</urlset>', add.join('\n') + (add.length ? '\n' : '') + '</urlset>');
  fs.writeFileSync(sm, x);
}
console.log(`es: zbudowano ${built.length} stron, pominieto ${skipped.length}` + (skipped.length ? ' (brak tlumaczen, np. ' + skipped.slice(0, 3).join(', ') + ')' : ''));
