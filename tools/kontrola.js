// One command that checks the whole published site: structure, counts, the pieces that
// have silently vanished before, dead internal links and every previously indexed URL.
// Usage: node tools/kontrola.js [katalog]   (domyślnie bieżący, czyli zbudowana strona)
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..');
let bledy = 0, ostrzezenia = 0;
const ok = (co, info = '') => console.log('  OK   ' + co.padEnd(42) + info);
const zle = (co, info = '') => { console.log('  BŁĄD ' + co.padEnd(42) + info); bledy++; };
const uwaga = (co, info = '') => { console.log('  ?    ' + co.padEnd(42) + info); ostrzezenia++; };
const czytaj = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch (e) { return null; } };
const ile = (f, re) => { const t = czytaj(f); return t ? (t.match(re) || []).length : -1; };

console.log('\n── pliki, które już raz zniknęły ──');
[['licznik odwiedzin', 'index.html', /cf-beacon/g, 1],
 ['słownik', 'en/glossary.html', /gloss-row/g, 5],
 ['kanał RSS', 'feed.xml', /<item>/g, 1],
 ['ikona w przeglądarce', 'index.html', /rel="icon"/g, 1],
 ['dane organizacji', 'index.html', /application\/ld\+json/g, 1],
 ['obrazek udostępniania', 'index.html', /og:image/g, 1],
 ['strona 404', '404.html', /<h1/g, 1],
].forEach(([co, f, re, min]) => { const n = ile(f, re); n < 0 ? zle(co, 'brak pliku ' + f) : n < min ? zle(co, `${n} < ${min}`) : ok(co, n + '×'); });

console.log('\n── zawartość ──');
const licz = (dir, re) => { try { return fs.readdirSync(path.join(root, dir)).filter(f => re.test(f)).length; } catch (e) { return -1; } };
const karty = licz('p', /\.html$/), teksty = licz('en/t', /\.html$/);
karty >= 200 ? ok('karty substancji', karty) : zle('karty substancji', karty);
teksty >= 1 ? ok('dłuższe teksty', teksty) : zle('dłuższe teksty', teksty);
const mapa = (czytaj('sitemap.xml') || '').match(/<loc>/g);
mapa && mapa.length > 400 ? ok('adresy w mapie strony', mapa.length) : zle('mapa strony', mapa ? mapa.length : 'brak');

console.log('\n── katalog i dane ──');
try { execSync('node ' + path.join(__dirname, 'audyt.js'), { cwd: root, stdio: 'pipe' }); ok('audyt wpisów'); }
catch (e) { zle('audyt wpisów', String(e.stdout || '').trim().split('\n').pop()); }
try { const r = execSync('node ' + path.join(__dirname, 'rodziny.js') + ' --sprawdz', { cwd: root, stdio: 'pipe' }).toString(); ok('grupy zgodne z katalogiem'); }
catch (e) { zle('grupy', String(e.stdout || '').trim().split('\n').pop()); }
try { execSync('node ' + path.join(__dirname, 'zrodla.js') + ' --sprawdz', { cwd: root, stdio: 'pipe' }); ok('źródła przy wpisach'); }
catch (e) { uwaga('źródła', String(e.stdout || '').trim().split('\n')[0]); }

console.log('\n── linki wewnętrzne ──');
const pliki = [];
(function chodz(d) {
  for (const f of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
    if (/^(\.git|node_modules|tiktok|tools|src|brand|docs)$/.test(f.name)) continue;
    const r = d ? d + '/' + f.name : f.name;
    f.isDirectory() ? chodz(r) : /\.html$/.test(f.name) && pliki.push(r);
  }
})('');
const martwe = new Set();
for (const f of pliki) {
  for (const m of (czytaj(f) || '').matchAll(/href="\/([^"#?]*)"/g)) {
    const cel = m[1] || 'index.html';
    if (!fs.existsSync(path.join(root, cel))) martwe.add(cel);
  }
}
martwe.size ? zle('martwe linki', [...martwe].slice(0, 5).join(', ')) : ok('linki wewnętrzne', pliki.length + ' stron');

console.log('\n── adresy znane wyszukiwarkom ──');
try {
  const stare = execSync('git show HEAD~12:sitemap.xml', { cwd: root, stdio: 'pipe' }).toString();
  const lista = [...stare.matchAll(/<loc>https:\/\/pepsafe\.info([^<]*)<\/loc>/g)].map(m => m[1] || '/');
  const zgasle = lista.filter(u => !fs.existsSync(path.join(root, u.replace(/^\//, '') || 'index.html')));
  zgasle.length ? zle('stare adresy', zgasle.length + ' zgasło: ' + zgasle.slice(0, 3).join(', '))
    : ok('stare adresy', lista.length + ' nadal działa');
} catch (e) { uwaga('stare adresy', 'nie udało się odczytać poprzedniej mapy'); }

console.log('\n' + (bledy ? `${bledy} błędów` : 'bez błędów') + (ostrzezenia ? `, ${ostrzezenia} do sprawdzenia` : '') + '\n');
process.exit(bledy ? 1 : 0);
