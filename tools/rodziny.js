// Syncs the family member lists (FAMS[].m) in dane.html with the fam field on each E() entry.
// Entries are only ever added, never removed: the lists are curated by hand as well.
// Usage: node tools/rodziny.js [--sprawdz]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const file = path.join(root, 'dane.html');
let html = fs.readFileSync(file, 'utf8');
const lines = html.split('\n');
const a = lines.findIndex(l => /^var ST=\{A:/.test(l));
const b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const s = { window: {}, document: {}, console }; vm.createContext(s);
vm.runInContext('var D=[];function E(n,a,st,c,cat,f){D.push({n:n,f:f})}', s);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), s);
const famStart = lines.findIndex(l => /^var FAMS=/.test(l));
const famEnd = famStart + lines.slice(famStart).findIndex((l, n) => n > 0 && /^(\];|\};)/.test(l)) + 1;
vm.runInContext(lines.slice(famStart, famEnd).join('\n'), s);

const want = {};
for (const e of s.D) if (e.f) (want[e.f] = want[e.f] || []).push(e.n);

const check = process.argv.includes('--sprawdz');
let changed = 0;
for (const [id, names] of Object.entries(want)) {
  const fam = (s.FAMS || []).find(f => f.id === id);
  if (!fam) { console.error(`nieznana rodzina: ${id}`); process.exitCode = 1; continue; }
  const missing = names.filter(n => !(fam.m || []).includes(n));
  if (!missing.length) continue;
  console.log(`${id}: dopisuję ${missing.length} — ${missing.join(', ')}`);
  changed += missing.length;
  if (check) continue;
  const old = 'm:' + JSON.stringify(fam.m).replace(/","/g, '","');
  const idx = html.indexOf(`{id:"${id}"`);
  if (idx < 0) { console.error(`nie znaleziono bloku ${id}`); process.exitCode = 1; continue; }
  const end = html.indexOf('}', html.indexOf('m:[', idx));
  const before = html.slice(idx, end);
  const mStart = before.lastIndexOf('m:[');
  const mEnd = before.indexOf(']', mStart);
  const list = before.slice(mStart + 3, mEnd);
  const added = list + (list.trim() ? ',' : '') + missing.map(n => JSON.stringify(n)).join(',');
  html = html.slice(0, idx + mStart + 3) + added + html.slice(idx + mEnd);
}
if (!changed) { console.log('rodziny są zgodne z katalogiem'); process.exit(0); }
if (check) { console.log(`${changed} pozycji do dopisania (tryb sprawdzania, nic nie zapisano)`); process.exit(1); }
fs.writeFileSync(file, html);
console.log(`zapisano: dopisano ${changed} pozycji`);
