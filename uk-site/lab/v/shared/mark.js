(function(){
var NEON=['#5ef0ff','#ffb15c','#ff6ad5','#b6ff5e','#ffffff','#a98bff'];
function P(d,w){return '<path d="'+d+'" pathLength="1" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>'}
function C(x,y,r,i){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="currentColor" style="--i:'+i+'"/>'}
var STY=[P('M14 94V18L26 6H62',6)+P('M14 52H46L53 45',6)+C(14,94,5.5,0)+C(62,6,5.5,1)+C(53,45,5.5,2),
 P('M10 94V22Q10 8 24 8H62',3.4)+P('M19 94V30Q19 17 31 17H62',3.4)+P('M28 94V38Q28 26 38 26H62',3.4)+P('M28 54H52',3.4)+P('M28 62H46',3.4)+C(62,8,3.6,0)+C(62,17,3.6,1)+C(62,26,3.6,2)+C(52,54,3.6,3)+C(46,62,3.6,4),
 (function(){var m=['XXXXX','X....','XXXX.','X....','X....','X....'],o='';for(var y=0;y<6;y++)for(var x=0;x<5;x++)if(m[y][x]==='X')o+=C(12+x*12,10+y*16,4.6,x+y);return o})(),
 '<path d="M10 8H62V24H28V42H52V58H28V94H10Z" pathLength="1" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-width="3.6" stroke-linejoin="round"/>',
 P('M22 12H56',10)+P('M14 20V45',10)+P('M22 51H48',10)+P('M14 57V88',10)+C(62,90,5,0),
 '<path d="M14 94V12" fill="none" stroke="currentColor" stroke-width="14" stroke-dasharray="6 4"/><path d="M20 12H62" fill="none" stroke="currentColor" stroke-width="14" stroke-dasharray="6 4"/><path d="M20 50H48" fill="none" stroke="currentColor" stroke-width="14" stroke-dasharray="6 4"/>'];
function svg(){var h='<svg viewBox="0 0 70 100" aria-hidden="true" focusable="false"><path class="ghost" d="M10 8H62V24H28V42H52V58H28V94H10Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';STY.forEach(function(s,i){h+='<g class="sg" data-s="'+i+'">'+s+'</g>'});return h+'</svg>'}
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches,cur={sty:0,pal:0,name:0},els=[],over=false,lastUser=0,last=0;
function paint(){els.forEach(function(e){e.style.setProperty('--nc',NEON[cur.pal]);e.querySelectorAll('.sg').forEach(function(g){var on=+g.dataset.s===cur.sty;if(on&&!g.classList.contains('on')){g.classList.remove('on');void g.getBoundingClientRect();g.classList.add('on')}else if(!on)g.classList.remove('on')});var m=e.querySelector('.mid'),a=m.querySelector('.a'),b=m.querySelector('.b');m.style.width=(cur.name?a:b).offsetWidth+'px';a.className='a '+(cur.name?'on':'off');b.className='b '+(cur.name?'off':'on')})}
function rnd(n,not){var r;do{r=Math.floor(Math.random()*n)}while(r===not&&n>1);return r}
function roll(){var t=Date.now();if(t-last<420)return;last=t;cur.sty=rnd(STY.length,cur.sty);cur.pal=rnd(NEON.length,cur.pal);cur.name=1-cur.name;paint()}
window.FIKOL={mount:function(e){e.classList.add('fk');e.innerHTML='<span class="wd" role="img" aria-label="Fikol"><span aria-hidden="true" style="display:contents">'+svg()+'<span class="rest"><span class="mid"><span class="a off">21</span><span class="b on">i</span></span>kol</span></span></span>';els.push(e);
 e.addEventListener('pointerenter',function(ev){over=true;lastUser=Date.now();if(ev.pointerType!=='touch')roll()});e.addEventListener('pointerleave',function(){over=false;lastUser=Date.now()});paint()},roll:roll,paint:paint};
setInterval(function(){if(!over&&Date.now()-lastUser>2500&&!document.hidden)roll()},rm?6000:4200);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(paint);addEventListener('resize',paint);
window.__studioMark={get:function(){return JSON.parse(JSON.stringify(cur))}};
})();
