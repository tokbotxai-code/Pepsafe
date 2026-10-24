// Fills SRC for entries that have no sources yet, using stable registry searches.
// Those links are navigational on purpose: they point at the register filtered by the
// substance, so they stay valid when a label or a trial record is updated.
// Usage: node tools/zrodla.js [--sprawdz]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const file = path.join(root, 'dane.html');
let html = fs.readFileSync(file, 'utf8');
const lines = html.split('\n');
const at = re => lines.findIndex(l => re.test(l));
const box = { window: {}, document: {}, console }; vm.createContext(box);
const a = at(/^var ST=\{A:/), b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
vm.runInContext('var D=[];function E(n,a,s,c,cat,f){D.push({n,a,s})}', box);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
const si = at(/^var SRC=\{/); vm.runInContext(lines[si], box);
const SRC = box.SRC || {};
const EN = box.EN || {};

const q = s => encodeURIComponent(s);
const nazwaEN = e => (EN[e.n] || [])[0] || e.n;

function zrodla(e) {
  const n = nazwaEN(e).replace(/\s*\(.*\)$/, '');
  const out = [];
  // tylko rejestry, ktore odpowiadaja na nasze zapytania: EMA i accessdata FDA blokuja roboty
  if (e.s === 'A' || e.s === 'R' || e.s === 'N')
    out.push(['DailyMed: etykieta leku', `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${q(n)}`]);
  if (e.s === 'P' || e.s === 'U')
    out.push(['ClinicalTrials.gov: zarejestrowane badania', `https://clinicaltrials.gov/search?intr=${q(n)}`]);
  out.push(['PubMed: publikacje naukowe', `https://pubmed.ncbi.nlm.nih.gov/?term=${q(n)}`]);
  return out.slice(0, 3);
}

const brak = box.D.filter(e => !(SRC[e.n] || []).length);
if (!brak.length) { console.log('wszystkie wpisy mają źródła'); process.exit(0); }
if (process.argv.includes('--sprawdz')) {
  console.log(`${brak.length} wpisów bez źródeł (tryb sprawdzania, nic nie zapisano)`);
  brak.slice(0, 8).forEach(e => console.log('  ', e.n, '->', zrodla(e).map(x => x[0]).join(' · ')));
  process.exit(1);
}
const dopisz = {};
for (const e of brak) dopisz[e.n] = zrodla(e);
const wstaw = Object.entries(dopisz)
  .map(([k, v]) => JSON.stringify(k) + ':' + JSON.stringify(v)).join(',');
html = html.replace(/^var SRC=\{/m, 'var SRC={' + wstaw + ',');
fs.writeFileSync(file, html);
console.log(`dopisano źródła do ${brak.length} wpisów`);
