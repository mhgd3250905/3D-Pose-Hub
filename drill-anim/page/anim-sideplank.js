// side-plank hip-dip pose: legs+pelvis rotate rigidly about the planted ankles (gamma), torso rotates about the pelvis (beta)
// so the straight support arm keeps its length to the planted wrist. Feet/hand targets and orientations never change.
window.__poseAnim=function(cfg,dip){
  const T=window.__toonT,v=flareInspector.viewer,m=v.motion;
  if(!window.__pa0){m.reset();v.coach.updateMatrixWorld(true);window.__pa0=m.getMetrics().joints;}
  const J0=window.__pa0,V=a=>new T.Vector3(...a);const P0=V(J0.pelvis);
  const a=cfg.angle*Math.PI/180;
  const L=new T.Vector3(Math.sin(a),Math.cos(a),0),D=new T.Vector3(-Math.cos(a),Math.sin(a),0),F=new T.Vector3(0,0,1);
  const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(L,D,F));
  const R=(o,qq)=>o.clone().applyQuaternion(qq||q);
  const oS=V(J0.rightShoulder).sub(P0),oA=V(J0.rightAnkle).sub(P0),oLH=V(J0.leftHip).sub(P0),oLS=V(J0.leftShoulder).sub(P0),oRH=V(J0.rightHip).sub(P0);
  const P0r=new T.Vector3(0,0,0);P0r.y=cfg.shoulderY-R(oS).y;const S=P0r.clone().add(R(oS));
  if(!window.__paHand)window.__paHand=m.getGroundHandPose('right',cfg.finger,[S.x+cfg.handDx,0,S.z+cfg.handDz]);const hand=window.__paHand;
  const Ar=P0r.clone().add(R(oA));const Al=Ar.clone().addScaledVector(L,cfg.stack).addScaledVector(F,cfg.stackF||0);
  const piv=Ar.clone().add(Al).multiplyScalar(.5);
  const W=V(hand.wrist);
  let Pc=null;
  const build=(g,b,tD=0,tF=0)=>{const P=Pc||P0r;const qg=new T.Quaternion().setFromAxisAngle(F,g),qb=new T.Quaternion().setFromAxisAngle(F,b);
    const qP=qg.clone().multiply(q),qT=qb.clone().multiply(qP);
    const Pp=piv.clone().add(P.clone().sub(piv).applyQuaternion(qg)).addScaledVector(D,tD).addScaledVector(F,tF);
    const Lp=L.clone().applyQuaternion(qg),Dp=D.clone().applyQuaternion(qg);
    const RH=Pp.clone().add(R(oRH,qP)),LH=Pp.clone().add(R(oLH,qP)),LS=Pp.clone().add(R(oLS,qT)),Sp=Pp.clone().add(R(oS,qT));
    const knee=(h,an)=>h.clone().add(an).multiplyScalar(.5).addScaledVector(F,.4);
    const fr=(x,n)=>{x=x.clone().normalize();const y=n.clone().addScaledVector(x,-n.dot(x)).normalize();return new T.Matrix4().makeBasis(x,y,x.clone().cross(y));};
    const pl=new T.Vector3(0.98253144,0.05483374,0.17783482),pn=new T.Vector3(0.06068526,-0.99777448,-0.02762938);
    const fW=F.clone().multiplyScalar(cfg.lhF).addScaledVector(Dp,-cfg.lhD).normalize(),nW=Lp.clone().negate().addScaledVector(F,-.2).normalize();
    const hq=new T.Quaternion().setFromRotationMatrix(fr(fW,nW).multiply(fr(pl,pn).invert()));
    const LW=LH.clone().addScaledVector(Lp,cfg.lwL).addScaledVector(F,cfg.lwF).addScaledVector(Dp,cfg.lwD);
    return {version:1,pelvis:Pp.toArray(),bodyQuaternion:qT.toArray(),pelvisQuaternion:qP.toArray(),
      limbs:{right:{wrist:hand.wrist,handQuaternion:hand.handQuaternion,elbowPole:Sp.clone().addScaledVector(D,-.25).addScaledVector(F,-.25).toArray(),
          ankle:Ar.toArray(),kneePole:knee(RH,Ar).toArray(),footQuaternion:q.toArray(),handLocked:true},
        left:{wrist:LW.toArray(),handQuaternion:hq.toArray(),elbowPole:LS.clone().add(LW).multiplyScalar(.5).addScaledVector(Lp,.35).addScaledVector(Dp,.1).addScaledVector(F,-.25).toArray(),
          ankle:Al.toArray(),kneePole:knee(LH,Al).toArray(),footQuaternion:q.toArray(),handLocked:false}},groundLock:false};};
  const apply=(g,b,tD=0,tF=0)=>{m.applyPose(build(g,b,tD,tF),{playback:false});v.coach.updateMatrixWorld(true);return m.getMetrics();};
  // gamma: hip drop -> rotation of the legs about the feet (sign: positive F rotation lifts? test both)
  if(window.__paArm===undefined){const M=apply(0,0);window.__paPc=V(M.joints.pelvis);}Pc=window.__paPc;const lever=Pc.clone().sub(piv).length();const g=(cfg.dipSign||1)*dip/lever;
  // beta: keep |shoulder - wrist| equal to the straight-arm length of the base pose
  if(window.__paArm===undefined){const M=apply(0,0);window.__paArm=V(M.joints.rightShoulder).distanceTo(V(M.joints.rightWrist));window.__paBase=M.joints;}
  const kn=M=>{const J=M.joints;const an=(a,b,c)=>V(J[a]).sub(V(J[b])).angleTo(V(J[c]).sub(V(J[b])))*180/Math.PI;return Math.min(an('rightHip','rightKnee','rightAnkle'),an('leftHip','leftKnee','leftAnkle'));};
  let tD=0,tF=0,bestK=-1;const scan=[];
  if(dip!==0){for(let x=-0.04;x<=0.0401;x+=0.004)for(let z=-0.02;z<=0.0201;z+=0.01){const M=apply(g,0,x,z);const bad=(M.warnings||[]).some(w=>/脚踝/.test(w));const k=bad?-1:kn(M);if(k>bestK){bestK=k;tD=x;tF=z;}}
    // refine
    const c0=tD,c1=tF;for(let x=c0-0.004;x<=c0+0.0041;x+=0.001)for(let z=c1-0.01;z<=c1+0.0101;z+=0.0025){const M=apply(g,0,x,z);const bad=(M.warnings||[]).some(w=>/脚踝/.test(w));const k=bad?-1:kn(M);if(k>bestK){bestK=k;tD=x;tF=z;}}}
  const f=b=>{const M=apply(g,b,tD,tF);return V(M.joints.rightShoulder).distanceTo(V(M.joints.rightWrist))-window.__paArm;};
  let lo=-0.25,hi=0.25,best=0;
  if(dip!==0){let flo=f(lo),fhi=f(hi);
    // scan for the root nearest 0
    let prev=-0.12,fp=f(prev),found=false;for(let b=-0.12+0.01;b<=0.12001;b+=0.01){const fb=f(b);if(fp*fb<=0){lo=prev;hi=b;flo=fp;found=true;if(Math.abs(b)<0.06)break;}prev=b;fp=fb;}
    if(found){for(let it=0;it<30;it++){const mid=(lo+hi)/2,fm=f(mid);if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}}best=(lo+hi)/2;}else best=NaN;}
  const M=apply(g,isNaN(best)?0:best,tD,tF);
  return {gamma:g,beta:best,tD,tF,bestK,joints:M.joints,warn:M.warnings||null};
};
window.__animMetrics=function(){const T=window.__toonT,v=flareInspector.viewer,m=v.motion;const J=m.getMetrics().joints;const V=a=>new T.Vector3(...a);
  const ang=(a,b,c)=>{const u=V(J[a]).sub(V(J[b])),w=V(J[c]).sub(V(J[b]));return u.angleTo(w)*180/Math.PI;};
  const p=new T.Vector3();let minY=9;const cen={hand:[0,0,0,0],feetR:[0,0,0,0],feetL:[0,0,0,0]};
  v.coach.traverse(o=>{if(!o.isSkinnedMesh||!o.visible)return;const g=o.geometry,n=g.attributes.position.count,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bs=o.skeleton.bones;
    for(let i=0;i<n;i+=3){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld);if(p.y<minY)minY=p.y;
      let bi=-1,bw=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>bw){bw=sw.getComponent(i,k);bi=si.getComponent(i,k);}const bn=bs[bi].name;
      const c=bn==='rightHand'?cen.hand:bn==='rightFoot'?cen.feetR:bn==='leftFoot'?cen.feetL:null;if(c){c[0]+=p.x;c[1]+=p.y;c[2]+=p.z;c[3]++;}}});
  for(const k in cen){const c=cen[k];cen[k]=[c[0]/c[3],c[1]/c[3],c[2]/c[3]];}
  return {elbowR:ang('rightShoulder','rightElbow','rightWrist'),kneeR:ang('rightHip','rightKnee','rightAnkle'),kneeL:ang('leftHip','leftKnee','leftAnkle'),
    hipR:ang('rightShoulder','rightHip','rightKnee'),minY,cen,pelvis:J.pelvis,hipMid:V(J.rightHip).add(V(J.leftHip)).multiplyScalar(.5).toArray(),joints:J};};
