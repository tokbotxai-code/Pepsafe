// Molecule reel: glowing amino-acid chains and real 3D protein structures (RCSB PDB), word-by-word captions, free US voice.
// No generated imagery: every structure shown is real data, so no "AI generated" label is needed.
// Usage: node tools/molreel.js <folder> <script.json>
//   script.json: {"caption": "...", "scenes": [{"say": "sentence", "show": "chain:12" | "pdb:3I40"}, ...]}
// Output: tiktok/<folder>/pepsafe-<folder>-lektor.mp4 + caption.txt
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const [folder, scriptFile] = process.argv.slice(2);
if (!folder || !scriptFile) { console.error('usage: node tools/molreel.js <folder> <script.json>'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(scriptFile, 'utf8'));
const dir = path.join(root, 'tiktok', folder); fs.mkdirSync(dir, { recursive: true });

// C-alpha trace of a structure, centred, one array per chain (kept in tools/pdb so it never depends on the network)
const pdb = id => {
  const f = path.join(__dirname, 'pdb', id + '.pdb');
  if (!fs.existsSync(f)) execFileSync('curl', ['-sS', '-o', f, `https://files.rcsb.org/download/${id}.pdb`]);
  const ch = {};
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!l.startsWith('ATOM') || l.slice(12, 16) !== ' CA ') continue;
    if (l.startsWith('ENDMDL')) break;
    (ch[l[21]] = ch[l[21]] || []).push([+l.slice(30, 38), +l.slice(38, 46), +l.slice(46, 54)]);
  }
  const all = Object.values(ch).flat(), c = [0, 1, 2].map(k => all.reduce((s, p) => s + p[k], 0) / all.length);
  const r = Math.max(...all.map(p => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2])));
  return Object.values(ch).map(a => a.map(p => p.map((v, k) => (v - c[k]) / r)));
};

