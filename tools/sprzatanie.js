// Removes heavy media (mp4, mp3, m4a, png, jpg) from tiktok/<YYYY-MM-DD>-* folders older than N days (default 14).
// Metricool copies media when a post is scheduled, so old files are no longer needed; post.json and caption.txt stay,
// and git history keeps every file. Skips folders listed in tiktok/ZAPAS.md and ads folders.
// Usage: node tools/sprzatanie.js [dni] [--na-sucho]
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'tiktok');
const days = parseInt(process.argv[2], 10) || 14, dry = process.argv.includes('--na-sucho');
const cut = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
const zapas = fs.existsSync(path.join(dir, 'ZAPAS.md')) ? fs.readFileSync(path.join(dir, 'ZAPAS.md'), 'utf8') : '';
let n = 0, bytes = 0;
for (const f of fs.readdirSync(dir)) {
  const m = /^(\d{4}-\d{2}-\d{2})-/.exec(f);
  if (!m || m[1] >= cut || /-ads-/.test(f) || zapas.includes(f)) continue;
  const d = path.join(dir, f); if (!fs.statSync(d).isDirectory()) continue;
  for (const x of fs.readdirSync(d)) {
    if (!/\.(mp4|mp3|m4a|png|jpe?g|wav)$/i.test(x)) continue;
    const p = path.join(d, x); bytes += fs.statSync(p).size; n++;
    if (!dry) fs.unlinkSync(p);
  }
}
console.log(`${dry ? 'do usunięcia' : 'usunięto'}: ${n} plików, ${(bytes / 1e6).toFixed(1)} MB (foldery sprzed ${cut})`);
