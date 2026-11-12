// Elbow pinch metric (pose-fix 1108): in-page eval for /workspace/work/pose-batch-1108/probe.mjs --eval <this file>. Returns per arm minW (mm), minRatio vs rest pose, elbowTw (forearm vs upper arm twist, deg), handTw, pit dir.
function(){
// Elbow pinch metric: per arm, slices of the limb skin near the elbow (upper-arm side along shoulder->elbow, forearm side along
// elbow->wrist), min caliper width per slice; min over slices. Reference = same metric on the bind pose (untwisted).
// Also: twist of forearm vs upper arm about the forearm axis (bones, relative to bind), hand vs forearm twist, elbow angle,
// elbow-pit direction (bind-pose bend direction carried by the upper arm).
const T=window.__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);
let mesh=v.coach.getObjectByName('V2P_Base_Limbs');if(!mesh)v.scene.traverse(o=>{if(!mesh&&o.isSkinnedMesh&&o.name.includes('Limb'))mesh=o;});
const sk=mesh.skeleton;sk.update();
const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
const tw=(q,a)=>{let p=q.x*a.x+q.y*a.y+q.z*a.z,w=q.w;if(w<0){w=-w;p=-p;}let t=2*Math.atan2(p,w);if(t>Math.PI)t-=2*Math.PI;return t*57.2958;};
const SL=[-0.06,-0.045,-0.03,-0.015,0,0.015,0.03,0.045,0.06];
if(!window.__EW){
  const g=mesh.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,pos=g.attributes.position;
  const bindW=b=>{const i=sk.bones.indexOf(b);const m=new T.Matrix4().copy(sk.boneInverses[i]).invert().premultiply(mesh.bindMatrixInverse).premultiply(mesh.matrixWorld);return m;};
  const S={};
  for(const s of ['left','right']){
    const ua=v.coach.getObjectByName(s+'UpperArm'),fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');
    const bi=[ua,fa].map(b=>sk.bones.indexOf(b));const idx=[];
    for(let i=0;i<si.count;i++){let w=0;for(let k=0;k<4;k++)if(bi.includes(si.getComponent(i,k)))w+=sw.getComponent(i,k);if(w>=0.5)idx.push(i);}
    const Mua=bindW(ua),Mfa=bindW(fa),Mh=bindW(h);
    const pS=new T.Vector3().setFromMatrixPosition(Mua),pE=new T.Vector3().setFromMatrixPosition(Mfa),pW=new T.Vector3().setFromMatrixPosition(Mh);
    const qua=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().extractRotation(Mua)),qfa=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().extractRotation(Mfa)),qh=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().extractRotation(Mh));
    const pts=idx.map(i=>new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld));
    const u=pE.clone().sub(pS).normalize(),f=pW.clone().sub(pE).normalize();
    const aL=f.clone().applyQuaternion(qfa.clone().invert());
    let pit=f.clone().sub(u.clone().multiplyScalar(f.dot(u)));const pitLocal=pit.length()>1e-4?pit.normalize().applyQuaternion(qua.clone().invert()):null;
    S[s]={ua,fa,h,bi,idx,restRel:qua.clone().invert().multiply(qfa),restHand:qfa.clone().invert().multiply(qh),aL,pitLocal,restElbow:u.angleTo(f)*57.2958};
    S[s].ref=null;S[s]._ref=[pS,pE,pW,pts];
  }
  window.__EW={S};
}
const S=__EW.S;
function widths(pS,pE,pW,pts){
  const u=pE.clone().sub(pS).normalize(),f=pW.clone().sub(pE).normalize();const out=[];
  for(const s of SL){const ax=s<0?u:f,c=pE.clone().add(ax.clone().multiplyScalar(s));
    const b1=new T.Vector3().crossVectors(ax,Math.abs(ax.x)<0.9?new T.Vector3(1,0,0):new T.Vector3(0,0,1)).normalize(),b2=new T.Vector3().crossVectors(ax,b1);
    const pr=[];for(const p of pts){const d=p.clone().sub(c);const h=d.dot(ax);if(Math.abs(h)>0.005)continue;const x=d.dot(b1),y=d.dot(b2);if(x*x+y*y>0.08*0.08)continue;pr.push([x,y]);}
    if(pr.length<8){out.push(null);continue;}
    let mn=9,mx=0;for(let k=0;k<36;k++){const a=k*Math.PI/36,ca=Math.cos(a),sa=Math.sin(a);let lo=9,hi=-9;for(const [x,y] of pr){const t=x*ca+y*sa;if(t<lo)lo=t;if(t>hi)hi=t;}const w=hi-lo;if(w<mn)mn=w;if(w>mx)mx=w;}
    out.push([+(mn*1000).toFixed(1),+(mx*1000).toFixed(1)]);}
  return out;}
const res={};const q=new T.Vector3();
for(const [s,x] of Object.entries(S)){
  if(!x.ref){for(const y of Object.values(S)){const [a,b,c,p]=y._ref;y.bindRef=widths(a,b,c,p);delete y._ref;}
    const bones=[];v.coach.traverse(o=>{if(o.isBone)bones.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
    v.motion.reset();v.coach.updateMatrixWorld(true);sk.update();
    for(const y of Object.values(S)){const rp=y.idx.map(i=>{mesh.getVertexPosition(i,q);return q.clone().applyMatrix4(mesh.matrixWorld);});y.ref=widths(P(y.ua),P(y.fa),P(y.h),rp);y.restPose=[P(y.ua),P(y.fa),P(y.h)].map(z=>z.toArray().map(k=>+k.toFixed(3)));}
    for(const [o,a,b,c] of bones){o.position.copy(a);o.quaternion.copy(b);o.scale.copy(c);}v.coach.updateMatrixWorld(true);sk.update();}
  const pS=P(x.ua),pE=P(x.fa),pW=P(x.h);
  const pts=x.idx.map(i=>{mesh.getVertexPosition(i,q);return q.clone().applyMatrix4(mesh.matrixWorld);});
  const w=widths(pS,pE,pW,pts);
  const ratio=w.map((z,i)=>z&&x.ref[i]?z[0]/x.ref[i][0]:null).filter(z=>z!==null);
  const rel=W(x.ua).invert().multiply(W(x.fa));const d=x.restRel.clone().invert().multiply(rel);
  const hd=x.restHand.clone().invert().multiply(W(x.fa).invert().multiply(W(x.h)));
  const pit=x.pitLocal?x.pitLocal.clone().applyQuaternion(W(x.ua)).toArray().map(z=>+z.toFixed(3)):null;
  res[s]={minW:Math.min(...w.filter(Boolean).map(z=>z[0])),minRatio:+Math.min(...ratio).toFixed(3),w:w.map(z=>z&&z[0]),ref:x.ref.map(z=>z&&z[0]),
    elbowTw:+tw(d,x.aL).toFixed(1),handTw:+tw(hd,x.aL).toFixed(1),elbow:+(pE.clone().sub(pS).angleTo(pW.clone().sub(pE))*57.2958).toFixed(1),pit,restElbow:+x.restElbow.toFixed(1),bindRef:x.bindRef.map(z=>z&&z[0]),restPose:x.restPose,
    palm:pW.toArray().map(z=>+z.toFixed(4))};
}
return res;}
