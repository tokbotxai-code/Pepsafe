// Story 9:16 "Peptide of the day" built from the site's DAILY entry (Instagram + Facebook; it shows the name, so never TikTok).
// Usage: node tools/story.js [YYYY-MM-DD]   (default: today, Europe/London)
// Output: tiktok/<date>-story-daily-en/story.jpg
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const date = process.argv[2] || new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

// catalog and DAILY, read the same way as tools/reel.js
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const a = lines.findIndex(l => /^var ST=\{A:/.test(l)), b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const box = { window: {}, document: {}, console }; vm.createContext(box);
vm.runInContext('var D=[];function E(n,a,s,c,cat,f,d,m,u,ev,w){D.push({n,s})}', box);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
const di = lines.findIndex(l => /^var DAILY=\[/.test(l));
vm.runInContext(lines.slice(di, lines.findIndex((l, i) => i > di && /^\];/.test(l)) + 1).join('\n'), box);

const day = box.DAILY.find(e => e.date === date);
if (!day) { console.error('no DAILY entry for', date); process.exit(1); }
const e = box.D.find(x => x.n === day.n), t = box.EN[day.n];
if (!e || !t) { console.error('not in catalog:', day.n); process.exit(1); }
const AVOID = /\b(inject\w*|dose\w*|dosing|buy\w*|vials?|shops?|cycles?|protocols?|stacks?|syringes?|banned|prohibited)\b/i;
const facts = day.en.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/).filter(s => !AVOID.test(s) && s.length < 260).slice(0, 2);
const TONE = { A: '#3CCFA9', R: '#6FA3E8', P: '#6FA3E8', U: '#FF9A66', C: '#F2B134', N: '#9AA8B3' };
const tone = TONE[e.s] || '#3CCFA9', status = box.ST_EN[e.s] || e.s;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#070D11;overflow:hidden;font-family:Inter,sans-serif;color:#E6EEF2;position:relative}
canvas{position:absolute;inset:0}
#brand{position:absolute;left:70px;top:110px;display:flex;align-items:center;gap:18px;font:800 46px Inter;color:#fff}
.k{position:absolute;left:70px;right:70px;top:300px;font:700 38px Inter;letter-spacing:.18em;color:${tone}}
.n{position:absolute;left:70px;right:70px;top:360px;font:900 128px/1 Inter;letter-spacing:-.03em;text-shadow:0 6px 40px #070D11}
.c{position:absolute;left:70px;right:70px;top:${t[0].length > 14 ? 640 : 520}px;font:600 40px/1.3 Inter;color:#93A4AF}
.f{position:absolute;left:70px;right:70px;bottom:440px;display:flex;flex-direction:column;gap:26px}
.f p{font:600 44px/1.32 Inter;background:rgba(7,13,17,.78);border-left:8px solid ${tone};padding:24px 30px;border-radius:14px}
.st{position:absolute;left:70px;bottom:330px;font:800 40px Inter;padding:14px 34px;border-radius:999px;border:5px solid ${tone};color:${tone};background:#070D11}
.cta{position:absolute;left:70px;right:70px;bottom:150px;text-align:center;font:800 46px Inter;color:#070D11;background:${tone};padding:30px;border-radius:999px}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas>
<div id="brand"><svg width="78" height="78" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#93A4AF" stroke-width="2.2" fill="none"/><circle cx="6" cy="24" r="4.6" fill="#6FA3E8"/><circle cx="14" cy="10" r="4.6" fill="#3CCFA9"/><circle cx="22" cy="22" r="4.6" fill="#FF9A66"/><circle cx="29" cy="8" r="4.6" fill="#C58BE0"/></svg>PepSafe</div>
<div class="k">PEPTIDE OF THE DAY</div><div class="n">${esc(t[0])}</div><div class="c">${esc(t[1])}</div>
<div class="f">${facts.map(s => '<p>' + esc(s) + '</p>').join('')}</div>
<div class="st">${esc(status)}</div><div class="cta">Full story: pepsafe.info</div>
<script>
const x=document.getElementById('c').getContext('2d');const COL=['#6FA3E8','#3CCFA9','#FF9A66','#C58BE0'];let seed=11;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
const g=x.createRadialGradient(800,700,40,800,700,900);g.addColorStop(0,'${tone}33');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,1080,1920);
const P=[...Array(60)].map(()=>({x:r()*1080,y:r()*1920,z:.3+r()*1.2,c:COL[Math.floor(r()*4)]}));
x.lineWidth=2;for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const d=Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y);if(d<180){x.strokeStyle='rgba(147,164,175,'+(0.2*(1-d/180))+')';x.beginPath();x.moveTo(P[i].x,P[i].y);x.lineTo(P[j].x,P[j].y);x.stroke();}}
for(const p of P){x.globalAlpha=.12+.2*p.z/1.5;x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,6+10*p.z,0,6.28);x.fill();}
</script></body></html>`;

(async () => {
  const dir = path.join(root, 'tiktok', `${date}-story-daily-en`); fs.mkdirSync(dir, { recursive: true });
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(page); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(dir, 'story.jpg'), type: 'jpeg', quality: 90 });
  await br.close();
  console.log('story:', path.join(dir, 'story.jpg'), '|', t[0], '|', facts.length, 'facts');
})();