// generic pelvis solve for a hip drop d: pelvis offset (tx,ty,tz) + pelvis rotations (rz about F, rd about D); returns best params
window.__dipSolve=function(cfg,d,x0){const T=window.__toonT,v=flareInspector.viewer,m=v.motion,V=a=>new T.Vector3(...a);
  __poseAnim(cfg,0);const base=window.__paBase||m.getMetrics().joints;const pose0=m.capturePose();
  const F=new T.Vector3(0,0,1),a=cfg.angle*Math.PI/180,D=new T.Vector3(-Math.cos(a),Math.sin(a),0),L=new T.Vector3(Math.sin(a),Math.cos(a),0);
  const Pc=V(pose0.pelvis),q0=new T.Quaternion(...pose0.pelvisQuaternion||pose0.bodyQuaternion);const J0=m.getMetrics().joints;
  const hm0=V(J0.rightHip).add(V(J0.leftHip)).multiplyScalar(.5);
  const an=(J,a,b,c)=>V(J[a]).sub(V(J[b])).angleTo(V(J[c]).sub(V(J[b])))*180/Math.PI;
  const lh0=V(J0.leftWrist).sub(V(J0.leftHip)),lhq=new T.Quaternion(...pose0.limbs.left.handQuaternion);
  const mk=(x)=>{const qr=new T.Quaternion().setFromAxisAngle(F,x[3]).multiply(new T.Quaternion().setFromAxisAngle(D,x[4]));const qP=qr.clone().multiply(q0);
    const p=structuredClone(pose0);p.pelvis=Pc.clone().add(new T.Vector3(x[0],x[1],x[2])).toArray();p.pelvisQuaternion=qP.toArray();
    const qb=new T.Quaternion().setFromAxisAngle(F,x[5]||0);p.bodyQuaternion=qb.multiply(new T.Quaternion(...pose0.bodyQuaternion)).toArray();
    // left hand rides with the pelvis (stays on the hip)
    const lhip0=V(J0.leftHip).sub(Pc).applyQuaternion(q0.clone().invert());const lhip=lhip0.clone().applyQuaternion(qP).add(V(p.pelvis));
    p.limbs.left.wrist=lh0.clone().applyQuaternion(qr).add(lhip).toArray();p.limbs.left.handQuaternion=qr.clone().multiply(lhq).toArray();
    p.limbs.left.elbowPole=V(pose0.limbs.left.elbowPole).sub(Pc).applyQuaternion(qr).add(V(p.pelvis)).toArray();
    p.limbs.right.kneePole=V(pose0.limbs.right.kneePole).sub(Pc).applyQuaternion(qr).add(V(p.pelvis)).toArray();p.limbs.left.kneePole=V(pose0.limbs.left.kneePole).sub(Pc).applyQuaternion(qr).add(V(p.pelvis)).toArray();
    return p;};
  const ev=x=>{let M;try{m.applyPose(mk(x),{playback:false});M=m.getMetrics();}catch(e){return {s:-1e9};}const J=M.joints;
    const clamp=(M.warnings||[]).length?1:0;const hm=V(J.rightHip).add(V(J.leftHip)).multiplyScalar(.5);const drop=hm0.y-hm.y;
    const kR=an(J,'rightHip','rightKnee','rightAnkle'),kL=an(J,'leftHip','leftKnee','leftAnkle'),el=an(J,'rightShoulder','rightElbow','rightWrist');
    const s=Math.min(kR,kL,174+ (el-179)*3)-1000*clamp-3000*Math.abs(drop-d);return {s,kR,kL,el,drop,clamp};};
  let x=x0?x0.slice():[0,-d,0,0,0,0];let best=ev(x);let step=[0.01,0.01,0.01,0.02,0.02,0.02];
  for(let it=0;it<500;it++){const k=it%6;let imp=false;for(const sg of [1,-1]){const y=x.slice();y[k]+=sg*step[k];const r=ev(y);if(r.s>best.s){best=r;x=y;imp=true;break;}}
    if(!imp)step[k]*=0.6;}
  m.applyPose(mk(x),{playback:false});v.coach.updateMatrixWorld(true);
  window.__dipMk=mk;return {x,best};};
