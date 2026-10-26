// native-open-r2 page runtime (opt-in; injected only by models/native-open-r2/loader.mjs).
// Wraps the live engine at runtime the same way page/human-v2plus.js does; no frozen source is edited.
//  1. palm-floor: frozen getGroundHandPose() orients a floor hand by the palm frame measured on the legacy Snow
//     hand and sets wrist height from the hidden legacy hand points. The visible native r3 hand has a different
//     palm plane and size, so the palm body hovered / heel and thumb sank. Here the native hand's own palmar
//     contact plane is measured once on the visible rest mesh (palm-floor finger pose), and floor hands are placed
//     on THAT plane: same finger heading semantics, wrist height from the visible native vertices.
//  2. neck: optional spec.neck = {flex, side, rot} (degrees; number = constant, string = timeline track name,
//     {track, scale, offset}). flex>0 chin toward chest, side>0 ear toward the body's left (+X rest), rot>0 face
//     turns toward the body's left. Applied at the neck (C7) pivot with the head bone following rigidly (see SPLIT).
//     Absent field = no bone is touched.
(function(){
window.__installNativeOpenR2=function(spec,opts){
 const T=__toonT,v=flareInspector.viewer,m=v.motion,E=__drill,V=a=>new T.Vector3(...a);
 const report={entry:'native-open-r2',palmFloor:null,neck:!!spec.neck};
 // ---------- 1. native palm contact frame ----------
 E.selectModelProfile(spec);
 __v2p.setHandPose('left','palm-floor',1);__v2p.setHandPose('right','palm-floor',1);
 m.reset();v.coach.updateMatrixWorld(true);
 const hands=[];v.coach.traverse(o=>{if(o.isSkinnedMesh&&o.name==='V2P_Base_Hands')hands.push(o);});
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
 window.__nativeOpenR2Debug={pts,tags};
 // legacy frame (coach-motion getGroundHandPose) = search start and heading convention
 const frame=(f,n)=>{const y=f.clone().normalize(),z=n.clone().addScaledVector(y,-n.dot(y)).normalize(),x=new T.Vector3().crossVectors(y,z).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
 const sideAxes=s=>{const sg=s==='left'?1:-1,L0=V([sg*0.98253144,0.05483374,0.17783482]).normalize(),N0=V([sg*0.06068526,-0.99777448,-0.02762938]);
  N0.addScaledVector(L0,-N0.dot(L0)).normalize();return {L0,N0,X0:new T.Vector3().crossVectors(L0,N0).normalize()};};
 const cand=(ax,a,b)=>ax.N0.clone().applyAxisAngle(ax.L0,a*Math.PI/180).applyAxisAngle(ax.X0,b*Math.PI/180).normalize();
 const q20=(arr,k)=>{const c=arr.slice().sort((x,y)=>x-y);return c[Math.min(c.length-1,Math.floor(c.length*k))];};
 // (a) palmar contact plane of the palm itself (hand-bone vertices beyond the wrist crease): heel and MCP pads on the
 //     plane, thenar/hypothenar heel balanced. Fingers/thumb are excluded here and posed onto the plane in (b).
 const PF={};
 for(const s of ['left','right']){
  const ax=sideAxes(s),P=pts[s],G=tags[s],hb=s+'Hand',idx=[];
  for(let i=0;i<P.length;i++)if((G[i]===hb&&P[i].dot(ax.L0)>0)||(G[i]===s+'Forearm'&&P[i].dot(ax.L0)>-0.005))idx.push(i);
  const plane=(N)=>{let mx=-1e9;for(const i of idx){const k=P[i].dot(N);if(k>mx)mx=k;}return mx;};
  const score=N=>{const mx=plane(N),heelA=[],heelB=[],mcp=[];
   for(const i of idx){if(G[i]!==hb)continue;const d=P[i],al=d.dot(ax.L0),dep=d.dot(N);if(dep<=0)continue;const c=mx-dep;
    if(al>0.005&&al<0.035)(d.dot(ax.X0)>0?heelA:heelB).push(c);else if(al>0.06)mcp.push(c);}
   if(!heelA.length||!heelB.length||!mcp.length)return 1e9;
   const lo=(arr,n)=>{const c=arr.sort((x,y)=>x-y).slice(0,n);return c.reduce((u,w)=>u+w,0)/c.length;};
   return lo(heelA,15)+lo(heelB,15)+2*lo(mcp,30)+Math.abs(lo(heelA,10)-lo(heelB,10));};
  let best={a:0,b:0,sc:score(ax.N0)};
  for(const[step,R]of [[3,45],[1,4],[0.25,1.5]]){const c0={...best};
   for(let a=c0.a-R;a<=c0.a+R+1e-9;a+=step)for(let b=c0.b-R;b<=c0.b+R+1e-9;b+=step){const sc=score(cand(ax,a,b));if(sc<best.sc-1e-9)best={a,b,sc};}}
  PF[s]={ax,N:cand(ax,best.a,best.b),rollDeg:best.a,pitchDeg:best.b};
 }
 // (b) native palm-floor finger pose: extend each finger (and lift the thumb) about its own flex axis so the finger pads
 //     lie on the palm plane without crossing it. Solved on the LEFT hand (rig frame); setHandPose mirrors it to the right.
 const rig=opts.rig,FN=['thumb','index','middle','ring','pinky'];
 const Nl=PF.left.N.clone().applyQuaternion(bindQ.left.clone().invert());   // plane normal in left hand-bone local frame
 const Ll=pts.left.map(d=>d.clone().applyQuaternion(bindQ.left.clone().invert())),GL=tags.left;
 const palmMax=(()=>{let mx=-1e9;for(let i=0;i<Ll.length;i++)if(GL[i]==='leftHand'&&pts.left[i].dot(PF.left.ax.L0)>0){const k=Ll[i].dot(Nl);if(k>mx)mx=k;}return mx;})();
 const pose={},fingerReport={};
 for(const f of FN){
  const F=rig.fingers[f],J=F.joints.map(V),axis=V(F.flexAxis).normalize(),vs=[];
  for(let i=0;i<Ll.length;i++){const m=/^v2p_L_([a-z]+)([123])$/.exec(GL[i]);if(m&&m[1]===f)vs.push([Ll[i],+m[2]]);}
  const posed=(p,k,e)=>{const q=p.clone();for(let j=k;j>=1;j--){q.sub(J[j-1]).applyAxisAngle(axis,e[j-1]*Math.PI/180).add(J[j-1]);}return q;};
  const cost=e=>{const c=vs.map(([p,k])=>(palmMax-posed(p,k,e).dot(Nl))*1000);const mn=Math.min(...c);
   const pen=Math.max(0,0.3-mn)*100,pad=q20(c,0.15);return pen+(f==='thumb'?0.2:1)*pad+0.02*(Math.abs(e[0])+Math.abs(e[1])+Math.abs(e[2]));};
  let best={e:[0,0,0],c:cost([0,0,0])};
  for(const[step,R]of [[4,[[-48,16],[-32,12],[-24,12]]],[1,null]]){const c0=best.e.slice();
   const rng=R||[[c0[0]-4,c0[0]+4],[c0[1]-4,c0[1]+4],[c0[2]-4,c0[2]+4]];
   for(let a=rng[0][0];a<=rng[0][1];a+=step)for(let b=rng[1][0];b<=rng[1][1];b+=step)for(let c=rng[2][0];c<=rng[2][1];c+=step){const k=cost([a,b,c]);if(k<best.c)best={e:[a,b,c],c:k};}}
  best.e.forEach((deg,j)=>{const q=new T.Quaternion().setFromAxisAngle(axis,deg*Math.PI/180);pose[f+(j+1)]=[q.x,q.y,q.z,q.w];});
  const c=vs.map(([p,k])=>(palmMax-posed(p,k,best.e).dot(Nl))*1000);
  fingerReport[f]={deg:best.e,minClearMm:+Math.min(...c).toFixed(1),padP15Mm:+q20(c,0.15).toFixed(1)};
 }
 __v2p.poses['palm-floor']=pose;
 // (c) support points with the native palm-floor pose applied (bind frame), used for the wrist height
 __v2p.setHandPose('left','palm-floor',1);__v2p.setHandPose('right','palm-floor',1);v.coach.updateMatrixWorld(true);H.skeleton.update();
 const A={left:[],right:[]};
 for(let i=0;i<H.geometry.attributes.position.count;i++){H.getVertexPosition(i,pv);pv.applyMatrix4(H.matrixWorld);
  const s=pv.distanceTo(hw.left)<pv.distanceTo(hw.right)?'left':'right';const d=pv.clone().applyMatrix4(invW[s]).applyQuaternion(bindQ[s]);
  if(d.dot(PF[s].ax.L0)>-0.005)A[s].push(d);}
 report.palmFloor={pose:fingerReport};
 for(const s of ['left','right']){const P=PF[s];P.A=A[s];P.L=P.ax.L0.clone().addScaledVector(P.N,-P.ax.L0.dot(P.N)).normalize();
  let mx=-1e9;for(const d of A[s])mx=Math.max(mx,d.dot(P.N));const palm=[];
  for(let i=0;i<pts[s].length;i++){const d=pts[s][i],al=d.dot(P.ax.L0);if(tags[s][i]===s+'Hand'&&al>0.015&&al<0.075&&d.dot(P.N)>0)palm.push((mx-d.dot(P.N))*1000);}
  report.palmFloor[s]={rollDeg:P.rollDeg,pitchDeg:P.pitchDeg,restPalmBodyP20Mm:+q20(palm,0.2).toFixed(1),restPalmBodyP50Mm:+q20(palm,0.5).toFixed(1)};}
 __v2p.restHands();m.reset();v.coach.updateMatrixWorld(true);
 const FLOOR=0,UP=V([0,1,0]),g0=m.getGroundHandPose.bind(m);
 m.getGroundHandPose=function(side,fingerDirection,position){
  const P=PF[side];if(!P)return g0(side,fingerDirection,position);
  const f=V(fingerDirection);f.y=0;if(f.lengthSq()<1e-8)throw Error('native-open-r2: finger direction needs a horizontal component');f.normalize();
  const q=frame(f,UP.clone().negate()).multiply(frame(P.L,P.N).invert());
  let low=Infinity;for(const d of P.A){const y=d.clone().applyQuaternion(q).y;if(y<low)low=y;}
  const sg=side==='left'?1:-1,w=position?V(position):V([sg*0.215,0,0]);w.y=FLOOR+(opts?.palmClear??0)-low;
  return {wrist:w.toArray(),handQuaternion:q.toArray(),fingerDirection:f.toArray()};
 };
 // ---------- 2. neck channels ----------
 if(spec.neck){
  const restQ={},restP={},names=['neck','head'];
  for(const n of names){const b=v.coach.getObjectByName(n);if(!b)throw Error('native-open-r2: bone '+n+' missing');restQ[n]=b.getWorldQuaternion(new T.Quaternion());restP[n]=b.getWorldPosition(new T.Vector3());}
  // share of each channel taken at the neck (C7) pivot; the head (C1) pivot takes the rest relative to the neck.
  // The v2 head mesh carries a rigid neck stub skinned 100% to the head bone, so any head-vs-neck angle opens a
  // visible seam on the neck; the whole channel therefore pivots at C7 and the collar skin weights bend the neck.
  const SPLIT={flex:[1,0],side:[1,0],rot:[1,0]};
  const val=(c,params)=>{if(c==null)return 0;if(typeof c==='number')return c;if(typeof c==='string')return +(params[c]??0);return (+(params[c.track]??0))*(c.scale??1)+(c.offset??0);};
  const rotQ=(flex,side,rot)=>{const D=Math.PI/180;return new T.Quaternion().setFromAxisAngle(V([0,1,0]),rot*D).multiply(new T.Quaternion().setFromAxisAngle(V([1,0,0]),flex*D)).multiply(new T.Quaternion().setFromAxisAngle(V([0,0,1]),-side*D));};
  const setWorld=(b,wq,wp)=>{const par=b.parent;par.updateMatrixWorld(true);const pq=par.getWorldQuaternion(new T.Quaternion());b.quaternion.copy(pq.invert().multiply(wq));b.position.copy(par.worldToLocal(wp.clone()));b.updateMatrixWorld(true);};
  const pose1=E.pose.bind(E);
  E.pose=function(sp,params,warm){const r=pose1(sp,params,warm);
   const a={flex:val(sp.neck?.flex,params),side:val(sp.neck?.side,params),rot:val(sp.neck?.rot,params)};r.neck=a;
   if(!a.flex&&!a.side&&!a.rot)return r;
   const nb=v.coach.getObjectByName('neck'),hb=v.coach.getObjectByName('head');v.coach.updateMatrixWorld(true);
   const nq=nb.getWorldQuaternion(new T.Quaternion()),np=nb.getWorldPosition(new T.Vector3()),hq=hb.getWorldQuaternion(new T.Quaternion()),hp=hb.getWorldPosition(new T.Vector3());
   const U=nq.clone().multiply(restQ.neck.clone().invert());          // current upper-body rotation (neck rides the chest)
   const Dn=rotQ(a.flex*SPLIT.flex[0],a.side*SPLIT.side[0],a.rot*SPLIT.rot[0]),Dh=rotQ(a.flex,a.side,a.rot);
   const Wn=U.clone().multiply(Dn).multiply(U.clone().invert());      // world-space delta at the neck pivot
   setWorld(nb,Wn.clone().multiply(nq),np);
   const hpNew=hp.clone().sub(np).applyQuaternion(Wn).add(np);
   const Wh=U.clone().multiply(Dh).multiply(U.clone().invert());
   setWorld(hb,Wh.clone().multiply(hq),hpNew);
   v.coach.updateMatrixWorld(true);v.coach.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
   return r;};
 }
 return report;
};
})();
