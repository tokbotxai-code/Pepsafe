// Checks a TikTok post.json against the whole catalog: no substance name may appear
// in the caption, on a slide, in the voiceover or in a hashtag. Run before scheduling anything on TikTok.
// Usage: node tools/sprawdz.js tiktok/<folder> [tiktok/<folder> ...]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const a = lines.findIndex(l => /^var ST=\{A:/.test(l));
const b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const s = { window: {}, document: {}, console }; vm.createContext(s);
vm.runInContext('var D=[];function E(n,aa){D.push({n,aa})}', s);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), s);

const names = new Set();
for (const e of s.D) { names.add(e.n); (e.aa || '').split(/,\s*/).filter(Boolean).forEach(x => names.add(x)); }
for (const t of Object.values(s.EN || {})) if (t[0]) names.add(t[0]);
const BANNED = ['🚫', '💉', 'banned', 'prohibited', 'zakazan', 'dose', 'dawk', 'buy', 'kup', 'vial', 'fiolk',
  'inject', 'wstrzyk', 'syringe', 'strzykaw', 'purchase', 'before you', 'sklep', 'protocol', 'protokó', 'protokol'];
// whole words only: 'shop' must not catch 'workshop'; 'cycle' is left out on purpose ('cell cycle' is biology)
const BANNED_RE = [/\bshops?\b/i, /\bstack(s|ed|ing)?\b/i, /#(biohacking|fitness|gym|bodybuilding)\b/i];

let bad = 0;
for (const dir of process.argv.slice(2)) {
  const txt = fs.readFileSync(path.join(root, dir, 'post.json'), 'utf8');
  const hits = [...names].filter(n => n.length > 3 &&
    new RegExp('\\b' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(txt));
  const words = BANNED.filter(w => txt.toLowerCase().includes(w.toLowerCase()))
    .concat(BANNED_RE.filter(r => r.test(txt)).map(r => (txt.match(r) || [''])[0]));
  const problems = [...hits.map(h => 'nazwa: ' + h), ...words.map(w => 'słowo: ' + w)];
  console.log((problems.length ? 'UWAGA  ' : 'czysty ') + path.basename(dir) +
    (problems.length ? ' -> ' + problems.join(', ') : ''));
  bad += problems.length ? 1 : 0;
}
process.exit(bad ? 1 : 0);
