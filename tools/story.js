// Builds 1080x1920 graphics for Stories/Reels: a headline, one sentence and a framed
// screenshot of the page it talks about. Usage: node tools/story.js [--light|--dark]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'brand', 'story');
const SITE = 'https://pepsafe.info';

// Kadry bez nazw substancji nadają się na TikToka; z nazwami tylko na Instagram.
const SLIDES = [
  { id: '01-what', url: '/en/', tiktok: true,
    kick: 'What this is', h: 'Peptide facts,<br>nothing for sale.',
    p: 'No shop, no affiliate links, no sponsored entries. Just what is known and what is not.' },
  { id: '02-catalog', url: '/en/catalog.html', tiktok: false,
    kick: 'The catalog', h: '203 entries.<br>One question each.',
    p: 'Did a regulator ever approve it, and for what? Every entry answers that before anything else.' },
  { id: '03-overlap', url: '/en/compare.html', tiktok: false,
    kick: 'Overlap checker', h: 'Two names,<br>one receptor.',
    p: 'The most common mistake online is stacking things that act on the same target. Check before you read further.' },
  { id: '04-symptoms', url: '/en/symptoms.html', tiktok: true,
    kick: 'Start from the symptom', h: 'Something feels<br>off. Now what?',
    p: 'Type what you noticed and see which entries mention it. Not a diagnosis — a way into the facts.' },
  { id: '05-dosing', url: '/en/dosing.html', tiktok: false,
    kick: 'Dosing', h: 'Numbers only<br>where a label<br>exists.',
    p: 'Approved medicines, copied from the label. For everything else we publish no doses at all.' },
  { id: '06-sources', url: '/p/semaglutide.html', tiktok: false,
    kick: 'Sources', h: 'Every claim<br>has a link.',
    p: 'Trial registries, regulator decisions, published reviews. Where the evidence is thin, the entry says so.' },
];

const LOGO = '<svg width="54" height="54" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#8A918D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="24" r="4.5" fill="#2F6DB5"/><circle cx="14" cy="10" r="4.5" fill="#0A7C66"/><circle cx="22" cy="22" r="4.5" fill="#C2410C"/><circle cx="29" cy="8" r="4.5" fill="#8B3FA8"/></svg>';

const page = (s, shot, dark) => `<!doctype html><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap');
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;
  background:${dark ? '#0B0F0D' : '#F6F6F3'};color:${dark ? '#EDF2EE' : '#14171A'};
  font-family:'Inter Tight',system-ui;display:flex;flex-direction:column;padding:96px 84px 72px}
.blob{position:absolute;border-radius:50%;filter:blur(90px);opacity:${dark ? '.34' : '.4'}}
.b1{width:640px;height:640px;background:${dark ? '#6FA3E8' : '#2F6DB5'};right:-200px;top:-180px}
.b2{width:520px;height:520px;background:${dark ? '#3CCFA9' : '#0A7C66'};left:-200px;top:520px;opacity:${dark ? '.26' : '.3'}}
.b3{width:460px;height:460px;background:${dark ? '#FF9A66' : '#C2410C'};right:-140px;bottom:260px;opacity:.22}
.kick{position:relative;font-size:26px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  color:${dark ? '#8FA096' : '#5C6560'}}
h1{position:relative;font-size:92px;line-height:1.02;letter-spacing:-.04em;font-weight:700;margin:26px 0 0}
p.lead{position:relative;font-size:32px;line-height:1.45;margin:30px 0 0;max-width:820px;
  color:${dark ? '#B6C2BA' : '#4A524D'}}
.frame{position:relative;margin:56px auto 0;width:720px;height:880px;border-radius:44px;overflow:hidden;
  border:1px solid ${dark ? '#243029' : '#DDE2DC'};box-shadow:0 50px 120px -30px rgba(0,0,0,${dark ? '.75' : '.35'})}
.frame img{width:100%;display:block}
.foot{position:relative;margin-top:auto;display:flex;align-items:center;gap:20px;
  font-size:34px;font-weight:700;letter-spacing:-.01em}
.foot span{opacity:.6;font-weight:500;font-size:26px;margin-left:auto}
</style>
<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
<p class="kick">${s.kick}</p>
<h1>${s.h}</h1>
<p class="lead">${s.p}</p>
<div class="frame"><img src="data:image/png;base64,${shot}"></div>
<div class="foot">${LOGO} pepsafe.info <span>Educational content</span></div>`;

(async () => {
  const motywy = process.argv.includes('--light') ? ['light']
    : process.argv.includes('--dark') ? ['dark'] : ['light', 'dark'];
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const motyw of motywy) {
    const dark = motyw === 'dark';
    for (const s of SLIDES) {
      const shot = await b.newPage({ viewport: { width: 760, height: 930 }, isMobile: true, hasTouch: true });
      await shot.addInitScript(t => { try { localStorage.setItem('pep-theme', t); } catch (e) {} }, motyw);
      await shot.goto(SITE + s.url, { waitUntil: 'networkidle' });
      await shot.waitForTimeout(2600);
      const buf = await shot.screenshot();
      await shot.close();

      const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
      await p.setContent(page(s, buf.toString('base64'), dark));
      await p.waitForTimeout(1100);
      const f = path.join(OUT, `${s.id}-${motyw}.png`);
      await p.screenshot({ path: f });
      await p.close();
      console.log(`${s.id}-${motyw}`.padEnd(22), s.tiktok ? 'IG + TikTok' : 'tylko Instagram (widać nazwy)');
    }
  }
  await b.close();
  console.log(`\ngotowe w brand/story/ — ${SLIDES.length * motywy.length} grafik`);
})();
