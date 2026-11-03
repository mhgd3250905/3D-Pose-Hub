// Ground-contact fix probe: open one production scene once, then measure several in-memory spec variants
// (same stageAt + CPU-skinned measure as tools/ground-audit-r1). Read-only; never writes specs.
//   node tools/ground-contact-r1/probe.mjs --id <recipeId> --variants <module.mjs> --out <file.json> [--stride 16]
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {loadRecipe,openScene,stageAt,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {allRecipes,measureRegionsInPage} from '../ground-audit-r1/ground-penetration-audit.mjs';
const a=process.argv.slice(2),o={stride:16,size:96};for(let i=0;i<a.length;i+=2)o[a[i].replace(/^--/,'')]=a[i+1];o.stride=+o.stride;o.size=+o.size;
const file=allRecipes().find(f=>path.basename(f,'.json')===o.id);if(!file)throw Error('no recipe '+o.id);
const variants=o.variants?(await import(pathToFileURL(path.resolve(o.variants)))).default:[{name:'base',patch:()=>{}}];
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const loaded=await loadRecipe(file),base=loaded.source,fps=30,N=Math.round(base.timeline.duration*fps);
const report={pageErrors:[]};const {browser,page}=await openScene(loaded,{size:o.size,theme:loadTheme(),report});
const results=[];
try{
  await page.evaluate(src=>{window.__groundMeasure=eval('('+src+')');},measureRegionsInPage.toString());
  for(const v of variants){
    const src=structuredClone(base);v.patch(src);let warm=null;const reg={},jt={},frames=[];
    for(let f=0;f<N;f+=o.stride){
      if(freeGiB()<.6)throw Error('low mem');
      const st=await stageAt(page,src,f/fps,warm);warm=st.x;
      const m=await page.evaluate(()=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val=null;sc.onAfterRender=function(...a){prev?.apply(this,a);val=__groundMeasure();};try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}return val;});
      const fr={f};for(const [k,r] of Object.entries(m.regions)){const mm=+(r.minY*1000).toFixed(1);fr[k]=mm;const R=reg[k]??(reg[k]={min:Infinity,maxOfMin:-Infinity});if(mm<R.min){R.min=mm;R.minF=f;}if(mm>R.maxOfMin){R.maxOfMin=mm;R.maxF=f;}}
      for(const [k,y] of Object.entries(m.joints)){const J=jt[k]??(jt[k]={min:Infinity,max:-Infinity});J.min=Math.min(J.min,+(y*1000).toFixed(1));J.max=Math.max(J.max,+(y*1000).toFixed(1));}
      fr.warn=st.warn?.length??0;fr.J=Object.fromEntries(Object.entries(m.joints).map(([k,y])=>[k,+(y*1000).toFixed(1)]));fr.P=st.joints.pelvis?.map(x=>+(x*1000).toFixed(0));fr.LK=st.joints.leftKnee?.map(x=>+(x*1000).toFixed(0));fr.LA=st.joints.leftAnkle?.map(x=>+(x*1000).toFixed(0));fr.LH=(st.joints.leftHip??st.joints.leftThigh)?.map(x=>+(x*1000).toFixed(0));frames.push(fr);
    }
    const r={name:v.name,regions:reg,joints:jt,frames};results.push(r);
    console.log(JSON.stringify({variant:v.name,min:Object.fromEntries(Object.entries(reg).map(([k,x])=>[k,x.min+'/'+x.maxOfMin]))}));
  }
}finally{await browser.close();}
fs.writeFileSync(o.out,JSON.stringify({id:o.id,stride:o.stride,results,pageErrors:report.pageErrors},null,1));
