// Fetch molecular formula, weight and PubChem id for each catalogue entry (by English name) -> molekuly.json
// {"<PL name>": {"cid":n,"f":"C..","mw":"4114","t":"PubChem title"}}. Existing entries are kept; --all refetches.
const fs = require('fs'), path = require('path'), https = require('https');
const root = path.join(__dirname, '..');
const load = L => JSON.parse(fs.readFileSync(path.join(root, 'assets', 'dane-' + L + '.js'), 'utf8').replace(/^window\.PEP = /, '').replace(/;\s*$/, '')).rows;
const pl = load('pl'), en = load('en');
const out = path.join(root, 'molekuly.json');
const have = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
const get = u => new Promise(r => https.get(u, { headers: { 'User-Agent': 'pepsafe.info' } }, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => r({ s: x.statusCode, b })); }).on('error', () => r({ s: 0, b: '' })));
const skip = /\+|^GLOW|^KLOW|blend|mieszan/i;
(async () => {
  for (let i = 0; i < pl.length; i++) {
    const k = pl[i].n, name = en[i].n;
    if ((have[k] || have[k] === null) && !process.argv.includes('--all')) continue;
    if (skip.test(name)) { have[k] = null; continue; }
    const r = await get('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + encodeURIComponent(name) + '/property/MolecularFormula,MolecularWeight,Title/JSON');
    try { const p = JSON.parse(r.b).PropertyTable.Properties[0]; have[k] = { cid: p.CID, f: p.MolecularFormula, mw: String(p.MolecularWeight), t: p.Title, q: name }; }
    catch (e) { have[k] = null; }
    await new Promise(r => setTimeout(r, 250));
  }
  fs.writeFileSync(out, JSON.stringify(have, null, 1));
  const ok = Object.values(have).filter(Boolean).length;
  console.log(ok + ' found, ' + (Object.keys(have).length - ok) + ' without data');
})();
