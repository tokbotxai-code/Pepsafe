// TikTok photo carousel (JPG slides, TikTok adds its own music with autoAddMusic) from a topic's post.json.
// Only for nature/biology topics without substance names: run tools/sprawdz.js on the source folder first.
// Usage: node tools/fotki.js tiktok/<source-folder> <new-folder-name>
// Output: tiktok/<new-folder-name>/slide-1.jpg ... + caption.txt
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const [src, name] = process.argv.slice(2);
if (!src || !name) { console.error('usage: node tools/fotki.js tiktok/<source> <new-folder>'); process.exit(1); }
const post = JSON.parse(fs.readFileSync(path.join(root, src, 'post.json'), 'utf8'));
const dir = path.join(root, 'tiktok', name); fs.mkdirSync(dir, { recursive: true });
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const AC = ['#3CCFA9', '#6FA3E8', '#FF9A66', '#C58BE0', '#F2B134'];

const html = (s, i, n) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#070D11;color:#E6EEF2;font-family:Inter,sans-serif;overflow:hidden;position:relative}
canvas{position:absolute;inset:0}
.w{position:absolute;left:90px;right:90px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:40px}
.k{font:800 40px Inter;letter-spacing:.18em;text-transform:uppercase;color:${AC[i % 5]}}
.b{font:900 300px/0.9 Inter;color:${AC[i % 5]};letter-spacing:-.04em}
.t{font:900 ${s.hero ? 110 : 84}px/1.08 Inter;letter-spacing:-.02em}
.c{align-self:flex-start;font:800 50px Inter;color:#070D11;background:${AC[i % 5]};padding:22px 44px;border-radius:999px}
.f{font:600 36px/1.35 Inter;color:#93A4AF}
.n{position:absolute;right:90px;bottom:120px;font:700 36px Inter;color:#93A4AF}
.br{position:absolute;left:90px;bottom:120px;font:800 40px Inter;color:#fff;opacity:.85}
${i === 0 ? '.sw{position:absolute;left:0;right:0;bottom:240px;text-align:center;font:700 40px Inter;color:#93A4AF}' : ''}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<div class="w"><div class="k">${esc(s.kicker)}</div>${s.big ? '<div class="b">' + esc(s.big) + '</div>' : ''}<div class="t">${esc(s.title)}</div>
${s.cta ? '<div class="c">' + esc(s.cta) + '</div>' : ''}${s.foot ? '<div class="f">' + esc(s.foot) + '</div>' : ''}</div>
<div class="br">PepSafe</div><div class="n">${i + 1}/${n}</div>${i === 0 ? '<div class="sw">swipe →</div>' : ''}
<script>
const x=document.getElementById('c').getContext('2d');let sd=${i * 97 + 13};const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
const g=x.createRadialGradient(780,600,40,780,600,900);g.addColorStop(0,'${AC[i % 5]}30');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,1080,1920);
const COL=${JSON.stringify(AC)};const P=[...Array(45)].map(()=>({x:r()*1080,y:r()*1920,z:.3+r()*1.2,c:COL[Math.floor(r()*5)]}));
x.lineWidth=2;for(let a=0;a<P.length;a++)for(let b=a+1;b<P.length;b++){const d=Math.hypot(P[a].x-P[b].x,P[a].y-P[b].y);if(d<170){x.strokeStyle='rgba(147,164,175,'+(0.16*(1-d/170))+')';x.beginPath();x.moveTo(P[a].x,P[a].y);x.lineTo(P[b].x,P[b].y);x.stroke();}}
for(const p of P){x.globalAlpha=.12+.2*p.z/1.5;x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,6+10*p.z,0,6.28);x.fill();}
</script></body></html>`;

(async () => {
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  const n = post.slides.length;
  for (let i = 0; i < n; i++) {
    await pg.setContent(html(post.slides[i], i, n)); await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(dir, `slide-${i + 1}.jpg`), type: 'jpeg', quality: 90 });
  }
  await br.close();
  fs.writeFileSync(path.join(dir, 'caption.txt'), post.caption + '\n');
  fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ ...post, format: 'tiktok-photo', source: src }, null, 1));
  console.log('fotki:', path.relative(root, dir), n, 'slides');
})();
