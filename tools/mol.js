// Downloads the 2D structure of each steroid-section compound from PubChem (public domain) into mol/<id>.png.
// Only fetches what is missing. Usage: node tools/mol.js [--force]
// Products that are not one defined molecule (blends, proteins) get no picture.
const fs = require('fs'), path = require('path'), https = require('https');
const root = path.join(__dirname, '..'), dir = path.join(root, 'sterydy'), out = path.join(root, 'mol');
fs.mkdirSync(out, { recursive: true });
const rows = fs.readdirSync(dir).filter(f => /^\d.*\.json$/.test(f)).sort().flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const SKIP = new Set(['sustanon', 'hcg', 'somatropin']);                       // mixture and proteins
const NAME = {                                                                   // PubChem name when it differs from the entry name
  'testosterone-gel': 'testosterone', 'testosterone-propionate': 'testosterone propionate', 'trenbolone': 'trenbolone',
  'nandrolone-phenylpropionate': 'nandrolone phenylpropionate', 'turinabol': 'chlorodehydromethyltestosterone',
  'ostarine': 'enobosarm', 'ligandrol': 'LGD-4033', 'rad140': 'testolone', 'andarine': 'andarine', 'cardarine': 'GW501516',
  'sr9009': 'SR9009', 'mk-677': 'ibutamoren', 'yk-11': 'YK-11', 'dnp': '2,4-dinitrophenol', 'bam15': 'BAM15', 'dhea': 'prasterone',
  'androstanolone': 'androstanolone', 'dexamethasone': 'dexamethasone', 'hydrocortisone': 'hydrocortisone', 'methasterone': 'methasterone',
  'testosterone-undecanoate': 'testosterone undecanoate', 'methenolone-enanthate': 'methenolone enanthate', 'drostanolone': 'drostanolone',
  'trestolone': 'trestolone', 'clostebol': 'clostebol', 'tibolone': 'tibolone', 'androstenedione': 'androstenedione', 'dmaa': 'methylhexanamine'
};
function get(url) {
  return new Promise((res, rej) => https.get(url, { headers: { 'User-Agent': 'pepsafe-build' } }, r => {
    const c = []; r.on('data', d => c.push(d)); r.on('end', () => r.statusCode === 200 ? res(Buffer.concat(c)) : rej(new Error('HTTP ' + r.statusCode)));
  }).on('error', rej));
}
(async () => {
  const force = process.argv.includes('--force'); let ok = 0, miss = [];
  for (const e of rows) {
    if (SKIP.has(e.id)) continue;
    const f = path.join(out, e.id + '.png');
    if (fs.existsSync(f) && !force) { ok++; continue; }
    const name = encodeURIComponent(NAME[e.id] || e.n.toLowerCase());
    try { fs.writeFileSync(f, await get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/PNG?image_size=320x320`)); ok++; }
    catch (x) { miss.push(e.id + ' (' + x.message + ')'); }
    await new Promise(r => setTimeout(r, 400));                                   // PubChem asks for under 5 requests a second
  }
  console.log(`mol: ${ok} obrazkow, brak: ${miss.length}` + (miss.length ? '\n - ' + miss.join('\n - ') : ''));
})();
