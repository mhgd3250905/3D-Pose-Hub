import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {makeAnkleJoinMath,installAnkleJoinInPage,fairAnkleContours} from './ankle-join-r4.mjs';

test('ankle transported connection is straight at rest and C1 at both rigid endpoints',()=>{
  const m=makeAnkleJoinMath(T),Y=new T.Vector3(0,1,0);
  for(const degrees of [-52,0,30,52]){
    const q0=new T.Quaternion(),q1=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),degrees*Math.PI/180);
    const a=new T.Vector3(0,-.012,0),b=new T.Vector3(0,.165,0).applyQuaternion(q1),s=m.state(a,b,q0,q1,.177);
    const first=m.section(s,0),last=m.section(s,1);
    assert.ok(first.center.distanceTo(a)<1e-12);assert.ok(last.center.distanceTo(b)<1e-12);
    assert.ok(first.tangent.distanceTo(Y)<1e-10);assert.ok(last.tangent.distanceTo(Y.clone().applyQuaternion(q1))<1e-10);
    assert.ok(first.q.angleTo(q0)<1e-7);assert.ok(last.q.angleTo(q1)<1e-7);
    let bound=1;for(let i=0;i<=64;i++)bound=Math.min(bound,1-m.section(s,i/64).curvature*.04);
    assert.ok(bound>0,'required 52 degree section must not fold');
    assert.ok(first.curvature<1e-9);assert.ok(last.curvature<1e-9);
    if(!degrees)assert.ok(m.point(s,.5,.04,.03).distanceTo(new T.Vector3(.04,.0765,.03))<1e-12);
  }
});

test('shared join preserves rigid shoes/bones and exact restore while joining skin source seams',()=>{
  const oldWindow=globalThis.window,oldInspector=globalThis.flareInspector,coach=new T.Group(),scene=new T.Scene();scene.add(coach);
  for(const side of ['left','right']){const shin=new T.Bone(),foot=new T.Bone();shin.name=side+'Shin';foot.name=side+'Foot';shin.position.set(side==='left'?.08:-.08,.42,0);foot.position.y=-.42;shin.add(foot);coach.add(shin);}
  coach.updateMatrixWorld(true);const bones=['leftShin','leftFoot','rightShin','rightFoot'].map(n=>coach.getObjectByName(n));
  const N=24,heights=[-.03,0,.04,.08,.12,.16,.20];
  function makeMesh(name,shoe=false){
    const g=new T.BufferGeometry(),pos=[],si=[],sw=[],rings=shoe?[-.04,.02]:heights;
    for(const side of ['left','right'])for(const h of rings)for(let k=0;k<N;k++){
      const theta=k*2*Math.PI/N,r=shoe?.045:.033+Math.max(0,h)*.055;
      pos.push((side==='left'?.08:-.08)+r*Math.cos(theta),h,(shoe?.055:r)*Math.sin(theta));
      const first=side==='left'?0:2,w=shoe?0:Math.max(0,Math.min(1,h/.08));si.push(first,first+1,0,0);sw.push(w,1-w,0,0);
    }
    const idx=[];for(let side=0;side<2;side++)for(let r=0;r<rings.length-1;r++)for(let k=0;k<N;k++){const a=side*rings.length*N+r*N+k,b=side*rings.length*N+r*N+(k+1)%N,c=a+N,d=b+N;idx.push(a,b,c,b,d,c);}
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));g.setIndex(idx);g.computeVertexNormals();
    const mesh=new T.SkinnedMesh(g,new T.MeshBasicMaterial());mesh.name=name;coach.add(mesh);mesh.bind(new T.Skeleton(bones));return mesh;
  }
  const body=makeMesh('Coach_Body'),limb=makeMesh('V2P_Base_Limbs'),shoe=makeMesh('Coach_Sneakers',true);
  const oldBefore=()=>{},oldAfter=()=>{};scene.onBeforeRender=oldBefore;scene.onAfterRender=oldAfter;
  const renderer={render(){scene.onBeforeRender();scene.onAfterRender();}},oldRender=renderer.render;
  const v={coach,scene,renderer,camera:new T.PerspectiveCamera(),motion:{capturePose(){return{};},applyPose(){},reset(){for(const b of bones)b.quaternion.identity();}}};
  globalThis.window={__toonT:T,__ankleIntegratedR4:{},__v2p:{limbs:{on:true,mesh:limb}},__makeAnkleJoinMath:makeAnkleJoinMath,__fairAnkleContours:fairAnkleContours};globalThis.flareInspector={viewer:v};
  try{
    const pairs=['left','right'].flatMap((s,side)=>Array.from({length:N},(_,i)=>[s,side*heights.length*N+3*N+i,side*heights.length*N+3*N+i]));
    const positions=body.geometry.attributes.position.array.slice(),normals=body.geometry.attributes.normal.array.slice(),shoePositions=shoe.geometry.attributes.position.array.slice();
    const setup=installAnkleJoinInPage({pairs});assert.equal(setup.shoesChanged,false);assert.equal(setup.weightsChanged,false);
    bones[1].rotation.x=.8;bones[3].rotation.x=.8;coach.updateMatrixWorld(true);const boneMatrices=bones.map(b=>b.matrixWorld.toArray());
    const d=window.__ankleJoinR4.sample(()=>structuredClone(window.__ankleJoinR4.last));assert.ok(d.maxMoveMm>1);assert.ok(d.seamMaxGapMm<1e-4);assert.ok(d.sides.left.conservativeJacobianLowerBound>0);
    assert.deepEqual(body.geometry.attributes.position.array,positions);assert.deepEqual(body.geometry.attributes.normal.array,normals);assert.deepEqual(shoe.geometry.attributes.position.array,shoePositions);assert.deepEqual(bones.map(b=>b.matrixWorld.toArray()),boneMatrices);
    assert.throws(()=>window.__ankleJoinR4.sample(()=>{throw Error('sample-error');}),/sample-error/);assert.deepEqual(body.geometry.attributes.position.array,positions);
    window.__ankleJoinR4.detach();assert.equal(scene.onBeforeRender,oldBefore);assert.equal(scene.onAfterRender,oldAfter);assert.equal(renderer.render,oldRender);
  }finally{globalThis.window=oldWindow;globalThis.flareInspector=oldInspector;}
});

test('local fairing removes short-wavelength surface noise while pinning endpoints and axial coordinates',()=>{
  const points=[],neighbors=[],weights=[],N=24,R=9;
  for(let j=0;j<R;j++)for(let i=0;i<N;i++){
    const theta=i*2*Math.PI/N,r=.035+(j>0&&j<R-1?.002*(i%2?1:-1):0);
    points.push([r*Math.cos(theta),j*.015,r*Math.sin(theta)]);
    neighbors.push([j*N+(i+N-1)%N,j*N+(i+1)%N,...(j?[((j-1)*N+i)]:[]),...(j<R-1?[((j+1)*N+i)]:[])]);
    weights.push(j===0||j===R-1?0:1);
  }
  const result=fairAnkleContours(points,neighbors,weights);
  let before=0,after=0;
  for(let i=0;i<points.length;i++){
    assert.equal(result[i][1],points[i][1]);assert.ok(Math.hypot(result[i][0]-points[i][0],result[i][2]-points[i][2])<=.00400000001);
    if(!weights[i])assert.deepEqual(result[i],points[i]);
    else{before+=Math.abs(Math.hypot(points[i][0],points[i][2])-.035);after+=Math.abs(Math.hypot(result[i][0],result[i][2])-.035);}
  }
  assert.ok(after<before*.6,'small alternating radial ridges should be smoothed without moving anchors');
});