// voice per sentence; words timed in proportion to their length inside the sentence
const PAD = 0.45;
let t0 = 0;
const scenes = spec.scenes.map((s, i) => {
  const mp3 = path.join(dir, `vo-${String(i + 1).padStart(2, '0')}.mp3`);
  execFileSync('python3', ['-I', path.join(__dirname, 'kokoro.py'), s.say, mp3], { stdio: 'ignore' });
  const len = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString());
  const words = s.say.replace(/pepsafe dot info/i, 'pepsafe.info').split(/\s+/), chars = words.reduce((a, w) => a + w.length + 1, 0);
  let acc = t0 + 0.2; const timed = words.map(w => { const st = acc; acc += (w.length + 1) / chars * (len - 0.15); return { w, st }; });
  const out = { ...s, mp3, start: t0, sec: len + PAD, words: timed, data: s.show.startsWith('pdb:') ? pdb(s.show.slice(4)) : null };
  t0 += len + PAD; return out;
});
const total = t0, FPS = 24;

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0}body{width:1080px;height:1920px;background:#05080B;overflow:hidden}canvas{position:absolute;inset:0}
#cap{position:absolute;left:60px;right:60px;top:1230px;text-align:center;font:900 92px/1.05 Inter,sans-serif;letter-spacing:-.01em;color:#fff;text-transform:uppercase;text-shadow:0 4px 30px #000,0 0 12px #000}
#cap b{color:#FF9A3C}#brand{position:absolute;left:56px;top:70px;display:flex;align-items:center;gap:18px;font:800 46px Inter,sans-serif;color:#fff;opacity:.92;text-shadow:0 2px 16px #000}
</style></head><body><canvas id="c" width="1080" height="1920"></canvas><div id="cap"></div><div id="brand"><svg width="78" height="78" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#93A4AF" stroke-width="2.2" fill="none"/><circle cx="6" cy="24" r="4.6" fill="#6FA3E8"/><circle cx="14" cy="10" r="4.6" fill="#3CCFA9"/><circle cx="22" cy="22" r="4.6" fill="#FF9A66"/><circle cx="29" cy="8" r="4.6" fill="#C58BE0"/></svg>PepSafe</div><script>
const S=${JSON.stringify(scenes.map(s => ({ show: s.show, start: s.start, sec: s.sec, words: s.words, data: s.data })))};
const c=document.getElementById('c'),x=c.getContext('2d'),cap=document.getElementById('cap');
let seed=11;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const SP=[...Array(160)].map(()=>({x:R()*1080,y:R()*1920,s:.5+R()*2.5,v:5+R()*25,a:R()}));
const rot=(p,a,b)=>{let [X,Y,Z]=p;let x1=X*Math.cos(a)+Z*Math.sin(a),z1=-X*Math.sin(a)+Z*Math.cos(a);let y1=Y*Math.cos(b)-z1*Math.sin(b),z2=Y*Math.sin(b)+z1*Math.cos(b);return [x1,y1,z2]};
const proj=(p,sc,cx,cy)=>{const f=2.6/(2.6+p[2]);return [cx+p[0]*sc*f,cy+p[1]*sc*f,f,p[2]]};
function glowBall(X,Y,r,a){const g=x.createRadialGradient(X-r*.3,Y-r*.3,r*.1,X,Y,r);g.addColorStop(0,'rgba(255,240,200,'+a+')');g.addColorStop(.35,'rgba(255,140,40,'+a+')');g.addColorStop(1,'rgba(120,30,0,0)');x.fillStyle=g;x.beginPath();x.arc(X,Y,r*1.6,0,6.28);x.fill();
 x.strokeStyle='rgba(255,220,180,'+(a*.55)+')';x.lineWidth=3;x.beginPath();x.arc(X,Y,r,0,6.28);x.stroke();}
function bg(t){x.fillStyle='#05080B';x.fillRect(0,0,1080,1920);const g=x.createRadialGradient(540,820,40,540,820,900);g.addColorStop(0,'rgba(255,120,30,.10)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,1080,1920);
 for(const p of SP){const y=(p.y-t*p.v+19200)%1920;x.globalAlpha=.25+.5*Math.abs(Math.sin(t*1.3+p.a*6));x.fillStyle=p.a>.7?'#FFB25C':'#9FB4C4';x.beginPath();x.arc(p.x+Math.sin(t*.5+p.a*9)*12,y,p.s,0,6.28);x.fill();}x.globalAlpha=1;}
function chain(t,n,lt){const pts=[];for(let i=0;i<n;i++){const u=i/(n-1);pts.push(rot([Math.sin(u*Math.PI*2.2+t*1.4)*.55,(u-.5)*1.15+Math.sin(t*2+u*6)*.03,Math.cos(u*Math.PI*2.2+t*1.4)*.45],t*.6,.25+Math.sin(t*.7)*.15));}
 const shown=Math.min(n,Math.floor(lt*7)+1),P=pts.map(p=>proj(p,560,540,760));
 x.shadowColor='#FF8A20';x.shadowBlur=30;x.strokeStyle='rgba(255,170,80,.75)';x.lineWidth=7;x.beginPath();for(let i=0;i<shown;i++){i?x.lineTo(P[i][0],P[i][1]):x.moveTo(P[i][0],P[i][1]);}x.stroke();x.shadowBlur=0;
 P.slice(0,shown).map((p,i)=>[p,i]).sort((a,b)=>b[0][3]-a[0][3]).forEach(([p,i])=>{const pop=Math.min(1,(lt*7-i)/1.2);glowBall(p[0],p[1],(34+14*p[2])*Math.max(.2,pop)*(1+.13*Math.sin(t*6+i*.9)),.95*p[2]);});}
function prot(t,D,lt){const a=t*.9,b=.35+Math.sin(t*.6)*.25,e=Math.min(1,lt/1.2),sc=(260+200*(1-Math.pow(1-e,3)))*(1+.05*Math.sin(t*2));const cols=['255,205,90','255,130,40','255,170,120'];
 D.forEach((ch,ci)=>{const P=ch.map(p=>proj(rot(p,a,b),sc,540,820));
  for(const [w,al,bl] of [[26,.10,40],[12,.35,22],[5,.95,8]]){x.shadowColor='rgba('+cols[ci%3]+',1)';x.shadowBlur=bl;x.strokeStyle='rgba('+cols[ci%3]+','+al+')';x.lineWidth=w;x.lineJoin='round';x.lineCap='round';x.beginPath();
   for(let i=0;i<P.length;i++){if(!i){x.moveTo(P[i][0],P[i][1]);continue}const m=[(P[i-1][0]+P[i][0])/2,(P[i-1][1]+P[i][1])/2];x.quadraticCurveTo(P[i-1][0],P[i-1][1],m[0],m[1]);}x.stroke();}
  x.shadowBlur=0;P.forEach(p=>{x.fillStyle='rgba(255,235,200,'+(.35+.5*p[2]-.2)+')';x.beginPath();x.arc(p[0],p[1],5*p[2],0,6.28);x.fill();});});}
let last='',lastW='',SPK=[];
function sparks(){for(const p of SPK){p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l-=1/24;x.globalAlpha=Math.max(0,p.l);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,p.r,0,6.28);x.fill();}x.globalAlpha=1;SPK=SPK.filter(p=>p.l>0);}
window.frame=t=>{bg(t);let k=S.findIndex(s=>t<s.start+s.sec);if(k<0)k=S.length-1;const s=S[k],lt=t-s.start;
 const z=1.04+.06*Math.sin(t*.8)+Math.min(.08,lt*.03);x.save();x.translate(540+Math.sin(t*.5)*18,780+Math.cos(t*.4)*14);x.scale(z,z);x.translate(-540,-780);
 const fade=Math.min(1,lt/.4,(s.start+s.sec-t)/.3+.3);x.globalAlpha=Math.max(0,Math.min(1,fade));
 if(s.show.startsWith('chain:'))chain(t,+s.show.slice(6),lt);else prot(t,s.data,lt);x.globalAlpha=1;x.restore();sparks();
 if(lt<.3){const fl=x.createRadialGradient(540,780,10,540,780,900);fl.addColorStop(0,'rgba(255,200,140,'+((.3-lt)*1.6)+')');fl.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=fl;x.fillRect(0,0,1080,1920);}
 let wi=s.words.findIndex(w=>w.st>t)-1;if(wi<-1)wi=s.words.length-1;if(wi===-2)wi=s.words.length-1;
 const a=Math.max(0,Math.floor(Math.max(wi,0)/3)*3),grp=s.words.slice(a,a+3);
 const h=wi<0?'':grp.map((w,j)=>a+j===wi?'<b>'+w.w+'</b>':(a+j<wi?w.w:'')).filter(Boolean).join(' ');if(h!==last){cap.innerHTML=h;last=h;}
 const wk=k+':'+wi;if(wi>=0&&wk!==lastW){lastW=wk;for(let i=0;i<16;i++){const an=R()*6.28,sp=4+R()*9;SPK.push({x:540+Math.cos(an)*40,y:780+Math.sin(an)*40,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-3,r:2+R()*4,l:.7+R()*.5,c:R()>.5?'#FFB25C':'#FFE2B0'});}}
 cap.style.transform='scale('+(1+Math.max(0,.12-(t-(s.words[Math.max(wi,0)]||{st:0}).st)*.6))+')';};
</script></body></html>`;

(async () => {
  const br = await chromium.launch(), pg = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(page); await pg.waitForTimeout(300);
  const frames = path.join(dir, 'frames'); fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  for (let i = 0, n = Math.ceil(total * FPS); i < n; i++) {
    await pg.evaluate(t => window.frame(t), i / FPS);
    await pg.screenshot({ path: path.join(frames, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
  }
  await br.close();
  const silent = path.join(dir, 'silent.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', silent]);
  const args = ['-v', 'error', '-y', '-i', silent]; let f = '', mix = '';
  scenes.forEach((s, i) => { const ms = Math.round((s.start + 0.2) * 1000); args.push('-i', s.mp3); f += `[${i + 1}:a]adelay=${ms}|${ms}[a${i}];`; mix += `[a${i}]`; });
  args.push('-stream_loop', '-1', '-i', path.join(root, 'tiktok', 'music-calm.m4a'));
  f += `[${scenes.length + 1}:a]volume=0.14,atrim=0:${total.toFixed(2)}[m];${mix}[m]amix=inputs=${scenes.length + 1}:normalize=0[out]`;
  const out = path.join(dir, `pepsafe-${folder}-lektor.mp4`);
  args.push('-filter_complex', f, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', total.toFixed(2), '-movflags', '+faststart', out);
  execFileSync('ffmpeg', args);
  fs.rmSync(frames, { recursive: true }); fs.unlinkSync(silent);
  fs.writeFileSync(path.join(dir, 'caption.txt'), spec.caption + '\n');
  fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify({ format: 'mol-reel', ...spec }, null, 1));
  console.log('molreel:', out, total.toFixed(1) + 's');
})();
