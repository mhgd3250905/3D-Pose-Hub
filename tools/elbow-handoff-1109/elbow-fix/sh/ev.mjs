// node ev.mjs --out X.jsonl --jobs jobs.json    jobs=[{id, variants:[{name, spec?:repo-rel path | file?:abs path, fix?:{left:{a,b,c},right:..}, base?:repo-rel}]}]
// One browser per id; each variant measured on all sample frames (16 uniform + keyFrames + extra t). Resumable per (id,variant).
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='/workspace/work/elbow-scan-wt/',H='/workspace/work/elbow-fix/';
const {loadRecipe,openScene,stageAt}=await import(R+'tools/action-package-v3/recipe-scene.mjs');
const RP=JSON.parse(fs.readFileSync(H+'recipes.json','utf8'));
const {loadTheme}=await import(R+'drill-anim/lib/config.mjs');
const EV2=fs.readFileSync(H+'metric2.js','utf8'),EV3=fs.readFileSync(H+'sh/metric3.js','utf8');
const a=process.argv.slice(2),o={};for(let i=0;i<a.length;i+=2)o[a[i].replace(/^--/,'')]=a[i+1];
const jobs=JSON.parse(fs.readFileSync(o.jobs,'utf8'));
const done=new Set(fs.existsSync(o.out)?fs.readFileSync(o.out,'utf8').trim().split('\n').filter(Boolean).map(l=>{const r=JSON.parse(l);return r.id+'|'+r.name;}):[]);
function fixSide(s,side,A,B,C){const h=s.pose.base.hands[side];const U0=h.upperArmTwist??0,E0=h.elbowTwist??0;
  for(const d of Object.values(s.pose.deltas||{})){const x=d.hands?.[side];if(!x)continue;
    if(x.elbowTwist!==undefined){const ev=x.elbowTwist-E0;x.elbowTwist+=B;x.upperArmTwist=(x.upperArmTwist??U0)+A+C*ev;}
    else if(x.upperArmTwist!==undefined)x.upperArmTwist+=A;}
  h.upperArmTwist=U0+A;h.elbowTwist=E0+B;}
async function build(v){let m;if(v.file)m=(await import(pathToFileURL(v.file).href+'?'+fs.statSync(v.file).mtimeMs)).default;
  else m=structuredClone((await import(pathToFileURL(R+(v.spec||v.base)).href)).default);
  if(v.fix){m=structuredClone(m);for(const [s,q] of Object.entries(v.fix))fixSide(m,s,q.a||0,q.b||0,q.c||0);}return m;}
for(const j of jobs){
  const todo=j.variants.filter(v=>!done.has(j.id+'|'+v.name));if(!todo.length)continue;
  let browser;const t0=Date.now();
  try{const loaded=await loadRecipe(RP[j.id]);const S0=loaded.source;const D=S0.timeline.duration;
    const ts=new Set(Array.from({length:16},(_,i)=>+(i*D/16).toFixed(3)));for(const k of S0.keyFrames||[])ts.add(+(+k).toFixed(3));for(const t of j.t||[])ts.add(+t);
    const times=[...ts].filter(t=>t>=0&&t<=D).sort((x,y)=>x-y);
    const op=await openScene(loaded,{size:96,theme:loadTheme(),report:{pageErrors:[]}});browser=op.browser;const page=op.page;
    await page.evaluate(([x,y])=>{window.__xm2=eval('('+x+')');window.__xm3=eval('('+y+')');},[EV2,EV3]);
    for(const v of todo){const m=await build(v);const S=structuredClone(S0);S.timeline=m.timeline;S.pose=m.pose;
      const rows=[];let warm=null;
      if(v.jointsOnly){const tt=S.timeline.tracks[Object.keys(S.timeline.tracks)[0]].map(r=>r[0]);
        for(const t of tt){const st=await stageAt(page,S,t,warm);warm=st.x;rows.push({t,joints:st.joints});}
        fs.appendFileSync(o.out,JSON.stringify({id:j.id,name:v.name,v,rows})+'\n');console.log(j.id,v.name,'joints ok');continue;}
      for(const t of times){const st=await stageAt(page,S,t,warm);warm=st.x;
        const r=await page.evaluate(()=>{const vw=flareInspector.viewer,sc=vw.scene,prev=sc.onAfterRender;let val;sc.onAfterRender=function(...a){prev?.apply(this,a);const e=__xm2();delete e.restInfo;const s=__xm3();val={left:{...e.left,...s.left},right:{...e.right,...s.right}};};try{vw.renderer.render(sc,vw.camera);}finally{sc.onAfterRender=prev;}return val;});
        for(const s of ['left','right']){delete r[s].pos;delete r[s].pit;}
        rows.push({t,warn:st.warn?.length||0,joints:st.joints,...r});}
      fs.appendFileSync(o.out,JSON.stringify({id:j.id,name:v.name,v,rows})+'\n');console.log(j.id,v.name,'ok',((Date.now()-t0)/1000).toFixed(0));}
  }catch(e){console.log(j.id,'ERR',String(e.stack||e).slice(0,400));}
  finally{if(browser){try{browser.process?.()?.kill('SIGKILL');}catch{}await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,3000))]);}}
}
console.log('EV DONE');
