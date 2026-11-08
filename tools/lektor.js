// Lektor budget: characters sent to the voice service this month, counted from rendered -lektor.mp4 folders.
// Usage: node tools/lektor.js [YYYY-MM-DD start of the billing month, default 2026-10-20]
// Prints used / left and exits 1 when fewer than 400 characters are left (then render with "vo": false).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'tiktok'), LIMIT = 10000, from = process.argv[2] || '2026-10-20';
let used = 0, n = 0;
for (const d of fs.readdirSync(root)) {
  const dir = path.join(root, d), date = (d.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1];
  if (!date || date < from || !fs.existsSync(path.join(dir, 'post.json'))) continue;
  if (!fs.readdirSync(dir).some(f => f.endsWith('-lektor.mp4'))) continue;
  const p = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
  for (const s of p.slides) used += String(s.vo ?? [s.title, s.text].filter(Boolean).join(' ')).length;
  n++;
}
const left = LIMIT - used;
console.log(`lektor: ${n} filmów, ${used}/${LIMIT} znaków, zostało ${left} (~${Math.floor(left / 290)} filmów)`);
process.exit(left < 400 ? 1 : 0);
