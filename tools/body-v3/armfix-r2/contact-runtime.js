// Independent scale-1 live-mesh calibration. The frozen r5 source and guards are untouched.
// Reuses its search objective, right-hand encoding and neck channel math; every
// installation validates the new recipe/mesh/pivots, then fits actual fresh geometry.
// v3-contact-r5: independently adapted from the project PR #21 palm-plane
// search (c5d71c59e4a16982ba0c62a3ff9a2aac6df716f3). Uses the actual
// c1r2 mesh and scaled finger rig; the neck path uses r7's shared-seam
// half-neck/full-head audit instead of the earlier rigid-neck workaround.
(function(){
window.__installArmfixContactR2=function(spec,opts){
 if(window.__armfixContactR2)throw Error("v3-contact: already installed");
 if(!opts?.rig||opts.handScale!==1||!Number.isFinite(opts.neckShare)||opts.neckShare<0||opts.neckShare>1)throw Error("v3-contact: invalid scale-1 armfix rig/options");
 const independentGuard=window.__assertArmfixContactBase(opts.guard);
 window.__armfixContactUsedR2=true;
 const T=__toonT,v=flareInspector.viewer,m=v.motion,E=__drill,V=a=>new T.Vector3(...a);
 const report={entry:'training-human-v3-armfix-contact-r2',handScale:1,independentGuard,palmFloor:null,neckShare:opts.neckShare,scope:'fresh scale-1 live-mesh fit; world-space action acceptance pending'};
 const savedPose=E.pose, savedGround=m.getGroundHandPose, originalPalm=__v2p.poses['palm-floor'], savedCurObj=__v2p.cur, savedCur={...__v2p.cur};
 const savedBones=__v2p.hands.mesh.skeleton.bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
 const savedSet=__v2p.setHandPose,aliases={left:'__armfix-contact-r2-left-palm-floor',right:'__armfix-contact-r2-right-palm-floor'},aliasPrevious=Object.fromEntries(Object.values(aliases).map(k=>[k,{own:Object.prototype.hasOwnProperty.call(__v2p.poses,k),value:__v2p.poses[k]}]));
 const restoreAliases=()=>{for(const k of Object.values(aliases)){if(aliasPrevious[k].own)__v2p.poses[k]=aliasPrevious[k].value;else delete __v2p.poses[k];}};
 let committed=false;try{
 // ---------- 1. native palm contact frame ----------
 __v2p.setHandPose('left','palm-floor',1);__v2p.setHandPose('right','palm-floor',1);
 v.coach.updateMatrixWorld(true);
 const hands=[];v.coach.traverse(o=>{if(o.isSkinnedMesh&&o===__v2p.hands?.mesh&&o.visible)hands.push(o);});
 if(hands.length!==1)throw Error('native-open-r2: visible native hand mesh V2P_Base_Hands not found');
 const H=hands[0];H.skeleton.update();
 // Points are expressed in the BIND (rest landmark) frame the frozen solver uses for hand rotations: hand-bone local
 // coordinates (any pose: the hand piece is rigid w.r.t. its bone beyond the wrist band) rotated by the bone's bind rotation.
 const pv=new T.Vector3(),names=H.skeleton.bones.map(b=>b.name),bindQ={},invW={};
 for(const s of ['left','right']){const bi=names.indexOf(s+'Hand');if(bi<0)throw Error('native-open-r2: '+s+'Hand bone missing');
  const bw=H.skeleton.boneInverses[bi].clone().invert(),q=new T.Quaternion();bw.decompose(new T.Vector3(),q,new T.Vector3());bindQ[s]=q;
  invW[s]=v.coach.getObjectByName(s+'Hand').matrixWorld.clone().invert();}
 const pts={left:[],right:[]},tags={left:[],right:[]},si=H.geometry.attributes.skinIndex,sw=H.geometry.attributes.skinWeight;
 const hw={left:v.coach.getObjectByName('leftHand').getWorldPosition(new T.Vector3()),right:v.coach.getObjectByName('rightHand').getWorldPosition(new T.Vector3())};
 for(let i=0;i<H.geometry.attributes.position.count;i++){
  H.getVertexPosition(i,pv);pv.applyMatrix4(H.matrixWorld);
  const s=pv.distanceTo(hw.left)<pv.distanceTo(hw.right)?'left':'right';
  let bi=0,bwt=-1;for(let k=0;k<4;k++){const x=sw.getComponent(i,k);if(x>bwt){bwt=x;bi=si.getComponent(i,k);}}
  pts[s].push(pv.clone().applyMatrix4(invW[s]).applyQuaternion(bindQ[s]));tags[s].push(names[bi]);}
 
 // legacy frame (coach-motion getGroundHandPose) = search start and heading convention
 const frame=(f,n)=>{const y=f.clone().normalize(),z=n.clone().addScaledVector(y,-n.dot(y)).normalize(),x=new T.Vector3().crossVectors(y,z).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
 const sideAxes=s=>{const sign=s==='left'?1:-1,rig=opts.rig;
  const tips=['index','middle','ring','pinky'].map(f=>V(rig.fingers[f].joints[3]));
  const L0=tips.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/tips.length);L0.x*=sign;L0.normalize();
  const N0=V(rig.palmar);N0.x*=sign;N0.addScaledVector(L0,-N0.dot(L0)).normalize();
  if(L0.lengthSq()<.9||N0.lengthSq()<.9)throw Error('v3-contact: invalid palm frame');return {L0,N0,X0:new T.Vector3().crossVectors(L0,N0).normalize()};};
 const cand=(ax,a,b)=>ax.N0.clone().applyAxisAngle(ax.L0,a*Math.PI/180).applyAxisAngle(ax.X0,b*Math.PI/180).normalize();
 const q20=(arr,k)=>{const c=arr.slice().sort((x,y)=>x-y);return c[Math.min(c.length-1,Math.floor(c.length*k))];};
 // (a) palmar contact plane of the palm itself (hand-bone vertices beyond the wrist crease): heel and MCP pads on the
 //     plane, thenar/hypothenar heel balanced. Fingers/thumb are excluded here and posed onto the plane in (b).
 const PF={};
 for(const s of ['left','right']){
  const ax=sideAxes(s),P=pts[s],G=tags[s],hb=s+'Hand',idx=[];
  for(let i=0;i<P.length;i++)if((G[i]===hb&&P[i].dot(ax.L0)>0)||(G[i]===s+'Forearm'&&P[i].dot(ax.L0)>-0.005*opts.handScale))idx.push(i);
  const plane=(N)=>{let mx=-1e9;for(const i of idx){const k=P[i].dot(N);if(k>mx)mx=k;}return mx;};
  const score=N=>{const mx=plane(N),heelA=[],heelB=[],mcp=[];
   for(const i of idx){if(G[i]!==hb)continue;const d=P[i],al=d.dot(ax.L0),dep=d.dot(N);if(dep<=0)continue;const c=mx-dep;
    if(al>0.005*opts.handScale&&al<0.035*opts.handScale)(d.dot(ax.X0)>0?heelA:heelB).push(c);else if(al>0.06*opts.handScale)mcp.push(c);}
   if(!heelA.length||!heelB.length||!mcp.length)return 1e9;
   const lo=(arr,n)=>{const c=arr.sort((x,y)=>x-y).slice(0,n);return c.reduce((u,w)=>u+w,0)/c.length;};
   return lo(heelA,15)+lo(heelB,15)+2*lo(mcp,30)+Math.abs(lo(heelA,10)-lo(heelB,10));};
  let best={a:0,b:0,sc:score(ax.N0)};
  for(const[step,R]of [[3,45],[1,4],[0.25,1.5]]){const c0={...best};
   for(let a=c0.a-R;a<=c0.a+R+1e-9;a+=step)for(let b=c0.b-R;b<=c0.b+R+1e-9;b+=step){const sc=score(cand(ax,a,b));if(sc<best.sc-1e-9)best={a,b,sc};}}
  PF[s]={ax,N:cand(ax,best.a,best.b),rollDeg:best.a,pitchDeg:best.b};
 }
 // (b) Fit each side independently in its own hand-local frame. Joint pivots
 // come from the actual side's skinned skeleton at the original palm-floor pose.
 const rig=opts.rig,FN=['thumb','index','middle','ring','pinky'],sidePoses={left:{},right:{}},fingerReport={left:{},right:{}};
 for(const s of ['left','right']){
  const N=PF[s].N.clone().applyQuaternion(bindQ[s].clone().invert());
  const local=pts[s].map(d=>d.clone().applyQuaternion(bindQ[s].clone().invert())),tagsSide=tags[s];
  const palmMax=(()=>{let mx=-Infinity;for(let i=0;i<local.length;i++)if(tagsSide[i]===s+'Hand'&&pts[s][i].dot(PF[s].ax.L0)>0)mx=Math.max(mx,local[i].dot(N));return mx;})();
  if(!Number.isFinite(palmMax))throw Error('v3-contact: no palmar vertices '+s);
  for(const f of FN){
   const F=rig.fingers[f],prefix='v2p_'+(s==='left'?'L':'R')+'_'+f;
   const J=[1,2,3].map(j=>{const bone=v.coach.getObjectByName(prefix+j);if(!bone)throw Error('v3-contact: missing finger joint '+prefix+j);return bone.getWorldPosition(new T.Vector3()).applyMatrix4(invW[s]);});
   const a=F.flexAxis,axis=V(s==='right'?[a[0],-a[1],-a[2]]:a).normalize(),vs=[];
   for(let i=0;i<local.length;i++){const match=new RegExp('^'+prefix+'([123])$').exec(tagsSide[i]);if(match)vs.push([local[i],+match[1]]);}
   if(!vs.length||axis.lengthSq()<.9)throw Error('v3-contact: invalid finger geometry '+prefix);
   const posed=(p,k,e)=>{const q=p.clone();for(let j=k;j>=1;j--){q.sub(J[j-1]).applyAxisAngle(axis,e[j-1]*Math.PI/180).add(J[j-1]);}return q;};
   // r4 optimized all finger segments together; the measured left pinky distal
   // pad remained high. Include distal segment P10 in this finger's objective,
   // while retaining the existing all-vertex penetration penalty.
   const leftPinky=s==='left'&&f==='pinky';
   const scoreClearances=(c,e)=>{const mn=Math.min(...c),pen=Math.max(0,0.3-mn)*100,pad=q20(c,0.15),bend=0.02*(Math.abs(e[0])+Math.abs(e[1])+Math.abs(e[2]));
    if(!leftPinky)return pen+(f==='thumb'?0.2:1)*pad+bend;
    const tip=c.filter((_,i)=>vs[i][1]===3).sort((a,b)=>a-b);if(!tip.length)throw Error('v3-contact: missing left pinky distal vertices');
    const tipP10=tip[Math.floor((tip.length-1)*0.1)];return pen+pad+4*Math.max(0,tipP10-0.5)+bend;};
   const cost=e=>scoreClearances(vs.map(([p,k])=>(palmMax-posed(p,k,e).dot(N))*1000),e);
   let best={e:[0,0,0],c:cost([0,0,0])};
   for(const[step,R]of [[4,[[-48,16],[-32,leftPinky?28:12],[-24,12]]],[1,null]]){const c0=best.e.slice(),rng=R||[[c0[0]-4,c0[0]+4],[c0[1]-4,c0[1]+4],[c0[2]-4,c0[2]+4]];
    for(let x=rng[0][0];x<=rng[0][1];x+=step)for(let y=rng[1][0];y<=rng[1][1];y+=step)for(let z=rng[2][0];z<=rng[2][1];z+=step){const k=cost([x,y,z]);if(k<best.c)best={e:[x,y,z],c:k};}}
   best.e.forEach((deg,j)=>{const q=new T.Quaternion().setFromAxisAngle(axis,deg*Math.PI/180);sidePoses[s][f+(j+1)]=s==='right'?[q.x,-q.y,-q.z,q.w]:[q.x,q.y,q.z,q.w];});
   const c=vs.map(([p,k])=>(palmMax-posed(p,k,best.e).dot(N))*1000);
   const distal=c.filter((_,i)=>vs[i][1]===3).sort((a,b)=>a-b);
   fingerReport[s][f]={deg:best.e,minClearMm:+Math.min(...c).toFixed(1),padP15Mm:+q20(c,0.15).toFixed(1),distalP10ModelMm:distal.length?+distal[Math.floor((distal.length-1)*0.1)].toFixed(1):null};
  }
 }
 const pose=sidePoses.left;
 __v2p.poses['palm-floor']=pose;
 __v2p.poses[aliases.left]=sidePoses.left;__v2p.poses[aliases.right]=sidePoses.right;
 const wrappedSet=function(side,name,k=1){if(name!=='palm-floor')return savedSet.call(this,side,name,k);const result=savedSet.call(this,side,aliases[side],k);this.cur[side]='palm-floor';return result;};
 __v2p.setHandPose=wrappedSet;
 // (c) support points with the native palm-floor pose applied (bind frame), used for the wrist height
 __v2p.setHandPose('left','palm-floor',1);__v2p.setHandPose('right','palm-floor',1);v.coach.updateMatrixWorld(true);H.skeleton.update();
 const A={left:[],right:[]};
 for(let i=0;i<H.geometry.attributes.position.count;i++){H.getVertexPosition(i,pv);pv.applyMatrix4(H.matrixWorld);
  const s=pv.distanceTo(hw.left)<pv.distanceTo(hw.right)?'left':'right';const d=pv.clone().applyMatrix4(invW[s]).applyQuaternion(bindQ[s]);
  if(d.dot(PF[s].ax.L0)>-0.005*opts.handScale)A[s].push(d);}
 report.palmFloor={pose:fingerReport};
 for(const s of ['left','right']){const P=PF[s];P.A=A[s];P.L=P.ax.L0.clone().addScaledVector(P.N,-P.ax.L0.dot(P.N)).normalize();
  let mx=-1e9;for(const d of A[s])mx=Math.max(mx,d.dot(P.N));const palm=[];
  for(let i=0;i<pts[s].length;i++){const d=pts[s][i],al=d.dot(P.ax.L0);if(tags[s][i]===s+'Hand'&&al>0.015*opts.handScale&&al<0.075*opts.handScale&&d.dot(P.N)>0)palm.push((mx-d.dot(P.N))*1000);}
  report.palmFloor[s]={rollDeg:P.rollDeg,pitchDeg:P.pitchDeg,restPalmBodyP20Mm:+q20(palm,0.2).toFixed(1),restPalmBodyP50Mm:+q20(palm,0.5).toFixed(1)};}
 __v2p.restHands();v.coach.updateMatrixWorld(true);
 const FLOOR=0,UP=V([0,1,0]),g0=savedGround.bind(m);
 m.getGroundHandPose=function(side,fingerDirection,position){
  const P=PF[side];if(!P||!__v2p.hands.on||!__v2p.hands.mesh.visible)return g0(side,fingerDirection,position);if(__v2p.hands.mesh!==H||__v2p.poses['palm-floor']!==pose)throw Error('v3-contact: calibrated mesh or pose changed; discard page');
  const f=V(fingerDirection);f.y=0;if(f.lengthSq()<1e-8)throw Error('native-open-r2: finger direction needs a horizontal component');f.normalize();
  const q=frame(f,UP.clone().negate()).multiply(frame(P.L,P.N).invert());
  let low=Infinity;for(const d of P.A){const y=d.clone().applyQuaternion(q).y;if(y<low)low=y;}
  const sg=side==='left'?1:-1,w=position?V(position):V([sg*0.215,0,0]);w.y=FLOOR+(opts?.palmClear??0)-low;
  return {wrist:w.toArray(),handQuaternion:q.toArray(),fingerDirection:f.toArray()};
 };
 // Neck channels operate after the normal r7 pose.  Each frame starts from
 // the engine's solved pose.  Half the world rotation goes to neck by default,
 // while the head receives the full world rotation: the relative half follows
 // the r7 extreme-pose audit instead of the legacy single-pivot seam workaround.
 const evalChannel=(value,params)=>{if(value==null)return 0;if(typeof value==='number')return value;if(typeof value==='string'){if(!(value in params))throw Error('v3-contact: missing neck track '+value);return Number(params[value]);}if(typeof value==='object'&&typeof value.track==='string'&&value.track in params)return Number(params[value.track])*Number(value.scale??1)+Number(value.offset??0);throw Error('v3-contact: invalid neck channel');};
 const setWorld=(b,q,p)=>{b.parent.updateMatrixWorld(true);const parentQ=b.parent.getWorldQuaternion(new T.Quaternion());b.position.copy(b.parent.worldToLocal(p.clone()));b.quaternion.copy(parentQ.invert().multiply(q));b.updateMatrixWorld(true);};
 E.pose=function(sp,params,warm){if(sp.neck===undefined)return savedPose.call(this,sp,params,warm);if(!sp.neck||typeof sp.neck!=='object'||Array.isArray(sp.neck))throw Error('v3-contact: neck must be an object');
  for(const key of Object.keys(sp.neck))if(!['flex','side','rot'].includes(key))throw Error('v3-contact: unknown neck channel '+key);
  const a=Object.fromEntries(['flex','side','rot'].map(k=>[k,evalChannel(sp.neck[k],params)]));if(Object.values(a).some(x=>!Number.isFinite(x)))throw Error('v3-contact: nonfinite neck angle');const result=savedPose.call(this,sp,params,warm);result.neck=a;if(!a.flex&&!a.side&&!a.rot)return result;
  const torso=v.coach.getObjectByName('torso'),nk=v.coach.getObjectByName('neck'),head=v.coach.getObjectByName('head');v.coach.updateMatrixWorld(true);
  const torsoQ=torso.getWorldQuaternion(new T.Quaternion()),D=Math.PI/180;
  const local=new T.Quaternion().setFromAxisAngle(V([0,1,0]),a.rot*D).multiply(new T.Quaternion().setFromAxisAngle(V([1,0,0]),a.flex*D)).multiply(new T.Quaternion().setFromAxisAngle(V([0,0,1]),-a.side*D));
  const full=torsoQ.clone().multiply(local).multiply(torsoQ.clone().invert()),partial=new T.Quaternion().slerp(full,opts.neckShare);
  const pivot=nk.getWorldPosition(new T.Vector3()),nq=nk.getWorldQuaternion(new T.Quaternion()),hp=head.getWorldPosition(new T.Vector3()),hq=head.getWorldQuaternion(new T.Quaternion());
  setWorld(nk,partial.clone().multiply(nq),pivot);setWorld(head,full.clone().multiply(hq),hp.sub(pivot).applyQuaternion(partial).add(pivot));v.coach.updateMatrixWorld(true);return result;};
 const wrappedPose=E.pose,wrappedGround=m.getGroundHandPose;
 window.__armfixContactR2={report,remove(){if(E.pose!==wrappedPose||m.getGroundHandPose!==wrappedGround||__v2p.setHandPose!==wrappedSet||__v2p.poses['palm-floor']!==pose||__v2p.poses[aliases.left]!==sidePoses.left||__v2p.poses[aliases.right]!==sidePoses.right)throw Error('v3-contact: hook conflict; discard page');E.pose=savedPose;m.getGroundHandPose=savedGround;__v2p.setHandPose=savedSet;__v2p.poses['palm-floor']=originalPalm;restoreAliases();for(const side of ['left','right'])if(__v2p.cur[side]==='palm-floor')savedSet.call(__v2p,side,'palm-floor',1);v.coach.updateMatrixWorld(true);delete window.__armfixContactR2;return {removed:true};}};
 committed=true;return report;
 }finally{for(const x of savedBones){x.b.position.copy(x.p);x.b.quaternion.copy(x.q);x.b.scale.copy(x.s);}__v2p.cur=savedCurObj;Object.assign(savedCurObj,savedCur);if(!committed){E.pose=savedPose;m.getGroundHandPose=savedGround;__v2p.setHandPose=savedSet;__v2p.poses['palm-floor']=originalPalm;restoreAliases();delete window.__armfixContactR2;}v.coach.updateMatrixWorld(true);}
};
})();
