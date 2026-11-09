// node batch.mjs --out res.jsonl [--n 8] [--override id=specfile,...] recipe.json ...
// One node process, one browser per recipe (full install chain via openScene), elbow-pinch-metric eval per frame.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='/workspace/work/elbow-scan-wt/';
const {loadRecipe,openScene,stageAt}=await import(R+'tools/action-package-v3/recipe-scene.mjs');
const {loadTheme}=await import(R+'drill-anim/lib/config.mjs');
const EV=fs.readFileSync(R+'tools/pose-fix-1108/elbow-pinch-metric.js','utf8').replace(/^\/\/.*\n/,'');
const a=process.argv.slice(2);let out,n=8;const ov={},files=[];
for(let i=0;i<a.length;i++){if(a[i]==='--out')out=a[++i];else if(a[i]==='--n')n=+a[++i];else if(a[i]==='--override'){for(const kv of a[++i].split(',')){const [k,v]=kv.split('=');ov[k]=v;}}else files.push(a[i]);}
const done=new Set(fs.existsSync(out)?fs.readFileSync(out,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).key):[]);
for(const f of files){
  const id=path.basename(f,'.json');const key=f+(ov[id]?'#'+ov[id]:'');if(done.has(key))continue;
  const t0=Date.now();let rec={key,id,file:f};let browser;
  try{
    const loaded=await loadRecipe(path.resolve(f));let S=loaded.source;rec.spec=path.relative(R,loaded.prepared.specFile);
    if(ov[id]){const v=(await import(pathToFileURL(path.resolve(R,ov[id])).href)).default;S=structuredClone(S);S.timeline=v.timeline;S.pose=v.pose;rec.spec=ov[id]+' (override)';}
    const D=S.timeline.duration;const ts=new Set(Array.from({length:n},(_,i)=>+(i*D/n).toFixed(3)));
    for(const k of loaded.source.keyFrames||[])ts.add(+(+k).toFixed(3));
    if(loaded.prepared.recipe.camera?.at!==undefined)ts.add(+loaded.prepared.recipe.camera.at);
    const times=[...ts].filter(t=>t>=0&&t<=D).sort((x,y)=>x-y);
    const report={pageErrors:[]};const o=await openScene(loaded,{size:96,theme:loadTheme(),report});browser=o.browser;const page=o.page;rec.bootSec=+((Date.now()-t0)/1000).toFixed(1);
    await page.evaluate(x=>{window.__xm=eval('('+x+')');},EV);
    rec.duration=D;rec.keyFrames=loaded.source.keyFrames;rec.rows=[];let warm=null;
    rec.prof=[];for(const t of times){const q0=Date.now();const st=await stageAt(page,S,t,warm);warm=st.x;const q1=Date.now();
      const m=await page.evaluate(()=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val;sc.onAfterRender=function(...a){prev?.apply(this,a);val=__xm();};try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}return val;});
      const r={t,warn:st.warn?.length||0};for(const s of ['left','right'])r[s]={ratio:m[s].minRatio,minW:m[s].minW,tw:m[s].elbowTw,htw:m[s].handTw,elbow:m[s].elbow,ref:Math.min(...m[s].ref.filter(Boolean))};
      rec.prof.push([q1-q0,Date.now()-q1]);rec.rows.push(r);}
  }catch(e){rec.error=String(e.stack||e).slice(0,400);}
  finally{if(browser){const c0=Date.now();try{browser.process()?.kill('SIGKILL');}catch{}await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,3000))]);rec.closeSec=(Date.now()-c0)/1000;}}
  rec.sec=+((Date.now()-t0)/1000).toFixed(1);fs.appendFileSync(out,JSON.stringify(rec)+'\n');console.log(id,rec.error?'ERR':'ok',rec.sec);
}
console.log('BATCH DONE');
