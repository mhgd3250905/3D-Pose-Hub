function(){
// ROM metric (rom-spec r1, 2026-11-09). Read-only. Per side: axial twists (swing-twist of rest-relative child-vs-parent
// rotation about the child's rest long axis) + carried reference directions for signs. Joint angles are derived in rom.py
// from the stageAt joints + these vectors.
const T=window.__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);
const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
const tw=(q,a)=>{let p=q.x*a.x+q.y*a.y+q.z*a.z,w=q.w;if(w<0){w=-w;p=-p;}let t=2*Math.atan2(p,w);if(t>Math.PI)t-=2*Math.PI;return t*57.2958;};
const B=n=>v.coach.getObjectByName(n);
const CH=s=>({torso:B('torso'),ua:B(s+'UpperArm'),fa:B(s+'Forearm'),h:B(s+'Hand'),th:B(s+'Thigh'),sh:B(s+'Shin'),ft:B(s+'Foot'),to:B(s+'Toe')});
const rel=(p,c)=>W(p).invert().multiply(W(c));
if(!window.__EW5){
  const X={S:{}};const bones=[];v.coach.traverse(o=>{if(o.isBone)bones.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
  v.motion.reset();v.coach.updateMatrixWorld(true);
  for(const s of ['left','right']){const c=CH(s);c.pel=c.th.parent;const r={c};
    const loc=(vec,b)=>vec.clone().normalize().applyQuaternion(W(b).invert());
    const pS=P(c.ua),pE=P(c.fa),pW=P(c.h),pH=P(c.th),pK=P(c.sh),pA=P(c.ft),pT=c.to?P(c.to):null;
    const u=pE.clone().sub(pS).normalize(),f=pW.clone().sub(pE).normalize();
    r.rel={ua:rel(c.torso,c.ua),fa:rel(c.ua,c.fa),h:rel(c.fa,c.h),th:rel(c.pel,c.th),sh:rel(c.th,c.sh),ft:rel(c.sh,c.ft)};
    r.ax={ua:loc(u,c.ua),fa:loc(f,c.fa),h:loc(f,c.h),th:loc(pK.clone().sub(pH),c.th),sh:loc(pA.clone().sub(pK),c.sh),
      ftShin:loc(pA.clone().sub(pK),c.ft),ftLong:pT?loc(pT.clone().sub(pA),c.ft):null};
    let pit=f.clone().sub(u.clone().multiplyScalar(f.dot(u)));if(pit.length()<0.02)pit=new T.Vector3(0,0,1).sub(u.clone().multiplyScalar(u.z));
    r.pitL=loc(pit,c.ua);r.kneeFrontL=loc(new T.Vector3(0,0,1),c.th);
    let palm0=null;try{const g=v.motion.getGroundHandPose(s,[0,0,1]);const H=new T.Quaternion().fromArray(g.handQuaternion);palm0=new T.Vector3(0,-1,0).applyQuaternion(H.clone().invert());}catch(e){}
    r.palm0=palm0;r.ank0=pT?pA.clone().sub(pK).normalize().angleTo(pT.clone().sub(pA).normalize()):null;X.S[s]=r;}
  for(const [o,a,b,c] of bones){o.position.copy(a);o.quaternion.copy(b);o.scale.copy(c);}v.coach.updateMatrixWorld(true);
  window.__EW5=X;}
const X=__EW5,res={};const r3=a=>a?a.toArray().map(z=>+z.toFixed(3)):null;
for(const [s,r] of Object.entries(X.S)){const c=r.c;
  const R=k=>{const [p,ch]={ua:[c.torso,c.ua],fa:[c.ua,c.fa],h:[c.fa,c.h],th:[c.pel,c.th],sh:[c.th,c.sh],ft:[c.sh,c.ft]}[k];return r.rel[k].clone().invert().multiply(rel(p,ch));};
  res[s]={shTw5:+tw(R('ua'),r.ax.ua).toFixed(1),elTw:+tw(R('fa'),r.ax.fa).toFixed(1),htw5:+tw(R('h'),r.ax.h).toFixed(1),
    hipTw:+tw(R('th'),r.ax.th).toFixed(1),knTw:+tw(R('sh'),r.ax.sh).toFixed(1),ankTw:+tw(R('ft'),r.ax.ftShin).toFixed(1),
    ankInv:r.ax.ftLong?+tw(R('ft'),r.ax.ftLong).toFixed(1):null,
    ankDP:(r.ank0!==null&&c.to)?+((P(c.ft).sub(P(c.sh)).normalize().angleTo(P(c.to).sub(P(c.ft)).normalize())-r.ank0)*57.2958).toFixed(1):null,
    pitW:r3(r.pitL.clone().applyQuaternion(W(c.ua))),kneeFrontW:r3(r.kneeFrontL.clone().applyQuaternion(W(c.th))),
    palmW:r.palm0?r3(r.palm0.clone().applyQuaternion(W(c.h))):null};}
return res;}
