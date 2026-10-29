// Shared ankle connector candidate; frozen model sources remain untouched.
// Uses the project wrist-join design of rigid endpoints plus a smooth central band.
import fs from 'node:fs';

export function makeAnkleJoinMath(T){
  const Y=new T.Vector3(0,1,0),smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  function state(p0,p1,q0,q1,length){
    const a=Y.clone().applyQuaternion(q0),b=Y.clone().applyQuaternion(q1);
    const endFrame=new T.Quaternion().setFromUnitVectors(a,b).multiply(q0);
    const twist=endFrame.clone().invert().multiply(q1);if(twist.w<0)twist.set(-twist.x,-twist.y,-twist.z,-twist.w);
    let twistAngle=2*Math.atan2(twist.y,twist.w);if(twistAngle>Math.PI)twistAngle-=2*Math.PI;if(twistAngle< -Math.PI)twistAngle+=2*Math.PI;
    return {p0,p1,q0,q1,a,b,length,twistAngle,bendAngle:Math.acos(Math.max(-1,Math.min(1,a.dot(b))))};
  }
  function section(s,t){
    const u=1-t,L=s.length;
    const center=s.p0.clone().multiplyScalar(2*t*t*t-3*t*t+1).addScaledVector(s.p1,-2*t*t*t+3*t*t).addScaledVector(s.a,L*(t*t*t-2*t*t+t)).addScaledVector(s.b,L*(t*t*t-t*t));
    const derivative=s.p0.clone().multiplyScalar(6*t*t-6*t).addScaledVector(s.p1,-6*t*t+6*t).addScaledVector(s.a,L*(3*t*t-4*t+1)).addScaledVector(s.b,L*(3*t*t-2*t));
    const second=s.p0.clone().multiplyScalar(12*t-6).addScaledVector(s.p1,-12*t+6).addScaledVector(s.a,L*(6*t-4)).addScaledVector(s.b,L*(6*t-2));
    if(derivative.length()<1e-7)throw Error('Collapsed ankle centerline');
    const curvature=derivative.clone().cross(second).length()/derivative.length()**3;
    const q=new T.Quaternion().setFromUnitVectors(s.a,derivative.clone().normalize()).multiply(s.q0).multiply(new T.Quaternion().setFromAxisAngle(Y,s.twistAngle*smooth(t)));
    return {center,q,curvature,tangent:derivative.normalize()};
  }
  function point(s,t,x,z){const f=section(s,t);return new T.Vector3(x,0,z).applyQuaternion(f.q).add(f.center);}
  return {state,section,point,smooth};
}

export async function install(page,options={}){
  const seam=JSON.parse(fs.readFileSync(new URL('../../drill-anim/models/training-human-v2plus-limbs-base.json',import.meta.url),'utf8')).seam;
  const pairs=seam.ring.flatMap((name,i)=>/^ankle_(left|right)$/.test(name)?[[name.slice(6),seam.vid[i],seam.first+i]]:[]);
  if(pairs.length!==56)throw Error('Expected 56 ankle source seam pairs');
  await page.addScriptTag({content:'window.__makeAnkleJoinMath='+makeAnkleJoinMath.toString()+';'});
  return page.evaluate(installAnkleJoinInPage,{...options,pairs});
}

