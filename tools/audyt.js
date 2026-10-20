// Checks catalog entries for consistency: missing pieces, suspicious lengths, repeated text,
// and the house rules (no doses for unapproved substances, the closing safety sentence).
// Usage: node tools/audyt.js [--nowe N]   (--nowe limits the check to the last N entries)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const a = lines.findIndex(l => /^var ST=\{A:/.test(l));
const b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const s = { window: {}, document: {}, console }; vm.createContext(s);
vm.runInContext('var D=[];function E(n,a,st,c,cat,f,d,m,u,ev,w,q,wa){D.push({n,a,st,c,cat,f,d,m,u,ev,w})}', s);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), s);

const i = process.argv.indexOf('--nowe');
const D = i > 0 ? s.D.slice(-Number(process.argv[i + 1])) : s.D;
const EN = s.EN || {};
let n = 0;
const flag = (e, msg) => { console.log(`${e.n}: ${msg}`); n++; };

for (const e of D) {
  const en = EN[e.n];
  if (!en) { flag(e, 'brak wersji angielskiej'); continue; }
  const pl = [e.d, e.m, e.u, e.ev, e.w], ang = en.slice(2);
  // pole "zastosowanie" bywa jednym slowem ("Kosmetyki.") i to jest pelna odpowiedz
  const urwane = (t, j) => !t || t.length < (j === 2 ? 5 : 12) || !/[.!?]$/.test(t.trim());
  pl.forEach((t, j) => { if (urwane(t, j)) flag(e, `pole PL ${j + 1} puste albo urwane`); });
  ang.forEach((t, j) => { if (urwane(t, j)) flag(e, `pole EN ${j + 1} puste albo urwane`); });
  // tekst polski i angielski nie moga byc identyczne (znak nieprzetlumaczonego pola)
  pl.forEach((t, j) => { if (t && t === ang[j]) flag(e, `pole ${j + 1} identyczne w obu językach`); });
  // zdanie zamykajace przy substancjach bez zatwierdzenia
  if (e.st === 'U') {
    const zamkniecie = /nieustalon|nie ustalono|nie jest .*dostępn|nie było ocenian|nie istniej|wymaga decyzji lekarza|decyduje lekarz/i;
    if (!zamkniecie.test(e.w))
      flag(e, 'brak zdania o nieustalonym bezpieczeństwie (PL)');
    if (!/not established|not available|is unknown|do not exist|was not assessed|doctor's decision/i.test(ang[4]))
      flag(e, 'brak zdania o nieustalonym bezpieczeństwie (EN)');
  }
  // dawki tylko przy lekach zatwierdzonych
  if (e.st !== 'A' && e.st !== 'R' && /\b\d+([.,]\d+)?\s?(mg|mcg|µg|j\.m\.|IU)\b/i.test([e.d, e.m, e.u, e.ev, e.w].join(' ')))
    flag(e, 'liczbowa dawka przy substancji niezatwierdzonej');
  // powtorzone zdanie w obrebie wpisu
  const zd = (e.d + ' ' + e.m + ' ' + e.u + ' ' + e.ev + ' ' + e.w).split(/(?<=\.)\s+/).map(x => x.trim()).filter(x => x.length > 40);
  const dup = zd.filter((x, j) => zd.indexOf(x) !== j);
  if (dup.length) flag(e, 'powtórzone zdanie: ' + dup[0].slice(0, 60));
  // podwojne spacje i spacja przed kropka
  [...pl, ...ang].forEach(t => { if (/\s{2,}|\s[.,]/.test(t)) flag(e, 'podwójna spacja albo spacja przed znakiem'); });
  if (e.a && /,,|,\s*$/.test(e.a)) flag(e, 'przecinki w aliasach');
}
console.log(n ? `\n${n} rzeczy do poprawy w ${D.length} wpisach` : `${D.length} wpisów bez zastrzeżeń`);
process.exit(n ? 1 : 0);
