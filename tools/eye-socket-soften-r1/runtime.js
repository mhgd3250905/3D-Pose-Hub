// Keep socket geometry/depth. Locally blend shading normals and cavity tone.
(() => {
 if(window.__eyeSocketSoften||window.__armfixR2?.profile!=='training-human-v3-armfix'||__armfixR2.version!=='0.1.0-r2')throw Error('Unexpected eye/model lifecycle');
 const T=__toonT,mesh=window.__collarShared?.mesh;
 if(!mesh?.isSkinnedMesh||!mesh.material[1].customProgramCacheKey().startsWith('head-neck-toon-r4-1'))throw Error('Original head missing');
 const old=mesh.geometry,geometry=old.clone(),materials=mesh.material,errors=[];
 const p=old.attributes.position,normal=old.attributes.normal,si=old.attributes.skinIndex,sw=old.attributes.skinWeight;
 const group=old.groups.find(g=>g.materialIndex===1);if(!group)throw Error('Original head group missing');
 mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
 const ids=[...new Set(Array.from(old.index.array.slice(group.start,group.start+group.count)))];
 const samples=[],changed=[],radius=.009,sigma=.0045;
 const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
 for(const id of ids){
  const point=new T.Vector3();mesh.getVertexPosition(id,point);point.applyMatrix4(mesh.matrixWorld);
  // Restrict support to both eye sockets; keep nose bridge, forehead and temples.
  if(Math.abs(point.x)>.09||point.y<1.575||point.y>1.66||point.z<.055)continue;
  const blend=new T.Matrix4();blend.elements.fill(0);
  for(let k=0;k<4;k++){const j=si.getComponent(id,k),w=sw.getComponent(id,k),m=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[j].matrixWorld,mesh.skeleton.boneInverses[j]);for(let c=0;c<16;c++)blend.elements[c]+=m.elements[c]*w;}
  const world=new T.Matrix4().multiplyMatrices(mesh.matrixWorld,mesh.bindMatrixInverse).multiply(blend).multiply(mesh.bindMatrix);
  const n=new T.Vector3().fromBufferAttribute(normal,id).applyMatrix3(new T.Matrix3().getNormalMatrix(world)).normalize();
  const d=Math.hypot((Math.abs(point.x)-.034)/.026,(point.y-1.620)/.018,(point.z-.105)/.035);
  const weight=(1-smooth(.8,1.5,d))*smooth(.010,.019,Math.abs(point.x))*(1-smooth(1.642,1.651,point.y));
  samples.push({id,point,n,world,weight});
 }
 for(const a of samples){
  if(a.weight<=0)continue;
  const links=[],n=new T.Vector3();let sum=0;
  for(const b of samples){const d=a.point.distanceToSquared(b.point);if(d>radius*radius)continue;const w=Math.exp(-d/(2*sigma*sigma));sum+=w;n.addScaledVector(b.n,w);links.push([b.id,w]);}
  if(!sum)throw Error('Empty eye neighborhood');
  n.normalize().lerp(a.n,1-a.weight).normalize().applyMatrix3(new T.Matrix3().setFromMatrix4(a.world).transpose()).normalize();
  geometry.attributes.normal.setXYZ(a.id,n.x,n.y,n.z);
  changed.push({id:a.id,weight:a.weight,links:links.map(([id,w])=>[id,w/sum])});
 }
 if(changed.length<20)throw Error('Eye region not found');
 geometry.attributes.normal.needsUpdate=true;
 // Explicitly enforce unchanged topology, positions, skinning and other attributes.
 const changedIds=new Set(changed.map(x=>x.id));
 for(const [name,a] of Object.entries(old.attributes))for(let i=0;i<a.count;i++){
  if(name==='normal'&&changedIds.has(i))continue;
  for(let c=0;c<a.itemSize;c++)if(a.getComponent(i,c)!==geometry.attributes[name].getComponent(i,c))throw Error('Unexpected attribute edit: '+name);
 }
 const material=materials[1].clone(),compile=materials[1].onBeforeCompile,key=materials[1].customProgramCacheKey;
 let compiled=0;
 material.onBeforeCompile=function(shader,renderer){
  compile.call(this,shader,renderer);
  const uniform=shader.uniforms.uVT,oldTex=uniform?.value;
  if(!oldTex?.image?.data){errors.push('Missing head tone texture');return;}
  const src=oldTex.image.data,dst=src.slice();
  for(const a of changed){let cavity=0;for(const [id,w] of a.links)cavity+=Math.max(-src[id*4+1],0)*w;
   // Negative green is cavity darkening; never alter positive clothing channels.
   const before=Math.max(-src[a.id*4+1],0);if(src[a.id*4+1]<=0)dst[a.id*4+1]=-(before*(1-a.weight)+cavity*a.weight);
  }
  const texture=oldTex.clone();texture.image={...oldTex.image,data:dst};texture.needsUpdate=true;
  shader.uniforms.uVT={...uniform,value:texture};compiled++;
 };
 material.customProgramCacheKey=()=>key.call(materials[1])+'|eye-socket-soften-r1';material.needsUpdate=true;
 const next=[...materials];next[1]=material;
 window.__eyeSocketSoften={errors,enable(on){mesh.geometry=on?geometry:old;mesh.material=on?next:materials;},
  report(){return {profile:'eye-socket-soften',version:'0.1.0-r1',changedNormalVertices:changed.length,blurRadiusMm:radius*1000,positionsChanged:false,topologyChanged:false,skinWeightsChanged:false,compiled,errors:[...errors]};}};
})();
