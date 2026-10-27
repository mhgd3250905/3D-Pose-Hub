// training-human-v3 proportion warp (shared by viewer-v3.js in the page and the v3 node loader).
// Maps a point from the v2 body to the v3 body given old/new joint positions in the SAME pose space:
// segment bones (upper arm, forearm, thigh, shank, trunk pelvis->torso) stretch linearly along their axis
// (continuous at both joints, so no stretching band at shoulder/elbow/wrist/hip/knee); end bones move rigidly.
export const SEG={UpperArm:['Shoulder','Elbow'],Forearm:['Elbow','Wrist'],Thigh:['Hip','Knee'],Shin:['Knee','Ankle']};
const RIGID={Hand:'Wrist',Foot:'Ankle',Patella:'Knee',Scapula:'Shoulder'};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
// boneName -> mapping kind; fingers (v2p_L_*/v2p_R_*) follow the hand, unknown bones follow their mapped ancestor (caller)
export function boneKind(name){
  if(name==='pelvis'||name==='torso'||name==='spineLower'||name==='spineUpper')return {trunk:true};
  const m=/^(left|right)(UpperArm|Forearm|Thigh|Shin|Hand|Foot|Patella|Scapula)$/.exec(name);
  if(m){if(SEG[m[2]])return {side:m[1],seg:SEG[m[2]]};return {side:m[1],rigid:RIGID[m[2]]};}
  const f=/^v2p_([LR])_/.exec(name);if(f)return {side:f[1]==='L'?'left':'right',rigid:'Wrist'};
  if(name==='neck'||name==='head')return {zero:true};
  return null;
}
// J/N: joint maps {pelvis,torso,leftShoulder,...} old/new in the same space
export function mapPoint(p,kind,J,N){
  if(!kind||kind.zero)return p.slice();
  if(kind.trunk){const a0=J.pelvis,a1=J.torso,ax=sub(a1,a0),L=Math.hypot(...ax),u=ax.map(x=>x/L);
    let s=Math.min(L,Math.max(0,dot(sub(p,a0),u)));const d0=sub(N.pelvis,a0),d1=sub(N.torso,a1),t=s/L;
    return [0,1,2].map(i=>p[i]+d0[i]+(d1[i]-d0[i])*t);}
  const S=kind.side;
  if(kind.rigid){const d=sub(N[S+kind.rigid],J[S+kind.rigid]);return [0,1,2].map(i=>p[i]+d[i]);}
  const j0=J[S+kind.seg[0]],j1=J[S+kind.seg[1]],ax=sub(j1,j0),L=Math.hypot(...ax),u=ax.map(x=>x/L);
  const s=Math.min(L,Math.max(0,dot(sub(p,j0),u))),d0=sub(N[S+kind.seg[0]],j0),d1=sub(N[S+kind.seg[1]],j1),t=s/L;
  return [0,1,2].map(i=>p[i]+d0[i]+(d1[i]-d0[i])*t);
}
// joint chain in any pose: same joint directions, v3 segment lengths (rig.v3.segmentScale / torsoScale)
export function chainJoints(J,v3){
  const K=v3.segmentScale,N={...J},lerp=(a,b,k)=>[0,1,2].map(i=>a[i]+(b[i]-a[i])*k);
  N.pelvis=lerp(J.torso,J.pelvis,v3.torsoScale);const dp=sub(N.pelvis,J.pelvis);
  for(const s of['left','right']){
    N[s+'Elbow']=lerp(J[s+'Shoulder'],J[s+'Elbow'],K.upperArm);
    N[s+'Wrist']=[0,1,2].map(i=>N[s+'Elbow'][i]+(J[s+'Wrist'][i]-J[s+'Elbow'][i])*K.forearm);
    N[s+'Hip']=[0,1,2].map(i=>J[s+'Hip'][i]+dp[i]);
    N[s+'Knee']=[0,1,2].map(i=>N[s+'Hip'][i]+(J[s+'Knee'][i]-J[s+'Hip'][i])*K.thigh);
    N[s+'Ankle']=[0,1,2].map(i=>N[s+'Knee'][i]+(J[s+'Ankle'][i]-J[s+'Knee'][i])*K.shin);}
  return N;
}
// blend over skin influences: p' = sum_w w * map_b(p)
export function warpVertex(p,infl,kindOf,J,N){const o=[0,0,0];let ws=0;
  for(const [b,w] of infl){if(w<=0)continue;const q=mapPoint(p,kindOf(b),J,N);o[0]+=w*q[0];o[1]+=w*q[1];o[2]+=w*q[2];ws+=w;}
  return ws>0?o.map(x=>x/ws):p.slice();}
