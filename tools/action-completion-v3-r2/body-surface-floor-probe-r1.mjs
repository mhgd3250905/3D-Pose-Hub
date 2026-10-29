// Read-only full coach surface diagnostic; call inside sampleActualRender's callback.
// No GPU is started here. Includes only vertices used by visible material draw ranges.
export function measureVisibleBodySurfacesInPage(options={}) {
  const T=window.__toonT,v=flareInspector.viewer;
  if(!T||!v?.coach||!v?.motion)throw Error('Active coach and motion required');
  const planeY=options.planeY??0,kneeRadius=options.kneeRadius??.16;
  if(!Number.isFinite(planeY)||!Number.isFinite(kneeRadius)||kneeRadius<=0)throw Error('Invalid surface diagnostic options');
  v.coach.updateWorldMatrix(true,true);
  const joints=v.motion.getMetrics().joints,knees={};
  for(const side of ['left','right'])knees[side]=new T.Vector3().fromArray(joints[side+'Knee']);
  const result={method:'all-visible-coach-drawn-vertices-cpu-skinned-world-space',units:'metres',planeY,kneeRadius,
    expectedSamplingStage:'sampleActualRender callback / scene.onAfterRender',
    meshes:[],vertexCount:0,minY:Infinity,minClearance:Infinity,minimum:null,belowPlaneVertexCount:0,
    kneeRegions:{left:{vertexCount:0,minY:Infinity,minClearance:Infinity,minimum:null,belowPlaneVertexCount:0},right:{vertexCount:0,minY:Infinity,minClearance:Infinity,minimum:null,belowPlaneVertexCount:0}},
    limitations:['CPU vertex positions include active skeletal/joint-correction buffers, but not shader-only displacement, sink or fragment discard.','A negative body vertex hidden by a shader or outer clothing is not automatically a visible penetration; report mesh/material identity and inspect the keyframe.','No tolerance converts negative values into a pass; this reports signed minima and raw below-plane counts.']};
  const q=new T.Vector3(),visibleMaterial=m=>m&&m.visible!==false&&m.colorWrite!==false&&!(m.transparent&&m.opacity<=0);
  function add(target,vertex){target.vertexCount++;if(vertex.clearance<0)target.belowPlaneVertexCount++;if(vertex.world[1]<target.minY){target.minY=vertex.world[1];target.minClearance=vertex.clearance;target.minimum=vertex;}}
  v.coach.traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(let ancestor=mesh;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)return;
    if(v.camera&&!mesh.layers.test(v.camera.layers))return;
    if(mesh.isInstancedMesh)throw Error('Instanced coach mesh requires an instance-aware surface diagnostic');
    const g=mesh.geometry,pos=g?.attributes?.position;if(!pos)return;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    if(!materials.some(visibleMaterial))return;
    const count=g.index?.count??pos.count,start=Math.max(0,g.drawRange.start),end=Math.min(count,start+g.drawRange.count);
    const ranges=Array.isArray(mesh.material)?g.groups.filter(group=>visibleMaterial(materials[group.materialIndex])):[{start:0,count}];
    const drawn=new Set();for(const range of ranges)for(let k=Math.max(start,range.start);k<Math.min(end,range.start+range.count);k++)drawn.add(g.index?g.index.getX(k):k);
    if(!drawn.size)return;
    mesh.skeleton?.update();
    const row={name:mesh.name||'(unnamed)',uuid:mesh.uuid,isSkinnedMesh:!!mesh.isSkinnedMesh,vertexCount:0,minY:Infinity,minClearance:Infinity,minimum:null,belowPlaneVertexCount:0,kneeRegions:{left:{vertexCount:0,minY:Infinity,minClearance:Infinity,minimum:null,belowPlaneVertexCount:0},right:{vertexCount:0,minY:Infinity,minClearance:Infinity,minimum:null,belowPlaneVertexCount:0}},materials:materials.map(m=>({name:m?.name,type:m?.type,visible:m?.visible,transparent:m?.transparent,opacity:m?.opacity,vertexShaderDisplacementNotEvaluated:!!m?.isShaderMaterial}))};
    for(const id of drawn){
      if(mesh.getVertexPosition)mesh.getVertexPosition(id,q);else q.fromBufferAttribute(pos,id);
      q.applyMatrix4(mesh.matrixWorld);if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('Nonfinite body surface vertex');
      const vertex={mesh:row.name,id,world:q.toArray(),clearance:q.y-planeY,weights:[]},si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
      if(si&&sw&&mesh.skeleton)for(let k=0;k<sw.itemSize;k++){const w=sw.getComponent(id,k);if(w>0)vertex.weights.push({bone:mesh.skeleton.bones[si.getComponent(id,k)]?.name,weight:w});}
      add(row,vertex);add(result,vertex);
      for(const side of ['left','right'])if(q.distanceToSquared(knees[side])<=kneeRadius*kneeRadius){add(row.kneeRegions[side],vertex);add(result.kneeRegions[side],vertex);}
    }
    for(const side of ['left','right'])if(!row.kneeRegions[side].vertexCount){row.kneeRegions[side].minY=null;row.kneeRegions[side].minClearance=null;}
    result.meshes.push(row);
  });
  if(!result.vertexCount)throw Error('No visible coach surface vertices sampled');
  for(const side of ['left','right']){result.kneeRegions[side].jointWorld=knees[side].toArray();if(!result.kneeRegions[side].vertexCount){result.kneeRegions[side].minY=null;result.kneeRegions[side].minClearance=null;}}
  return result;
}
