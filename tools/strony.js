// Generates one static page per catalog entry, so search engines have something to index.
// The single-page app serves the same HTML for every ?e= link, so nothing but the homepage can rank.
// Usage: node tools/strony.js   -> writes p/<slug>.html (EN) and p/<slug>.pl.html (PL), then rebuilds sitemap.xml
const fs = require('fs'), path = require('path'), vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dane.html'), 'utf8');
const lines = html.split('\n');

// Pull only the data blocks out of index.html and run them in a sandbox: the catalog (D),
// the English strings (EN), the status/category labels, the sources (SRC) and the WADA table.
const at = re => lines.findIndex(l => re.test(l));
const slice = (a, b) => lines.slice(a, b).join('\n');
const dataStart = at(/^var ST=\{A:/);
const dataEnd = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const srcStart = at(/^var SRC=\{/);

const sandbox = { window: {}, document: {}, console };
vm.createContext(sandbox);
vm.runInContext('var D=[];function E(n,a,s,c,cat,fam,d,m,u,ev,w,q,wa){D.push({n,a,s,c,cat,f:fam,d,m,u,ev,w,q:q||"",wa:!!wa});}', sandbox);
vm.runInContext(slice(dataStart, dataEnd).replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), sandbox);
vm.runInContext(slice(srcStart, srcStart + 4), sandbox);
const { D, EN, ST, ST_EN, CAT_EN, SRC, WADA, WADA_URL } = sandbox;

const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;.]+\S*$/, '') + '…' : s; };

const css = `:root{--bg:#0B1419;--card:#122027;--line:#2A3E47;--txt:#E6EEF2;--dim:#93A4AF;--accent:#3CCFA9;--warn:#FF8A5C}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.65 -apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial,sans-serif}
.w{max-width:760px;margin:0 auto;padding:28px 20px 72px}
a{color:var(--accent)}nav{font-size:14px;color:var(--dim);margin-bottom:22px}
h1{font-size:34px;line-height:1.15;margin:0 0 6px}.sub{color:var(--dim);margin:0 0 18px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 26px}
.tag{font-size:13px;padding:5px 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--dim)}
.tag.on{border-color:var(--warn);color:var(--warn)}.tag.ok{border-color:var(--accent);color:var(--accent)}
h2{font-size:15px;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin:30px 0 8px}
p{margin:0 0 12px}ul{margin:0 0 12px;padding-left:20px}
.note{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--warn);border-radius:10px;padding:14px 16px;margin:14px 0}
footer{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);color:var(--dim);font-size:14px}
.seq{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;word-break:break-all;color:var(--dim)}`;

