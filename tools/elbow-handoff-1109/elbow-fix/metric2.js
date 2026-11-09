function(){
// Extended elbow metric for elbow-twist-r1: elbow/shoulder/wrist slice widths vs rest, cross-elbow twist, hand twist,
// signed elbow-pit vs bend-direction angle, arm min height, arm verts near other body verts (self-contact proxy).
const T=window.__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);
let mesh=v.coach.getObjectByName('V2P_Base_Limbs');if(!mesh)v.scene.traverse(o=>{if(!mesh&&o.isSkinnedMesh&&o.name.includes('Limb'))mesh=o;});
const sk=mesh.skeleton;sk.update();
const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
const tw=(q,a)=>{let p=q.x*a.x+q.y*a.y+q.z*a.z,w=q.w;if(w<0){w=-w;p=-p;}let t=2*Math.atan2(p,w);if(t>Math.PI)t-=2*Math.PI;return t*57.2958;};
// slice defs: [kind, offset]; elbow: along u (neg) / f (pos) from elbow; sh: from shoulder along u; wr: back from wrist along f
const SL=[['e',-0.06],['e',-0.045],['e',-0.03],['e',-0.015],['e',0],['e',0.015],['e',0.03],['e',0.045],['e',0.06],['s',0.07],['s',0.10],['w',0.03],['w',0.05]];
const q=new T.Vector3();
if(!window.__EW2){
  const g=mesh.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;const S={};
  for(const s of ['left','right']){
    const ua=v.coach.getObjectByName(s+'UpperArm'),fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');
    const bi=[ua,fa].map(b=>sk.bones.indexOf(b));const idx=[];
    for(let i=0;i<si.count;i++){let w=0;for(let k=0;k<4;k++)if(bi.includes(si.getComponent(i,k)))w+=sw.getComponent(i,k);if(w>=0.5)idx.push(i);}
    S[s]={ua,fa,h,idx};
  }
  // other-body verts for the contact proxy: every skinned visible mesh vertex whose dominant bone is not this arm's chain
  const others=[];v.coach.traverse(o=>{if(!o.isSkinnedMesh||!o.visible)return;const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bs=o.skeleton.bones;
    for(let i=0;i<g.attributes.position.count;i+=3){let bi=-1,bw=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>bw){bw=sw.getComponent(i,k);bi=si.getComponent(i,k);}others.push([o,i,bs[bi].name]);}});
  window.__EW2={S,others,first:true};
}
const X=__EW2,S=X.S;
function widths(pS,pE,pW,pts){
  const u=pE.clone().sub(pS).normalize(),f=pW.clone().sub(pE).normalize();const out=[];
  for(const [k,s] of SL){let ax,c;
    if(k==='e'){ax=s<0?u:f;c=pE.clone().add(ax.clone().multiplyScalar(s));}
    else if(k==='s'){ax=u;c=pS.clone().add(u.clone().multiplyScalar(s));}
    else {ax=f;c=pW.clone().sub(f.clone().multiplyScalar(s));}
    const b1=new T.Vector3().crossVectors(ax,Math.abs(ax.x)<0.9?new T.Vector3(1,0,0):new T.Vector3(0,0,1)).normalize(),b2=new T.Vector3().crossVectors(ax,b1);
    const pr=[];for(const p of pts){const d=p.clone().sub(c);const h=d.dot(ax);if(Math.abs(h)>0.005)continue;const x=d.dot(b1),y=d.dot(b2);if(x*x+y*y>0.08*0.08)continue;pr.push([x,y]);}
    if(pr.length<8){out.push(null);continue;}
    let mn=9;for(let j=0;j<36;j++){const a=j*Math.PI/36,ca=Math.cos(a),sa=Math.sin(a);let lo=9,hi=-9;for(const [x,y] of pr){const t=x*ca+y*sa;if(t<lo)lo=t;if(t>hi)hi=t;}if(hi-lo<mn)mn=hi-lo;}
    out.push(+(mn*1000).toFixed(1));}
  return out;}