export function installAnkleJoinInPage(input){
  const T=window.__toonT,v=flareInspector.viewer,V=window.__v2p;
  if(window.__ankleJoinR1||!window.__ankleIntegratedR4||!V?.limbs?.on)throw Error('Ankle join needs fresh active armfix P1');
  const mode=input.mode??'join';if(!['join'].includes(mode))throw Error('Unsupported ankle mode');
  const math=window.__makeAnkleJoinMath(T),body=v.coach.getObjectByName('Coach_Body'),limb=V.limbs.mesh;
  const meshes=[body,limb];if(meshes.some(m=>!m?.isSkinnedMesh))throw Error('Missing ankle skin meshes');
  const pose=v.motion.capturePose(),bones=[];v.coach.traverse(b=>{if(b.isBone)bones.push([b,b.position.clone(),b.quaternion.clone(),b.scale.clone()]);});
  const lowerHeight=input.lowerHeight??-.012,upperHeight=input.upperHeight??.165;
  if(!(lowerHeight>=-.03&&lowerHeight<=0&&upperHeight>=.12&&upperHeight<=.20))throw Error('Unsupported ankle connection bounds');
  const neutral={},entries=[],smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const point=(m,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);
  const skin=(m,i)=>{
    const a=m.geometry.attributes,M=new T.Matrix4(),e=M.elements.fill(0),B=new T.Matrix4();
    for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(i,k);if(!w)continue;B.fromArray(m.skeleton.boneMatrices,a.skinIndex.getComponent(i,k)*16);for(let c=0;c<16;c++)e[c]+=w*B.elements[c];}
    return m.matrixWorld.clone().multiply(m.bindMatrixInverse).multiply(M).multiply(m.bindMatrix);
  };
  try{
    v.motion.reset();v.coach.updateMatrixWorld(true);for(const m of meshes){m.updateMatrixWorld(true);m.skeleton.update();}
    for(const side of ['left','right']){
      const foot=v.coach.getObjectByName(side+'Foot'),shin=v.coach.getObjectByName(side+'Shin');
      if(!foot||!shin)throw Error('Missing ankle bones');
      const ankle=foot.getWorldPosition(new T.Vector3()),axis=shin.getWorldPosition(new T.Vector3()).sub(ankle).normalize();
      const X=new T.Vector3(1,0,0).addScaledVector(axis,-axis.x).normalize(),Z=X.clone().cross(axis).normalize();
      const basis=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(X,axis,Z));
      neutral[side]={foot,shin,footInverse:foot.matrixWorld.clone().invert(),shinInverse:shin.matrixWorld.clone().invert(),ankle,axis,basis,inverseBasis:basis.clone().invert()};
    }
    for(const mesh of meshes){
      const g=mesh.geometry,a=g.attributes,vertices=new Map(),normalIds=new Set(),rest=[];
      for(let i=0;i<a.position.count;i++){
        const p=point(mesh,i);rest.push(p);const side=p.x>=0?'left':'right',n=neutral[side],offset=p.clone().sub(n.ankle),height=offset.dot(n.axis),radial=offset.clone().addScaledVector(n.axis,-height).length();
        if(height<lowerHeight||height>upperHeight||radial>.105)continue;
        const weights={};let total=0;
        for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(i,k);if(w>1e-8){const name=mesh.skeleton.bones[a.skinIndex.getComponent(i,k)].name;weights[name]=(weights[name]??0)+w;total+=w;}}
        if(Object.keys(weights).some(name=>![side+'Foot',side+'Shin'].includes(name))||Math.abs(total-1)>1e-4)continue;
        const footWeight=(weights[side+'Foot']??0)/total;
        const t=(height-lowerHeight)/(upperHeight-lowerHeight),mask=smooth(t/.12)*smooth((1-t)/.12);
        vertices.set(i,{side,p,footWeight,mask,t});normalIds.add(i);
      }
      const index=g.index;if(!index)throw Error('Indexed ankle geometry required');
      const faces=[];const start=g.drawRange.start,end=Math.min(index.count,start+g.drawRange.count);
      for(let k=start;k+2<end;k+=3){const f=[index.getX(k),index.getX(k+1),index.getX(k+2)];faces.push(f);}
      for(const f of faces)if(f.some(i=>vertices.has(i)))for(const i of f)normalIds.add(i);
      const areaFaces=faces.filter(f=>f.some(i=>normalIds.has(i))),needed=new Set(areaFaces.flat());
      entries.push({mesh,g,index,vertices,normalIds,areaFaces,needed,rest,positionSave:null,normalSave:null});
    }
    // Recover the actual shoe opening, not an invented narrow ankle socket.
    const shoe=v.coach.getObjectByName('Coach_Sneakers');if(!shoe?.isSkinnedMesh)throw Error('Missing fixed shoe mesh');shoe.updateMatrixWorld(true);shoe.skeleton.update();
    const sg=shoe.geometry,unique=new Map(),groups=[],ids=[],shoePoints=[];
    for(let i=0;i<sg.attributes.position.count;i++){const p=point(shoe,i),key=p.toArray().map(x=>Math.round(x*1e5)).join(',');if(!unique.has(key)){unique.set(key,groups.length);groups.push([]);shoePoints.push(p);}const j=unique.get(key);groups[j].push(i);ids.push(j);}
    const edges=new Map();for(let k=0;k<sg.index.count;k+=3){const f=[0,1,2].map(j=>ids[sg.index.getX(k+j)]);for(let j=0;j<3;j++){const key=[f[j],f[(j+1)%3]].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)??0)+1);}}
    const boundary=new Set();for(const [edge,count]of edges)if(count===1)for(const j of edge.split(':'))boundary.add(Number(j));
    const quantile=(values,t)=>{values.sort((a,b)=>a-b);return values[Math.floor((values.length-1)*t)];};
    for(const [side,n]of Object.entries(neutral)){
      const local=p=>p.clone().sub(n.ankle).applyQuaternion(n.inverseBasis);
      const ring=[...boundary].map(i=>shoePoints[i]).filter(p=>(side==='left'?p.x>0:p.x<0)).map(local).filter(p=>p.y>-.04&&p.y<.04&&Math.abs(p.x)<.08&&Math.abs(p.z)<.11);
      if(ring.length<16)throw Error('Incomplete fixed shoe collar');
      const lowerCenter=new T.Vector3((Math.min(...ring.map(p=>p.x))+Math.max(...ring.map(p=>p.x)))/2,lowerHeight,(Math.min(...ring.map(p=>p.z))+Math.max(...ring.map(p=>p.z)))/2);
      const lowerRadius=[(Math.max(...ring.map(p=>p.x))-Math.min(...ring.map(p=>p.x)))/2-.004,(Math.max(...ring.map(p=>p.z))-Math.min(...ring.map(p=>p.z)))/2-.004];
      const upper=entries.flatMap(e=>e.rest).filter(p=>(side==='left'?p.x>0:p.x<0)).map(local).filter(p=>Math.abs(p.y-upperHeight)<.018&&Math.hypot(p.x,p.z)<.09);
      if(upper.length<16)throw Error('Incomplete proximal ankle skin section');
      const upperCenter=new T.Vector3((quantile(upper.map(p=>p.x),.05)+quantile(upper.map(p=>p.x),.95))/2,upperHeight,(quantile(upper.map(p=>p.z),.05)+quantile(upper.map(p=>p.z),.95))/2);
      const upperRadius=[quantile(upper.map(p=>Math.abs(p.x-upperCenter.x)),.97),quantile(upper.map(p=>Math.abs(p.z-upperCenter.z)),.97)];
      if([...lowerRadius,...upperRadius].some(r=>r<.018||r>.075))throw Error('Unsupported ankle section dimensions');
      Object.assign(n,{lowerCenter,upperCenter,lowerRadius,upperRadius});
      for(const e of entries)for(const r of e.vertices.values())if(r.side===side){
        const p=local(r.p),c=lowerCenter.clone().lerp(upperCenter,r.t);r.radial=[p.x-c.x,p.z-c.z];r.angle=Math.atan2(r.radial[1],r.radial[0]);
      }
    }
    for(const [side,bi,li]of input.pairs){
      if(entries[0].rest[bi].distanceTo(entries[1].rest[li])>.000001)throw Error('Initial ankle source seam is not closed');
      entries[0].normalIds.add(bi);entries[1].normalIds.add(li);
    }
  }finally{
    v.motion.applyPose(pose);for(const [b,p,q,s]of bones){b.position.copy(p);b.quaternion.copy(q);b.scale.copy(s);}v.coach.updateMatrixWorld(true);
  }
  const previousBefore=v.scene.onBeforeRender,previousAfter=v.scene.onAfterRender,previousRender=v.renderer.render;
  let changed=false,depth=0,pending=null;
  function restore(){
    if(!changed)return;
    for(const e of entries){const a=e.g.attributes;for(const [i,p]of e.positionSave??[])a.position.setXYZ(i,...p);for(const [i,n]of e.normalSave??[])a.normal.setXYZ(i,...n);a.position.needsUpdate=a.normal.needsUpdate=true;e.positionSave=e.normalSave=null;}
    changed=false;
  }
  function update(){
    if(changed)throw Error('Ankle correction still active');v.coach.updateMatrixWorld(true);
    const states={};for(const [side,n]of Object.entries(neutral)){
      const footDelta=n.foot.matrixWorld.clone().multiply(n.footInverse),shinDelta=n.shin.matrixWorld.clone().multiply(n.shinInverse);
      const p0=n.lowerCenter.clone().applyQuaternion(n.basis).add(n.ankle).applyMatrix4(footDelta),p1=n.upperCenter.clone().applyQuaternion(n.basis).add(n.ankle).applyMatrix4(shinDelta);
      const q0=new T.Quaternion().setFromRotationMatrix(footDelta).multiply(n.basis),q1=new T.Quaternion().setFromRotationMatrix(shinDelta).multiply(n.basis);
      states[side]=math.state(p0,p1,q0,q1,upperHeight-lowerHeight);
    }
    const diagnostics={mode,maxMoveMm:0,seamMaxGapMm:0,vertices:0,sides:{}};
    for(const [side,n]of Object.entries(neutral)){const s=states[side];let minimumBound=1;for(let i=0;i<=32;i++){const t=i/32,f=math.section(s,t),radius=Math.max(...n.lowerRadius.map((r,k)=>r*(1-t)+n.upperRadius[k]*t));minimumBound=Math.min(minimumBound,1-f.curvature*radius);}diagnostics.sides[side]={bendDegrees:s.bendAngle*180/Math.PI,twistDegrees:s.twistAngle*180/Math.PI,conservativeJacobianLowerBound:minimumBound,stress:minimumBound<=.05,lowerRadiusMm:n.lowerRadius.map(x=>x*1000),upperRadiusMm:n.upperRadius.map(x=>x*1000)};}
    changed=true;
    for(const e of entries){
      const m=e.mesh,a=e.g.attributes;if(m.geometry!==e.g||e.g.index!==e.index)throw Error('Ankle source geometry changed');m.updateMatrixWorld(true);m.skeleton.update();
      e.positionSave=[...e.vertices.keys()].map(i=>[i,[a.position.getX(i),a.position.getY(i),a.position.getZ(i)]]);
      e.normalSave=[...e.normalIds].map(i=>[i,[a.normal.getX(i),a.normal.getY(i),a.normal.getZ(i)]]);
      for(const [i,r]of e.vertices){
        const n=neutral[r.side],t=r.t,shape=math.smooth(t/.18)*math.smooth((1-t)/.18),u=math.smooth(t);
        const radius=n.lowerRadius.map((x,k)=>x*(1-u)+n.upperRadius[k]*u);
        const x=r.radial[0]*(1-shape)+Math.cos(r.angle)*radius[0]*shape,z=r.radial[1]*(1-shape)+Math.sin(r.angle)*radius[1]*shape;
        const original=point(m,i),target=math.point(states[r.side],t,x,z);target.lerp(original,1-r.mask);
        diagnostics.maxMoveMm=Math.max(diagnostics.maxMoveMm,original.distanceTo(target)*1000);diagnostics.vertices++;
        const M=skin(m,i);if(Math.abs(M.determinant())<1e-10)throw Error('Singular ankle LBS inverse');target.applyMatrix4(M.invert());a.position.setXYZ(i,...target.toArray());
      }
      a.position.needsUpdate=true;
      e.world=new Map([...e.needed].map(i=>[i,point(m,i)]));e.area=new Map([...e.normalIds].map(i=>[i,new T.Vector3()]));
      for(const f of e.areaFaces){const A=e.world.get(f[0]),B=e.world.get(f[1]),C=e.world.get(f[2]),n=B.clone().sub(A).cross(C.clone().sub(A));for(const i of f)e.area.get(i)?.add(n);}
      // UV-split copies must share a skin normal. Shoes are deliberately absent.
      const weld=new Map();for(const i of e.normalIds){const p=e.rest[i],key=p.toArray().map(x=>Math.round(x*1e6)).join(',');if(!weld.has(key))weld.set(key,[]);weld.get(key).push(i);}
      for(const ids of weld.values()){const n=new T.Vector3();for(const i of ids)n.add(e.area.get(i));for(const i of ids)e.area.set(i,n.clone());}
    }
    for(const [,bi,li]of input.pairs){
      const a=entries[0],b=entries[1],A=point(a.mesh,bi),B=point(b.mesh,li);diagnostics.seamMaxGapMm=Math.max(diagnostics.seamMaxGapMm,A.distanceTo(B)*1000);
      const normal=a.area.get(bi).clone().add(b.area.get(li));a.area.set(bi,normal.clone());b.area.set(li,normal.clone());
    }
    for(const e of entries){const m=e.mesh,a=e.g.attributes,worldNormalMatrix=new T.Matrix3().getNormalMatrix(m.matrixWorld);
      for(const [i,n]of e.area){if(n.lengthSq()<1e-20)continue;
        // Three skinnormal_vertex uses mat3(skinMatrix), not its inverse transpose.
        const objectSkin=m.matrixWorld.clone().invert().multiply(skin(m,i));
        const transform=worldNormalMatrix.clone().multiply(new T.Matrix3().setFromMatrix4(objectSkin));
        n.normalize().applyMatrix3(transform.invert()).normalize();a.normal.setXYZ(i,n.x,n.y,n.z);
      }a.normal.needsUpdate=true;
    }
    if(diagnostics.seamMaxGapMm>.01)throw Error('Ankle corrected seam opened');api.last=diagnostics;
  }
  function before(...args){previousBefore?.apply(this,args);if(api.active)update();}
  function after(...args){previousAfter?.apply(this,args);if(pending)pending();}
  function render(...args){const outer=depth++===0;try{return previousRender.apply(this,args);}finally{depth--;if(outer)restore();}}
  const api=window.__ankleJoinR1={version:'0.1.0-r1',mode,active:true,last:null,
    sample(fn){if(changed)return fn();if(pending)throw Error('Nested ankle sample');let result,error;pending=()=>{try{result=fn();}catch(e){error=e;}};try{v.renderer.render(v.scene,v.camera);}finally{pending=null;}if(error)throw error;return result;},
    detach(){if(depth)throw Error('Cannot detach during render');if(v.scene.onBeforeRender!==before||v.scene.onAfterRender!==after||v.renderer.render!==render)throw Error('Detach later hooks first');restore();v.scene.onBeforeRender=previousBefore;v.scene.onAfterRender=previousAfter;v.renderer.render=previousRender;api.active=false;},
    config:{mode,lowerHeight,upperHeight,method:'rigid foot/shin endpoints with transported Hermite connection and measured oval sections',vertices:entries.map(e=>({mesh:e.mesh.name,selected:e.vertices.size,normalVertices:e.normalIds.size})),seamPairs:input.pairs.length,shoesChanged:false,bonesChanged:false,weightsChanged:false,reviewed:false}};
  v.scene.onBeforeRender=before;v.scene.onAfterRender=after;v.renderer.render=render;
  return api.config;
}