function page(e, en) {
  const t = EN[e.n] || [];
  const name = en ? (t[0] || e.n) : e.n;
  const klass = en ? (t[1] || e.c) : e.c;
  const d = en ? (t[2] || e.d) : e.d, m = en ? (t[3] || e.m) : e.m, u = en ? (t[4] || e.u) : e.u;
  const ev = en ? (t[5] || e.ev) : e.ev, w = en ? (t[6] || e.w) : e.w;
  const status = en ? (ST_EN[e.s] || e.s) : (ST[e.s] || e.s);
  const cat = en ? (CAT_EN[e.cat] || e.cat) : e.cat;
  const wada = (WADA || {})[e.n] || (e.wa ? ['S0'] : null);
  const src = (SRC || {})[e.n] || [];
  const s = slug(EN[e.n] ? EN[e.n][0] : e.n);
  const url = `https://pepsafe.info/p/${s}${en ? '' : '.pl'}.html`;
  const other = `https://pepsafe.info/p/${s}${en ? '.pl' : ''}.html`;
  const L = (pl, e2) => en ? e2 : pl;
  const desc = clip(`${name} — ${status}. ${d}`, 155);

  const sec = (h, body) => body ? `<h2>${h}</h2>${body}` : '';
  return `<!doctype html><html lang="${en ? 'en' : 'pl'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)} — ${esc(status)} | PepSafe</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="${en ? 'pl' : 'en'}" href="${other}">
<link rel="alternate" hreflang="${en ? 'en' : 'pl'}" href="${url}">
<link rel="alternate" hreflang="x-default" href="https://pepsafe.info/p/${s}.html">
<meta property="og:title" content="${esc(name)} — ${esc(status)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="https://pepsafe.info/brand/pepsafe-share.jpg">
<meta name="twitter:card" content="summary_large_image">
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article', headline: `${name} — ${status}`,
    description: desc, url, inLanguage: en ? 'en' : 'pl',
    publisher: { '@type': 'Organization', name: 'PepSafe', url: 'https://pepsafe.info' },
    about: { '@type': 'ChemicalSubstance', name, alternateName: e.a || undefined }
  })}</script></head><body><div class="w">
<nav><a href="https://pepsafe.info/">PepSafe</a> › ${esc(L('Katalog', 'Catalog'))} › ${esc(name)}</nav>
<h1>${esc(name)}</h1>
<p class="sub">${esc(e.a || klass)}</p>
<div class="tags">
<span class="tag ${e.s === 'A' ? 'ok' : 'on'}">${esc(status)}</span>
<span class="tag">${esc(klass)}</span>
<span class="tag">${esc(cat)}</span>
${wada ? `<span class="tag on">${esc(L('Lista WADA', 'WADA list'))}: ${esc(wada[0])}</span>` : ''}
</div>
${sec(L('Co to jest', 'What it is'), `<p>${esc(d)}</p>`)}
${sec(L('Jak działa', 'How it works'), `<p>${esc(m)}</p>`)}
${sec(L('Zastosowanie', 'Use'), `<p>${esc(u)}</p>`)}
${sec(L('Co mówią badania', 'What the research shows'), `<p>${esc(ev)}</p>`)}
${w ? `<h2>${L('Na co uważać', 'What to watch for')}</h2><div class="note">${esc(w)}</div>` : ''}
${wada ? `<h2>${L('Status antydopingowy', 'Anti-doping status')}</h2><p>${en
      ? `Listed by WADA in class ${esc(wada[0])}${wada[1] === 'always' ? ', prohibited at all times' : ''}.`
      : esc(wada[2] || ('Wymieniony przez WADA w klasie ' + wada[0] + '.'))
      } <a href="${WADA_URL}" rel="nofollow">${esc(L('Lista WADA', 'WADA list'))}</a></p>` : ''}
${e.q ? `<h2>${L('Sekwencja', 'Sequence')}</h2><p class="seq">${esc(e.q)}</p>` : ''}
${src.length ? `<h2>${L('Źródła', 'Sources')}</h2><ul>${src.map(x => `<li><a href="${esc(x[1])}" rel="nofollow">${esc(x[0])}</a></li>`).join('')}</ul>` : ''}
${(() => { // sasiedzi z tej samej kategorii: robot schodzi glebiej, czytelnik ma dokad kliknac
    const sibs = D.filter(x => x.cat === e.cat && x.n !== e.n).slice(0, 6);
    if (!sibs.length) return '';
    return `<h2>${L('Podobne', 'Related')}</h2><ul>${sibs.map(x => {
      const sl = slug(EN[x.n] ? EN[x.n][0] : x.n), nm = en ? (EN[x.n] ? EN[x.n][0] : x.n) : x.n;
      return `<li><a href="/p/${sl}${en ? '' : '.pl'}.html">${esc(nm)}</a></li>`;
    }).join('')}</ul>`;
  })()}
<footer>
<p>${L('Treść edukacyjna, nie porada medyczna. Nie podajemy dawek ani źródeł zakupu.',
      'Educational content, not medical advice. We do not give doses or sources to buy from.')}</p>
<p><a href="https://pepsafe.info/?e=${encodeURIComponent(e.n)}">${L('Zobacz w pełnym katalogu', 'Open in the full catalog')}</a>
 · <a href="${other}">${en ? 'Po polsku' : 'In English'}</a></p>
</footer></div></body></html>`;
}

const dir = path.join(root, 'p');
fs.mkdirSync(dir, { recursive: true });
const urls = [];
for (const e of D) {
  const s = slug(EN[e.n] ? EN[e.n][0] : e.n);
  fs.writeFileSync(path.join(dir, s + '.html'), page(e, true));
  fs.writeFileSync(path.join(dir, s + '.pl.html'), page(e, false));
  urls.push(`https://pepsafe.info/p/${s}.html`, `https://pepsafe.info/p/${s}.pl.html`);
}

