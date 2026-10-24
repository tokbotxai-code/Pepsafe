// Name reel for Instagram and Facebook (never TikTok: it shows substance names).
// Animated molecule background, one big name per scene, one line on what it was studied for, its status, and the free US voice.
// Usage: node tools/reel.js <folder> "<intro line>" "Catalog name 1" "Catalog name 2" ...
// Output: tiktok/<folder>/pepsafe-<folder>-lektor.mp4 + caption.txt + post.json (the scene list, for the record).
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const [folder, intro, ...names] = process.argv.slice(2);
if (!folder || !intro || names.length < 2) { console.error('usage: node tools/reel.js <folder> "<intro>" "Name" "Name" ...'); process.exit(1); }
const dir = path.join(root, 'tiktok', folder); fs.mkdirSync(dir, { recursive: true });

// catalog, read the same way as tools/karty.js
const lines = fs.readFileSync(path.join(root, 'dane.html'), 'utf8').split('\n');
const a = lines.findIndex(l => /^var ST=\{A:/.test(l)), b = lines.length - [...lines].reverse().findIndex(l => /^E\(/.test(l));
const box = { window: {}, document: {}, console }; vm.createContext(box);
vm.runInContext('var D=[];function E(n,a,s,c,cat,f,d,m,u,ev,w){D.push({n,s})}', box);
vm.runInContext(lines.slice(a, b).join('\n').replace(/^var D=\[\].*$/m, '').replace(/^function E\(.*$/m, ''), box);
const AVOID = /\b(inject\w*|dose\w*|dosing|buy\w*|vials?|shops?|cycles?|protocols?|stacks?|syringes?|banned|prohibited)\b/i;
const TONE = { A: '#3CCFA9', R: '#6FA3E8', P: '#6FA3E8', U: '#FF9A66', C: '#F2B134', N: '#9AA8B3' };
const short = t => {
  let x = String(t || '').split(/(?<=[.;])\s/)[0].replace(/\s*\(.*?\)\s*/g, ' ').replace(/[.;]\s*$/, '').trim();
  const parts = x.split(', '); if (parts.length > 3) x = parts.slice(0, 3).join(', ');  // long lists read badly on screen
  return x;
};

const scenes = names.map(n => {
  const e = box.D.find(x => x.n === n), t = box.EN[n];
  if (!e || !t) { console.error('not in catalog:', n); process.exit(1); }
  const use = short(t[4]), status = box.ST_EN[e.s] || e.s;
  if (AVOID.test(use) || AVOID.test(t[1])) { console.error('avoided word in', n); process.exit(1); }
  return { name: t[0], cls: t[1], use, status, tone: TONE[e.s] || '#3CCFA9', vo: `${t[0]}. ${use}. Status: ${status}.` };
});
const all = [{ intro, vo: intro }, ...scenes, { outro: true, vo: 'Status and sources for every one: pepsafe dot info.' }];

// voice, one line per scene; each scene lasts as long as its line plus a breath
const PAD = 0.6;
all.forEach((s, i) => {
  s.mp3 = path.join(dir, `vo-${String(i + 1).padStart(2, '0')}.mp3`);
  execFileSync('python3', ['-I', path.join(__dirname, 'kokoro.py'), s.vo, s.mp3], { stdio: 'ignore' });
  s.sec = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', s.mp3]).toString()) + PAD;
});
const total = all.reduce((t, s) => t + s.sec, 0), FPS = 24;

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#070D11;overflow:hidden;font-family:Inter,sans-serif;color:#E6EEF2}
canvas{position:absolute;inset:0}
.t *{text-shadow:0 4px 24px #070D11,0 0 40px #070D11}.t{position:absolute;left:80px;right:80px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:34px}
.kick{font:600 40px Inter;letter-spacing:.16em;text-transform:uppercase;color:#93A4AF}
.name{font:900 150px/1 "Inter Display",Inter;letter-spacing:-.03em}
.use{font:600 54px/1.3 Inter;color:#E6EEF2;max-width:900px}
.st{font:800 44px Inter;padding:14px 34px;border-radius:999px;border:5px solid}
.intro{font:800 96px/1.08 "Inter Display",Inter}
.brand{position:absolute;left:0;right:0;bottom:150px;text-align:center;font:700 44px Inter;color:#3CCFA9}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas><div class="t" id="t"></div><div class="brand">pepsafe.info</div>
<script>
const S=${JSON.stringify(all.map(s => ({ ...s, mp3: undefined })))};
const c=document.getElementById('c'),x=c.getContext('2d'),T=document.getElementById('t');
const COL=['#6FA3E8','#3CCFA9','#FF9A66','#C58BE0'];let seed=7;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
const P=[...Array(70)].map(()=>({x:r()*1080,y:r()*1920,z:.3+r()*1.2,c:COL[Math.floor(r()*4)],p:r()*6.28}));
function bg(t){x.fillStyle='#070D11';x.fillRect(0,0,1080,1920);
 const g=x.createRadialGradient(540,900+Math.sin(t*.3)*80,50,540,900,1100);g.addColorStop(0,'rgba(60,207,169,.16)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,1080,1920);
 const pts=P.map(p=>({X:(p.x+Math.sin(t*.25*p.z+p.p)*60*p.z)%1080,Y:(p.y-t*18*p.z+1920*4)%1920,z:p.z,c:p.c}));
 x.lineWidth=2;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const d=Math.hypot(pts[i].X-pts[j].X,pts[i].Y-pts[j].Y);if(d<170){x.strokeStyle='rgba(147,164,175,'+(0.22*(1-d/170))+')';x.beginPath();x.moveTo(pts[i].X,pts[i].Y);x.lineTo(pts[j].X,pts[j].Y);x.stroke();}}
 for(const p of pts){x.globalAlpha=.35+.5*p.z/1.5;x.fillStyle=p.c;x.beginPath();x.arc(p.X,p.Y,6+10*p.z,0,6.28);x.fill();}x.globalAlpha=1;}
let cur=-1;window.frame=t=>{bg(t);let acc=0,k=0;for(;k<S.length;k++){if(t<acc+S[k].sec)break;acc+=S[k].sec}k=Math.min(k,S.length-1);
 const s=S[k],f=Math.min(1,(t-acc)/.35);if(k!==cur){cur=k;T.innerHTML=s.intro?'<div class="kick">Peptide facts, no hype</div><div class="intro">'+s.intro+'</div>':s.outro?'<div class="intro">Status and sources for every one</div><div class="use" style="color:#3CCFA9">pepsafe.info</div>':'<div class="kick">'+s.cls+'</div><div class="name" style="color:'+s.tone+'">'+s.name+'</div><div class="use">'+s.use+'</div><div class="st" style="border-color:'+s.tone+';color:'+s.tone+'">'+s.status+'</div>';}
 T.style.opacity=f;T.style.transform='translateY('+((1-f)*40)+'px) scale('+(0.96+0.04*f)+')';};
</script></body></html>`;

(async () => {
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(page); await pg.waitForTimeout(300);
  const frames = path.join(dir, 'frames'); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  const n = Math.ceil(total * FPS);
  for (let i = 0; i < n; i++) { await pg.evaluate(t => window.frame(t), i / FPS); await pg.screenshot({ path: path.join(frames, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 85 }); }
  await br.close();
  const silent = path.join(dir, 'silent.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', silent]);
  // voice lines placed at their scene start, quiet music underneath
  const args = ['-v', 'error', '-y', '-i', silent]; let f = '', mix = '', off = 0;
  all.forEach((s, i) => { args.push('-i', s.mp3); f += `[${i + 1}:a]adelay=${Math.round((off + 0.25) * 1000)}|${Math.round((off + 0.25) * 1000)}[a${i}];`; mix += `[a${i}]`; off += s.sec; });
  args.push('-stream_loop', '-1', '-i', path.join(root, 'tiktok', 'music-calm.m4a'));
  f += `[${all.length + 1}:a]volume=0.14,atrim=0:${total.toFixed(2)}[m];${mix}[m]amix=inputs=${all.length + 1}:normalize=0[out]`;
  const out = path.join(dir, `pepsafe-${folder}-lektor.mp4`);
  args.push('-filter_complex', f, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', total.toFixed(2), '-movflags', '+faststart', out);
  execFileSync('ffmpeg', args);
  fs.rmSync(frames, { recursive: true }); fs.unlinkSync(silent);
  const tags = scenes.map(s => '#' + s.name.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '')).join(' ');
  const caption = `${scenes.map(s => s.name).join(', ')} — ${intro.replace(/[.!?]?$/, '')} 🔬\n\n` +
    scenes.map(s => `${s.name}: ${s.use.toLowerCase()} — ${s.status.toLowerCase()}.`).join('\n') +
    `\n\nEducational content, not medical advice. More at pepsafe.info\n\n${tags} #peptides #science #pepsafe`;
  fs.writeFileSync(path.join(dir, 'caption.txt'), caption + '\n');
  fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ format: 'reel-names', intro, names, caption }, null, 1));
  console.log('reel:', out, total.toFixed(1) + 's');
})();
