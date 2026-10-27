// Candidate-only P5 lifecycle. Inject after runtime-current-r1.js; no model init.
(function(){
 window.__installShoulderLifecycleR1=function(left,right,gate,asset,rest,cloth){
  const T=window.__toonT,V=window.__v2p,engine=window.__drill,viewer=window.flareInspector?.viewer,garment=window.__collarGarmentRefinement;
  const body=window.__collarShared?.mesh,tee=garment?.garment,original=garment?.originalGeo,refined=garment?.geo;
  if(!T||!V?.torso?.on||!engine||!body?.isSkinnedMesh||!tee?.isSkinnedMesh||!original||!refined||tee.geometry!==refined||window.__shoulderLifecycleR1||window.__shoulderLifecycleUsedR1)throw Error('P5 lifecycle: expected fresh active completed model');
  if(typeof window.__installCurrentShouldersR1!=='function'||!asset||asset.sharedOffset!==body.geometry.attributes.position.count-left.count||asset.sourceMesh!=='Mesh005'||cloth.sourceVertexCount!==original.attributes.position.count||refined.attributes.position.count!==cloth.sourceVertexCount+cloth.additions.length)throw Error('P5 lifecycle: incompatible assets');
  const geos=[body.geometry,original,refined];if(new Set(geos).size!==3)throw Error('P5 lifecycle: geometry alias');
  const snapshots=geos.map(g=>({g,morph:g.morphAttributes,relative:g.morphTargetsRelative}));
  const meshes=[body,tee],before=meshes.map(m=>({m,render:m.onBeforeRender,influences:m.morphTargetInfluences?.slice()||[],dictionary:m.morphTargetDictionary}));
  const controls={select:engine.selectModelProfile,hands:V.setHands,outfit:V.setOutfit};
  if(Object.values(controls).some(x=>typeof x!=='function'))throw Error('P5 lifecycle: missing profile controls');
  let bodyCtl,ownSelect,ownHands,ownOutfit,ownTee,owned,installed=false,disposed=false,desiredAuto=true,desired=[0,0];
  const nMorph=g=>{const values=Object.values(g.morphAttributes),n=values.length?values[0].length:0;if(values.some(a=>a.length!==n)||n&&!g.morphTargetsRelative)throw Error('P5 lifecycle: incompatible morph layout');return n;};
  const bodyOld=nMorph(geos[0]),teeOld=nMorph(original);if(nMorph(refined)!==teeOld||(body.morphTargetInfluences?.length||0)!==bodyOld||(tee.morphTargetInfluences?.length||0)!==teeOld)throw Error('P5 lifecycle: morph weight count mismatch');
  const materials=m=>Array.isArray(m.material)?m.material:[m.material];
  if(!materials(body).concat(materials(tee)).every(m=>m?.isMeshToonMaterial))throw Error('P5 lifecycle: expected toon materials');
  const restBones=new Map(rest.bones.map(b=>[b.name,b.matrix]));if(restBones.size!==rest.bones.length)throw Error('P5 lifecycle: duplicate rest bone');
  for(const m of meshes)for(const k of ['bindMatrix','bindMatrixInverse'])if(m[k].elements.some((x,i)=>Math.abs(x-rest[k][i])>1e-6))throw Error('P5 lifecycle: bind mismatch '+k);
  function invalidate(){for(const g of geos)g.dispose();for(const m of meshes)for(const mat of materials(m))mat.needsUpdate=true;}
  // dispose() only dispatches Three's GPU cache-release event. CPU attributes,
  // geometry objects and all caller-owned references remain intact.
  function copyMorph(g){g.morphAttributes=Object.fromEntries(Object.entries(g.morphAttributes).map(([k,a])=>[k,a.slice()]));}
  function fill(g,key,n){if(!g.morphAttributes[key]){const size=g.attributes[key]?.itemSize||3;g.morphAttributes[key]=Array.from({length:n},()=>new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*size),size));}}
  function appendSlots(g,n){
   fill(g,'position',n);fill(g,'normal',n);for(const [key,arr] of Object.entries(g.morphAttributes)){
    const size=arr[0]?.itemSize||g.attributes[key]?.itemSize;if(!size)throw Error('P5 lifecycle: unknown morph attribute '+key);
    for(let i=0;i<2;i++)arr.push(new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*size),size));
   }g.morphTargetsRelative=true;
  }
  const q=new T.Vector3(),tmp=new T.Matrix4(),S=new T.Matrix4(),linear=new T.Matrix3(),restWorld=new T.Matrix4().fromArray(rest.matrixWorld),w2o=new T.Matrix3().setFromMatrix4(restWorld).transpose();
  function target(m,g,id,row){const e=S.elements.fill(0),J=g.attributes.skinIndex,W=g.attributes.skinWeight;
   for(let k=0;k<4;k++){const w=W.getComponent(id,k);if(!w)continue;const bone=m.skeleton.bones[J.getComponent(id,k)],record=restBones.get(bone?.name);if(!record)throw Error('P5 lifecycle: missing rest bone');tmp.fromArray(record);for(let j=0;j<16;j++)e[j]+=w*tmp.elements[j];}
   S.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix);linear.setFromMatrix4(S);if(Math.abs(linear.determinant())<1e-12)throw Error('P5 lifecycle: singular skin');
   return q.set(row[2],row[3],row[4]).applyMatrix3(w2o).applyMatrix3(linear.invert()).normalize().clone();
  }
  function populate(m,g,rows,offset,slots,allowAdded){
   const base=g.attributes.normal,n=g.attributes.position.count,arrays=slots.map(i=>g.morphAttributes.normal[i]);if(!base||arrays.some(a=>!a||a.count!==n))throw Error('P5 lifecycle: bad normal slots');
   const previous=arrays.map(a=>a.array.slice());arrays.forEach(a=>a.array.fill(0));const rowsById=new Map(),sideById=new Map();
   for(const row of rows){const [src,side,x,y,z]=row;if(!Number.isInteger(src)||src<0||!['left','right'].includes(side)||![x,y,z].every(Number.isFinite)||Math.abs(Math.hypot(x,y,z)-1)>1e-4||rowsById.has(src))throw Error('P5 lifecycle: invalid normal target');rowsById.set(src,row);sideById.set(src,side);
    if(allowAdded&&src>=cloth.sourceVertexCount)continue;const id=src+offset;if(id<0||id>=n)throw Error('P5 lifecycle: normal index');const v=target(m,g,id,row).sub(new T.Vector3().fromBufferAttribute(base,id));arrays[side==='left'?0:1].setXYZ(id,v.x,v.y,v.z);
   }
   if(allowAdded&&g===refined)for(const a of cloth.additions){if(!rowsById.has(a.newIndex)||a.newIndex<cloth.sourceVertexCount||a.newIndex>=n)throw Error('P5 lifecycle: missing added normal target');const sides=new Set();
    a.triangle.forEach(id=>{if(sideById.has(id))sides.add(sideById.get(id));});if(sides.size!==1||!sides.has(sideById.get(a.newIndex)))throw Error('P5 lifecycle: added target has missing/mixed parents');
    const slot=sideById.get(a.newIndex)==='left'?0:1,out=new T.Vector3();a.triangle.forEach((id,i)=>out.addScaledVector(new T.Vector3().fromBufferAttribute(arrays[slot],id),a.barycentric[i]));const baseAdded=new T.Vector3().fromBufferAttribute(base,a.newIndex);out.add(baseAdded).normalize().sub(baseAdded);arrays[slot].setXYZ(a.newIndex,out.x,out.y,out.z);
   }
   let changed=false;arrays.forEach((a,i)=>{if(a.array.some((x,j)=>x!==previous[i][j])){a.needsUpdate=true;changed=true;}});
   // Three 0.170 caches the morph DataArrayTexture by geometry and target
   // count, not attribute version. Dispose the GPU cache when deltas change.
   if(changed)g.dispose();
  }
  function syncWeights(){const on=!!V.torso?.on;if(!on){bodyCtl.setAmounts([0,0]);tee.morphTargetInfluences[teeOld]=0;tee.morphTargetInfluences[teeOld+1]=0;return;}
   if(desiredAuto)bodyCtl.setAuto(true);else bodyCtl.setAmounts(desired);const a=bodyCtl.report().amounts;tee.morphTargetInfluences[teeOld]=a[0];tee.morphTargetInfluences[teeOld+1]=a[1];
  }
  function refresh(){if(disposed)throw Error('P5 lifecycle: detached');if(![original,refined].includes(tee.geometry))throw Error('P5 lifecycle: unexpected garment geometry');
   populate(body,body.geometry,asset.torsoTargets,bodyCtl.offset,bodyCtl.morphIndices,false);
   populate(tee,original,asset.sourceTargets,0,[teeOld,teeOld+1],true);populate(tee,refined,asset.sourceTargets,0,[teeOld,teeOld+1],true);syncWeights();
  }
  function restore(check){
   if(check&&(engine.selectModelProfile!==ownSelect||V.setHands!==ownHands||V.setOutfit!==ownOutfit||tee.onBeforeRender!==ownTee||body.onBeforeRender!==bodyCtl.__lifecycleRender))throw Error('P5 lifecycle: callback replaced; discard page');
   if(check&&owned.some(({g,attributes})=>Object.keys(g.morphAttributes).sort().join('|')!==Object.keys(attributes).sort().join('|')||Object.entries(attributes).some(([key,list])=>g.morphAttributes[key]!==list.array||list.items.some((v,i)=>list.array[i]!==v)||list.array.length!==list.items.length)))throw Error('P5 lifecycle: morph layout changed; discard page');
   if(bodyCtl)bodyCtl.setAmounts([0,0]);
   if(ownSelect&&engine.selectModelProfile===ownSelect)engine.selectModelProfile=controls.select;if(ownHands&&V.setHands===ownHands)V.setHands=controls.hands;if(ownOutfit&&V.setOutfit===ownOutfit)V.setOutfit=controls.outfit;
   for(const s of snapshots){s.g.morphAttributes=s.morph;s.g.morphTargetsRelative=s.relative;}
   for(const s of before){const current=s.m.morphTargetInfluences?.slice(0,s.influences.length)||s.influences;s.m.onBeforeRender=s.render;s.m.updateMorphTargets();if(s.m.morphTargetInfluences)for(let i=0;i<current.length;i++)s.m.morphTargetInfluences[i]=current[i];s.m.morphTargetDictionary=s.dictionary;}
   delete body.userData.__currentShouldersR1;delete window.__shoulderLifecycleR1;invalidate();disposed=true;
  }
  try{
   geos.forEach(copyMorph);window.__installCurrentShouldersR1(left,right,gate);bodyCtl=body.userData.__currentShouldersR1;if(!bodyCtl||bodyCtl.morphIndices[0]!==bodyOld||bodyCtl.morphIndices[1]!==bodyOld+1)throw Error('P5 lifecycle: wrong body slots');bodyCtl.__lifecycleRender=body.onBeforeRender;
   fill(body.geometry,'normal',bodyOld+2);appendSlots(original,teeOld);appendSlots(refined,teeOld);tee.updateMorphTargets();for(let i=0;i<teeOld;i++)tee.morphTargetInfluences[i]=before[1].influences[i];
   ownTee=function(...args){before[1].render.apply(this,args);if(V.torso?.on){bodyCtl.update();const a=bodyCtl.report().amounts;tee.morphTargetInfluences[teeOld]=a[0];tee.morphTargetInfluences[teeOld+1]=a[1];}else{tee.morphTargetInfluences[teeOld]=0;tee.morphTargetInfluences[teeOld+1]=0;}};tee.onBeforeRender=ownTee;
   ownSelect=function(...args){const result=controls.select.apply(this,args);refresh();return result;};ownHands=function(...args){const result=controls.hands.apply(this,args);refresh();return result;};ownOutfit=function(...args){const result=controls.outfit.apply(this,args);refresh();return result;};engine.selectModelProfile=ownSelect;V.setHands=ownHands;V.setOutfit=ownOutfit;
   refresh();invalidate();owned=geos.map(g=>({g,attributes:Object.fromEntries(Object.entries(g.morphAttributes).map(([key,array])=>[key,{array,items:array.slice()}]))}));installed=true;
   const api={setAuto(value){desiredAuto=!!value;syncWeights();},setAmounts(a){if(!Array.isArray(a)||a.length!==2||a.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('P5 lifecycle: invalid amounts');desiredAuto=false;desired=a.slice();syncWeights();},refresh,report(){return {bodySlots:bodyCtl.morphIndices,garmentSlots:[teeOld,teeOld+1],active:!!V.torso.on,body:bodyCtl.report(),garment:tee.morphTargetInfluences.slice(teeOld,teeOld+2)};},detach(){restore(true);return {removed:true,baseDetachStillRequired:true};}};
   window.__shoulderLifecycleR1=api;window.__shoulderLifecycleUsedR1=true;return api.report();
  }catch(error){if(!installed)restore(false);throw error;}
 };
})();
