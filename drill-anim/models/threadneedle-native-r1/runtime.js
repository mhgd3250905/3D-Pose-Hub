// Independent CPU skinning profile. Complete source topology is retained.
// All displayed positions are CPU-authored world positions, so runtime geometry
// inspection sees the same surface that the renderer draws.
(function(){
window.__installThreadneedle=function(data,rig,spec){
 const T=__toonT,v=flareInspector.viewer,E=__drill,vec=a=>new T.Vector3(...a),M=a=>new T.Matrix4().fromArray(a);
 const base={...spec,modelProfile:'training-human-v2plus'};
 E.selectModelProfile(base);__setHighlight(spec.highlight);__v2p.restHands();v.motion.reset();v.coach.updateMatrixWorld(true);
 const source=[],byName={},bones={},identity=new T.Matrix4();
 v.coach.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();for(const b of o.skeleton.bones)bones[b.name]=b;}});
 const canonical={};
 for(const[n,b]of Object.entries(bones)){
  if(data.pivots[n])canonical[n]=new T.Matrix4().makeTranslation(...data.pivots[n]);
  else if(n==='spineLower'||n==='spineUpper')canonical[n]=identity.clone();
 }
 for(const[n,b]of Object.entries(bones))if(!canonical[n]){
  const hand=n.startsWith('v2p_L_')?'leftHand':n.startsWith('v2p_R_')?'rightHand':null;
  if(!hand)throw Error('Unmapped canonical bone '+n);
  canonical[n]=canonical[hand].clone().multiply(bones[hand].matrixWorld.clone().invert()).multiply(b.matrixWorld);
 }
 const effectiveVisible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 const items=[];v.coach.traverse(o=>{if(o.isSkinnedMesh&&effectiveVisible(o)&&o.geometry.index?.count&&o.geometry.drawRange.count!==0)items.push(o);});
 for(const o of items){
  const g=o.geometry,short=o.name.replace('V2P_Base_',''),cal=data.calibration[short]||data.calibration[o.name];
  const names=o.skeleton.bones.map(b=>b.name),pre=o.matrixWorld.clone().multiply(o.bindMatrixInverse);
  if(pre.elements.some((a,i)=>Math.abs(a-identity.elements[i])>1e-6))throw Error('Unsupported non-identity skin frame '+o.name);
  const palette=names.map((n,i)=>cal?M(cal.palette[i]):canonical[n].clone().multiply(bones[n].matrixWorld.clone().invert()).multiply(pre).multiply(M(o.skeleton.boneMatrices.slice(i*16,i*16+16))).multiply(o.bindMatrix));
  if(cal&&(cal.vertices!==g.attributes.position.count||cal.bones.join('|')!==names.join('|')))throw Error('Calibration topology changed '+o.name);
  const N=g.attributes.position.count,J=new Uint16Array(N*4),W=new Float64Array(N*4),bind=new Float64Array(N*3),canonicalPoints=new Float64Array(N*3),influencePoints=new Float64Array(N*12),dq=new Uint8Array(N);
  const q=new T.Vector3();
  for(let i=0;i<N;i++){
   q.fromBufferAttribute(g.attributes.position,i);bind.set(q.toArray(),i*3);q.applyMatrix4(palette[0]);canonicalPoints.set(q.toArray(),i*3);
   for(let k=0;k<4;k++){const p=i*4+k,j=g.attributes.skinIndex.getComponent(i,k),w=g.attributes.skinWeight.getComponent(i,k);J[p]=j;W[p]=w;
    q.fromBufferAttribute(g.attributes.position,i).applyMatrix4(palette[j]);influencePoints.set(q.toArray(),p*3);
    if(short==='Hands'||(w>0&&['leftScapula','leftUpperArm','leftForearm'].includes(names[j])))dq[i]=1;
   }
  }
  const geo=g.clone();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(N*3),3));geo.setAttribute('normal',new T.BufferAttribute(new Float32Array(N*3),3));
  const mesh=new T.Mesh(geo,o.material);mesh.name='Threadneedle_'+o.name;mesh.frustumCulled=false;v.scene.add(mesh);o.visible=false;
  const r={name:short,originalName:o.name,names,J,W,bind,canonicalPoints,influencePoints,dq,palette:palette.map(p=>p.elements.slice()),mesh,points:new Float64Array(N*3)};
  source.push(r);byName[short]=r;
 }
 function frame(f,n){const F=vec(f).normalize(),N=vec(n).addScaledVector(F,-vec(n).dot(F)).normalize(),X=F.clone().cross(N);return new T.Matrix4().makeBasis(X,F,N);}
 const tip=rig.fingers.middle.joints.at(-1),ref={};
 for(const side of ['left','right'])ref[side]=frame([side==='left'?tip[0]:-tip[0],tip[1],tip[2]],rig.palmar).invert();
 const mul=(a,b)=>[a[3]*b[0]+b[3]*a[0]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]+b[3]*a[1]+a[2]*b[0]-a[0]*b[2],a[3]*b[2]+b[3]*a[2]+a[0]*b[1]-a[1]*b[0],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
 function draw(time){
  const ix=Math.max(0,Math.min(240,Math.round(time*30))),row=data.track[ix],D={},Q={},dual={};
  for(const[n,b]of Object.entries(row.bones)){D[n]=new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion(...b.q)).setPosition(...b.t);Q[n]=b.q;dual[n]=mul([...b.t,0],b.q).map(x=>x*.5);}
  for(const side of ['left','right']){
   const finger=side==='left'?row.leftFinger:[1,0,0];
   const R=frame(finger,side==='left'?[0,1,0]:[0,-1,0]).multiply(ref[side]);
   R.premultiply(new T.Matrix4().makeRotationAxis(vec(finger).normalize(),(side==='left'?data.leftPalmRollDegrees:data.rightPalmRollDegrees)*Math.PI/180));
   const q=new T.Quaternion().setFromRotationMatrix(R),pivot=vec(data.pivots[side+'Hand']),tr=vec(row.joints[side+'Wrist']).sub(pivot.applyMatrix4(R));
   D[side+'Hand']=R.setPosition(tr);Q[side+'Hand']=q.toArray();dual[side+'Hand']=mul([...tr.toArray(),0],q.toArray()).map(x=>x*.5);
  }
  for(const n of Object.keys(bones))if(n.startsWith('v2p_')){const h=n.startsWith('v2p_L_')?'leftHand':'rightHand';D[n]=D[h];Q[n]=Q[h];dual[n]=dual[h];}
  const p=new T.Vector3(),rquat=new T.Quaternion();
  for(const s of source){
   const transforms=s.names.map(n=>D[n]||identity),qs=s.names.map(n=>Q[n]||[0,0,0,1]),ds=s.names.map(n=>dual[n]||[0,0,0,0]);
   for(let i=0;i<s.points.length/3;i++){
    if(s.dq[i]){
     let best=0;for(let k=1;k<4;k++)if(s.W[i*4+k]>s.W[i*4+best])best=k;
     const refq=qs[s.J[i*4+best]],rr=[0,0,0,0],dd=[0,0,0,0];
     for(let k=0;k<4;k++){const pos=i*4+k,j=s.J[pos],qq=qs[j],w=s.W[pos]*(qq.reduce((a,x,z)=>a+x*refq[z],0)<0?-1:1);for(let z=0;z<4;z++){rr[z]+=w*qq[z];dd[z]+=w*ds[j][z];}}
     const norm=Math.hypot(...rr);for(let z=0;z<4;z++){rr[z]/=norm;dd[z]/=norm;}const dot=rr.reduce((a,x,z)=>a+x*dd[z],0);for(let z=0;z<4;z++)dd[z]-=dot*rr[z];
     const tr=mul(dd,[-rr[0],-rr[1],-rr[2],rr[3]]);p.fromArray(s.canonicalPoints,i*3).applyQuaternion(rquat.fromArray(rr));for(let z=0;z<3;z++)s.points[i*3+z]=p.getComponent(z)+2*tr[z];
    }else{
     let x=0,y=0,z=0;for(let k=0;k<4;k++){const pos=i*4+k,w=s.W[pos];if(!w)continue;p.fromArray(s.influencePoints,pos*3).applyMatrix4(transforms[s.J[pos]]);x+=w*p.x;y+=w*p.y;z+=w*p.z;}s.points.set([x,y,z],i*3);
    }
   }
  }
  const torso=byName.Torso,tee=byName.Mesh005,n=torso.points.length/3,get=i=>i<n?torso.points.subarray(i*3,i*3+3):tee.points.subarray((i-n)*3,(i-n)*3+3);
  // The original pieces duplicate boundary vertices for their separate normal
  // buffers. Their documented aliases share a source position, not two faces.
  let seamError=0;for(const[a,b]of data.weld){const x=get(a),y=get(b);seamError=Math.max(seamError,Math.hypot(...x.map((v,k)=>v-y[k])));}
  if(seamError>1e-6)throw Error('Source seam mismatch '+seamError+'m');
  for(const f of data.fair){const avg=[0,0,0];for(const j of f.neighbors){const a=get(j);for(let k=0;k<3;k++)avg[k]+=a[k]/f.neighbors.length;}const a=get(f.vertex);for(let k=0;k<3;k++)a[k]=(1-row.fairAmount)*a[k]+row.fairAmount*avg[k];}
  for(const[a,b]of data.weld)get(a).set(get(b));
  for(const s of source){s.mesh.geometry.attributes.position.array.set(s.points);s.mesh.geometry.attributes.position.needsUpdate=true;s.mesh.geometry.computeVertexNormals();}
  E._jo=row.joints;__toonUni.uBreath.value=0;__toonUni.uPulse.value=.55;
  // Cloth sink is a display-only displacement in the frozen material. Disable
  // it here because this profile supplies the complete visible surface itself.
  if(__toonUni.uSinkK)__toonUni.uSinkK.value=0;
  return row;
 }
 window.__threadneedle={source,draw,data,exportCalibration:()=>source.map(s=>({name:s.name,originalName:s.originalName,bones:s.names,joints:Array.from(s.J),weights:Array.from(s.W),bindPositions:Array.from(s.bind),palette:s.palette,faces:Array.from(s.mesh.geometry.index.array)}))};
 const original=E.applyAt.bind(E);E.applyAt=function(s,t,w){if(s.modelProfile!==spec.modelProfile)return original(s,t,w);const row=draw(t);return {params:{q:row.q},x:[],warn:[],locked:{left:false,right:true},touch:{}};};
 draw(0);return source.map(s=>({name:s.originalName,vertices:s.points.length/3,triangles:s.mesh.geometry.index.count/3}));
};
})();
