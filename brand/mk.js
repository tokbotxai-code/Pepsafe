const { chromium } = require('playwright');
const logo=(s)=>`<svg width="${s}" height="${s}" viewBox="0 0 34 34"><path d="M6 24 L14 10 L22 22 L29 8" stroke="#93A4AF" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="6" cy="24" r="4.2" fill="#6FA3E8"/><circle cx="14" cy="10" r="4.2" fill="#3CCFA9"/><circle cx="22" cy="22" r="4.2" fill="#FF9A66"/><circle cx="29" cy="8" r="4.2" fill="#C58BE0"/></svg>`;
const base=`*{margin:0}body{width:1080px;height:1080px;background:radial-gradient(circle at 50% 40%,#16303A 0%,#0B1419 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;font-family:"Inter Display",Inter,sans-serif;color:#E6EEF2}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1080}});
await p.setContent(`<style>${base}</style>${logo(700)}`);await p.screenshot({path:'pepsafe-profile-logo.png'});
await p.setContent(`<style>${base} h1{font:800 150px "Inter Display";letter-spacing:-.03em} h1 span{color:#3CCFA9}</style>${logo(470)}<h1>Pep<span>Safe</span></h1>`);await p.screenshot({path:'pepsafe-profile-name.png'});
await b.close();})();
