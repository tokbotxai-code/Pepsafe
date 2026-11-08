// Checks catalog sources (SRC): dead links, redirects to another page, search links for a different substance,
// PubMed records marked as retracted, and entries without any source.
// Usage: node tools/linki.js [--szybko]   (--szybko = no network, only name and missing-source checks)
// Exit code 1 = something to fix.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const at = re => lines.findIndex(l => re.test(l));
const box = { window: {}, document: {}, console }; vm.createContext(box);
const a = at(/^var ST=\{A:/), b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
vm.runInContext('var D=[];function E(n,a,s,c,cat,f){D.push({n,a,s})}', box);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
vm.runInContext(lines[at(/^var SRC=\{/)], box);
const D = box.D, SRC = box.SRC || {}, EN = box.EN || {};
const fast = process.argv.includes('--szybko');

const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const problems = [];
const jobs = [];
for (const e of D) {
  const src = SRC[e.n] || [];
  if (!src.length) { problems.push([e.n, 'brak źródła', '']); continue; }
  const names = [e.n, (EN[e.n] || [])[0] || e.n, ...(e.a ? String(e.a).split(/[,;\/]/) : [])].map(x => norm(x.replace(/\(.*\)/, ''))).filter(x => x.length > 2);
  for (const [title, url] of src) {
    let u; try { u = new URL(url); } catch (x) { problems.push([e.n, 'zły adres', url]); continue; }
    const q = u.searchParams.get('query') || u.searchParams.get('term') || u.searchParams.get('intr') || u.searchParams.get('cond');
    if (q && !names.some(n => norm(q).includes(n) || n.includes(norm(q)))) problems.push([e.n, 'wyszukiwanie innej nazwy', url]);
    if (!q) jobs.push([e.n, url]);
  }
}

async function check([n, url]) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (link check; contact@pepsafe.info)' } });
    if (r.status >= 300 && r.status < 400) {
      const loc = new URL(r.headers.get('location') || '', url);
      const from = new URL(url), host = h => h.replace(/^www\./, '');
      // DOI links always redirect to the publisher; elsewhere a jump to another site or to a home page means the document moved
      if (!/doi\.org$/.test(from.hostname) && (host(loc.hostname) !== host(from.hostname) || (loc.pathname.length <= 1 && from.pathname.length > 1)))
        problems.push([n, 'przekierowanie ' + r.status, url + ' → ' + loc.href]);
    } else if (r.status === 404 || r.status === 410) problems.push([n, 'nie istnieje ' + r.status, url]);
    else if (r.status >= 500) problems.push([n, 'błąd serwera ' + r.status, url]);
    else if (r.ok && /pubmed\.ncbi\.nlm\.nih\.gov\/\d+/.test(url)) {
      const h = await r.text();
      if (/Retracted Publication|Retraction in:/i.test(h)) problems.push([n, 'publikacja wycofana', url]);
    }
  } catch (x) { problems.push([n, 'brak odpowiedzi', url]); } finally { clearTimeout(t); }
}

(async () => {
  if (!fast) for (let i = 0; i < jobs.length; i += 8) await Promise.all(jobs.slice(i, i + 8).map(check));
  console.log(`źródła: ${D.length} wpisów, ${jobs.length} linków do dokumentów sprawdzonych${fast ? ' (pominięte, --szybko)' : ''}`);
  for (const p of problems) console.log(' - ' + p.join(' | '));
  console.log(problems.length ? `${problems.length} do poprawy` : 'bez błędów');
  process.exit(problems.length ? 1 : 0);
})();
