// pose-fix r7: capture a Thomas rig calibration (R, L, floor-hand poses) from the live armfix-r2 page, same evaluation as
// render-finalization-r7 diagnostics.rigCalibration, but with caller-chosen floor-hand anchors. Feeds bake-thomas-reachability.mjs.
// Usage: node rig-calibration-capture.mjs --recipe <thomas recipe.json> --out cal.json --hands x,z,fx,fz[;x,z,fx,fz...]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadRecipe} from '../action-package-v3/recipe-scene.mjs';
import {REPO} from '../action-completion-v3-r2/render-finalization-r8.mjs';
const a=process.argv.slice(2),o={};for(let i=0;i<a.length;i+=2)o[a[i].slice(2)]=a[i+1];
const hands=o.hands.split(';').map(s=>s.split(',').map(Number));
const l=await loadRecipe(path.resolve(o.recipe));
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const model=await import(pathToFileURL(path.join(REPO,l.adapter.loader)));await model.verify();
const {b:browser,p:page}=await model.boot({size:64,pr:1,theme:loadTheme()});
try{
  const base=JSON.parse(JSON.stringify(l.source));delete base.nativeHands;
  await model.applyV3(page,base);
  const cal=await page.evaluate(hands=>{
    const E=__drill,m=flareInspector.viewer.motion; m.reset();
    const groundHands=[];
    for(const [x,z,fx,fz] of hands)for(const side of ['left','right']){
      const sign=side==='left'?1:-1,at=[x*sign,z];groundHands.push({side,at,pose:m.getGroundHandPose(side,[fx*sign,0,fz],[at[0],0,at[1]])});
    }
    return JSON.parse(JSON.stringify({R:E.R,L:E.L,groundHands,handPts:E.handPts}));
  },hands);
  fs.writeFileSync(o.out,JSON.stringify(cal));console.log('ok',cal.groundHands.length);
}finally{await browser.close();}
