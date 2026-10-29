// Complete r3 replacement: r1 restraint plus measured-envelope proximal continuity.
// No pose, bone, weights, topology, material or frozen asset changes.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function makeUpperArmContourR3Math(){
  const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(a,s)=>a.map(x=>x*s);
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const length=a=>Math.hypot(...a),unit=a=>{const n=length(a);if(n<1e-12)throw Error('Degenerate contour vector');return mul(a,1/n);};
  const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0];
  // Shared left/right calibration from valid actual-render r1 A-side sections.
  // PCHIP preserves a broad envelope without adding a new local bump. Endpoint
  // derivatives are zero; no correction reaches the 163.87 mm welded ring.
  const knots=[[60,0],[83.947,1],[88.886,2.806],[93.824,4.592],[98.762,5.346],
    [103.7,5.558],[108.638,5.674],[113.576,5.771],[118.514,5.447],
    [123.452,5.173],[128.39,5.082],[133.328,4.092],[138.266,2.651],
    [143.205,1.103],[148.143,0],[155,0]];
  const slopes=knots.slice(1).map((p,i)=>(p[1]-knots[i][1])/(p[0]-knots[i][0]));
  const tangents=knots.map((p,i)=>{
    if(i===0||i===knots.length-1||slopes[i-1]*slopes[i]<=0)return 0;
    const a=p[0]-knots[i-1][0],b=knots[i+1][0]-p[0],w1=2*b+a,w2=b+2*a;
    return (w1+w2)/(w1/slopes[i-1]+w2/slopes[i]);
  });
  function envelopeFillMm(s){
    if(s<=knots[0][0]||s>=knots.at(-1)[0])return 0;
    const i=knots.findIndex((p,k)=>k<knots.length-1&&s>=p[0]&&s<=knots[k+1][0]);
    const [x,a]=knots[i],[y,b]=knots[i+1],h=y-x,t=(s-x)/h;
    return (2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*h*tangents[i]+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*h*tangents[i+1];
  }
  function plan(input){
    const maxFillMm=input.maxFillMm??6;
    if(!Number.isFinite(maxFillMm)||maxFillMm<0||maxFillMm>6)throw Error('maxFillMm must be within 0..6');
    const maps=Object.fromEntries(Object.entries(input.meshes).map(([name,m])=>[name,new Map(m.vertices.map(v=>[v.id,v]))]));
    const changes={},summary={sides:{},maxMoveMm:0,changed:0,seamMaxGapMm:0,minimumFaceNormalDot:1};
    for(const name of Object.keys(maps))changes[name]=new Map();
    for(const side of ['left','right']){
      const S=input.joints[side].shoulder,axis=unit(sub(input.joints[side].elbow,S));
      const U=unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[0,0,1])),V=cross(axis,U);
      const pairs=input.pairs.filter(p=>p.side===side);if(pairs.length!==28)throw Error('Expected 28 cuff seam pairs on '+side);
      const axial=p=>dot(sub(p,S),axis),coord=p=>{const d=sub(p,S);return [dot(d,U),dot(d,V)];};
      const center=pairs.reduce((sum,p)=>sum+axial(maps[p.a.mesh].get(p.a.id).world),0)/pairs.length;
      const halfWidth=.055,lo=center-halfWidth,hi=center+halfWidth;
      function section(at){
        const segments=[];
        for(const [name,m]of Object.entries(input.meshes))for(const ids of m.facesOriginalIndices){
          const vs=ids.map(i=>maps[name].get(i));if(vs.some(v=>!v))throw Error('Missing contour triangle vertex');
          // The unchanged distal section can contain forearm blend weights;
          // requiring rigid weights here would leave artificial open arcs.
          if(!vs.some(v=>v.weights.some(w=>w.bone===side+'UpperArm'&&w.weight>.1)))continue;
          const ps=vs.map(v=>v.world),d=ps.map(p=>axial(p)-at);if(Math.min(...d)>0||Math.max(...d)<0)continue;
          const cuts=[];
          for(const [i,j]of [[0,1],[1,2],[2,0]])if((d[i]<=0&&d[j]>0)||(d[j]<=0&&d[i]>0)){
            const t=d[i]/(d[i]-d[j]);cuts.push(coord(add(ps[i],mul(sub(ps[j],ps[i]),t))));
          }
          if(cuts.length===2)segments.push(cuts);
        }
        if(segments.length<8)throw Error('Insufficient actual surface at contour endpoint '+side);
        return segments;
      }
      const A=section(lo),B=section(hi);
      function radius(segments,dir){let best=Infinity;for(const [a,b]of segments){const e=sub(b,a),den=cross2(dir,e);if(Math.abs(den)<1e-12)continue;const t=cross2(a,e)/den,k=cross2(a,dir)/den;if(t>0&&k>=-1e-8&&k<=1+1e-8)best=Math.min(best,t);}if(!Number.isFinite(best))throw Error('Open contour section '+side);return best;}
      let count=0,maxMove=0;
      for(const [name,m]of Object.entries(input.meshes))for(const v of m.vertices){
        if(v.weights.length!==1||v.weights[0].bone!==side+'UpperArm'||Math.abs(v.weights[0].weight-1)>1e-6)continue;
        const s=axial(v.world),t=(s-lo)/(hi-lo);if(t<=0||t>=1)continue;
        const radial=coord(v.world),r=Math.hypot(...radial);if(r<1e-6)continue;
        const dir=mul(radial,1/r),baseline=(1-t)*radius(A,dir)+t*radius(B,dir);
        // Retain at least 55% of the measured convex volume. C1 mask gives
        // zero displacement and derivative at both section boundaries.
        const excess=Math.max(0,r-baseline),mask=16*t*t*(1-t)*(1-t);
        const move=Math.min(.006,excess*.45*mask);if(move<1e-8)continue;
        const target=sub(v.world,mul(add(mul(U,dir[0]),mul(V,dir[1])),move));
        changes[name].set(v.id,target);maxMove=Math.max(maxMove,move*1000);count++;
      }
      for(const p of pairs){const a=maps[p.a.mesh].get(p.a.id),b=maps[p.b.mesh].get(p.b.id);if(length(sub(a.world,b.world))>.000001)throw Error('Source cuff seam open');
        const target=changes[p.a.mesh].get(a.id)??a.world;
        if(changes[p.a.mesh].has(a.id)||changes[p.b.mesh].has(b.id)){changes[p.a.mesh].set(a.id,target);changes[p.b.mesh].set(b.id,target);}
        summary.seamMaxGapMm=Math.max(summary.seamMaxGapMm,length(sub(target,changes[p.b.mesh].get(b.id)??b.world))*1000);
      }
      // This is the photographed proximal/inner-arm transition, not a claimed
      // anatomical muscle segmentation. A torso-relative neutral direction is
      // baked into the skinned mesh, so it follows the existing UpperArm pose.
      const other=input.joints[side==='left'?'right':'left'].shoulder,medial=sub(other,S);
      const heading=unit(sub(medial,mul(axis,dot(medial,axis))));
      const scale=center/.16387067,fillLo=.060*scale,fillHi=.155*scale,smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
      let fillCount=0,fillMax=0;
      for(const [name,m]of Object.entries(input.meshes))for(const v of m.vertices){
        const upperWeight=v.weights.filter(w=>w.bone===side+'UpperArm').reduce((s,w)=>s+w.weight,0);
        if(upperWeight<=.85)continue;
        const d=sub(v.world,S),s=dot(d,axis);if(s<=fillLo||s>=fillHi)continue;
        const radial=sub(d,mul(axis,s));if(length(radial)<1e-8)continue;
        const angular=smooth((dot(unit(radial),heading)-.25)/.40);
        const fill=Math.min(maxFillMm,envelopeFillMm(s*1000/scale))/1000*angular*smooth((upperWeight-.85)/.10);
        if(fill<1e-8)continue;
        const base=changes[name].get(v.id)??v.world;changes[name].set(v.id,add(base,mul(heading,fill)));
        fillCount++;fillMax=Math.max(fillMax,fill*1000);
      }
      summary.sides[side]={centerFromShoulderMm:center*1000,bandMm:[lo*1000,hi*1000],sectionSegments:[A.length,B.length],vertices:count,maxMoveMm:maxMove,
        fullness:{bandMm:[fillLo*1000,fillHi*1000],direction:heading,vertices:fillCount,maxMoveMm:fillMax,configuredCapMm:maxFillMm}};
      summary.maxMoveMm=Math.max(summary.maxMoveMm,maxMove);summary.changed+=count;
    }
    summary.changed=0;summary.maxMoveMm=0;
    for(const [name,map]of Object.entries(changes)){summary.changed+=map.size;for(const [id,p]of map)summary.maxMoveMm=Math.max(summary.maxMoveMm,length(sub(p,maps[name].get(id).world))*1000);}
    // A local fold is a rejection, never something to conceal with normals.
    for(const [name,m]of Object.entries(input.meshes))for(const ids of m.facesOriginalIndices){
      if(!ids.some(i=>changes[name].has(i)))continue;
      const before=ids.map(i=>maps[name].get(i).world),after=ids.map((i,k)=>changes[name].get(i)??before[k]);
      const a=cross(sub(before[1],before[0]),sub(before[2],before[0])),b=cross(sub(after[1],after[0]),sub(after[2],after[0]));
      if(length(a)<1e-12)continue;if(length(b)<1e-12)throw Error('Contour collapsed face');
      const d=dot(unit(a),unit(b));summary.minimumFaceNormalDot=Math.min(summary.minimumFaceNormalDot,d);if(d<=0)throw Error('Contour inverted face');
    }
    return {changes:Object.fromEntries(Object.entries(changes).map(([n,m])=>[n,[...m]])),summary};
  }
  return {plan,envelopeFillMm};
}

