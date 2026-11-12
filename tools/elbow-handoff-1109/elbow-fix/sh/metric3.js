function(){
// Shoulder / orientation metric (elbow-twist r2, 2026-11-09). Call after __xm2() in the same onAfterRender.
// Per arm:
//  shW   min caliper-width ratio vs rest over 5 bands of the proximal upper arm / deltoid (s = 0..0.08 m from the shoulder
//        joint along the arm, i.e. joint -> ~1/3 humerus); bands are the SAME rest vertices (UA weight >= 0.25, limb+torso mesh)
//  shR5  5th-percentile per-vertex radius ratio (distance to current shoulder->elbow axis / rest distance) in that region: a
//        fold/crease pulls skin toward the axis while a pure roll keeps the radius
//  shFlip triangles in the region whose normal turned > 90 deg against the blended (torso/upper-arm) rigid prediction
//  shTw  roll of the upper arm relative to the torso (deg, vs rest; only differences between variants with equal joints matter)
//  pitT/palmT  elbow pit (anterior humerus, rest bend direction carried by the upper arm) and palm normal in the torso frame
//        expressed in rest-body axes (+x model-left, +y head, +z front); pitW/palmW in world.
const T=window.__toonT,v=flareInspector.viewer;
const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
const tw=(q,a)=>{let p=q.x*a.x+q.y*a.y+q.z*a.z,w=q.w;if(w<0){w=-w;p=-p;}let t=2*Math.atan2(p,w);if(t>Math.PI)t-=2*Math.PI;return t*57.2958;};
const meshes=[];v.coach.traverse(o=>{if(o.isSkinnedMesh&&o.visible&&/Limbs|Torso/.test(o.name))meshes.push(o);});
const BANDS=[0,0.02,0.04,0.06,0.08],HB=0.006;const q=new T.Vector3();
if(!window.__SH3){
  const X={S:{}};const bones=[];v.coach.traverse(o=>{if(o.isBone)bones.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
  v.motion.reset();v.coach.updateMatrixWorld(true);for(const m of meshes)m.skeleton.update();
  const torso=v.coach.getObjectByName('torso');X.torso=torso;X.Wt0=W(torso);
  for(const s of ['left','right']){
    const ua=v.coach.getObjectByName(s+'UpperArm'),fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');
    const pS=P(ua),pE=P(fa),pW=P(h),u=pE.clone().sub(pS).normalize(),f=pW.clone().sub(pE).normalize();
    const reg=[];// [mesh, i, s, wUA, restPos]
    for(const m of meshes){const g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bi=m.skeleton.bones.indexOf(ua);if(bi<0)continue;
      for(let i=0;i<si.count;i++){let w=0;for(let k=0;k<4;k++)if(si.getComponent(i,k)===bi)w+=sw.getComponent(i,k);if(w<0.25)continue;
        m.getVertexPosition(i,q);const p=q.clone().applyMatrix4(m.matrixWorld);const d=p.clone().sub(pS),ss=d.dot(u);if(ss<-0.012||ss>0.09)continue;
        const r=d.clone().sub(u.clone().multiplyScalar(ss)).length();if(r<0.004||r>0.11)continue;reg.push({m,i,s:ss,w,p0:p,r0:r});}}
    // triangles fully inside the region (per mesh)
    const tris=[];for(const m of meshes){const set=new Map();reg.forEach((x,k)=>{if(x.m===m)set.set(x.i,k);});const ix=m.geometry.index;if(!ix)continue;
      for(let t=0;t<ix.count;t+=3){const a=set.get(ix.getX(t)),b=set.get(ix.getX(t+1)),c=set.get(ix.getX(t+2));if(a===undefined||b===undefined||c===undefined)continue;
        const n=reg[b].p0.clone().sub(reg[a].p0).cross(reg[c].p0.clone().sub(reg[a].p0));if(n.length()<1e-9)continue;tris.push([a,b,c,n.normalize(),(reg[a].w+reg[b].w+reg[c].w)/3]);}}
    const width=(pts,ax,c)=>{const b1=new T.Vector3().crossVectors(ax,Math.abs(ax.x)<0.9?new T.Vector3(1,0,0):new T.Vector3(0,0,1)).normalize(),b2=new T.Vector3().crossVectors(ax,b1);
      let mn=9;const pr=pts.map(p=>{const d=p.clone().sub(c);return [d.dot(b1),d.dot(b2)];});if(pr.length<8)return null;
      for(let j=0;j<36;j++){const an=j*Math.PI/36,ca=Math.cos(an),sa=Math.sin(an);let lo=9,hi=-9;for(const [x,y] of pr){const t=x*ca+y*sa;if(t<lo)lo=t;if(t>hi)hi=t;}if(hi-lo<mn)mn=hi-lo;}return mn;};
    const bands=BANDS.map(b=>reg.map((x,k)=>Math.abs(x.s-b)<=HB?k:-1).filter(k=>k>=0));
    const ref=bands.map((B,j)=>width(B.map(k=>reg[k].p0),u,pS.clone().add(u.clone().multiplyScalar(BANDS[j]))));
    const pit=new T.Vector3(0,0,1).sub(u.clone().multiplyScalar(u.z)).normalize(); // anatomical anterior (rest front +z) of the humerus = elbow pit / biceps side
    // palm normal: ground-hand pose gives the hand rotation (delta from rest) that puts the palm on the floor (world -Y)
    let palm0=null;try{const g=v.motion.getGroundHandPose(s,[0,0,1]);const H=new T.Quaternion().fromArray(g.handQuaternion);palm0=new T.Vector3(0,-1,0).applyQuaternion(H.clone().invert());}catch(e){}
    X.S[s]={ua,fa,h,reg,tris,bands,ref,Wua0:W(ua),Wh0:W(h),pit0:pit,palm0,aUA:u.clone().applyQuaternion(W(ua).invert())};
  }
  for(const [o,a,b,c] of bones){o.position.copy(a);o.quaternion.copy(b);o.scale.copy(c);}v.coach.updateMatrixWorld(true);for(const m of meshes)m.skeleton.update();
  window.__SH3=X;
}
const X=window.__SH3;v.coach.updateMatrixWorld(true);for(const m of meshes)m.skeleton.update();
const Dt=W(X.torso).multiply(X.Wt0.clone().invert());const toT=x=>x.clone().applyQuaternion(Dt.clone().invert());
const r3=x=>x?x.toArray().map(z=>+z.toFixed(2)):null;
const res={};
for(const [s,x] of Object.entries(X.S)){
  const pS=P(x.ua),pE=P(x.fa),u=pE.clone().sub(pS).normalize();
  const cur=x.reg.map(o=>{o.m.getVertexPosition(o.i,q);return q.clone().applyMatrix4(o.m.matrixWorld);});
  let shW=9;x.bands.forEach((B,j)=>{if(!x.ref[j]||B.length<8)return;const pts=B.map(k=>cur[k]);
    const c=pS.clone().add(u.clone().multiplyScalar(BANDS[j]));const b1=new T.Vector3().crossVectors(u,Math.abs(u.x)<0.9?new T.Vector3(1,0,0):new T.Vector3(0,0,1)).normalize(),b2=new T.Vector3().crossVectors(u,b1);
    const pr=pts.map(p=>{const d=p.clone().sub(c);return [d.dot(b1),d.dot(b2)];});let mn=9;
    for(let i=0;i<36;i++){const an=i*Math.PI/36,ca=Math.cos(an),sa=Math.sin(an);let lo=9,hi=-9;for(const [a,b] of pr){const t=a*ca+b*sa;if(t<lo)lo=t;if(t>hi)hi=t;}if(hi-lo<mn)mn=hi-lo;}
    shW=Math.min(shW,mn/x.ref[j]);});
  const rr=x.reg.map((o,k)=>{const d=cur[k].clone().sub(pS),ss=d.dot(u);return d.sub(u.clone().multiplyScalar(ss)).length()/o.r0;}).sort((a,b)=>a-b);
  const Dua=W(x.ua).multiply(x.Wua0.clone().invert());let flip=0;
  for(const [a,b,c,n0,w] of x.tris){const n=cur[b].clone().sub(cur[a]).cross(cur[c].clone().sub(cur[a]));if(n.length()<1e-10){flip++;continue;}
    const Q=Dt.clone().slerp(Dua,Math.min(1,w));if(n.normalize().dot(n0.clone().applyQuaternion(Q))<0)flip++;}
  const rel=X.Wt0.clone().invert().multiply(x.Wua0).invert().multiply(W(X.torso).invert().multiply(W(x.ua)));
  const pitW=x.pit0.clone().applyQuaternion(Dua); // reset->bind is a swing about Z, so carrying the reset anterior by the reset->current delta is the same as bind-based
  const palmW=x.palm0?x.palm0.clone().applyQuaternion(W(x.h)):null; // bone world quaternions are deltas from the bind pose (checked: floor hands give palmW = -Y)
  res[s]={shW:+shW.toFixed(3),shR5:+rr[Math.floor(rr.length*0.05)].toFixed(3),shFlip:flip,nTri:x.tris.length,shTw:+tw(rel,x.aUA).toFixed(1),
    pitW:r3(pitW),pitT:r3(toT(pitW)),palmW:r3(palmW),palmT:palmW?r3(toT(palmW)):null};
}
return res;}
