const {chromium}=require('playwright');const fs=require('fs');
const axe=fs.readFileSync(__dirname+'/node_modules/axe-core/axe.min.js','utf8');
const sites=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const out=[];
for(const u of sites){
 try{const ctx=await b.newContext({viewport:{width:1280,height:900},bypassCSP:true});const p=await ctx.newPage();
  await p.goto(u,{waitUntil:'domcontentloaded',timeout:45000});await p.waitForTimeout(2500);
  await p.addScriptTag({content:axe});
  const r=await p.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
  out.push({url:u,title:await p.title(),violations:r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,helpUrl:v.helpUrl,tags:v.tags.filter(t=>t.startsWith('wcag')&&/\d/.test(t)),count:v.nodes.length,examples:v.nodes.slice(0,2).map(n=>({html:n.html.slice(0,160),target:n.target.join(' ')}))})),passes:r.passes.length,incomplete:r.incomplete.length});
  await ctx.close();console.log('ok',u,out[out.length-1].violations.length);
 }catch(e){console.log('fail',u,e.message.slice(0,80));}}
fs.writeFileSync(__dirname+'/'+(process.env.OUT||'results.json'),JSON.stringify(out,null,1));await b.close();})();
