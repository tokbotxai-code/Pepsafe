// Adds one "Peptyd dnia" entry to var DAILY=[...] in index.html without reading the whole file into a chat.
// Usage: node tools/daily.js wpis.json
// The JSON file holds one entry: {"date","n","pl","en","src":[["title","url"],...]}.
// Refuses a name that is not in the catalog, and refuses a second entry for the same date.
const fs = require('fs'), path = require('path');

const root = path.join(__dirname, '..');
const file = path.join(root, 'dane.html');
const entry = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

for (const k of ['date', 'n', 'pl', 'en', 'src']) if (!entry[k]) { console.error('brak pola: ' + k); process.exit(1); }
if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) { console.error('zla data: ' + entry.date); process.exit(1); }
if (!Array.isArray(entry.src) || !entry.src.length || entry.src.some(s => !Array.isArray(s) || s.length !== 2)) {
  console.error('src musi byc lista par [tytul, URL]'); process.exit(1);
}

const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf('var DAILY=[');
if (start < 0) { console.error('nie znaleziono var DAILY=[ w dane.html'); process.exit(1); }
const at = start + 'var DAILY=['.length;

if (html.slice(at, at + 4000).includes(`"date": "${entry.date}"`)) {
  console.log('wpis z data ' + entry.date + ' juz jest, nie dodaje drugiego'); process.exit(0);
}
if (!html.includes(`E("${entry.n}"`)) {
  console.error(`"${entry.n}" nie wystepuje w katalogu jako E("${entry.n}", ...) - popraw nazwe`); process.exit(1);
}

const line = JSON.stringify({ date: entry.date, n: entry.n, pl: entry.pl, en: entry.en, src: entry.src })
  .replace(/^\{"/, '{"').replace(/","/g, '", "').replace(/":"/g, '": "');
const out = html.slice(0, at) + '\n' + line + ',' + html.slice(at);
fs.writeFileSync(file, out);
console.log('dodano wpis:', entry.date, entry.n);