window.__applyDip=function(x){const m=flareInspector.viewer.motion;m.applyPose(window.__dipMk(x),{playback:false});flareInspector.viewer.coach.updateMatrixWorld(true);};
window.__dipSolve2=function(cfg,d,x0,noOpt){const T=window.__toonT,v=flareInspector.viewer,m=v.motion,V=a=>new T.Vector3(...a);
  if(!window.__ds){__poseAnim(cfg,0);const pose0=m.capturePose();const J0=m.getMetrics().joints;m.reset();const R=m.getMetrics().joints;window.__ds={pose0,J0,R};}
  const {pose0,J0,R}=window.__ds;const F=new T.Vector3(0,0,1),a=cfg.angle*Math.PI/180,D=new T.Vector3(-Math.cos(a),Math.sin(a),0);
  const Pc=V(pose0.pelvis),q0=new T.Quaternion(...(pose0.pelvisQuaternion||pose0.bodyQuaternion)),qB0=new T.Quaternion(...pose0.bodyQuaternion);
  const oS=V(R.rightShoulder).sub(V(R.pelvis)),oHm=V(R.rightHip).add(V(R.leftHip)).multiplyScalar(.5).sub(V(R.pelvis));
  const W=V(pose0.limbs.right.wrist);const reach=Pc.clone().add(oS.clone().applyQuaternion(qB0)).distanceTo(W)-0.00005;
  const hm0=Pc.clone().add(oHm.clone().applyQuaternion(q0));
  const an=(J,a,b,c)=>V(J[a]).sub(V(J[b])).angleTo(V(J[c]).sub(V(J[b])))*180/Math.PI;
  const lh0=V(J0.leftWrist).sub(V(J0.leftHip)),lhq=new T.Quaternion(...pose0.limbs.left.handQuaternion);const lhip0=V(R.leftHip).sub(V(R.pelvis));
  const mk=(x)=>{// x=[tx,tz,rz,rd]; ty from drop; beta from reach
    const qr=new T.Quaternion().setFromAxisAngle(F,x[2]).multiply(new T.Quaternion().setFromAxisAngle(D,x[3]));const qP=qr.clone().multiply(q0);
    const hmOff=oHm.clone().applyQuaternion(qP);const P=new T.Vector3(Pc.x+x[0],0,Pc.z+x[1]);P.y=hm0.y-d-hmOff.y;
    const dist=b=>P.clone().add(oS.clone().applyQuaternion(new T.Quaternion().setFromAxisAngle(F,b).multiply(qB0))).distanceTo(W)-reach;
    let lo=-0.3,hi=0.3,best=0;{let prev=-0.3,fp=dist(prev);let cands=[];for(let b=-0.29;b<=0.3001;b+=0.01){const fb=dist(b);if(fp*fb<=0)cands.push([prev,b]);prev=b;fp=fb;}
      if(cands.length){cands.sort((u,w)=>Math.abs(u[0])-Math.abs(w[0]));[lo,hi]=cands[0];let flo=dist(lo);for(let it=0;it<40;it++){const mid=(lo+hi)/2,fm=dist(mid);if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}}best=(lo+hi)/2;}}
    const p=structuredClone(pose0);p.pelvis=P.toArray();p.pelvisQuaternion=qP.toArray();const qBn=new T.Quaternion().setFromAxisAngle(F,best).multiply(qB0);p.bodyQuaternion=qBn.toArray();
    const lhip=lhip0.clone().applyQuaternion(qP).add(P);p.limbs.left.wrist=lh0.clone().applyQuaternion(qr).add(lhip).toArray();p.limbs.left.handQuaternion=qr.clone().multiply(lhq).toArray();
    p.limbs.left.elbowPole=V(pose0.limbs.left.elbowPole).sub(Pc).applyQuaternion(qr).add(P).toArray();
    for(const s of ['right','left'])p.limbs[s].kneePole=V(pose0.limbs[s].kneePole).sub(Pc).applyQuaternion(qr).add(P).toArray();
    p.limbs.right.elbowPole=V(pose0.limbs.right.elbowPole).sub(Pc).add(P).toArray();
    p.__beta=best;return p;};
  const ev=x=>{let M;const p=mk(x);try{m.applyPose(p,{playback:false});M=m.getMetrics();}catch(e){return {s:-1e9};}const J=M.joints;
    const clamp=(M.warnings||[]).length;const kR=an(J,'rightHip','rightKnee','rightAnkle'),kL=an(J,'leftHip','leftKnee','leftAnkle'),el=an(J,'rightShoulder','rightElbow','rightWrist');
    const hm=V(J.rightHip).add(V(J.leftHip)).multiplyScalar(.5);
    return {s:Math.min(kR,kL)-100*clamp-Math.abs(x[2])*20-Math.abs(x[3])*20-Math.min(Math.abs(x[1])*300,30)-Math.max(0,170.5-Math.min(kR,kL))*50,kR,kL,el,clamp,drop:hm0.y-hm.y,beta:p.__beta,warn:M.warnings};};
  let x=x0?x0.slice():[0,0,0,0];let best=noOpt?null:ev(x);const step=[0.01,0.01,0.03,0.03];
  if(noOpt){const p=mk(x);m.applyPose(p,{playback:false});v.coach.updateMatrixWorld(true);return {x,beta:p.__beta};}
  for(let it=0;it<400;it++){const k=it%4;let imp=false;for(const sg of [1,-1]){const y=x.slice();y[k]+=sg*step[k];const r=ev(y);if(r.s>best.s){best=r;x=y;imp=true;break;}}if(!imp)step[k]*=0.7;}
  window.__dipMk2=mk;window.__dipD=d;m.applyPose(mk(x),{playback:false});v.coach.updateMatrixWorld(true);return {x,best};};
