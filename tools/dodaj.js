// Adds catalog entries from a JSON file to dane.html without reading the whole file into a chat.
// Usage: node tools/dodaj.js <plik.json>
// Each item: {n, a, s, c, cat, fam, d, m, u, ev, w, q?, wa?, en:[name,class,d,m,u,ev,w]}
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const file = path.join(root, 'dane.html');
const items = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let html = fs.readFileSync(file, 'utf8');
const lines = html.split('\n');

const CATS = { M: 'Metabolizm i waga', H: 'Hormony', R: 'Regeneracja i „research”', K: 'Kosmetyka', NE: 'Neurologia', ON: 'Onkologia', KO: 'Kości', SE: 'Serce i krzepnięcie', JE: 'Jelita', RO: 'Rozród', IN: 'Infekcje', OD: 'Odporność', OT: 'Inne' };
const FAMS = ['glp1', 'amylin', 'gh', 'gnrh', 'sst', 'pth', 'mc', 'vp', 'gcc', 'anticoag', 'repair', 'muscle', 'cns', 'long', 'fat'];
const q = s => JSON.stringify(String(s));

let added = 0, skipped = [];
const eLines = [], enParts = [];
for (const it of items) {
  for (const f of ['n', 'a', 's', 'c', 'cat', 'd', 'm', 'u', 'ev', 'w', 'en']) {
    if (it[f] === undefined) throw new Error(`${it.n}: brakuje pola ${f}`);
  }
  if (!CATS[it.cat]) throw new Error(`${it.n}: nieznana kategoria ${it.cat}`);
  if (!'ARPUCN'.includes(it.s)) throw new Error(`${it.n}: nieznany status ${it.s}`);
  if (it.fam && !FAMS.includes(it.fam)) throw new Error(`${it.n}: nieznana rodzina ${it.fam}`);
  if (it.en.length !== 7) throw new Error(`${it.n}: wersja EN musi mieć 7 pól`);
  if (new RegExp('^E\\(' + q(it.n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'm').test(html)) { skipped.push(it.n); continue; }
  eLines.push(`E(${q(it.n)},${q(it.a)},${q(it.s)},${q(it.c)},${it.cat},${it.fam ? q(it.fam) : '""'},${q(it.d)},${q(it.m)},${q(it.u)},${q(it.ev)},${q(it.w)}${it.q || it.wa ? ',' + q(it.q || '') : ''}${it.wa ? ',1' : ''});`);
  enParts.push(`${q(it.n)}: [${it.en.map(q).join(', ')}]`);
  added++;
}
if (!added) { console.log('nic nowego; pominięte (już są):', skipped.join(', ') || '—'); process.exit(0); }

const lastE = lines.length - 1 - [...lines].reverse().findIndex(l => /^E\(/.test(l));
lines.splice(lastE + 1, 0, ...eLines);
html = lines.join('\n');
html = html.replace('var EN={', 'var EN={' + enParts.join(', ') + ', ');
fs.writeFileSync(file, html);
console.log(`dodano ${added} wpisów`, skipped.length ? `| pominięto (już są): ${skipped.join(', ')}` : '');
