// Foot-follow baker (foot-angle r3, 2026-11-06). Read-only on the repo except --write.
// For one recipe and its FREE feet: solve every frame (spec fps) of the recipe's prepared spec with __drill.applyAt on the
// armfix-r2 base page (same page as scan-foot.mjs), read the solved shin bone, and build the foot orientation
//   desired = shinWorld * restShin^-1 * Off(pf, add, inv) * restFoot      (bone world; rest = bind pose)
// i.e. the foot keeps its bind relation to the REAL solved shin, then gets a plantar(+)/dorsi(-) flexion about the foot's
// lateral axis, a toe-in(+)/out(-) swing about the shin axis and an inversion(+)/eversion(-) roll about the toe axis; each
// offset is keyed in time ([[t, pf, add, inv], ...], linear, constant outside the keys).
// Grounded frames (lowest foot vertex of the ORIGINAL orientation within --ground m of the floor) keep the original
// orientation; the weight ramps smoothly (smoothstep over --ramp s) to 1 away from them.
// The result is turned into the engine foot quaternion (foot carry removed for frame 'hips'), decomposed into Rz*Ry*Rx
// angles, unwrapped, and written as drill-anim/specs/<newId>.js via drill-anim/lib/foot-follow.mjs (generated file).
//   cd <worktree> && node tools/foot-angle-r3/foot-follow.mjs --id n-prone-ir --cfg cfg.json [--write 1]
//   cfg.json: {"newId":"n-prone-ir-fa1","prev":"./n-prone-ir.js","why":"...","sides":{"right":{"off":[[0,0,0,0]],"ground":0.012,"ramp":0.3}}}
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const W=process.cwd();
const {loadRecipe}=await import(pathToFileURL(W+'/tools/action-package-v3/recipe-scene.mjs'));
const {REPO}=await import(pathToFileURL(W+'/tools/action-completion-v3-r2/render-finalization-r8.mjs'));
const {allRecipes}=await import(pathToFileURL(W+'/tools/ground-audit-r1/ground-penetration-audit.mjs'));
const args=process.argv.slice(2),o={};for(let i=0;i<args.length;i+=2)o[args[i].slice(2)]=args[i+1];
const cfg=JSON.parse(fs.readFileSync(o.cfg,'utf8'));
const rf=allRecipes().find(f=>path.basename(f,'.json')===o.id);if(!rf)throw Error('no recipe '+o.id);
const l=await loadRecipe(rf),s=l.source;
const fps=s.fps||15,D=s.timeline.duration,times=Array.from({length:Math.round(D*fps)},(_,k)=>+(k/fps).toFixed(4));
const {loadTheme}=await import(pathToFileURL(W+'/drill-anim/lib/config.mjs'));
const model=await import(pathToFileURL(path.join(REPO,l.adapter.loader)));await model.verify();
const opened=await model.boot({size:64,pr:1,theme:loadTheme()});const browser=opened.b,page=opened.p;
const pageFn=function([s,times,cfg]){
  const T=__toonT,E=__drill,v=flareInspector.viewer;E.selectModelProfile?.(s);
  v.motion.reset();v.coach.updateMatrixWorld(true);
  const rest={};for(const sd of ['left','right'])rest[sd]={foot:v.coach.getObjectByName(sd+'Foot').getWorldQuaternion(new T.Quaternion()),shin:v.coach.getObjectByName(sd+'Shin').getWorldQuaternion(new T.Quaternion())};
    const lerpKeys=(K,t)=>{if(t<=K[0][0])return K[0].slice(1);for(let i=0;i<K.length-1;i++)if(t<=K[i+1][0]){const u=(t-K[i][0])/(K[i+1][0]-K[i][0]);return K[i].slice(1).map((x,j)=>x+(K[i+1][j+1]-x)*u);}return K[K.length-1].slice(1);};
  const ax=(x,y,z,deg)=>new T.Quaternion().setFromAxisAngle(new T.Vector3(x,y,z),deg*Math.PI/180);
  const out={};let warm=null;const fr=[];
  for(const t of times){const r=E.applyAt(s,t,warm);warm=r.x;v.coach.updateMatrixWorld(true);
    const D=E.currentDescriptor,f={t,sides:{}};
    for(const [sd,c] of Object.entries(cfg.sides)){
      const J=v.motion.getMetrics().joints,M=v.motion.getMetrics(),L={ankle:J[sd+'Ankle']};
      const foot=v.coach.getObjectByName(sd+'Foot'),shin=v.coach.getObjectByName(sd+'Shin');
      const fw=foot.getWorldQuaternion(new T.Quaternion()),sw=shin.getWorldQuaternion(new T.Quaternion());
      const fq=fw.clone().multiply(rest[sd].foot.clone().invert());   // engine foot quaternion = world delta of the rest foot
      let mn=9;for(const p of E.footPts[sd]){const y=p.clone().applyQuaternion(fq).y+L.ankle[1];if(y<mn)mn=y;}
      const [pf,add,inv]=lerpKeys(c.off,t),m=sd==='right'?1:-1;
      // rest foot: toes +Z, sole -Y, body left +X. pf about +X (toes down = +); toe-in: right Ry(+), left Ry(-); inversion:
      // sole toward midline: right Rz(+), left Rz(-). Off is applied in the rest (bind) frame of the foot.
      const off=ax(0,1,0,m*add).multiply(ax(1,0,0,pf)).multiply(ax(0,0,1,m*inv));
      const des=sw.clone().multiply(rest[sd].shin.clone().invert()).multiply(off);   // engine-space (fq) target
      f.sides[sd]={fq:fq.toArray(),des:des.toArray(),mn,boneErr:0,frame:D.feet[sd].frame,mode:D.feet[sd].mode,qP:M.pelvisQuaternion,ay:L.ankle[1]};
    }
    fr.push(f);}
  // weights + rot lists
  for(const [sd,c] of Object.entries(cfg.sides)){
    const g=c.ground??0.012,ramp=c.ramp??0.3,gt=fr.filter(f=>f.sides[sd].mn<g).map(f=>f.t),Dd=s.timeline.duration;
    const dist=t=>gt.length?Math.min(...gt.map(x=>{const d=Math.abs(t-x);return Math.min(d,Dd-d);})):9;
    const res={t:[],a:[],b:[],c:[],w:[],mn:[],boneErr:0};let prev=null;
    for(const f of fr){const S=f.sides[sd],x=Math.min(1,dist(f.t)/ramp),w0=c.force?1:x*x*(3-2*x);
      // floor clamp: never let the blended foot go lower than the original one (or the floor): shrink w by bisection
      const lowAt=ww=>{const qq=new T.Quaternion(...S.fq).slerp(new T.Quaternion(...S.des),ww).normalize();let m2=9;for(const p of E.footPts[sd]){const y=p.clone().applyQuaternion(qq).y+S.ay;if(y<m2)m2=y;}return m2;};
      const floorMin=Math.min(S.mn,c.floorY??0)-0.001;let w=w0;
      if(!c.noClamp&&lowAt(w)<floorMin){let lo=0,hi=w;for(let it=0;it<20;it++){const mid=(lo+hi)/2;if(lowAt(mid)<floorMin)hi=mid;else lo=mid;}w=lo;res.clamped=(res.clamped||0)+1;}
      const q=new T.Quaternion(...S.fq).slerp(new T.Quaternion(...S.des),w).normalize();
      const mn2=lowAt(w);res.mnNew=Math.min(res.mnNew??9,mn2);res.penNew=Math.min(res.penNew??9,mn2-Math.min(S.mn,0));
      const carry=S.frame==='world'?new T.Quaternion():new T.Quaternion(...S.qP);
      const rq=q.clone().multiply(carry.invert());
      const e=new T.Euler().setFromQuaternion(rq,'ZYX');let a=[e.x,e.y,e.z].map(z=>z*57.2958);
      if(prev)a=a.map((z,i)=>{while(z-prev[i]>180)z-=360;while(z-prev[i]<-180)z+=360;return z;});prev=a;
      res.t.push(f.t);res.a.push(+a[0].toFixed(3));res.b.push(+a[1].toFixed(3));res.c.push(+a[2].toFixed(3));res.w.push(+w.toFixed(3));res.mn.push(+S.mn.toFixed(4));res.boneErr=Math.max(res.boneErr,S.boneErr);res.mode=S.mode;res.frame=S.frame;}
    out[sd]=res;}
  return out;
};
try{
  const base=JSON.parse(JSON.stringify(s));delete base.nativeHands;
  await model.applyV3(page,base);
  await page.evaluate(()=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.motion.reset();});
  const res=await page.evaluate(pageFn,[s,times,cfg]);
  for(const [sd,r] of Object.entries(res))console.log(sd,r.mode,r.frame,'boneErr',r.boneErr.toFixed(3),'grounded',r.w.filter(w=>w===0).length+'/'+r.w.length,'minY',Math.min(...r.mn).toFixed(3),'minYnew',r.mnNew.toFixed(3),'clamped',r.clamped||0,'wMin(air)',Math.min(...r.w.filter(x=>x>0),1).toFixed(2));
  fs.writeFileSync(o.out||`/tmp/ff-${o.id}.json`,JSON.stringify(res));
  if(o.write){
    for(const r of Object.values(res))if(r.mode!=='free')throw Error('only free feet supported');
    const data={sides:Object.fromEntries(Object.entries(res).map(([sd,r])=>[sd,{t:r.t,a:r.a,b:r.b,c:r.c}]))};
    const offs=Object.entries(cfg.sides).map(([sd,c])=>`${sd}: off ${JSON.stringify(c.off)} ground ${c.ground??0.012} ramp ${c.ramp??0.3}${c.force?' force':''}`).join('; ');
    const txt=`// ${cfg.newId}: GENERATED by tools/foot-angle-r3/foot-follow.mjs (foot-angle r3, 2026-11-06) from ${cfg.prev.replace('./','')}.\n`+
      cfg.why.split('\n').map(x=>'// '+x).join('\n')+`\n// Baked: ${offs} (off = [[t, plantarflex+, toe-in+, inversion+], ...] relative to the solved shin).\n`+
      `// Only the listed feet's rot changes (per-frame Rz*Ry*Rx tracks fa1<Side>0..2); ankle, poles, other limbs, timing, camera unchanged.\n`+
      `import previous from '${cfg.prev}';\nimport { applyFootFollow } from '../lib/foot-follow.mjs';\n`+
      `export default applyFootFollow(previous, '${cfg.newId}', ${JSON.stringify(data)});\n`;
    const fn=path.join(W,'drill-anim/specs',cfg.newId+'.js');fs.writeFileSync(fn,txt);console.log('wrote',fn);
  }
}finally{await browser.close();}