// An index page, so a crawler reaching the site can walk into every entry by following links
const list = D.slice().sort((a, b) => (EN[a.n] ? EN[a.n][0] : a.n).localeCompare(EN[b.n] ? EN[b.n][0] : b.n));
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Peptide catalog: ${D.length} substances, status and evidence | PepSafe</title>
<meta name="description" content="Every peptide in the PepSafe catalog: approval status, what the research shows and anti-doping status. ${D.length} entries, educational, nothing for sale.">
<link rel="canonical" href="https://pepsafe.info/p/">
<style>${css}</style></head><body><div class="w">
<nav><a href="https://pepsafe.info/">PepSafe</a> › Catalog</nav>
<h1>Peptide catalog</h1>
<p class="sub">${D.length} substances: what each one is, what the research shows, and whether any regulator approved it.</p>
<ul>${list.map(e => {
  const s = slug(EN[e.n] ? EN[e.n][0] : e.n), n = EN[e.n] ? EN[e.n][0] : e.n;
  return `<li><a href="/p/${s}.html">${esc(n)}</a> — ${esc(ST_EN[e.s] || e.s)}</li>`;
}).join('')}</ul>
<footer><p>Educational content, not medical advice. <a href="https://pepsafe.info/">Full site</a></p></footer>
</div></body></html>`);
urls.unshift('https://pepsafe.info/p/');

// FAQ as a real page: in the app it is rendered by JavaScript, so no crawler ever sees the answers
const faqStart = at(/^var FAQ=\[/);
const faqEnd = faqStart + lines.slice(faqStart).findIndex(l => /^\];/.test(l)) + 1;
vm.runInContext(slice(faqStart, faqEnd), sandbox);
const FAQ = sandbox.FAQ || [];
for (const en of [true, false]) {
  const qa = FAQ.filter(x => Array.isArray(x) && x[0] && x[1]);
  if (!qa.length) break;
  const f = en ? 'faq.html' : 'faq.pl.html';
  const L = (pl, e2) => en ? e2 : pl;
  fs.writeFileSync(path.join(dir, f), `<!doctype html><html lang="${en ? 'en' : 'pl'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${L('Pytania i odpowiedzi o peptydach', 'Peptide questions and answers')} | PepSafe</title>
<meta name="description" content="${esc(clip(qa.map(x => en ? x[0].en : x[0].pl).join(' '), 155))}">
<link rel="canonical" href="https://pepsafe.info/p/${f}">
<link rel="alternate" hreflang="${en ? 'pl' : 'en'}" href="https://pepsafe.info/p/${en ? 'faq.pl.html' : 'faq.html'}">
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: qa.map(x => ({
      '@type': 'Question', name: en ? x[0].en : x[0].pl,
      acceptedAnswer: { '@type': 'Answer', text: en ? x[1].en : x[1].pl }
    }))
  })}</script></head><body><div class="w">
<nav><a href="https://pepsafe.info/">PepSafe</a> › ${L('Pytania', 'Questions')}</nav>
<h1>${L('Pytania i odpowiedzi', 'Questions and answers')}</h1>
<p class="sub">${qa.length} ${L('pytań o peptydy, z odpowiedziami opartymi na badaniach.', 'questions about peptides, answered from the research.')}</p>
${qa.map(x => `<h2>${esc(en ? x[0].en : x[0].pl)}</h2><p>${esc(en ? x[1].en : x[1].pl)}</p>`).join('')}
<footer><p>${L('Treść edukacyjna, nie porada medyczna.', 'Educational content, not medical advice.')}
 <a href="https://pepsafe.info/p/">${L('Katalog A–Z', 'Catalog A–Z')}</a></p></footer>
</div></body></html>`);
  urls.push('https://pepsafe.info/p/' + f);
}

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `<url><loc>https://pepsafe.info/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n` +
  `<url><loc>https://pepsafe.info/en/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n` +
  `<url><loc>https://pepsafe.info/pl/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n` +
  urls.map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`).join('\n') +
  `\n</urlset>\n`);

console.log(`wygenerowano ${D.length} substancji = ${urls.length} stron, sitemap: ${urls.length + 1} adresow`);
