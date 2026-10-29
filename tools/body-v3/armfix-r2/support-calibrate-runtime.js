// Offline-only adaptation of contact-runtime.js. This never installs a live fitter.
(function(){
window.__calibrateFixedSupport=function(opts){
 const T=window.__toonT,v=flareInspector.viewer,V2P=window.__v2p,V=a=>new T.Vector3(...a),__v2p=V2P;
 if(!opts?.rig||opts.handScale!==1||!opts.sourceId||!V2P?.hands?.on||!V2P.hands.mesh?.visible)throw Error('support: fresh scale-1 native hands required');
 if(window.__armfixContactR2||window.__v3ContactR5||window.__fixedSupport)throw Error('support: calibration requires unmodified hand setter');
 function fingerprint(H){let h=2166136261;for(const [a,k]of [[H.geometry.attributes.position,1e7],[H.geometry.attributes.skinIndex,1],[H.geometry.attributes.skinWeight,1e7],[H.geometry.index,1]]){if(!a)throw Error('support: missing indexed skin attribute');for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++){h^=Math.round(a.getComponent(i,j)*k);h=Math.imul(h,16777619);}}return (h>>>0).toString(16).padStart(8,'0');}
 const before=V2P.hands.mesh.skeleton.bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()})),cur=V2P.cur,curValue={...cur};
 const alias='__offline_fixed_support',prior=V2P.poses[alias],had=Object.hasOwn(V2P.poses,alias);
 try{
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
 
 // The engine handQuaternion is a delta before restRotation (coach-motion
 // poseBone). Rotate local rig axes into the same bind-rest frame as pts.
 // Finger fitting below deliberately converts N and pts BACK to hand-local;
 // its J pivots (invW) and flexAxis must remain hand-local too.
 const frame=(f,n)=>{const y=f.clone().normalize(),z=n.clone().addScaledVector(y,-n.dot(y)).normalize(),x=new T.Vector3().crossVectors(y,z).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
 const sideAxes=s=>{const sign=s==='left'?1:-1,rig=opts.rig;
  const tips=['index','middle','ring','pinky'].map(f=>V(rig.fingers[f].joints[3]));
  const L0=tips.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/tips.length);L0.x*=sign;L0.applyQuaternion(bindQ[s]).normalize();
  const N0=V(rig.palmar);N0.x*=sign;N0.applyQuaternion(bindQ[s]).addScaledVector(L0,-N0.dot(L0)).normalize();
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
   // Both hands share the corrected mirrored source. Apply the same pinky
   // distal-pad objective on both sides; no old side-specific mesh compensation.
   const pinkyPad=f==='pinky';
   const scoreClearances=(c,e)=>{const mn=Math.min(...c),pen=Math.max(0,0.3-mn)*100,pad=q20(c,0.15),bend=0.02*(Math.abs(e[0])+Math.abs(e[1])+Math.abs(e[2]));
    if(!pinkyPad)return pen+(f==='thumb'?0.2:1)*pad+bend;
    const tip=c.filter((_,i)=>vs[i][1]===3).sort((a,b)=>a-b);if(!tip.length)throw Error('v3-contact: missing pinky distal vertices');
    const tipP10=tip[Math.floor((tip.length-1)*0.1)];return pen+pad+4*Math.max(0,tipP10-0.5)+bend;};
   const cost=e=>scoreClearances(vs.map(([p,k])=>(palmMax-posed(p,k,e).dot(N))*1000),e);
   let best={e:[0,0,0],c:cost([0,0,0])};
   for(const[step,R]of [[4,[[-48,16],[-32,pinkyPad?28:12],[-24,12]]],[1,null]]){const c0=best.e.slice(),rng=R||[[c0[0]-4,c0[0]+4],[c0[1]-4,c0[1]+4],[c0[2]-4,c0[2]+4]];
    for(let x=rng[0][0];x<=rng[0][1];x+=step)for(let y=rng[1][0];y<=rng[1][1];y+=step)for(let z=rng[2][0];z<=rng[2][1];z+=step){const k=cost([x,y,z]);if(k<best.c)best={e:[x,y,z],c:k};}}
   best.e.forEach((deg,j)=>{const q=new T.Quaternion().setFromAxisAngle(axis,deg*Math.PI/180);sidePoses[s][f+(j+1)]=s==='right'?[q.x,-q.y,-q.z,q.w]:[q.x,q.y,q.z,q.w];});
   const c=vs.map(([p,k])=>(palmMax-posed(p,k,best.e).dot(N))*1000);
   const distal=c.filter((_,i)=>vs[i][1]===3).sort((a,b)=>a-b);
   fingerReport[s][f]={deg:best.e,minClearMm:+Math.min(...c).toFixed(1),padP15Mm:+q20(c,0.15).toFixed(1),distalP10ModelMm:distal.length?+distal[Math.floor((distal.length-1)*0.1)].toFixed(1):null};
  }
 }

 // The fitter above proposes only quaternions. Measure the resulting actual
 // weighted skinned surface here; dominant-bone approximations are not QA.
 const groups={left:{all:[],palm:[],heelThumb:[],heelPinky:[],distal:{}},right:{all:[],palm:[],heelThumb:[],heelPinky:[],distal:{}}};
 for(const side of ['left','right']){V2P.poses[alias]=sidePoses[side];V2P.setHandPose(side,alias,1);}
 v.coach.updateMatrixWorld(true);H.skeleton.update();
 // Offline refinement uses actual weighted LBS. The first pass above is only
 // an economical proposal; its dominant-bone estimates are not the final fit.
 const refinement={left:{},right:{}};
 for(const side of ['left','right']){
  const P=PF[side],toLocal=invW[side].clone().multiply(H.matrixWorld),Nlocal=P.N.clone().applyQuaternion(bindQ[side].clone().invert()),prefix='v2p_'+(side==='left'?'L':'R')+'_';
  const relevant=[],dominant={};let plane=-Infinity;
  for(let i=0;i<H.geometry.attributes.position.count;i++){
   H.getVertexPosition(i,pv).applyMatrix4(toLocal);const bind=pv.clone().applyQuaternion(bindQ[side]);
   let best=-1,tag='';for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>best){best=w;tag=names[si.getComponent(i,k)];}}
   if(tag!==side+'Hand'&&tag!==side+'Forearm'&&!tag.startsWith(prefix))continue;
   if(bind.dot(P.ax.L0)<=-.005)continue;
   relevant.push(i);dominant[i]=tag;plane=Math.max(plane,pv.dot(Nlocal));
  }
  if(!Number.isFinite(plane))throw Error('support: missing weighted refinement plane');
  for(const finger of FN){
   const root=prefix+finger,affected=relevant.filter(i=>{for(let k=0;k<4;k++)if(sw.getComponent(i,k)>0&&names[si.getComponent(i,k)].startsWith(root))return true;return false;}),distal=new Set(affected.filter(i=>dominant[i]===root+'3'));
   if(!affected.length||!distal.size)throw Error('support: empty weighted finger selection '+root);
   const a=rig.fingers[finger].flexAxis,axis=V(side==='right'?[a[0],-a[1],-a[2]]:a).normalize(),bones=[1,2,3].map(j=>v.coach.getObjectByName(root+j)),initial=fingerReport[side][finger].deg.slice();
   const apply=deg=>{for(let j=0;j<3;j++)bones[j].quaternion.setFromAxisAngle(axis,deg[j]*Math.PI/180);bones[0].updateMatrixWorld(true);H.skeleton.update();};
   const evaluate=deg=>{
    apply(deg);let min=Infinity,tip=Infinity;const distalClear=[];
    for(const i of affected){H.getVertexPosition(i,pv).applyMatrix4(toLocal);const clear=(plane-pv.dot(Nlocal))*1000;min=Math.min(min,clear);if(distal.has(i)){tip=Math.min(tip,clear);distalClear.push(clear);}}
    distalClear.sort((a,b)=>a-b);const p10=distalClear[Math.floor((distalClear.length-1)*.1)],bend=deg.reduce((sum,x,j)=>sum+Math.abs(x-initial[j]),0);
    // Minimum is the contact-pad target; distal P10 discourages a single spike.
    const score=1000*Math.max(0,.15-min)**2+3*Math.abs(tip-.35)+.15*p10+.003*bend;
    return {deg:deg.slice(),score,minClearMm:min,distalMinClearMm:tip,distalP10Mm:p10};
   };
   let best=evaluate(initial);const before={...best,deg:best.deg.slice()};
   for(const step of [2,.5,.125])for(let round=0;round<2;round++){
    let improved=false;
    for(const joint of [2,1,0]){const centre=best.deg.slice();for(const k of [-4,-3,-2,-1,1,2,3,4]){const candidate=centre.slice();candidate[joint]+=k*step;if(Math.abs(candidate[joint]-initial[joint])>12+1e-9)continue;const test=evaluate(candidate);if(test.score<best.score-1e-9){best=test;improved=true;}}apply(best.deg);}
    if(!improved)break;
   }
   apply(best.deg);
   best.deg.forEach((deg,j)=>{const q=bones[j].quaternion;sidePoses[side][finger+(j+1)]=side==='right'?[q.x,-q.y,-q.z,q.w]:q.toArray();});
   refinement[side][finger]={method:'bounded actual weighted LBS',targetDistalMinMm:.35,boundDegrees:12,deltaDegrees:best.deg.map((x,j)=>x-initial[j]),before,after:best};
  }
 }
 v.coach.updateMatrixWorld(true);H.skeleton.update();
 for(let i=0;i<H.geometry.attributes.position.count;i++){
  H.getVertexPosition(i,pv);pv.applyMatrix4(H.matrixWorld);
  const side=pv.distanceTo(hw.left)<pv.distanceTo(hw.right)?'left':'right',d=pv.clone().applyMatrix4(invW[side]).applyQuaternion(bindQ[side]);
  const P=PF[side],al=d.dot(P.ax.L0),G=groups[side];
  let bi=0,bwt=-1;for(let k=0;k<4;k++){const wt=sw.getComponent(i,k);if(wt>bwt){bwt=wt;bi=si.getComponent(i,k);}}
  const tag=names[bi];if(al>-.005)G.all.push(d);
  if(tag===side+'Hand'&&al>.015&&al<.075&&d.dot(P.N)>0)G.palm.push(d);
  if(tag===side+'Hand'&&al>.005&&al<.035&&d.dot(P.N)>0){const thumb=V(rig.fingers.thumb.joints[0]);if(side==='right')thumb.x*=-1;thumb.applyQuaternion(bindQ[side]);const towardThumb=Math.sign(thumb.dot(P.ax.X0));(d.dot(P.ax.X0)*towardThumb>=0?G.heelThumb:G.heelPinky).push(d);}
  for(const finger of FN)if(tag==='v2p_'+(side==='left'?'L':'R')+'_'+finger+'3')(G.distal[finger]??=[]).push(d);
 }
 // Every persisted frame vector is in the motion engine rest-delta frame.
 const sides={};
 for(const side of ['left','right']){
  const P=PF[side],G=groups[side],L=P.ax.L0.clone().addScaledVector(P.N,-P.ax.L0.dot(P.N)).normalize();
  const offset=Math.max(...G.all.map(d=>d.dot(P.N)));
  const measure=points=>{if(!points?.length)throw Error('support: empty contact group '+side);const clear=points.map(d=>(offset-d.dot(P.N))*1000).sort((a,b)=>a-b);return {vertices:points.length,minClearMm:clear[0],p10ClearMm:clear[Math.floor((clear.length-1)*.1)],p50ClearMm:clear[Math.floor((clear.length-1)*.5)],maxClearMm:clear.at(-1)};};
  sides[side]={pose:sidePoses[side],longitudinal:L.toArray(),palmarNormal:P.N.toArray(),wristHeightM:offset,fitDegrees:fingerReport[side],weightedRefinement:refinement[side],contact:{all:measure(G.all),palm:measure(G.palm),heelThumb:measure(G.heelThumb),heelPinky:measure(G.heelPinky),distal:Object.fromEntries(FN.map(f=>[f,measure(G.distal[f])]))}};
 }
 return {format:'pose-hub-fixed-support@1',sourceId:opts.sourceId,handScale:1,coordinateFrame:'motion-rest-delta',bindRotations:Object.fromEntries(['left','right'].map(s=>[s,bindQ[s].toArray()])),sourcePins:opts.sourcePins||[],mesh:{fingerprint:fingerprint(H),vertices:H.geometry.attributes.position.count,indices:H.geometry.index.count,bones:names},sides,
  scope:'One-time offline support calibration on the supplied actual scale-1 mesh; fixed pose and support offsets only.',
  limitations:['Clearances are CPU-skinned model measurements, not shader displacement or visible-camera acceptance.','Flat-plane support only. Wrist and arm placement remain the action authors responsibility.','Palm/heel/distal group statistics must be reviewed with preview images before acceptance.']};
 }finally{
  for(const x of before){x.b.position.copy(x.p);x.b.quaternion.copy(x.q);x.b.scale.copy(x.s);}V2P.cur=cur;Object.assign(cur,curValue);
  if(had)V2P.poses[alias]=prior;else delete V2P.poses[alias];v.coach.updateMatrixWorld(true);V2P.hands.mesh.skeleton.update();
 }
};
})();
