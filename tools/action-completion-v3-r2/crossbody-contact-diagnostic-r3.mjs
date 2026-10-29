// Read only. Invoke inside sampleActualRender while corrective geometry is active.
export async function install(page){
  await page.addScriptTag({content:'window.__measureCrossbodyContactR3='+measureCrossbodyContactInPage.toString()+';'});
}

export function measureCrossbodyContactInPage(){
  const T=window.__toonT,v=flareInspector.viewer,H=window.__v2p?.hands?.mesh,L=v.coach.getObjectByName('V2P_Base_Limbs');
  if(!H?.visible||!L?.visible)throw Error('Expected visible native hand and limb surfaces');
  const bone=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3());
  const elbow=bone('rightUpperArm'),wrist=bone('rightForearm'),axis=wrist.clone().sub(elbow),length=axis.length();axis.normalize();
  const centerline=p=>elbow.clone().addScaledVector(axis,p.clone().sub(elbow).dot(axis));
  const handBone=v.coach.getObjectByName('leftHand'),inverse=handBone.matrixWorld.clone().invert();
  const dominant=(mesh,i)=>{const a=mesh.geometry.attributes;let best=-1,name;for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(i,k);if(w>best){best=w;name=mesh.skeleton.bones[a.skinIndex.getComponent(i,k)].name;}}return name;};
  const points=(mesh,predicate)=>{mesh.skeleton.update();const out=new Map();for(let i=0;i<mesh.geometry.attributes.position.count;i++){if(!predicate(i))continue;out.set(i,mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));}return out;};
  const hp=points(H,i=>{const n=dominant(H,i);return n==='leftHand'||n?.startsWith('v2p_L_');}),lp=points(L,i=>['rightUpperArm','rightForearm'].includes(dominant(L,i)));
  const palm=new Set(),hi=H.geometry.index;
  // Palm-side faces are selected geometrically toward the target forearm, not by an assumed world axis.
  for(let j=0;j<hi.count;j+=3){const ids=[hi.getX(j),hi.getX(j+1),hi.getX(j+2)];if(ids.some(i=>!hp.has(i)||dominant(H,i)!=='leftHand'))continue;const [a,b,c]=ids.map(i=>hp.get(i)),middle=a.clone().add(b).add(c).multiplyScalar(1/3),local=middle.clone().applyMatrix4(inverse);
    if(local.x<.035||local.x>.105)continue;
    const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize(),toward=centerline(middle).sub(middle).normalize();
    if(normal.dot(toward)>.2)ids.forEach(i=>palm.add(i));
  }
  const triangles=[];
  for(const mesh of [L,v.coach.getObjectByName('V3_Head_Neck_Torso_Shared_R26')]){
   if(!mesh?.visible)throw Error('Missing upper-arm surface');
   const isTorso=mesh!==L,lp=points(mesh,i=>['rightUpperArm','rightForearm'].includes(dominant(mesh,i))),li=mesh.geometry.index;
   for(let j=0;j<li.count;j+=3){const ids=[li.getX(j),li.getX(j+1),li.getX(j+2)];if(ids.some(i=>!lp.has(i)))continue;const [a,b,c]=ids.map(i=>lp.get(i)),middle=a.clone().add(b).add(c).multiplyScalar(1/3),along=middle.clone().sub(elbow).dot(axis);
    if(along<.025||along>length+.20||(isTorso?along>.1645:along<.1630))continue;
    const triangle=new T.Triangle(a,b,c),normal=triangle.getNormal(new T.Vector3());if(normal.dot(middle.clone().sub(centerline(middle)))<0)normal.negate();
    triangles.push({mesh:mesh.name,ids,triangle,normal,box:new T.Box3().setFromPoints([a,b,c])});
   }
  }
  if(!palm.size||!triangles.length)throw Error('Missing palm or target forearm triangles');
  // A small exact AABB hierarchy prunes distant triangles; triangle distance remains THREE's implementation.
  const build=items=>{const box=new T.Box3();for(const x of items)box.union(x.box);if(items.length<=12)return {box,items};const span=box.getSize(new T.Vector3()),key=span.x>=span.y&&span.x>=span.z?'x':span.y>=span.z?'y':'z';items.sort((a,b)=>(a.box.min[key]+a.box.max[key])-(b.box.min[key]+b.box.max[key]));const mid=Math.floor(items.length/2);return {box,left:build(items.slice(0,mid)),right:build(items.slice(mid))};};
  const tree=build(triangles.slice()),samples=[],closest=new T.Vector3(),allHand=[];
  const nearest=p=>{let best=Infinity,hit=null;const visit=node=>{if(node.box.distanceToPoint(p)**2>best)return;
    if(node.items){for(const t of node.items){if(t.box.distanceToPoint(p)**2>best)continue;t.triangle.closestPointToPoint(p,closest);const dist=p.distanceToSquared(closest);if(dist<best){best=dist;hit={targetMesh:t.mesh,targetTriangle:t.ids,point:closest.toArray(),normal:t.normal.toArray(),signedMm:Math.sqrt(dist)*1000*(p.clone().sub(closest).dot(t.normal)<0?-1:1)};}}return;}
    const a=node.left,b=node.right;if(a.box.distanceToPoint(p)<=b.box.distanceToPoint(p)){visit(a);visit(b);}else{visit(b);visit(a);}};visit(tree);return hit;};
  let maximumBruteForceErrorMm=0;
  for(const [id,p] of hp){const along=p.clone().sub(elbow).dot(axis);if(!palm.has(id)&&(along<.035||along>length+.18))continue;
    const hit=nearest(p),sample={id,world:p.toArray(),...hit};
    // Bounded cross-check against the unaccelerated distance for diagnostic correctness.
    if(id%127===0){let brute=Infinity;for(const t of triangles){t.triangle.closestPointToPoint(p,closest);brute=Math.min(brute,p.distanceTo(closest));}maximumBruteForceErrorMm=Math.max(maximumBruteForceErrorMm,Math.abs(brute*1000-Math.abs(hit.signedMm)));}
    if(palm.has(id))samples.push(sample);allHand.push({...sample,bone:dominant(H,id)});
  }
  if(maximumBruteForceErrorMm>1e-6)throw Error('Nearest-triangle acceleration differs from brute force');
  allHand.sort((a,b)=>a.signedMm-b.signedMm);
  samples.sort((a,b)=>a.signedMm-b.signedMm);
  const joints=v.motion.getMetrics().joints;
  return {format:'pose-hub-crossbody-contact-diagnostic@3',method:'Actual CPU-skinned palm-facing native hand vertices to closest actual right-upper-arm and adjacent forearm triangles; sign from radially oriented target face normal',allHandRegion:{perBone:Object.fromEntries([...new Set(allHand.map(x=>x.bone))].map(b=>{const a=allHand.filter(x=>x.bone===b);return [b,{samples:a.length,minSignedGapMm:Math.min(...a.map(x=>x.signedMm)),penetratingBelowMinus1Mm:a.filter(x=>x.signedMm< -1).length}];})),samples:allHand.length,minSignedGapMm:allHand[0]?.signedMm??null,penetratingBelowMinus1Mm:allHand.filter(x=>x.signedMm< -1).length,nearWithin2Mm:allHand.filter(x=>Math.abs(x.signedMm)<=2).length,closestWitnesses:allHand.slice(0,16),maximumBruteForceErrorMm},palmSampleCount:samples.length,targetTriangles:triangles.length,minSignedGapMm:samples[0].signedMm,medianSignedGapMm:samples[Math.floor(samples.length/2)].signedMm,maxSignedGapMm:samples.at(-1).signedMm,nearWithin2Mm:samples.filter(x=>Math.abs(x.signedMm)<=2).length,penetratingBelowMinus1Mm:samples.filter(x=>x.signedMm< -1).length,samples,rightElbow:elbow.toArray(),rightWrist:wrist.toArray(),leftPalm:joints.leftPalm,leftWrist:joints.leftWrist,limits:['Vertex-to-triangle samples are not a continuous triangle-triangle intersection certificate.','Separate allHandRegion tests native left hand/finger vertices over the upper-arm and adjacent elbow/forearm range; no end-cap/target-hand collision certificate.','Inspect multiple visible camera angles; no shader displacement or fragment-discard evaluation.'],userAccepted:false,releaseEligible:false};
}
