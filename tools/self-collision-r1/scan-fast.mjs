// Fast self-collision screen: ONE page (armfix-r2 booted once, base install), every recipe's prepared spec solved
// with __drill.applyAt at its keytimes, then measureSelfInPage (same metric as self-collision-audit.mjs).
// Limits (same as elbow-audit-r1/scan-fast): per-recipe action correctives / fixed-hand adapters / joint correctives /
// props are not installed, hands are the base native hands. Suspects are re-checked with the full chain
// (self-collision-audit.mjs).  Resumable; stops itself after ~80 s so it fits one 120 s command.
//   node tools/self-collision-r1/scan-fast.mjs --out file.json --list order.txt
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadRecipe} from '../action-package-v3/recipe-scene.mjs';
import {REPO} from '../action-completion-v3-r2/render-finalization-r8.mjs';
import {allRecipes} from '../ground-audit-r1/ground-penetration-audit.mjs';
import {keyTimes,measureSelfInPage} from './self-collision-audit.mjs';

const args=process.argv.slice(2),o={budget:80};for(let i=0;i<args.length;i+=2)o[args[i].slice(2)]=args[i+1];
const done=fs.existsSync(o.out)?JSON.parse(fs.readFileSync(o.out,'utf8')):{};
const all=allRecipes();let ids=fs.readFileSync(o.list,'utf8').split('\n').filter(Boolean);
const todo=ids.filter(id=>!done[id]).map(id=>all.find(f=>path.basename(f,'.json')===id)).filter(Boolean);
if(!todo.length){console.log('ALLDONE');process.exit(0);}
const t0=Date.now();
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const first=await loadRecipe(todo[0]);
const model=await import(pathToFileURL(path.join(REPO,first.adapter.loader)));await model.verify();
const opened=await model.boot({size:64,pr:1,theme:loadTheme()});const browser=opened.b,page=opened.p;
try{
  const base=JSON.parse(JSON.stringify(first.source));delete base.nativeHands;
  await model.applyV3(page,base);
  await page.evaluate(src=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.motion.reset();window.__selfMeasure=eval('('+src+')');},measureSelfInPage.toString());
  console.log('boot',((Date.now()-t0)/1000).toFixed(0)+'s');
  for(const f of todo){
    if((Date.now()-t0)/1000>Number(o.budget))break;
    const id=path.basename(f,'.json');
    try{
      const l=await loadRecipe(f),s=l.source,times=keyTimes(s);
      const frames=await page.evaluate(([s,times])=>{
        const v=flareInspector.viewer,E=__drill;E.selectModelProfile?.(s);v.motion.reset();let warm=null;const out=[];
        for(const {tag,t} of times){const r=E.applyAt(s,t,warm);warm=r.x;v.coach.updateMatrixWorld(true);out.push({tag,t,...__selfMeasure({})});}
        return out;},[s,times]);
      done[id]={id,spec:l.prepared.recipe.spec,hands:l.prepared.handSetup?.modes??null,times,frames};
    }catch(e){done[id]={id,error:String(e).slice(0,300)};}
    fs.writeFileSync(o.out,JSON.stringify(done));
    const w=done[id].frames?Math.max(0,...done[id].frames.flatMap(fr=>Object.values(fr.pairs).map(p=>p.d10))):null;
    console.log(id,done[id].error?'FAIL '+done[id].error:'worst '+w,((Date.now()-t0)/1000).toFixed(0)+'s');
  }
}finally{await browser.close();}