window.__dipSolve2Apply=function(cfg,d,x){window.__dipSolve2(cfg,d,x,true);};
// ===== v6 =====
// base: v5 side-plank pose with legs straightened (ankles slid horizontally so hip-ankle = straight length), akimbo top hand
window.__b6init=function(cfg){const T=window.__toonT,v=flareInspector.viewer,m=v.motion,V=a=>new T.Vector3(...a);
  m.reset();v.coach.updateMatrixWorld(true);const R=m.getMetrics().joints;
  __poseAnim(cfg,0);const pose0=m.capturePose();const J0=m.getMetrics().joints;
  const len=(s)=>[V(R[s+'Hip']).distanceTo(V(R[s+'Knee'])),V(R[s+'Knee']).distanceTo(V(R[s+'Ankle']))];
  const KT=(cfg.kneeT||178.0)*Math.PI/180;const Lt=s=>{const [a,b]=len(s);return Math.sqrt(a*a+b*b-2*a*b*Math.cos(KT));};
  for(const s of ['right','left']){const H=V(J0[s+'Hip']),A=V(pose0.limbs[s].ankle);const h=A.clone().sub(H);const L=Lt(s);
    // slide ankle horizontally along the horizontal part of (A-H) until |A-H| = L
    const hz=new T.Vector3(h.x,0,h.z).normalize();const dy=h.y;const hor=Math.sqrt(Math.max(0,L*L-dy*dy));const cur=Math.hypot(h.x,h.z);
    const A2=A.clone().addScaledVector(hz,hor-cur);pose0.limbs[s].ankle=A2.toArray();
    pose0.limbs[s].kneePole=V(pose0.limbs[s].kneePole).addScaledVector(hz,hor-cur).toArray();}
  const Pc=V(pose0.pelvis),q0=new T.Quaternion(...(pose0.pelvisQuaternion||pose0.bodyQuaternion)),qB0=new T.Quaternion(...pose0.bodyQuaternion);
  window.__b6={R,pose0,Pc,q0,qB0,LtR:Lt('right'),LtL:Lt('left')};return window.__b6;};
