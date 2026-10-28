// Side effects and symptoms per entry (skutki.json): tags for the symptom search plus common / serious / unknown, in en, pl and es.
// key = PL name from the catalogue (peptides) or "s-<id>" (steroids).
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'skutki.json');
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const H = {
  common: { en: 'Common effects', pl: 'Częste skutki', es: 'Efectos frecuentes' },
  serious: { en: 'Serious: get medical help', pl: 'Poważne: pilnie do lekarza', es: 'Graves: busca atención médica' },
  unknown: { en: 'What we do not know', pl: 'Czego nie wiemy', es: 'Lo que no sabemos' }
};
const list = (o, L) => (o && (o[L] || o.en)) || [];
const get = key => data[key] || null;
const text = (key, L) => { const o = data[key]; if (!o) return ''; return [].concat(list(o.common, L), list(o.serious, L), o.unknown ? [(o.unknown[L] || o.unknown.en || '')] : []).join(' '); };
const tags = key => (data[key] && data[key].k) || [];
const html = (key, L, esc) => {
  const o = data[key]; if (!o) return '';
  const ul = (t, a) => a.length ? `<div class="pc"><h2 class="kick">${esc(H[t][L])}</h2><ul class="srcs-list">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
  const un = o.unknown && (o.unknown[L] || o.unknown.en) ? `<div class="pc"><h2 class="kick">${esc(H.unknown[L])}</h2><p class="small">${esc(o.unknown[L] || o.unknown.en)}</p></div>` : '';
  const body = ul('common', list(o.common, L)) + ul('serious', list(o.serious, L)) + un;
  return body ? `<section class="blk reveal skgrid">${body}</section>` : '';
};
// EN -> ES pairs for the Spanish data and pages
const pairs = () => { const m = {}; for (const o of Object.values(data)) { for (const t of ['common', 'serious']) (list(o[t], 'en')).forEach((s, i) => { if (o[t].es && o[t].es[i]) m[s] = o[t].es[i]; }); if (o.unknown && o.unknown.en && o.unknown.es) m[o.unknown.en] = o.unknown.es; } return m; };
module.exports = { get, text, tags, html, pairs, data };
