// Experimental local elbow volume preservation under render-time forearm twist.
// Reuses reviewed DQS math; does not alter bones, hands, wrist contacts or skin weights.
import {makeAnkleDqsMath as makeJointDqsMath} from './ankle-dqs-r1.mjs';
export async function install(page,options={}){
  await page.addScriptTag({content:'window.__makeElbowDqsMath='+makeJointDqsMath.toString()+';'});
  return page.evaluate(installElbowDqsInPage,{...options,pairs:[]});
}
export function installElbowDqsInPage(input){
  const T=window.__toonT,v=flareInspector.viewer,V=window.__v2p;
  if(window.__elbowDqsR1||!window.__armfixR2||!V?.limbs?.on)throw Error('Elbow DQS needs fresh active armfix P1');
  const mode=input.mode??'dqs';if(!['dqs','normals-only'].includes(mode))throw Error('Unsupported elbow mode');
  const math=window.__makeElbowDqsMath(T),body=v.coach.getObjectByName('Coach_Body'),limb=V.limbs.mesh;
  const meshes=[body,limb];if(meshes.some(m=>!m?.isSkinnedMesh))throw Error('Missing elbow skin meshes');
  const pose=v.motion.capturePose(),bones=[];v.coach.traverse(b=>{if(b.isBone)bones.push([b,b.position.clone(),b.quaternion.clone(),b.scale.clone()]);});
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
      const foot=v.coach.getObjectByName(side+'Forearm'),shin=v.coach.getObjectByName(side+'UpperArm');
      if(!foot||!shin)throw Error('Missing elbow bones');
      neutral[side]={foot,shin,footInverse:foot.matrixWorld.clone().invert(),shinInverse:shin.matrixWorld.clone().invert(),elbow:foot.getWorldPosition(new T.Vector3()),axis:shin.getWorldPosition(new T.Vector3()).sub(foot.getWorldPosition(new T.Vector3())).normalize()};
    }
    for(const mesh of meshes){
      const g=mesh.geometry,a=g.attributes,vertices=new Map(),normalIds=new Set(),rest=[];
      for(let i=0;i<a.position.count;i++){
        const p=point(mesh,i);rest.push(p);const side=p.x>=0?'left':'right',n=neutral[side],offset=p.clone().sub(n.elbow),height=offset.dot(n.axis),radial=offset.clone().addScaledVector(n.axis,-height).length();
        if(height<-.10||height>.10||radial>.12)continue;
        const weights={};let total=0;
        for(let k=0;k<4;k++){const w=a.skinWeight.getComponent(i,k);if(w>1e-8){const name=mesh.skeleton.bones[a.skinIndex.getComponent(i,k)].name;weights[name]=(weights[name]??0)+w;total+=w;}}
        if(Object.keys(weights).some(name=>![side+'Forearm',side+'UpperArm'].includes(name))||Math.abs(total-1)>1e-4)continue;
        const footWeight=(weights[side+'Forearm']??0)/total;
        const mask=smooth((height+.10)/.02)*(1-smooth((height-.08)/.02));
        vertices.set(i,{side,p,footWeight,mask});normalIds.add(i);
      }
      const index=g.index;if(!index)throw Error('Indexed elbow geometry required');
      const faces=[];const start=g.drawRange.start,end=Math.min(index.count,start+g.drawRange.count);
      for(let k=start;k+2<end;k+=3){const f=[index.getX(k),index.getX(k+1),index.getX(k+2)];faces.push(f);}
      for(const f of faces)if(f.some(i=>vertices.has(i)))for(const i of f)normalIds.add(i);
      const areaFaces=faces.filter(f=>f.some(i=>normalIds.has(i))),needed=new Set(areaFaces.flat());
      entries.push({mesh,g,index,vertices,normalIds,areaFaces,needed,rest,positionSave:null,normalSave:null});
    }
    for(const [side,bi,li]of input.pairs){
      if(entries[0].rest[bi].distanceTo(entries[1].rest[li])>.000001)throw Error('Initial elbow source seam is not closed');
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
    if(changed)throw Error('Elbow correction still active');v.coach.updateMatrixWorld(true);
    const transforms={};for(const [side,n]of Object.entries(neutral))transforms[side]=[math.encode(n.foot.matrixWorld.clone().multiply(n.footInverse)),math.encode(n.shin.matrixWorld.clone().multiply(n.shinInverse))];
    const diagnostics={mode,maxMoveMm:0,seamMaxGapMm:0,vertices:0};
    changed=true;
    for(const e of entries){
      const m=e.mesh,a=e.g.attributes;if(m.geometry!==e.g||e.g.index!==e.index)throw Error('Elbow source geometry changed');m.updateMatrixWorld(true);m.skeleton.update();
      e.positionSave=[...e.vertices.keys()].map(i=>[i,[a.position.getX(i),a.position.getY(i),a.position.getZ(i)]]);
      e.normalSave=[...e.normalIds].map(i=>[i,[a.normal.getX(i),a.normal.getY(i),a.normal.getZ(i)]]);
      if(mode==='dqs')for(const [i,r]of e.vertices){
        if(r.footWeight<1e-8||r.footWeight>1-1e-8)continue;
        const original=point(m,i),target=math.point(r.p,math.blend(transforms[r.side],[r.footWeight,1-r.footWeight]));target.lerp(original,1-r.mask);
        diagnostics.maxMoveMm=Math.max(diagnostics.maxMoveMm,original.distanceTo(target)*1000);diagnostics.vertices++;
        const M=skin(m,i);if(Math.abs(M.determinant())<1e-10)throw Error('Singular elbow LBS inverse');target.applyMatrix4(M.invert());a.position.setXYZ(i,...target.toArray());
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
    if(diagnostics.seamMaxGapMm>.01)throw Error('Elbow corrected seam opened');api.last=diagnostics;
  }
  function before(...args){previousBefore?.apply(this,args);if(api.active)update();}
  function after(...args){previousAfter?.apply(this,args);if(pending)pending();}
  function render(...args){const outer=depth++===0;try{return previousRender.apply(this,args);}finally{depth--;if(outer)restore();}}
  const api=window.__elbowDqsR1={version:'0.1.0-experimental',mode,active:true,last:null,
    sample(fn){if(changed)return fn();if(pending)throw Error('Nested elbow sample');let result,error;pending=()=>{try{result=fn();}catch(e){error=e;}};try{v.renderer.render(v.scene,v.camera);}finally{pending=null;}if(error)throw error;return result;},
    detach(){if(depth)throw Error('Cannot detach during render');if(v.scene.onBeforeRender!==before||v.scene.onAfterRender!==after||v.renderer.render!==render)throw Error('Detach later hooks first');restore();v.scene.onBeforeRender=previousBefore;v.scene.onAfterRender=previousAfter;v.renderer.render=previousRender;api.active=false;},
    config:{mode,vertices:entries.map(e=>({mesh:e.mesh.name,selected:e.vertices.size,normalVertices:e.normalIds.size})),seamPairs:input.pairs.length,handsChanged:false,bonesChanged:false,weightsChanged:false,region:'elbow-only UpperArm/Forearm blend',reviewed:false}};
  v.scene.onBeforeRender=before;v.scene.onAfterRender=after;v.renderer.render=render;
  return api.config;
}