export async function install(page,options={}){
  if(Object.keys(options).some(k=>k!=='maxFillMm'))throw Error('Unsupported upper-arm r3 option');
  const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
  const read=f=>JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models',f),'utf8'));
  const torso=read('training-human-v2plus-torso-base.json'),limbs=read('training-human-v2plus-limbs-base.json');
  await page.addScriptTag({content:'window.__makeUpperArmContourR3Math='+makeUpperArmContourR3Math.toString()+';'});
  return page.evaluate(installUpperArmContourR3InPage,{torsoCount:torso.n,torsoSeam:torso.seam,limbSeam:limbs.seam,maxFillMm:options.maxFillMm??6});
}

export function installUpperArmContourR3InPage(data){
  const T=window.__toonT,v=flareInspector.viewer,V=window.__v2p;
  if(!window.__armfixR2||window.__upperArmContourR1||window.__upperArmContourR2||window.__upperArmContourR3||!window.__collarShared?.mesh||!V?.limbs?.on)throw Error('Cuff contour r3 requires fresh active armfix-r2; do not stack contour revisions');
  const torso=window.__collarShared.mesh,limb=V.limbs.mesh,meshes=[torso,limb],offset=torso.geometry.attributes.position.count-data.torsoCount;
  const bones=[];v.coach.traverse(b=>{if(b.isBone)bones.push([b,b.position.clone(),b.quaternion.clone(),b.scale.clone()]);});
  const pose=v.motion.capturePose(),originals=[];let report,seamPairs;
  const point=(m,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);
  function skin(m,i){const a=m.geometry.attributes,M=new T.Matrix4(),B=new T.Matrix4();M.elements.fill(0);for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(i,k);if(!w)continue;B.fromArray(m.skeleton.boneMatrices,a.skinIndex.getComponent(i,k)*16);for(let j=0;j<16;j++)M.elements[j]+=w*B.elements[j];}return m.matrixWorld.clone().multiply(m.bindMatrixInverse).multiply(M).multiply(m.bindMatrix);}
  try{
    v.motion.reset();v.coach.updateMatrixWorld(true);for(const m of meshes){m.updateMatrixWorld(true);m.skeleton.update();}
    const input={meshes:{},joints:{},pairs:[],maxFillMm:data.maxFillMm};
    for(const side of ['left','right'])input.joints[side]={shoulder:v.coach.getObjectByName(side+'UpperArm').getWorldPosition(new T.Vector3()).toArray(),elbow:v.coach.getObjectByName(side+'Forearm').getWorldPosition(new T.Vector3()).toArray()};
    for(const m of meshes){const a=m.geometry.attributes,vertices=[];for(let i=0;i<a.position.count;i++){
      const weights=[];for(let k=0;k<4;k++){const weight=a.skinWeight.getComponent(i,k);if(weight>1e-8)weights.push({bone:m.skeleton.bones[a.skinIndex.getComponent(i,k)].name,weight});}
      vertices.push({id:i,world:point(m,i).toArray(),weights});
    }const f=Array.from(m.geometry.index.array),faces=[];for(let i=0;i<f.length;i+=3)faces.push(f.slice(i,i+3));input.meshes[m.name]={vertices,facesOriginalIndices:faces};}
    const lm=new Map(data.limbSeam.vid.map((id,i)=>[data.limbSeam.mesh[i]+':'+id,data.limbSeam.first+i]));
    data.torsoSeam.vid.forEach((id,i)=>{const li=lm.get(data.torsoSeam.mesh[i]+':'+id),ti=offset+data.torsoSeam.first+i;if(li===undefined)return;
      const w=input.meshes[torso.name].vertices[ti].weights;if(w.length===1&&/^(left|right)UpperArm$/.test(w[0].bone))input.pairs.push({side:w[0].bone.replace('UpperArm',''),a:{mesh:torso.name,id:ti},b:{mesh:limb.name,id:li}});
    });
    seamPairs=input.pairs;
    const result=window.__makeUpperArmContourR3Math().plan(input);report=result.summary;
    for(const m of meshes){const a=m.geometry.attributes,changes=new Map(result.changes[m.name]),faces=input.meshes[m.name].facesOriginalIndices;
      const normalIds=new Set(changes.keys());for(const f of faces)if(f.some(i=>changes.has(i)))for(const i of f)normalIds.add(i);
      const saved={m,position:[...changes.keys()].map(i=>[i,[a.position.getX(i),a.position.getY(i),a.position.getZ(i)]]),normal:[...normalIds].map(i=>[i,[a.normal.getX(i),a.normal.getY(i),a.normal.getZ(i)]])};originals.push(saved);
      for(const [i,target]of changes){const p=new T.Vector3(...target).applyMatrix4(skin(m,i).invert());a.position.setXYZ(i,p.x,p.y,p.z);}a.position.needsUpdate=true;
      saved.normalIds=normalIds;saved.sums=new Map([...normalIds].map(i=>[i,new T.Vector3()]));
      for(const f of faces){if(!f.some(i=>normalIds.has(i)))continue;const A=point(m,f[0]),N=point(m,f[1]).sub(A).cross(point(m,f[2]).sub(A));for(const i of f)saved.sums.get(i)?.add(N);}
      const weld=new Map();for(const i of normalIds){const key=input.meshes[m.name].vertices[i].world.map(x=>Math.round(x*1e6)).join(',');if(!weld.has(key))weld.set(key,[]);weld.get(key).push(i);}
      for(const ids of weld.values()){const sum=new T.Vector3();for(const i of ids)sum.add(saved.sums.get(i));for(const i of ids)saved.sums.get(i).copy(sum);}
    }
    for(const p of input.pairs){const a=originals.find(x=>x.m.name===p.a.mesh),b=originals.find(x=>x.m.name===p.b.mesh),A=a.sums.get(p.a.id),B=b.sums.get(p.b.id);if(A&&B){const n=A.clone().add(B);A.copy(n);B.copy(n);}}
    for(const o of originals){const m=o.m,a=m.geometry.attributes;
      for(const [i,n]of o.sums){if(n.lengthSq()<1e-20)continue;const sk=m.matrixWorld.clone().invert().multiply(skin(m,i));const normalTransform=new T.Matrix3().getNormalMatrix(m.matrixWorld).multiply(new T.Matrix3().setFromMatrix4(sk));n.normalize().applyMatrix3(normalTransform.invert()).normalize();a.normal.setXYZ(i,n.x,n.y,n.z);}a.normal.needsUpdate=true;
    }
  }catch(error){for(const o of originals){const a=o.m.geometry.attributes;for(const [i,p]of o.position)a.position.setXYZ(i,...p);for(const [i,n]of o.normal)a.normal.setXYZ(i,...n);a.position.needsUpdate=a.normal.needsUpdate=true;}throw error;}
  finally{v.motion.applyPose(pose);for(const [b,p,q,s]of bones){b.position.copy(p);b.quaternion.copy(q);b.scale.copy(s);}v.coach.updateMatrixWorld(true);}
  const config={profile:'upper-arm-contour-r3',version:'0.1.0-r3',...report,bonesChanged:false,weightsChanged:false,topologyChanged:false,materialsChanged:false,reviewed:false};
  function measure(){
    v.coach.updateMatrixWorld(true);for(const m of meshes){m.updateMatrixWorld(true);m.skeleton.update();}
    let maxSeamGapMm=0;const byName=new Map(meshes.map(m=>[m.name,m]));
    for(const p of seamPairs)maxSeamGapMm=Math.max(maxSeamGapMm,point(byName.get(p.a.mesh),p.a.id).distanceTo(point(byName.get(p.b.mesh),p.b.id))*1000);
    if(!Number.isFinite(maxSeamGapMm)||maxSeamGapMm>.01)throw Error('Upper-arm contour seam exceeded 0.01 mm: '+maxSeamGapMm);
    return {maxSeamGapMm,seamPairs:seamPairs.length,stress:false,maxRestMoveMm:report.maxMoveMm};
  }
  window.__upperArmContourR3={config,measure,detach(){for(const o of originals){const a=o.m.geometry.attributes;for(const [i,p]of o.position)a.position.setXYZ(i,...p);for(const [i,n]of o.normal)a.normal.setXYZ(i,...n);a.position.needsUpdate=a.normal.needsUpdate=true;}delete window.__upperArmContourR3;}};
  return config;
}
