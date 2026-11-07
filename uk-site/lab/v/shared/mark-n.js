(function(){
var NEON=['#5ef0ff','#ffb15c','#ff6ad5','#b6ff5e','#ffffff','#a98bff'];
function P(d,w){return '<path d="'+d+'" pathLength="1" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>'}
function C(x,y,r,i){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="currentColor" style="--i:'+i+'"/>'}
var G='M10 94V8H26L44 62V8H60V94H44L26 40V94Z';
var STY=[P('M14 94V8L56 94V8',6)+C(14,94,5.5,0)+C(14,8,5.5,1)+C(56,94,5.5,2)+C(56,8,5.5,3),
 P('M10 94V8L52 94V8',3.4)+P('M19 94V8L43 62',3.4)+P('M28 94V8',3.4)+P('M48 94V8',3.4)+P('M57 94V8',3.4)+C(10,8,3.6,0)+C(28,8,3.6,1)+C(48,8,3.6,2)+C(57,8,3.6,3)+C(52,94,3.6,4),
 (function(){var m=['X...X','XX..X','X.X.X','X..XX','X...X','X...X'],o='';for(var y=0;y<6;y++)for(var x=0;x<5;x++)if(m[y][x]==='X')o+=C(12+x*12,10+y*16,4.6,x+y);return o})(),
 '<path d="'+G+'" pathLength="1" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-width="3.6" stroke-linejoin="round"/>',
 P('M14 90V20',10)+P('M22 20L50 78',10)+P('M56 80V20',10)+C(56,90,5,0),
 '<path d="M14 94V8" fill="none" stroke="currentColor" stroke-width="14" stroke-dasharray="6 4"/><path d="M14 8L56 94" fill="none" stroke="currentColor" stroke-width="14" stroke-dasharray="6 4"/><path d="M56 94V8" fill="none" stroke="currentColor" stroke-width="14" stroke-dasharray="6 4"/>'];
function svg(){var h='<svg viewBox="0 0 70 100" aria-hidden="true" focusable="false"><path class="ghost" d="'+G+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';STY.forEach(function(s,i){h+='<g class="sg" data-s="'+i+'">'+s+'</g>'});return h+'</svg>'}
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches,cur={sty:0,pal:0,name:0},els=[],over=false,lastUser=0,last=0;
function paint(){els.forEach(function(e){e.style.setProperty('--nc',NEON[cur.pal]);e.querySelectorAll('.sg').forEach(function(g){var on=+g.dataset.s===cur.sty;if(on&&!g.classList.contains('on')){g.classList.remove('on');void g.getBoundingClientRect();g.classList.add('on')}else if(!on)g.classList.remove('on')});var m=e.querySelector('.mid'),a=m.querySelector('.a'),b=m.querySelector('.b');m.style.width=(cur.name?a:b).offsetWidth+'px';a.className='a '+(cur.name?'on':'off');b.className='b '+(cur.name?'off':'on')})}
function rnd(n,not){var r;do{r=Math.floor(Math.random()*n)}while(r===not&&n>1);return r}
function roll(){var t=Date.now();if(t-last<420)return;last=t;cur.sty=rnd(STY.length,cur.sty);cur.pal=rnd(NEON.length,cur.pal);cur.name=1-cur.name;paint()}
window.NOVOPIX={mount:function(e){e.classList.add('fk');e.innerHTML='<span class="wd" role="img" aria-label="Novopix"><span aria-hidden="true" style="display:contents">'+svg()+'<span class="rest"><span class="mid"><span class="a off">0v0</span><span class="b on">ovo</span></span>pix</span></span></span>';els.push(e);
 e.addEventListener('pointerenter',function(ev){over=true;lastUser=Date.now();if(ev.pointerType!=='touch')roll()});e.addEventListener('pointerleave',function(){over=false;lastUser=Date.now()});paint()},roll:roll,paint:paint};
setInterval(function(){if(!over&&Date.now()-lastUser>2500&&!document.hidden)roll()},rm?6000:4200);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(paint);addEventListener('resize',paint);
window.__studioMark={get:function(){return JSON.parse(JSON.stringify(cur))}};
})();
