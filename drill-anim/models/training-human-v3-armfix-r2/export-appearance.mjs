// Read-only rest capture for source-derived corrective transport. Call on old r7 and new armfix-r2 after apply.
export async function exportAppearanceRest(page){return page.evaluate(()=>{
 const T=window.__toonT,v=flareInspector.viewer,V=window.__v2p;
 if(!T||!V?.torso?.on||!window.__collarShared||!window.__collarGarmentRefinement)throw Error('appearance capture requires active full P3 baseline');
 v.motion.reset();window.__shoulderLifecycleR1?.setAmounts([0,0]);v.coach.updateMatrixWorld(true);
 const get=(mesh)=>{mesh.skeleton.update();const g=mesh.geometry,arr=a=>Array.from(a.array),S=new T.Matrix4(),B=new T.Matrix4(),M=new T.Matrix4(),P=new T.Vector3(),N=new T.Vector3(),world=[],normal=[],a=g.attributes;
  for(let i=0;i<a.position.count;i++){S.elements.fill(0);for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(i,k);if(!w)continue;B.fromArray(mesh.skeleton.boneMatrices,16*a.skinIndex.getComponent(i,k));for(let j=0;j<16;j++)S.elements[j]+=w*B.elements[j];}
   M.copy(mesh.matrixWorld).multiply(mesh.bindMatrixInverse).multiply(S).multiply(mesh.bindMatrix);P.fromBufferAttribute(a.position,i).applyMatrix4(M);world.push(...P.toArray());
   N.fromBufferAttribute(a.normal,i).applyMatrix3(new T.Matrix3().setFromMatrix4(M)).normalize();normal.push(...N.toArray());}
  return {name:mesh.name,count:a.position.count,positions:arr(a.position),normals:arr(a.normal),joints:arr(a.skinIndex),weights:arr(a.skinWeight),index:arr(g.index),world,worldNormals:normal,bones:mesh.skeleton.bones.map((b,i)=>({name:b.name,matrix:Array.from(mesh.skeleton.boneMatrices.slice(i*16,i*16+16)),parent:b.parent?.name||'',world:b.matrixWorld.toArray(),inverse:mesh.skeleton.boneInverses[i].toArray()})),matrixWorld:mesh.matrixWorld.toArray(),bindMatrix:mesh.bindMatrix.toArray(),bindMatrixInverse:mesh.bindMatrixInverse.toArray()};};
 const garment=window.__collarGarmentRefinement;
 return {schemaVersion:1,profile:window.__armfixR2?'armfix-r2':'original-r7',units:'metres-world; mesh-local-position',body:get(window.__collarShared.mesh),torso:get(V.torso.mesh),garment:get(garment.garment),originalGarment:(()=>{const old=garment.garment.geometry;garment.garment.geometry=garment.originalGeo;try{return get(garment.garment);}finally{garment.garment.geometry=old;}})(),joints:__drill._jo,source:'actual zero-morph rest geometry and effective live skin palette; no saved shoulder correction applied'};
 });}