// rest(character)-frame -> world for the pelvis frame P,qP
window.__pose6=function(cfg,d,H,warm){const T=window.__toonT,v=flareInspector.viewer,m=v.motion,V=a=>new T.Vector3(...a);
  const B=window.__b6||__b6init(cfg);const {R,pose0,Pc,q0,qB0}=B;const F=new T.Vector3(0,0,1),a=cfg.angle*Math.PI/180,D=new T.Vector3(-Math.cos(a),Math.sin(a),0),Lx=new T.Vector3(Math.sin(a),Math.cos(a),0);
  const rp=V(R.pelvis);const oRH=V(R.rightHip).sub(rp),oLH=V(R.leftHip).sub(rp),oS=V(R.rightShoulder).sub(rp);const oHm=oRH.clone().add(oLH).multiplyScalar(.5);
  const hm0=Pc.clone().add(oHm.clone().applyQuaternion(q0));const Ar=V(pose0.limbs.right.ankle),Al=V(pose0.limbs.left.ankle);const W=V(pose0.limbs.right.wrist);
  const reach=Pc.clone().add(oS.clone().applyQuaternion(qB0)).distanceTo(W);
  const qrOf=x=>new T.Quaternion().setFromAxisAngle(F,x[2]).multiply(new T.Quaternion().setFromAxisAngle(D,x[3])).multiply(new T.Quaternion().setFromAxisAngle(Lx,x[4]));
  const geo=x=>{const qr=qrOf(x),qP=qr.clone().multiply(q0);const P=new T.Vector3(Pc.x+x[0],0,Pc.z+x[1]);P.y=hm0.y-d-oHm.clone().applyQuaternion(qP).y;
    return {qr,qP,P,RH:P.clone().add(oRH.clone().applyQuaternion(qP)),LH:P.clone().add(oLH.clone().applyQuaternion(qP))};};
  const wr=cfg.reg||[0.3,1,0.05,0.4,0.4];
  const res=x=>{const g=geo(x);return [(g.RH.distanceTo(Ar)-B.LtR)*1000,(g.LH.distanceTo(Al)-B.LtL)*1000,x[0]*wr[0],x[1]*wr[1]*10,x[2]*wr[2],x[3]*wr[3],x[4]*wr[4]];};
  let x=(warm||[0,0,0,0,0]).slice();
  for(let it=0;it<40;it++){const r0=res(x);const Jm=[];for(let k=0;k<5;k++){const y=x.slice();y[k]+=1e-5;const r1=res(y);Jm.push(r1.map((v,i)=>(v-r0[i])/1e-5));}
    // normal equations (5x5) with LM damping
    const A=[...Array(5)].map(()=>Array(5).fill(0)),bv=Array(5).fill(0);for(let i=0;i<5;i++){for(let j=0;j<5;j++)for(let q=0;q<r0.length;q++)A[i][j]+=Jm[i][q]*Jm[j][q];for(let q=0;q<r0.length;q++)bv[i]-=Jm[i][q]*r0[q];A[i][i]*=1.001;A[i][i]+=1e-9;}
    for(let i=0;i<5;i++){let p=i;for(let j=i+1;j<5;j++)if(Math.abs(A[j][i])>Math.abs(A[p][i]))p=j;[A[i],A[p]]=[A[p],A[i]];[bv[i],bv[p]]=[bv[p],bv[i]];for(let j=i+1;j<5;j++){const f=A[j][i]/A[i][i];for(let k=i;k<5;k++)A[j][k]-=f*A[i][k];bv[j]-=f*bv[i];}}
    const dx=Array(5).fill(0);for(let i=4;i>=0;i--){let s=bv[i];for(let k=i+1;k<5;k++)s-=A[i][k]*dx[k];dx[i]=s/A[i][i];}
    x=x.map((v,i)=>v+dx[i]);if(Math.hypot(...dx)<1e-9)break;}
  const g=geo(x);const P=g.P,qP=g.qP,qr=g.qr;
  // torso lateral flexion beta about F: keep straight-arm reach to the planted wrist
  const dist=b=>P.clone().add(oS.clone().applyQuaternion(new T.Quaternion().setFromAxisAngle(F,b).multiply(qB0))).distanceTo(W)-reach;
  let best=0;{let prev=-0.4,fp=dist(prev);const c=[];for(let b=-0.39;b<=0.4001;b+=0.01){const fb=dist(b);if(fp*fb<=0)c.push([prev,b]);prev=b;fp=fb;}
    if(c.length){c.sort((u,w)=>Math.abs(u[0])-Math.abs(w[0]));let [lo,hi]=c[0],flo=dist(lo);for(let it=0;it<50;it++){const mid=(lo+hi)/2,fm=dist(mid);if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}}best=(lo+hi)/2;}}
  const qB=new T.Quaternion().setFromAxisAngle(F,best).multiply(qB0);
  const p=structuredClone(pose0);p.pelvis=P.toArray();p.pelvisQuaternion=qP.toArray();p.bodyQuaternion=qB.toArray();
  for(const s of ['right','left'])p.limbs[s].kneePole=V(pose0.limbs[s].kneePole).sub(Pc).applyQuaternion(qr).add(P).toArray();
  p.limbs.right.elbowPole=V(pose0.limbs.right.elbowPole).sub(Pc).add(P).toArray();
  // akimbo top hand, authored in the rest/character frame and carried rigidly by the pelvis frame
  const qW=new T.Quaternion().setFromAxisAngle(F,best*(H.torsoW??0.4)).multiply(qP);const toW=a=>V(a).sub(rp).applyQuaternion(qW).add(P);const dirW=a=>V(a).normalize().applyQuaternion(qW);
  const fr=(f,n)=>{f=f.clone().normalize();const z=n.clone().addScaledVector(f,-n.dot(f)).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(f.clone().cross(z).normalize(),f,z));};
  const pl=new T.Vector3(0.98253144,0.05483374,0.17783482),pn=new T.Vector3(0.06068526,-0.99777448,-0.02762938);
  const fW=dirW(H.finger),nW=dirW(H.normal);const hq=fr(fW,nW).multiply(fr(pl,pn).invert());
  p.limbs.left.wrist=toW(H.wrist).toArray();p.limbs.left.handQuaternion=hq.toArray();p.limbs.left.elbowPole=toW(H.pole).toArray();p.limbs.left.handLocked=false;
  window.__lastPose6=p; // read by the engine's surface-contact pass (drill-anim)
  m.applyPose(p,{playback:false});v.coach.updateMatrixWorld(true);
  return {x,beta:best,res:res(x).slice(0,2),warn:m.getMetrics().warnings||[]};};
