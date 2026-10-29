// Opt-in, render-transaction correction for the two existing native wrist pieces.
(function(){
 const T=window.__toonT,V=window.__v2p,v=window.flareInspector?.viewer,opts=window.__wristCorrectiveOptions;
 if(window.__wristCorrective)throw Error('wrist corrective: fresh page required');
 if(!T||!V?.hands?.mesh||!V?.limbs?.mesh||!opts||!window.__armfixR2Init)throw Error('wrist corrective: expected fixed armfix-r2 native pieces');
 const kernel=window.__createWristCorrectiveKernel(T),smooth=kernel.smooth;
 const pieces=['hands','limbs'].map(name=>{const mesh=V[name].mesh,g=mesh.geometry;return {name,mesh,g,P:g.attributes.position,N:g.attributes.normal,SI:g.attributes.skinIndex,SW:g.attributes.skinWeight,sourceP:g.attributes.position.array.slice(),sourceN:g.attributes.normal.array.slice(),records:[],byIndex:new Map(),needed:new Set(),faces:[],world:new Map(),normals:new Map()};});
 const byName=Object.fromEntries(pieces.map(p=>[p.name,p]));
 const bones=new Set();v.coach.traverse(o=>{if(o.isBone)bones.add(o);});for(const p of pieces)for(const b of p.mesh.skeleton.bones)bones.add(b);
 const savedBones=[...bones].map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
 const savedPose=v.motion.capturePose();
 const frames={};const skin=new T.Matrix4(),boneMatrix=new T.Matrix4(),local=new T.Matrix4(),world=new T.Matrix4();
 const temp=new T.Vector3(),normalMat=new T.Matrix3();
 function matrix(p,i){
  const e=skin.elements.fill(0),bm=p.mesh.skeleton.boneMatrices;
  for(let k=0;k<4;k++){const w=p.SW.getComponent(i,k);if(!w)continue;boneMatrix.fromArray(bm,p.SI.getComponent(i,k)*16);for(let j=0;j<16;j++)e[j]+=w*boneMatrix.elements[j];}
  local.copy(p.mesh.bindMatrixInverse).multiply(skin).multiply(p.mesh.bindMatrix);
  return world.copy(p.mesh.matrixWorld).multiply(local);
 }
 function sourcePoint(p,i){return new T.Vector3().fromArray(p.sourceP,i*3);}
 function restore(){for(const p of pieces){for(const r of p.records){const i=r.i*3;for(let k=0;k<3;k++){p.P.array[i+k]=p.sourceP[i+k];p.N.array[i+k]=p.sourceN[i+k];}}p.P.needsUpdate=true;p.N.needsUpdate=true;}}
 try{
  v.motion.reset();for(const b of bones)if(/^v2p_[LR]_/.test(b.name))b.quaternion.identity();v.coach.updateMatrixWorld(true);for(const p of pieces)p.mesh.skeleton.update();
  for(const [side,sign]of [['left',1],['right',-1]]){
   const hand=v.coach.getObjectByName(side+'Hand'),forearm=v.coach.getObjectByName(side+'Forearm');
   const hq=hand.getWorldQuaternion(new T.Quaternion()),fq=forearm.getWorldQuaternion(new T.Quaternion());
   const basis=hq.clone().multiply(sign===1?new T.Quaternion():new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI));
   frames[side]={side,sign,hand,forearm,origin:hand.getWorldPosition(new T.Vector3()),basis,forearmRest:fq,seam:[],mix:[],rest:new Map(),shares:new Map()};
  }
  for(const p of pieces){
   p.restWorld=[];
   for(let i=0;i<p.P.count;i++){
    const point=sourcePoint(p,i).applyMatrix4(matrix(p,i));p.restWorld.push(point);
    const influence={left:0,right:0},hw={left:0,right:0},fw={left:0,right:0},finger={left:0,right:0};
    for(let k=0;k<4;k++){const name=p.mesh.skeleton.bones[p.SI.getComponent(i,k)].name,w=p.SW.getComponent(i,k);for(const side of ['left','right']){if(name===side+'Hand'){influence[side]+=w;hw[side]+=w;}if(name===side+'Forearm'){influence[side]+=w;fw[side]+=w;}if(name.startsWith('v2p_'+(side==='left'?'L':'R')+'_')){influence[side]+=w;finger[side]+=w;}}}
    const side=influence.left>influence.right?'left':'right';if(influence[side]<.8)continue;
    const f=frames[side],canonical=point.clone().sub(f.origin).applyQuaternion(f.basis.clone().invert());
    f.rest.set(p.name+':'+i,canonical);f.shares.set(p.name+':'+i,(hw[side]+finger[side])/influence[side]);if(hw[side]>.01&&fw[side]>.01&&hw[side]+fw[side]>=.8)f.mix.push(canonical.x);
   }
  }
  for(const pair of opts.seamPairs){const a=byName.hands.restWorld[pair[0]],b=byName.limbs.restWorld[pair[1]];if(!a||!b||a.distanceTo(b)>.0001)throw Error('wrist corrective: source seam mismatch');const side=a.distanceTo(frames.left.origin)<a.distanceTo(frames.right.origin)?'left':'right';frames[side].seam.push(a.clone().sub(frames[side].origin).applyQuaternion(frames[side].basis.clone().invert()));}
  for(const f of Object.values(frames)){
   if(f.seam.length<20||f.mix.length<100)throw Error('wrist corrective: missing native wrist band');
   const radius=f.seam.map(p=>Math.hypot(p.y,p.z)).sort((a,b)=>a-b)[Math.floor(f.seam.length/2)];
   f.low=Math.min(...f.seam.map(p=>p.x))-radius;f.high=Math.max(...f.mix)+radius*.4;f.fade=Math.min(radius*.4,(f.high-f.low)*.15);
   if(f.low>-.02||f.low<-.10||f.high<.015||f.high>.045)throw Error('wrist corrective: derived band outside expected native dimensions');
  }
  for(const p of pieces){
   for(const f of Object.values(frames))for(const [key,canonical]of f.rest){if(!key.startsWith(p.name+':'))continue;const i=Number(key.split(':')[1]);if(canonical.x<=f.low||canonical.x>=f.high)continue;const fade=smooth((canonical.x-f.low)/f.fade);const r={i,side:f.side,canonical,fade,handShare:f.shares.get(key)};p.records.push(r);p.byIndex.set(i,r);}
   const idx=p.g.index.array;for(let j=0;j<idx.length;j+=3){const face=[idx[j],idx[j+1],idx[j+2]];if(face.some(i=>p.byIndex.has(i))){p.faces.push(face);face.forEach(i=>p.needed.add(i));}}
  }
 }finally{
  v.motion.applyPose(savedPose);for(const r of savedBones){r.b.position.copy(r.p);r.b.quaternion.copy(r.q);r.b.scale.copy(r.s);}v.coach.updateMatrixWorld(true);for(const p of pieces)p.mesh.skeleton.update();
 }
 const config=Object.fromEntries(Object.values(frames).map(f=>[f.side,{lowM:f.low,highM:f.high,fadeM:f.fade,seamVertices:f.seam.length}]));
 let inAdjusted=false,pending=null,disposed=false,renderDepth=0;
 const originalBefore=v.scene.onBeforeRender,originalRender=v.renderer.render;
 const api=window.__wristCorrective=window.__handWristCorrectiveR1={active:opts.enabled!==false,version:'0.1.1-r2',config,last:null,
  sample(callback){if(typeof callback!=='function')throw Error('wrist corrective: sample expects callback');if(inAdjusted)return callback();if(pending)throw Error('wrist corrective: pending sample');let value,error,called=false;pending=()=>{called=true;try{value=callback();}catch(e){error=e;}};try{v.renderer.render(v.scene,v.camera);}finally{pending=null;}if(error)throw error;if(!called)throw Error('wrist corrective: sample render did not reach scene hook');return value;},
  setEnabled(value){if(inAdjusted)throw Error('wrist corrective: cannot toggle during render');api.active=!!value;},
  restore,
  dispose(){if(inAdjusted||renderDepth)throw Error('wrist corrective: cannot dispose during render');if(v.scene.onBeforeRender!==before||v.renderer.render!==render)throw Error('wrist corrective: hooks replaced; discard page');restore();v.scene.onBeforeRender=originalBefore;v.renderer.render=originalRender;api.active=false;disposed=true;}
 };
 function update(){
  restore();v.coach.updateMatrixWorld(true);for(const p of pieces)p.mesh.skeleton.update();
  let maximum=0,minDet=Infinity,changed=0;const states={};
  for(const f of Object.values(frames)){
   const fq=f.forearm.getWorldQuaternion(new T.Quaternion()),base=fq.multiply(f.forearmRest.clone().invert()).multiply(f.basis),origin=f.hand.getWorldPosition(new T.Vector3());
   const handBasis=f.hand.getWorldQuaternion(new T.Quaternion()).multiply(f.sign===1?new T.Quaternion():new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI));
   const delta=base.clone().invert().multiply(handBasis).normalize();if(delta.w<0){delta.x*=-1;delta.y*=-1;delta.z*=-1;delta.w*=-1;}const angle=2*Math.acos(Math.min(1,Math.abs(delta.w)));
   states[f.side]={base,origin,delta,angle};
  }
  for(const p of pieces){
   p.world.clear();p.normals.clear();
   for(const i of p.needed)p.world.set(i,sourcePoint(p,i).applyMatrix4(matrix(p,i)));
   for(const r of p.records){const f=frames[r.side],s=states[r.side];if(!api.active||s.angle<1e-7)continue;
    const baseline=p.world.get(r.i);
    // Add only the wrist correction delta. The existing finger-pose residual
    // remains intact, including partially thumb-weighted proximal vertices.
    const wristOnly=r.canonical.clone().lerp(r.canonical.clone().applyQuaternion(s.delta),r.handShare).applyQuaternion(s.base).add(s.origin);
    const target=kernel.target(r.canonical,s.delta,f.low,f.high).applyQuaternion(s.base).add(s.origin).sub(wristOnly).multiplyScalar(r.fade).add(baseline);
    maximum=Math.max(maximum,target.distanceTo(baseline));const A=matrix(p,r.i).clone(),det=Math.abs(A.determinant());minDet=Math.min(minDet,det);if(det<1e-12)throw Error('wrist corrective: singular current LBS transform');
    const localTarget=target.clone().applyMatrix4(A.invert());p.P.setXYZ(r.i,localTarget.x,localTarget.y,localTarget.z);p.world.set(r.i,target);changed++;
   }
   if(api.active){for(const face of p.faces){const [a,b,c]=face.map(i=>p.world.get(i)),n=b.clone().sub(a).cross(c.clone().sub(a));for(const i of face)if(p.byIndex.has(i)){if(!p.normals.has(i))p.normals.set(i,new T.Vector3());p.normals.get(i).add(n);}}}
  }
  // The exact same target and combined face-area normal are used at duplicate seams.
  if(api.active)for(const [hi,li]of opts.seamPairs){const hp=byName.hands,lp=byName.limbs;if(!hp.byIndex.has(hi)||!lp.byIndex.has(li))throw Error('wrist corrective: seam outside shared band');const target=hp.world.get(hi).clone().add(lp.world.get(li)).multiplyScalar(.5),sum=hp.normals.get(hi).clone().add(lp.normals.get(li));for(const [p,i]of [[hp,hi],[lp,li]]){const r=p.byIndex.get(i);if(states[r.side].angle<1e-7)continue;p.world.set(i,target.clone());p.normals.set(i,sum.clone());const q=target.clone().applyMatrix4(matrix(p,i).clone().invert());p.P.setXYZ(i,q.x,q.y,q.z);}}
  for(const p of pieces){for(const r of p.records){if(!api.active||states[r.side].angle<1e-7)continue;
    matrix(p,r.i);const linear=new T.Matrix3().setFromMatrix4(local),toWorld=new T.Matrix3().getNormalMatrix(p.mesh.matrixWorld).multiply(linear);
    const oldN=new T.Vector3().fromArray(p.sourceN,r.i*3).applyMatrix3(toWorld).normalize(),newN=p.normals.get(r.i);if(!newN||newN.lengthSq()<1e-24)throw Error('wrist corrective: missing deformed normal');
    const n=oldN.lerp(newN.clone().normalize(),r.fade).normalize().applyMatrix3(toWorld.clone().invert()).normalize();p.N.setXYZ(r.i,n.x,n.y,n.z);
   }p.P.needsUpdate=true;p.N.needsUpdate=true;}
  api.last=api.lastDiagnostics={active:api.active,maxDisplacementMm:maximum*1000,changedVertices:changed,minSkinDeterminant:Number.isFinite(minDet)?minDet:null,sides:Object.fromEntries(Object.entries(states).map(([s,x])=>[s,{angleDegrees:x.angle*180/Math.PI,delta:x.delta.toArray()}])),sourceRestoredAfterRender:true};
 }
 function before(...args){originalBefore?.apply(this,args);if(disposed)return;update();inAdjusted=true;try{if(pending)pending();}catch(e){inAdjusted=false;throw e;}}
 function render(...args){if(disposed)return originalRender.apply(this,args);renderDepth++;try{return originalRender.apply(this,args);}finally{renderDepth--;if(renderDepth===0){restore();inAdjusted=false;}}}
 v.scene.onBeforeRender=before;v.renderer.render=render;
})();