const armPts=x=>x.idx.map(i=>{mesh.getVertexPosition(i,q);return q.clone().applyMatrix4(mesh.matrixWorld);});
if(X.first){
  X.first=false;
  for(const x of Object.values(S)){const bq=x.ua.getWorldQuaternion(new T.Quaternion());}
  const bones=[];v.coach.traverse(o=>{if(o.isBone)bones.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
  v.motion.reset();v.coach.updateMatrixWorld(true);sk.update();
  for(const x of Object.values(S)){const pS=P(x.ua),pE=P(x.fa),pW=P(x.h);x.ref=widths(pS,pE,pW,armPts(x));
    x.restRel=W(x.ua).invert().multiply(W(x.fa));x.restHand=W(x.fa).invert().multiply(W(x.h));
    const u=pE.clone().sub(pS).normalize(),f=pW.clone().sub(pE).normalize();x.aL=f.clone().applyQuaternion(W(x.fa).invert());
    // pit = rest bend direction (forearm dir minus its upper-arm component); fallback: rest forward axis
    let pit=f.clone().sub(u.clone().multiplyScalar(f.dot(u)));if(pit.length()<0.02)pit=new T.Vector3(0,0,1).sub(u.clone().multiplyScalar(u.z));
    x.pitL=pit.normalize().applyQuaternion(W(x.ua).invert());x.uL=u.clone().applyQuaternion(W(x.ua).invert());}
  const tb=v.coach.getObjectByName('torso')||v.coach.getObjectByName('Torso');X.torso=tb;X.restTq=tb?W(tb):null;
  const bn=[];v.coach.traverse(o=>{if(o.isBone)bn.push([o.name,P(o).toArray().map(z=>+z.toFixed(3))]);});X.restInfo=bn;
  for(const [o,a,b,c] of bones){o.position.copy(a);o.quaternion.copy(b);o.scale.copy(c);}v.coach.updateMatrixWorld(true);sk.update();
}
// contact proxy grid of other verts
const cell=0.012,grid=new Map();const key=(a,b,c)=>a+','+b+','+c;
const oth=[];for(const [o,i,bn] of X.others){o.getVertexPosition(i,q);const p=q.clone().applyMatrix4(o.matrixWorld);oth.push([p,bn]);}
for(let n=0;n<oth.length;n++){const p=oth[n][0];const k=key(Math.floor(p.x/cell),Math.floor(p.y/cell),Math.floor(p.z/cell));let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(n);}
const res={};
for(const [s,x] of Object.entries(S)){
  const pS=P(x.ua),pE=P(x.fa),pW=P(x.h);const pts=armPts(x);const w=widths(pS,pE,pW,pts);
  const rat=k=>{const r=w.map((z,i)=>SL[i][0]===k&&z&&x.ref[i]?z/x.ref[i]:null).filter(z=>z!==null);return r.length?+Math.min(...r).toFixed(3):null;};
  const d=x.restRel.clone().invert().multiply(W(x.ua).invert().multiply(W(x.fa)));
  const hd=x.restHand.clone().invert().multiply(W(x.fa).invert().multiply(W(x.h)));
  const u=pE.clone().sub(pS).normalize(),f=pW.clone().sub(pE).normalize();
  const pit=x.pitL.clone().applyQuaternion(W(x.ua));const bend=f.clone().sub(u.clone().multiplyScalar(f.dot(u)));
  let pitAng=null;if(bend.length()>0.05){bend.normalize();const pp=pit.clone().sub(u.clone().multiplyScalar(pit.dot(u))).normalize();pitAng=+(Math.atan2(u.dot(new T.Vector3().crossVectors(pp,bend)),pp.dot(bend))*57.2958).toFixed(1);}
  let minY=9,near=0;const other=s==='left'?'right':'left';
  for(const p of pts){if(p.y<minY)minY=p.y;if(p.distanceTo(pS)<0.10)continue;
    const cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell),cz=Math.floor(p.z/cell);let hit=false;
    for(let a=-1;a<=1&&!hit;a++)for(let b=-1;b<=1&&!hit;b++)for(let c=-1;c<=1&&!hit;c++){const L=grid.get(key(cx+a,cy+b,cz+c));if(!L)continue;
      for(const n of L){const bn=oth[n][1];if(bn.startsWith(s)&&/UpperArm|Forearm|Hand|Scapula|Shoulder|Clav/.test(bn))continue;if(oth[n][0].distanceTo(p)<0.008){hit=true;break;}}}
    if(hit)near++;}
  res[s]={ratio:rat('e'),sh:rat('s'),wr:rat('w'),minW:Math.min(...w.slice(0,9).filter(Boolean)),tw:+tw(d,x.aL).toFixed(1),htw:+tw(hd,x.aL).toFixed(1),
    elbow:+(u.angleTo(f)*57.2958).toFixed(1),pit:pit.toArray().map(z=>+z.toFixed(3)),pitAng,minY:+(minY*1000).toFixed(1),near,
    pos:[pS,pE,pW].map(z=>z.toArray()),pitT:X.torso?pit.clone().applyQuaternion(W(X.torso).invert()).applyQuaternion(X.restTq).toArray().map(z=>+z.toFixed(2)):null};
}
if(!X.infoSent){X.infoSent=true;res.restInfo=X.restInfo;}
return res;}
