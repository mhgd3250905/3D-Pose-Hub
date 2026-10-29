// Read only. Invoke inside sampleActualRender while corrective geometry is active.
export async function install(page){
  await page.addScriptTag({content:'window.__measureBicepsContactR1='+measureBicepsContactInPage.toString()+';'});
}

export function measureBicepsContactInPage(){
  const T=window.__toonT,v=flareInspector.viewer,H=window.__v2p?.hands?.mesh,L=v.coach.getObjectByName('V2P_Base_Limbs');
  if(!H?.visible||!L?.visible)throw Error('Expected visible native hand and limb surfaces');
  const bone=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3());
  const elbow=bone('rightForearm'),wrist=bone('rightHand'),axis=wrist.clone().sub(elbow),length=axis.length();axis.normalize();
  const centerline=p=>elbow.clone().addScaledVector(axis,p.clone().sub(elbow).dot(axis));
  const handBone=v.coach.getObjectByName('leftHand'),inverse=handBone.matrixWorld.clone().invert();
  const dominant=(mesh,i)=>{const a=mesh.geometry.attributes;let best=-1,name;for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(i,k);if(w>best){best=w;name=mesh.skeleton.bones[a.skinIndex.getComponent(i,k)].name;}}return name;};
  const points=(mesh,predicate)=>{mesh.skeleton.update();const out=new Map();for(let i=0;i<mesh.geometry.attributes.position.count;i++){if(!predicate(i))continue;out.set(i,mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));}return out;};
  const hp=points(H,i=>dominant(H,i)==='leftHand'),lp=points(L,i=>dominant(L,i)==='rightForearm');
  const palm=new Set(),hi=H.geometry.index;
  // Palm-side faces are selected geometrically toward the target forearm, not by an assumed world axis.
  for(let j=0;j<hi.count;j+=3){const ids=[hi.getX(j),hi.getX(j+1),hi.getX(j+2)];if(ids.some(i=>!hp.has(i)))continue;const [a,b,c]=ids.map(i=>hp.get(i)),middle=a.clone().add(b).add(c).multiplyScalar(1/3),local=middle.clone().applyMatrix4(inverse);
    if(local.x<.035||local.x>.105)continue;
    const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize(),toward=centerline(middle).sub(middle).normalize();
    if(normal.dot(toward)>.2)ids.forEach(i=>palm.add(i));
  }
  const triangles=[],li=L.geometry.index;
  for(let j=0;j<li.count;j+=3){const ids=[li.getX(j),li.getX(j+1),li.getX(j+2)];if(ids.some(i=>!lp.has(i)))continue;const [a,b,c]=ids.map(i=>lp.get(i)),middle=a.clone().add(b).add(c).multiplyScalar(1/3),along=middle.clone().sub(elbow).dot(axis);
    if(along<.025||along>length-.012)continue;
    const triangle=new T.Triangle(a,b,c),normal=triangle.getNormal(new T.Vector3());if(normal.dot(middle.clone().sub(centerline(middle)))<0)normal.negate();
    triangles.push({ids,triangle,normal,box:new T.Box3().setFromPoints([a,b,c])});
  }
  if(!palm.size||!triangles.length)throw Error('Missing palm or target forearm triangles');
  const samples=[],closest=new T.Vector3();
  for(const id of palm){const p=hp.get(id);let best=Infinity,hit=null;
    for(const t of triangles){if(t.box.distanceToPoint(p)**2>best)continue;t.triangle.closestPointToPoint(p,closest);const dist=p.distanceToSquared(closest);if(dist<best){best=dist;hit={targetTriangle:t.ids,point:closest.toArray(),normal:t.normal.toArray(),signedMm:Math.sqrt(dist)*1000*(p.clone().sub(closest).dot(t.normal)<0?-1:1)};}}
    samples.push({id,world:p.toArray(),...hit});
  }
  samples.sort((a,b)=>a.signedMm-b.signedMm);
  const joints=v.motion.getMetrics().joints;
  return {format:'pose-hub-biceps-contact-diagnostic@1',method:'Actual CPU-skinned palm-facing native hand vertices to closest actual right-forearm triangles; sign from radially oriented target face normal',palmSampleCount:samples.length,targetTriangles:triangles.length,minSignedGapMm:samples[0].signedMm,medianSignedGapMm:samples[Math.floor(samples.length/2)].signedMm,maxSignedGapMm:samples.at(-1).signedMm,nearWithin2Mm:samples.filter(x=>Math.abs(x.signedMm)<=2).length,penetratingBelowMinus1Mm:samples.filter(x=>x.signedMm< -1).length,samples,rightElbow:elbow.toArray(),rightWrist:wrist.toArray(),leftPalm:joints.leftPalm,leftWrist:joints.leftWrist,limits:['Vertex-to-triangle samples are not a continuous triangle-triangle intersection certificate.','Palm selection excludes fingers and wrist; it does not certify fingertip clearance.','Inspect multiple visible camera angles; no shader displacement or fragment-discard evaluation.'],userAccepted:false,releaseEligible:false};
}
