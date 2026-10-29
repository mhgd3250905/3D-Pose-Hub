// Read-only actual-render diagnostic. No pose, camera, geometry or materials changed.
export function makeChairContactMath(){
  const cross=(a,b,c)=>(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
  function clipTriangleOverTop(skin,top){
    let poly=skin.map(p=>p.slice());const sign=Math.sign(cross(...top));if(!sign)return [];
    for(let i=0;i<3&&poly.length;i++){
      const a=top[i],b=top[(i+1)%3],out=[];
      for(let j=0;j<poly.length;j++){
        const p=poly[j],q=poly[(j+1)%poly.length],dp=sign*cross(a,b,p),dq=sign*cross(a,b,q),pin=dp>=-1e-12,qin=dq>=-1e-12;
        if(pin)out.push(p);
        if(pin!==qin){const t=dp/(dp-dq);out.push(p.map((x,k)=>x+t*(q[k]-x)));}
      }poly=out;
    }return poly;
  }
  return {clipTriangleOverTop};
}

export async function install(page){
  await page.addScriptTag({content:'window.__chairContactMathR1=('+makeChairContactMath.toString()+')();window.__measureChairElbowContactR1='+measureChairElbowContactInPage.toString()+';'});
}

export function measureChairElbowContactInPage({radiusMm=140}={}){
  const T=window.__toonT,v=flareInspector.viewer,math=window.__chairContactMathR1;
  if(!math||!(radiusMm>0&&radiusMm<=200))throw Error('Install diagnostic first; bounded elbow radius required');
  const chairs=[];v.scene.traverse(o=>{if(o.name==='prop_chair')chairs.push(o);});
  if(chairs.length!==1)throw Error('Exactly one actual prop_chair required');
  const chair=chairs[0],s=chair.userData.spec,H=s.height??.45,BK=s.back??.42;
  chair.updateMatrixWorld(true);const inverse=chair.matrixWorld.clone().invert(),tops=[];
  chair.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.visible||!mesh.geometry?.attributes.position)return;
    mesh.updateMatrixWorld(true);const g=mesh.geometry,p=g.attributes.position,idx=g.index,toChair=inverse.clone().multiply(mesh.matrixWorld),points=[];
    for(let i=0;i<p.count;i++)points.push(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(toChair));
    for(let j=0;j<(idx?.count??p.count);j+=3){
      const ids=[0,1,2].map(k=>idx?idx.getX(j+k):j+k),a=points[ids[0]],b=points[ids[1]],c=points[ids[2]],normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      if(normal.y<.999||Math.max(a.y,b.y,c.y)-Math.min(a.y,b.y,c.y)>1e-7||a.y<H+BK*.85)continue;
      tops.push({childIndex:chair.children.indexOf(mesh),face:j/3,localTopY:a.y,localVertices:[a,b,c].map(p=>p.toArray())});
    }
  });
  if(!tops.length)throw Error('No horizontal upper chair support faces');
  const names=['V2P_Base_Limbs','V3_Head_Neck_Torso_Shared_R26'],meshes=names.map(n=>v.coach.getObjectByName(n)).filter(Boolean),sides={};
  for(const side of ['left','right']){
    const elbow=v.coach.getObjectByName(side+'Forearm').getWorldPosition(new T.Vector3()),elbowLocal=elbow.clone().applyMatrix4(inverse),results=[];
    for(const mesh of meshes){
      if(!mesh.isSkinnedMesh||!mesh.visible)continue;mesh.updateMatrixWorld(true);mesh.skeleton.update();
      const g=mesh.geometry,a=g.attributes,idx=g.index,points=new Map(),weights=new Map();
      for(let i=0;i<a.position.count;i++){
        let w=0;for(let k=0;k<4;k++)if([side+'UpperArm',side+'Forearm'].includes(mesh.skeleton.bones[a.skinIndex.getComponent(i,k)].name))w+=a.skinWeight.getComponent(i,k);
        if(w<.95)continue;const p=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);
        if(p.distanceTo(elbow)>radiusMm/1000)continue;points.set(i,p.applyMatrix4(inverse).toArray());weights.set(i,w);
      }
      let overlapFaces=0,minSignedGapMm=Infinity,maxSignedGapMm=-Infinity,minimum=null,nearestAbs=null;
      const perSupport=new Map();
      for(let j=0;j<idx.count;j+=3){const ids=[idx.getX(j),idx.getX(j+1),idx.getX(j+2)];if(ids.some(i=>!points.has(i)))continue;const triangle=ids.map(i=>points.get(i));
        for(const top of tops){const polygon=math.clipTriangleOverTop(triangle,top.localVertices);if(!polygon.length)continue;overlapFaces++;
          const entry=perSupport.get(top.childIndex)??{childIndex:top.childIndex,topY:top.localTopY,minSignedGapMm:Infinity,overlapPolygons:0};entry.overlapPolygons++;
          for(const p of polygon){const gap=(p[1]-top.localTopY)*1000;entry.minSignedGapMm=Math.min(entry.minSignedGapMm,gap);maxSignedGapMm=Math.max(maxSignedGapMm,gap);
            const detail={gapMm:gap,mesh:mesh.name,triangleVertexIds:ids,minimumArmBoneWeight:Math.min(...ids.map(i=>weights.get(i))),chairChildIndex:top.childIndex,chairFace:top.face,chairLocalPoint:p,worldPoint:new T.Vector3(...p).applyMatrix4(chair.matrixWorld).toArray()};
            if(gap<minSignedGapMm){minSignedGapMm=gap;minimum=detail;}if(!nearestAbs||Math.abs(gap)<Math.abs(nearestAbs.gapMm))nearestAbs=detail;
          }perSupport.set(top.childIndex,entry);
        }
      }
      results.push({mesh:mesh.name,sampledVertices:points.size,overlapPolygons:overlapFaces,minSignedGapMm:minimum?minSignedGapMm:null,maxSignedGapMm:minimum?maxSignedGapMm:null,minimum,nearestClippedVertexToTop:nearestAbs,perSupport:[...perSupport.values()],visibility:'mesh-visible; material/shader clipping not independently evaluated'});
    }
    sides[side]={elbowWorld:elbow.toArray(),elbowChairLocal:elbowLocal.toArray(),surfaces:results};
  }
  return {format:'pose-hub-chair-elbow-contact-diagnostic@1',method:'Actual skinned triangles clipped in chair-local XZ against actual upward chair top triangles; signed vertical distance over support footprint',captureRequirement:'Call synchronously from actual scene.onAfterRender sampler; do not measure pre-render target pose',chairSpec:s,chairMatrixWorld:chair.matrixWorld.toArray(),supportTopFaces:tops,elbowRadiusMm:radiusMm,sides,limits:['Positive minimum means sampled surface floats above that support footprint; negative minimum alone requires collision review, not automatic failure.','Separate mesh results avoid treating hidden original Coach_Body overlap as visible skin. Shared torso shader clipping can still hide triangles; prioritize distal limb surface and matched PNG.','Missing footprint overlap is null, not zero contact. Vertical distances use chair local frame; current chair scale/yaw must be inspected.','This is surface diagnosis, not proof of pressure/contact area or every-frame correctness.'],reviewed:false,releaseEligible:false};
}
