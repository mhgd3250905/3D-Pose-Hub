// Foot/ankle angle screen (read-only). One page (armfix-r2 base install), each recipe's prepared spec solved with
// __drill.applyAt at keytimes (rest/mid/peak/hold/q1/q3) + extra samples. Per side: ankle angle of the foot relative to
// the real solved shin, measured against the bind (rest) shin->foot relation:
//   pf  = plantar flexion (+) / dorsiflexion (-)  [toe direction pitched along the shin axis]
//   add = toe-in/adduction (+) / toe-out (-)       [toe direction swung about the shin axis]
//   inv = inversion (+) / eversion (-)             [foot rolled about its own toe axis, sole toward midline = +]
// plus ankle/toe height. Optional --col 1: self-collision pairs involving feet (measureSelfInPage) on every frame.
//   cd <worktree> && APP_URL=... node /workspace/work/foot-angle/scan-foot.mjs --out f.json --list ids.txt [--budget 80]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const W=process.cwd();
const {loadRecipe}=await import(pathToFileURL(W+'/tools/action-package-v3/recipe-scene.mjs'));
const {REPO}=await import(pathToFileURL(W+'/tools/action-completion-v3-r2/render-finalization-r8.mjs'));
const {allRecipes}=await import(pathToFileURL(W+'/tools/ground-audit-r1/ground-penetration-audit.mjs'));
const {keyTimes,measureSelfInPage}=await import(pathToFileURL(W+'/tools/self-collision-r1/self-collision-audit.mjs'));
const args=process.argv.slice(2),o={budget:80,col:0,n:8};for(let i=0;i<args.length;i+=2)o[args[i].slice(2)]=args[i+1];
const done=fs.existsSync(o.out)?JSON.parse(fs.readFileSync(o.out,'utf8')):{};
const all=allRecipes();
const ids=o.list==='ALL'?all.map(f=>path.basename(f,'.json')):fs.readFileSync(o.list,'utf8').split('\n').filter(Boolean);
const recFor=id=>o.recipe&&ids.length===1?path.resolve(o.recipe):all.find(f=>path.basename(f,'.json')===id);
const todo=ids.filter(id=>!done[id]).map(id=>[id,recFor(id)]);
if(!todo.length){console.log('ALLDONE');process.exit(0);}
const t0=Date.now();
const {loadTheme}=await import(pathToFileURL(W+'/drill-anim/lib/config.mjs'));
const first=await loadRecipe(todo.find(x=>x[1])[1]);
const model=await import(pathToFileURL(path.join(REPO,first.adapter.loader)));await model.verify();
const opened=await model.boot({size:64,pr:1,theme:loadTheme()});const browser=opened.b,page=opened.p;
const footFn=function(){
  const T=__toonT,v=flareInspector.viewer;v.coach.updateWorldMatrix(true,true);
  let sk=null;v.coach.traverse(o=>{if(!sk&&o.isSkinnedMesh&&o.skeleton?.bones?.some(b=>/^rightFoot$/i.test(b.name)))sk=o.skeleton;});
  const bi=n=>sk.bones.findIndex(b=>b.name===n);
  const bindW=i=>new T.Matrix4().copy(sk.boneInverses[i]).invert();
  const out={};
  const bx=new T.Vector3(1,0,0),by=new T.Vector3(0,1,0),bz=new T.Vector3(0,0,1);
  const J=v.motion.getMetrics().joints,P=n=>new T.Vector3().fromArray(J[n]);
  for(const sd of ['left','right']){
    const iS=bi(sd+'Shin'),iF=bi(sd+'Foot');
    const qBS=new T.Quaternion().setFromRotationMatrix(bindW(iS)),qBF=new T.Quaternion().setFromRotationMatrix(bindW(iF));
    const qS=new T.Quaternion(),qF=new T.Quaternion();sk.bones[iS].getWorldQuaternion(qS);sk.bones[iF].getWorldQuaternion(qF);
    // r2: normalise (the bind matrices carry a ~1.044 scale, so setFromRotationMatrix gave non-unit quaternions and every
    // non-perpendicular angle read off scaled vectors; ±90 and 0 readings were unaffected)
    const RF=qF.clone().normalize().multiply(qBF.clone().normalize().invert()).normalize(),RS=qS.clone().normalize().multiply(qBS.clone().normalize().invert()).normalize();
    const A=P(sd+'Ankle'),K=P(sd+'Knee'),Tt=P(sd+'Toe');
    const sUp=K.clone().sub(A).normalize(),tJ=Tt.clone().sub(A).normalize();
    const t=bz.clone().applyQuaternion(RF),up=by.clone().applyQuaternion(RF),lat=bx.clone().applyQuaternion(RF).multiplyScalar(sd==='right'?-1:1);
    const sB=by.clone().applyQuaternion(RS),latS=bx.clone().applyQuaternion(RS).multiplyScalar(sd==='right'?-1:1),fwdS=bz.clone().applyQuaternion(RS);
    const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,a.dot(b))))*57.2958;
    // plantar flexion: toe vs shin-up angle minus neutral 90
    const pf=ang(t,sUp)-90;
    // shin frame (from the real shin axis + the shin bone's forward, orthogonalised)
    const f0=fwdS.clone().sub(sUp.clone().multiplyScalar(fwdS.dot(sUp))).normalize(),l0=new T.Vector3().crossVectors(sUp,f0).multiplyScalar(sd==='right'?-1:1);
    // l0 is lateral for this side (right: up x fwd = +x... flipped to point lateral)
    const tp=t.clone().sub(sUp.clone().multiplyScalar(t.dot(sUp)));
    const add=Math.atan2(-tp.dot(l0),tp.dot(f0))*57.2958;// toe toward medial = +
    // inversion: foot lateral axis tilt toward the sole side, measured about the toe axis vs shin-frame lateral moved by the swing
    const sw=new T.Quaternion().setFromUnitVectors(f0,t.clone().normalize());const lref=l0.clone().applyQuaternion(sw);
    const inv=Math.atan2(lat.clone().cross(lref).dot(t)*(sd==='right'?1:-1),lat.dot(lref))*57.2958;
    out[sd]={pf:+pf.toFixed(1),add:+add.toFixed(1),inv:+inv.toFixed(1),toeErr:+ang(t,tJ).toFixed(1),shinErr:+ang(sB,sUp).toFixed(1),ankleY:+A.y.toFixed(3),toeY:+Tt.y.toFixed(3),ankle:A.toArray().map(a=>+a.toFixed(3)),toe:Tt.toArray().map(a=>+a.toFixed(3)),knee:K.toArray().map(a=>+a.toFixed(3)),RS:RS.toArray().map(a=>+a.toFixed(5)),RF:RF.toArray().map(a=>+a.toFixed(5)),f0:f0.toArray().map(a=>+a.toFixed(4)),l0:l0.toArray().map(a=>+a.toFixed(4)),sole:up.clone().negate().toArray().map(a=>+a.toFixed(3))};
  }
  return out;
};
try{
  const base=JSON.parse(JSON.stringify(first.source));delete base.nativeHands;
  await model.applyV3(page,base);
  await page.evaluate(([src,ff])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.motion.reset();window.__selfMeasure=eval('('+src+')');window.__footM=eval('('+ff+')');},[measureSelfInPage.toString(),footFn.toString()]);
  console.log('boot',((Date.now()-t0)/1000).toFixed(0)+'s');
  for(const [id,f] of todo){
    if((Date.now()-t0)/1000>Number(o.budget))break;
    if(!f){done[id]={id,error:'no recipe'};continue;}
    try{
      const l=await loadRecipe(f),s=l.source,D=s.timeline.duration;
      const kt=keyTimes(s);const extra=Array.from({length:Number(o.n)},(_,i)=>({tag:'s'+i,t:+((i+0.5)*D/Number(o.n)).toFixed(2)}));
      const seen=new Set(kt.map(k=>k.t.toFixed(2)));const times=[...kt,...extra.filter(e=>!seen.has(e.t.toFixed(2)))].sort((a,b)=>a.t-b.t);
      const frames=await page.evaluate(([s,times,col])=>{
        const v=flareInspector.viewer,E=__drill;E.selectModelProfile?.(s);v.motion.reset();let warm=null;const out=[];
        for(const {tag,t} of times){const r=E.applyAt(s,t,warm);warm=r.x;v.coach.updateMatrixWorld(true);
          const fr={tag,t,...__footM()};
          if(col){const m=__selfMeasure({});const p={};for(const [k,val] of Object.entries(m.pairs||{}))if(/Foot/i.test(k))p[k]=val;fr.pairs=p;}
          out.push(fr);}
        return out;},[s,times,Number(o.col)]);
      done[id]={id,spec:l.prepared.recipe.spec,duration:D,frames};
    }catch(e){done[id]={id,error:String(e).slice(0,300)};}
    fs.writeFileSync(o.out,JSON.stringify(done));
    const fr=done[id].frames;
    console.log(id,done[id].error?'FAIL '+done[id].error:fr.map(x=>`${x.t}:R${x.right.pf}/${x.right.add}/${x.right.inv} e${x.right.toeErr},${x.right.shinErr}`).slice(0,3).join(' '),((Date.now()-t0)/1000).toFixed(0)+'s');
  }
}finally{await browser.close();}
