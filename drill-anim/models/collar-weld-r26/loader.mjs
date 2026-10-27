// Experimental P3: join the validated P2 fragment and the existing torso into
// one mesh with shared indices. No frozen data or garment geometry is edited.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export async function applyCollarShared(page) {
 const candidate=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/collar-weld-r26/candidate.json'),'utf8'));
 const p2=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/head-neck-weld-r2/topological-weld.json'),'utf8'));
 const aliases=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/collar-weld-r26/ring-aliases.json'),'utf8'));
 const skinWeights=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/collar-weld-r26/weights.json'),'utf8')); 
 return page.evaluate(([data,p2,aliases,skinWeights])=>{
  const T=window.__toonT,v=flareInspector.viewer,state=window.__v3HeadNeckFragment;
  const head=state?.fragment.mesh,torso=window.__v2p?.torso?.mesh;
  if(!head?.isSkinnedMesh||!torso?.isSkinnedMesh||!torso.visible||window.__collarShared)throw Error('collar-shared-r26: expected active v3 fragment and base torso');
  if(!head.parent||!head.geometry.attributes._phvertexid||torso.geometry.attributes.position.count!==data.torsoVertexCount)throw Error('collar-shared-r26: source topology mismatch');
  v.motion.reset();v.coach.updateMatrixWorld(true);head.skeleton.update();torso.skeleton.update();
  const hg=head.geometry,tg=torso.geometry,n=hg.attributes.position.count,tn=tg.attributes.position.count,total=n+tn;
  const byMarker=new Map();for(let i=0;i<n;i++){const k=hg.attributes._phvertexid.getX(i),a=byMarker.get(k)||[];a.push(i);byMarker.set(k,a);}
  const neckToMarker=new Map();p2.neckSource.forEach((id,k)=>{if(id>=0)neckToMarker.set(id,k);});
  if(aliases.ringAliases.length!==data.neckRing.length)throw Error('P3 alias ring length mismatch');
  const neckRing=[],duplicateMap=new Map();
  for(const markers of aliases.ringAliases){const list=markers.flatMap(marker=>byMarker.get(marker)||[]);if(!list.length)throw Error('missing P3 ring vertex');const canonical=list[0];neckRing.push(canonical);
   for(const duplicate of list.slice(1)){
    for(const attr of ['position','skinIndex','skinWeight','normal']){const a=hg.attributes[attr];for(let c=0;c<a.itemSize;c++)if(Math.abs(a.getComponent(canonical,c)-a.getComponent(duplicate,c))>(attr==='normal'?.001:1e-5))throw Error(`unsafe duplicate ${canonical} ${attr}`);}
    duplicateMap.set(duplicate,canonical);
   }
  }
  const groups=hg.groups,hi=hg.index.array,torsoIndices=tg.index.array,indices0=Array.from(hi.slice(groups[0].start,groups[0].start+groups[0].count),i=>duplicateMap.get(i)??i),indices1=Array.from(hi.slice(groups[1].start,groups[1].start+groups[1].count),i=>duplicateMap.get(i)??i);
  const bridge=data.bridgeIndex.map(i=>i<data.neckRing.length?neckRing[i]:n+data.torsoRing[i-data.neckRing.length]);indices0.push(...bridge);
  const indices2=Array.from(torsoIndices,i=>n+i),joined=[...indices0,...indices1,...indices2];
  const names=new Set([...Object.keys(hg.attributes),...Object.keys(tg.attributes)]),geo=new T.BufferGeometry();
  for(const name of names){const a=hg.attributes[name],b=tg.attributes[name],template=a||b;if(a&&b&&a.itemSize!==b.itemSize)throw Error(`incompatible ${name}`);const size=template.itemSize,arr=name==='skinIndex'?new Uint16Array(total*size):new Float32Array(total*size);
   for(let i=0;i<n;i++)for(let k=0;k<size;k++)arr[i*size+k]=a?a.getComponent(i,k):0;
   for(let i=0;i<tn;i++)for(let k=0;k<size;k++)arr[(n+i)*size+k]=b?b.getComponent(i,k):0;
   geo.setAttribute(name,new T.BufferAttribute(arr,size));}
  const bones=new Map(head.skeleton.bones.map((x,i)=>[x.name,i]));const mapped=[];
  for(const bone of torso.skeleton.bones){if(!bones.has(bone.name))throw Error(`missing target bone ${bone.name}`);mapped.push(bones.get(bone.name));}
  const skinMatrix=(mesh,ids,weights)=>{const acc=new T.Matrix4(),m=new T.Matrix4();acc.elements.fill(0);for(let k=0;k<4;k++){if(!weights[k])continue;m.fromArray(mesh.skeleton.boneMatrices,ids[k]*16);for(let j=0;j<16;j++)acc.elements[j]+=weights[k]*m.elements[j];}return new T.Matrix4().copy(mesh.matrixWorld).multiply(mesh.bindMatrixInverse).multiply(acc).multiply(mesh.bindMatrix);};
  const read4=(a,i)=>[0,1,2,3].map(k=>a.getComponent(i,k));
  const targetSi=geo.attributes.skinIndex,targetSw=geo.attributes.skinWeight,pa=geo.attributes.position,na=geo.attributes.normal;
  const point=new T.Vector3(),normal=new T.Vector3();
  for(let i=0;i<tn;i++){
   const ids=read4(tg.attributes.skinIndex,i),weights=read4(tg.attributes.skinWeight,i),dst=ids.map(x=>mapped[x]);
   const source=skinMatrix(torso,ids,weights),target=skinMatrix(head,dst,weights);
   point.fromBufferAttribute(tg.attributes.position,i).applyMatrix4(source).applyMatrix4(target.clone().invert());pa.setXYZ(n+i,point.x,point.y,point.z);
   normal.fromBufferAttribute(tg.attributes.normal,i).applyMatrix3(new T.Matrix3().getNormalMatrix(source)).normalize().applyMatrix3(new T.Matrix3().setFromMatrix4(target).transpose()).normalize();na.setXYZ(n+i,normal.x,normal.y,normal.z);
   for(let k=0;k<4;k++){targetSi.setComponent(n+i,k,dst[k]);targetSw.setComponent(n+i,k,weights[k]);}
  }
  const delta=new Map();data.neckMovedIndices.forEach((id,k)=>delta.set(id,data.neckDeltaWorld.slice(k*3,k*3+3)));
  const moved=new Set();for(let i=0;i<n;i++){const marker=hg.attributes._phvertexid.getX(i),source=p2.neckSource[marker],d=delta.get(source);if(!d)continue;const matrix=skinMatrix(head,read4(targetSi,i),read4(targetSw,i));point.fromBufferAttribute(pa,i).applyMatrix4(matrix).add(new T.Vector3(...d)).applyMatrix4(matrix.clone().invert());pa.setXYZ(i,point.x,point.y,point.z);moved.add(i);}
  // Change local collar skin weights while preserving the same world-space rest
  // position and normal. Shared material indices continue to use one vertex.
  if(skinWeights.neckVertexCount!==data.neckVertexCount)throw Error('weight source mismatch');
  const weightRows=new Map(skinWeights.rows.map(row=>[row.id,row]));let reweighted=0,restErrorMax=0;
  for(let i=0;i<n;i++){
   const marker=hg.attributes._phvertexid.getX(i),source=p2.neckSource[marker],row=weightRows.get(source);if(!row)continue;
   if(marker<162)throw Error('weight update would alter head seam');
   const oldM=skinMatrix(head,read4(targetSi,i),read4(targetSw,i));const world=point.fromBufferAttribute(pa,i).applyMatrix4(oldM).clone();
   const worldNormal=normal.fromBufferAttribute(na,i).applyMatrix3(new T.Matrix3().getNormalMatrix(oldM)).normalize().clone();
   const ids=[0,0,0,0],weights=[0,0,0,0];row.bones.forEach((name,k)=>{if(!bones.has(name))throw Error(`missing weight bone ${name}`);ids[k]=bones.get(name);weights[k]=row.weights[k];});
   const newM=skinMatrix(head,ids,weights);point.copy(world).applyMatrix4(newM.clone().invert());pa.setXYZ(i,point.x,point.y,point.z);
   normal.copy(worldNormal).applyMatrix3(new T.Matrix3().setFromMatrix4(newM).transpose()).normalize();na.setXYZ(i,normal.x,normal.y,normal.z);
   for(let k=0;k<4;k++){targetSi.setComponent(i,k,ids[k]);targetSw.setComponent(i,k,weights[k]);}
   restErrorMax=Math.max(restErrorMax,point.clone().applyMatrix4(newM).distanceTo(world)*1000);reweighted++;
  }
  if(restErrorMax>0.001)throw Error(`weight rest-position mismatch ${restErrorMax} mm`);
  geo.setIndex(new T.BufferAttribute(new Uint32Array(joined),1));geo.addGroup(0,indices0.length,0);geo.addGroup(indices0.length,indices1.length,1);geo.addGroup(indices0.length+indices1.length,indices2.length,2);
  // Area-weighted smooth normals at the changed neck/bridge and torso ring.
  const touched=new Set([...moved,...data.torsoRing.map(i=>n+i)]),acc=new Float64Array(total*3),points=new Float64Array(total*3);
  for(let i=0;i<total;i++){const M=skinMatrix(head,read4(targetSi,i),read4(targetSw,i));point.fromBufferAttribute(pa,i).applyMatrix4(M);points.set(point.toArray(),i*3);}
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for(let k=0;k<joined.length;k+=3){const [x,y,z]=joined.slice(k,k+3);if(moved.has(x)||moved.has(y)||moved.has(z)){touched.add(x);touched.add(y);touched.add(z);}a.fromArray(points,x*3);b.fromArray(points,y*3).sub(a);c.fromArray(points,z*3).sub(a);b.cross(c);for(const i of [x,y,z]){acc[i*3]+=b.x;acc[i*3+1]+=b.y;acc[i*3+2]+=b.z;}}
  const usedIndices=new Set(joined);
  for(const i of touched){if(i<162||!usedIndices.has(i))continue;normal.fromArray(acc,i*3);if(normal.lengthSq()<1e-20)throw Error(`degenerate normal ${i}`);const M=skinMatrix(head,read4(targetSi,i),read4(targetSw,i));normal.normalize().applyMatrix3(new T.Matrix3().setFromMatrix4(M).transpose()).normalize();na.setXYZ(i,normal.x,normal.y,normal.z);}
  // Preserve the original P2 neck shading away from the new shared seam.
  // Blend in world space, then encode into the possibly reweighted bind space.
  const seamPoints=[...neckRing,...data.torsoRing.map(i=>n+i)];let restoredNormals=0;
  const smoothNormal=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  for(const i of touched){
   if(i<162||i>=n||!usedIndices.has(i)||p2.neckSource[hg.attributes._phvertexid.getX(i)]<0)continue;
   const x=points[i*3],y=points[i*3+1],z=points[i*3+2];if(y>=1.46)continue;let best=Infinity;
   for(const j of seamPoints){const dx=x-points[j*3],dy=y-points[j*3+1],dz=z-points[j*3+2];best=Math.min(best,dx*dx+dy*dy+dz*dz);}
   const blend=smoothNormal(.010,.025,Math.sqrt(best));if(blend<1e-5)continue;
   const oldM=skinMatrix(head,read4(hg.attributes.skinIndex,i),read4(hg.attributes.skinWeight,i));
   const newM=skinMatrix(head,read4(targetSi,i),read4(targetSw,i));
   const previous=new T.Vector3().fromBufferAttribute(hg.attributes.normal,i).applyMatrix3(new T.Matrix3().getNormalMatrix(oldM)).normalize();
   normal.fromBufferAttribute(na,i).applyMatrix3(new T.Matrix3().getNormalMatrix(newM)).normalize().lerp(previous,blend).normalize().applyMatrix3(new T.Matrix3().setFromMatrix4(newM).transpose()).normalize();
   na.setXYZ(i,normal.x,normal.y,normal.z);restoredNormals++;
  }
  // Smoothly reduce the extra toon rim contribution in the new collar
  // transition only. The original head seam, shader lighting and garment
  // assets remain unchanged; uVT alpha is the existing rim attenuation lane.
  const rimMask=new Float32Array(total),ring=[...neckRing,...data.torsoRing.map(i=>n+i)];
  const ease=(a,b,x)=>{const q=Math.max(0,Math.min(1,(x-a)/(b-a)));return q*q*(3-2*q);};
  for(let i=162;i<total;i++){
   const x=points[i*3],y=points[i*3+1],z=points[i*3+2];if(y>1.47||y<1.30)continue;let best=Infinity;
   for(const j of ring){const dx=x-points[j*3],dy=y-points[j*3+1],dz=z-points[j*3+2];best=Math.min(best,dx*dx+dy*dy+dz*dz);}
   rimMask[i]=(1-ease(.04,.065,Math.sqrt(best)))*(1-ease(1.455,1.47,y));
  }
  const remap=(original,mode)=>{const material=original.clone(),compile=original.onBeforeCompile;material.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);for(const name of ['uVT','uVR','uMMT','uV2pT','uNeckSeamSkin']){const uniform=shader.uniforms[name],old=uniform?.value;if(!old?.image?.data)continue;const width=old.image.width,height=Math.ceil(total/width),src=old.image.data,dst=new src.constructor(width*height*4);if(mode==='torso'){for(let i=0;i<tn;i++)for(let k=0;k<4;k++)dst[(n+i)*4+k]=src[i*4+k];}else{dst.set(src.subarray(0,n*4));if(mode==='neck')for(const id of data.torsoRing){const i=n+id;if(name==='uVT')dst[i*4]=1;if(name==='uVR'||name==='uV2pT')for(let k=0;k<3;k++)dst[i*4+k]=points[i*3+k];}}
   if(name==='uVT'&&mode==='neck')for(let i=0;i<total;i++)if(rimMask[i]>0&&dst[i*4+3]<=0)dst[i*4+3]=Math.min(dst[i*4+3],-rimMask[i]);
   const texture=new T.DataTexture(dst,width,height,old.format,old.type);texture.magFilter=old.magFilter;texture.minFilter=old.minFilter;texture.wrapS=old.wrapS;texture.wrapT=old.wrapT;texture.colorSpace=old.colorSpace;texture.needsUpdate=true;uniform.value=texture;}};material.customProgramCacheKey=()=>`${original.customProgramCacheKey()}-collar-shared-r26-${mode}`;return material;};
  // A single rest-position conversion is insufficient when the source meshes
  // have different bone inverses: retain the torso's exact per-bone bind.
  const torsoByName=new Map(torso.skeleton.bones.map((bone,index)=>[bone.name,index]));
  const inverseByName=new Map(torso.skeleton.bones.map((bone,index)=>[bone.name,torso.skeleton.boneInverses[index]]));
  for(const bone of torso.skeleton.bones){const target=head.skeleton.bones[bones.get(bone.name)];if(target!==bone)throw Error(`bone identity differs ${bone.name}`);}
  const compatible=['torso','neck','head','leftScapula','rightScapula'];let canonical=null,bindResidual=0;
  for(const name of compatible){const h=bones.get(name),t=torsoByName.get(name);if(h===undefined||t===undefined)throw Error(`missing compatible bone ${name}`);
   const source=skinMatrix(head,[h,0,0,0],[1,0,0,0]),target=skinMatrix(torso,[t,0,0,0],[1,0,0,0]),C=target.clone().invert().multiply(source);
   if(!canonical)canonical=C;else for(let k=0;k<16;k++)bindResidual=Math.max(bindResidual,Math.abs(C.elements[k]-canonical.elements[k]));}
  if(bindResidual>1e-5)throw Error(`P2/torso bind spaces differ on active P2 bones: ${bindResidual}`);
  const combinedSkeleton=new T.Skeleton(head.skeleton.bones,head.skeleton.bones.map((bone,index)=>(inverseByName.get(bone.name)||head.skeleton.boneInverses[index]).clone()));
  let bindRestError=0;const torsoSeam=new Set(data.torsoRing);
  for(let i=0;i<total;i++){
   const ids=read4(targetSi,i),weights=read4(targetSw,i),mapped=ids.map((id,k)=>{const name=head.skeleton.bones[id]?.name,j=torsoByName.get(name);if(weights[k]>1e-8&&j===undefined)throw Error(`source torso has no bone ${name}`);return j??0;});
   const oldM=skinMatrix(head,ids,weights),newM=skinMatrix(torso,mapped,weights);
   const world=point.fromBufferAttribute(pa,i).applyMatrix4(oldM).clone();
   const worldNormal=normal.fromBufferAttribute(na,i).applyMatrix3(new T.Matrix3().getNormalMatrix(oldM)).normalize().clone();
   if(i>=n){const j=i-n;point.fromBufferAttribute(tg.attributes.position,j);pa.setXYZ(i,point.x,point.y,point.z);
    if(!torsoSeam.has(j)){normal.fromBufferAttribute(tg.attributes.normal,j);na.setXYZ(i,normal.x,normal.y,normal.z);}
    else {normal.copy(worldNormal).applyMatrix3(new T.Matrix3().setFromMatrix4(newM).transpose()).normalize();na.setXYZ(i,normal.x,normal.y,normal.z);}
   }else{point.copy(world).applyMatrix4(newM.clone().invert());pa.setXYZ(i,point.x,point.y,point.z);normal.copy(worldNormal).applyMatrix3(new T.Matrix3().setFromMatrix4(newM).transpose()).normalize();na.setXYZ(i,normal.x,normal.y,normal.z);}
   bindRestError=Math.max(bindRestError,new T.Vector3().fromBufferAttribute(pa,i).applyMatrix4(newM).distanceTo(world)*1000);
  }
  if(bindRestError>.01)throw Error(`bind-space conversion changed rest position ${bindRestError} mm`);
  const mats=[remap(head.material[0],'neck'),remap(head.material[1],'head'),remap(torso.material,'torso')],mesh=new T.SkinnedMesh(geo,mats);mesh.name='V3_Head_Neck_Torso_Shared_R26';mesh.frustumCulled=false;
  const edgeCounts=new Map();for(let i=0;i<joined.length;i+=3)for(const [a,b] of [[joined[i],joined[i+1]],[joined[i+1],joined[i+2]],[joined[i+2],joined[i]]]){const key=[Math.min(a,b),Math.max(a,b)].join(',');const dirs=edgeCounts.get(key)||[];dirs.push(a<b?1:-1);edgeCounts.set(key,dirs);}
  const checkRing=(ring,name)=>{for(let i=0;i<ring.length;i++){const key=[Math.min(ring[i],ring[(i+1)%ring.length]),Math.max(ring[i],ring[(i+1)%ring.length])].join(',');const dirs=edgeCounts.get(key)||[];if(dirs.length!==2||dirs[0]===dirs[1])throw Error(`${name} boundary ${i} not oriented manifold (${dirs})`);}};
  checkRing(neckRing,'neck');checkRing(data.torsoRing.map(i=>n+i),'torso');
  torso.parent.add(mesh);mesh.position.copy(torso.position);mesh.quaternion.copy(torso.quaternion);mesh.scale.copy(torso.scale);mesh.updateMatrixWorld(true);mesh.bind(combinedSkeleton,torso.bindMatrix);
  head.visible=false;torso.visible=false;
  const engine=window.__drill,originalSelect=engine.selectModelProfile;
  function select(spec){const result=originalSelect.call(this,spec);const active=!!window.__v2p.torso?.on;mesh.visible=active;if(active){head.visible=false;torso.visible=false;}return result;}
  engine.selectModelProfile=select;window.__collarShared={mesh,head,torso,engine,originalSelect,select};
  return {vertices:total,materials:mats.length,neckEdges:neckRing.length,torsoEdges:data.torsoRing.length,duplicateIdsMerged:duplicateMap.size,movedVertices:moved.size,reweightedVertices:reweighted,restErrorMaxMm:restErrorMax,rimMaskVertices:rimMask.filter(x=>x>0).length,restoredNormals,bindResidual,bindRestErrorMm:bindRestError,bridgeFaces:bridge.length/3};
 },[candidate,p2,aliases,skinWeights]);
}
export async function detachCollarShared(page) {
 return page.evaluate(()=>{const s=window.__collarShared;if(!s)return false;if(s.engine.selectModelProfile!==s.select)throw Error('collar-shared-r26: profile wrapper replaced');s.engine.selectModelProfile=s.originalSelect;s.mesh.removeFromParent();s.mesh.geometry.dispose();s.mesh.material.forEach(m=>m.dispose());s.head.visible=true;s.torso.visible=!!window.__v2p.torso?.on;delete window.__collarShared;return true;});
}
