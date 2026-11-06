// Foot close-up probe (read-only): one browser, for each job {id, side, t, tag, recipe?} solve the recipe's spec at t
// (__drill.applyAt, warmed from 0) and render a small full-body view (recipe camera dir) + a foot/shin close-up from the
// foot's lateral side, plus the scan-foot ankle readings. cd <worktree> && node tools/foot-angle-r1/closeup.mjs jobs.json outdir
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const W=process.cwd();
const {loadRecipe}=await import(pathToFileURL(W+'/tools/action-package-v3/recipe-scene.mjs'));
const {REPO}=await import(pathToFileURL(W+'/tools/action-completion-v3-r2/render-finalization-r8.mjs'));
const {allRecipes}=await import(pathToFileURL(W+'/tools/ground-audit-r1/ground-penetration-audit.mjs'));
const {loadTheme}=await import(pathToFileURL(W+'/drill-anim/lib/config.mjs'));
const [jobsFile,outDir]=process.argv.slice(2);fs.mkdirSync(outDir,{recursive:true});
const jobs=JSON.parse(fs.readFileSync(jobsFile,'utf8'));const all=allRecipes();
const recOf=j=>j.recipe?path.resolve(j.recipe):all.find(f=>path.basename(f,'.json')===j.id);
const scanSrc=fs.readFileSync(W+'/tools/foot-angle-r1/scan-foot.mjs','utf8');
const footSrc=scanSrc.slice(scanSrc.indexOf('const footFn=function(){')+'const footFn='.length,scanSrc.indexOf('\ntry{'));
const first=await loadRecipe(recOf(jobs[0]));
const model=await import(pathToFileURL(path.join(REPO,first.adapter.loader)));await model.verify();
const {b,p}=await model.boot({size:360,pr:1,theme:loadTheme()});
const res={};
try{
  const base=JSON.parse(JSON.stringify(first.source));delete base.nativeHands;await model.applyV3(p,base);
  await p.evaluate(ff=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.motion.reset();window.__footM=eval('('+ff.trim().replace(/;\s*$/,'')+')');},footSrc);
  for(const j of jobs){
    const l=await loadRecipe(recOf(j));
    const r=await p.evaluate(([s,j,camDir])=>{
      const v=flareInspector.viewer,E=__drill,T=__toonT;E.selectModelProfile?.(s);v.motion.reset();let warm=null;
      const ts=[];for(let t=0;t<j.t;t+=0.25)ts.push(t);ts.push(j.t);for(const t of ts){warm=E.applyAt(s,t,warm).x;}
      v.coach.updateMatrixWorld(true);const m=__footM();const J=v.motion.getMetrics().joints;
      const cam=v.camera,keep={pos:cam.position.clone(),q:cam.quaternion.clone(),fov:cam.fov,bg:v.scene.background};
      const keepAsp=cam.aspect;const shot=(at,dir,far,fov)=>{const sz=v.renderer.getSize(new T.Vector2());v.renderer.setScissorTest(false);v.renderer.setViewport(0,0,sz.x,sz.y);cam.aspect=sz.x/sz.y;cam.fov=fov;cam.setViewOffset?cam.clearViewOffset():0;cam.updateProjectionMatrix();const P=new T.Vector3().fromArray(at);
        cam.position.copy(P.clone().add(new T.Vector3().fromArray(dir).normalize().multiplyScalar(far)));cam.lookAt(P);cam.updateMatrixWorld();
        v.scene.background=new T.Color(0xffffff);v.renderer.render(v.scene,cam);return v.renderer.domElement.toDataURL('image/png');};
      const f=m[j.side];const A=new T.Vector3().fromArray(f.ankle),K=new T.Vector3().fromArray(f.knee),To=new T.Vector3().fromArray(f.toe);
      const vals=Object.values(J).filter(a=>Array.isArray(a)&&a.length===3);const mn=[0,1,2].map(i=>Math.min(...vals.map(a=>a[i]))),mx=[0,1,2].map(i=>Math.max(...vals.map(a=>a[i])));const pel=mn.map((a,i)=>(a+mx[i])/2);const ext=Math.max(...mx.map((a,i)=>a-mn[i]));const full=shot(pel,camDir,ext*1.9+0.6,34);
      const c=A.clone().multiplyScalar(0.55).add(K.clone().multiplyScalar(0.2)).add(To.clone().multiplyScalar(0.25));
      const lat=new T.Vector3().fromArray(f.l0);const fw=new T.Vector3().fromArray(f.f0);
      const d1=lat.clone().multiplyScalar(1).add(fw.clone().multiplyScalar(0.35)).add(new T.Vector3(0,0.25,0));
      const foot=shot(c.toArray(),d1.toArray(),1.6,30);
      const d2=fw.clone().add(new T.Vector3(0,0.4,0)).add(lat.clone().multiplyScalar(0.3));
      const foot2=shot(c.toArray(),d2.toArray(),1.6,30);
      cam.position.copy(keep.pos);cam.quaternion.copy(keep.q);cam.fov=keep.fov;cam.aspect=keepAsp;cam.updateProjectionMatrix();v.scene.background=keep.bg;
      return {m:{[j.side]:{pf:f.pf,add:f.add,inv:f.inv,ankleY:f.ankleY,toeY:f.toeY,ankle:f.ankle,knee:f.knee,toe:f.toe,RS:f.RS,RF:f.RF,sole:f.sole}},full,foot,foot2};
    },[l.source,j,l.prepared?.recipe?.camera?.dir||[-0.45,0.75,0.9]]);
    for(const k of ['full','foot','foot2'])fs.writeFileSync(path.join(outDir,`${j.tag}-${k}.png`),Buffer.from(r[k].split(',')[1],'base64'));
    res[j.tag]={...j,spec:l.prepared.recipe.spec,...r.m};console.log(j.tag,JSON.stringify(r.m[j.side]).slice(0,120));
    fs.writeFileSync(path.join(outDir,'closeup.json'),JSON.stringify(res,null,1));
  }
}finally{await b.close();}