// hand-on-hip contact: left-hand verts vs nearest tee/shorts verts (signed along the cloth normal, posed)
window.__handContact=function(){const T=window.__toonT,v=flareInspector.viewer;const q=new T.Vector3();
  const cl=[];for(const nm of ['Mesh005','Coach_Training_Shorts']){const o=v.coach.getObjectByName(nm);const g=o.geometry;for(let i=0;i<g.attributes.position.count;i+=1){o.getVertexPosition(i,q);cl.push(q.clone());}}
  const o=v.coach.getObjectByName('Coach_Body');const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bs=o.skeleton.bones;
  const hv=[];for(let i=0;i<g.attributes.position.count;i+=2){let w=0;for(let k=0;k<4;k++)if(bs[si.getComponent(i,k)].name==='leftHand')w+=sw.getComponent(i,k);if(w<0.9)continue;o.getVertexPosition(i,q);hv.push(q.clone());}
  // cloth points near the hand
  const c0=hv.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/hv.length);const near=cl.filter(c=>c.distanceTo(c0)<0.16);
  const ds=hv.map(h=>{let bd=9;for(const c of near){const d=c.distanceToSquared(h);if(d<bd)bd=d;}return Math.sqrt(bd);});ds.sort((a,b)=>a-b);
  // signed: penetration = hand vert on the inner side of the cloth (nearest cloth vertex normal from posed neighbours)
  const ctr=new T.Vector3(...flareInspector.viewer.motion.getMetrics().joints.pelvis);let pen=0,penMax=0;
  for(const h of hv){let bd=9,bc=null;for(const c of near){const d=c.distanceToSquared(h);if(d<bd){bd=d;bc=c;}}if(Math.sqrt(bd)>0.012)continue;
    // local outward normal ~ PCA-free: average of (c - centroid of cloth points within 2cm) pointing away from the pelvis
    const nb=near.filter(c=>c.distanceTo(bc)<0.02);const m=nb.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/nb.length);
    let cov=[0,0,0,0,0,0];for(const c of nb){const d=c.clone().sub(m);cov[0]+=d.x*d.x;cov[1]+=d.y*d.y;cov[2]+=d.z*d.z;cov[3]+=d.x*d.y;cov[4]+=d.x*d.z;cov[5]+=d.y*d.z;}
    const M=new T.Matrix3().set(cov[0],cov[3],cov[4],cov[3],cov[1],cov[5],cov[4],cov[5],cov[2]);const inv=M.clone();if(Math.abs(M.determinant())<1e-18)continue;inv.invert();
    let n=new T.Vector3(1,0.3,0.2);for(let k=0;k<20;k++)n.applyMatrix3(inv).normalize();if(n.dot(bc.clone().sub(ctr))<0)n.negate();
    const sd=h.clone().sub(bc).dot(n);if(sd<-0.0005){pen++;penMax=Math.max(penMax,-sd);}}
  return {pen,penMax:+(penMax*1000).toFixed(1),min:ds[0],p05:ds[Math.floor(ds.length*.05)],n3mm:ds.filter(d=>d<0.003).length,n6mm:ds.filter(d=>d<0.006).length,n:ds.length};};