// page side: warp the loaded glb (bind pose == rig rest) before the coach motion is created
export function warpModelV3(THREE,model,oldRig,newRig){
  model.updateMatrixWorld(true);const inv=model.matrixWorld.clone().invert();
  const J=oldRig.landmarks,N=newRig.landmarks,bones=new Map();model.traverse(o=>{if(o.isBone)bones.set(o.name,o);});
  const kindCache=new Map(),kindOf=name=>{if(kindCache.has(name))return kindCache.get(name);let b=bones.get(name),k=boneKind(name);
    while(!k&&b&&b.parent){b=b.parent;if(b.isBone)k=boneKind(b.name);}kindCache.set(name,k);return k;};
  const v=new THREE.Vector3();let nv=0;
  // glb positions are quantized/normalized and the dequantization lives in the bind matrices, so work through the actual skinning
  // matrix of each vertex: model point q = inv * matrixWorld * Mv * p, warp q, write p' = Mv^-1 * matrixWorld^-1 * model * q' (float attr)
  const old=new Map();bones.forEach((b,n)=>old.set(n,{pos:b.getWorldPosition(new THREE.Vector3()),world:b.matrixWorld.clone()}));
  const meshes=[];model.traverse(m=>{if(m.isSkinnedMesh)meshes.push(m);});
  for(const m of meshes){const g=m.geometry,P=g.attributes.position,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight,sk=m.skeleton,names=sk.bones.map(b=>b.name);
    sk.update();const BM=sk.bones.map((b,k)=>new THREE.Matrix4().multiplyMatrices(b.matrixWorld,sk.boneInverses[k]));
    const toModel=inv.clone().multiply(m.matrixWorld),fromModel=toModel.clone().invert(),out=new Float32Array(P.count*3),M=new THREE.Matrix4(),A=new THREE.Matrix4();
    for(let i=0;i<P.count;i++){M.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const infl=[];
      for(let k=0;k<4;k++){const w=SW.getComponent(i,k);if(w<=0)continue;const bi=SI.getComponent(i,k);infl.push([names[bi],w]);const e=BM[bi].elements,me=M.elements;for(let j=0;j<16;j++)me[j]+=w*e[j];}
      A.multiplyMatrices(m.bindMatrixInverse,M).multiply(m.bindMatrix);
      v.fromBufferAttribute(P,i).applyMatrix4(A).applyMatrix4(toModel);
      const q=warpVertex([v.x,v.y,v.z],infl,kindOf,J,N);v.set(q[0],q[1],q[2]).applyMatrix4(fromModel).applyMatrix4(A.clone().invert());out.set([v.x,v.y,v.z],i*3);nv++;}
    g.setAttribute('position',new THREE.BufferAttribute(out,3));g.computeBoundingBox();g.computeBoundingSphere();}
  // bones: move each pivot by its joint delta (rotations unchanged), top-down; keep boneWorld*boneInverse unchanged at rest
  const delta=n=>{const pm=old.get(n).pos.clone().applyMatrix4(inv),q=mapPoint([pm.x,pm.y,pm.z],kindOf(n),J,N);return new THREE.Vector3(q[0],q[1],q[2]).applyMatrix4(model.matrixWorld).sub(old.get(n).pos);};
  const order=[];model.traverse(o=>{if(o.isBone)order.push(o);});
  for(const b of order){const w=old.get(b.name).pos.clone().add(delta(b.name));b.parent.updateMatrixWorld(true);b.position.copy(b.parent.worldToLocal(w));b.updateMatrixWorld(true);}
  model.updateMatrixWorld(true);
  for(const sk of new Set(meshes.map(m=>m.skeleton))){sk.bones.forEach((b,k)=>{const o=old.get(b.name);if(!o)return;sk.boneInverses[k]=new THREE.Matrix4().copy(b.matrixWorld).invert().multiply(o.world).multiply(sk.boneInverses[k]);});}
  return {vertices:nv,bones:order.length};
}
