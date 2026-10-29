import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {makeAnkleDqsMath,installAnkleDqsInPage} from './ankle-dqs-r1.mjs';

test('DQS preserves rigid endpoints and blend radius, including opposite quaternion signs',()=>{
  const math=makeAnkleDqsMath(T),p=new T.Vector3(1,0,0);
  const a=math.encode(new T.Matrix4().makeRotationZ(-Math.PI/3)),b=math.encode(new T.Matrix4().makeRotationZ(Math.PI/3));
  const q=math.point(p,math.blend([a,b],[.5,.5]));assert.ok(q.distanceTo(p)<1e-12);
  assert.ok(math.point(p,math.blend([a,b],[1,0])).distanceTo(p.clone().applyMatrix4(new T.Matrix4().makeRotationZ(-Math.PI/3)))<1e-12);
  for(const k of ['x','y','z','w']){b.r[k]*=-1;b.d[k]*=-1;}
  assert.ok(math.point(p,math.blend([a,b],[.5,.5])).distanceTo(p)<1e-12);
  const m=new T.Matrix4().compose(new T.Vector3(2,3,4),new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.7),new T.Vector3(1,1,1));
  assert.ok(math.point(p,math.blend([math.encode(m)],[1])).distanceTo(p.clone().applyMatrix4(m))<1e-12);
  assert.throws(()=>math.encode(new T.Matrix4().makeScale(2,1,1)),/rigid/);
});

for(const mode of ['dqs','normals-only'])test(mode+' runtime preserves shoes and restores exact buffers/hooks',()=>{
  const oldWindow=globalThis.window,oldInspector=globalThis.flareInspector;
  const coach=new T.Group(),scene=new T.Scene();scene.add(coach);
  for(const side of ['left','right']){const shin=new T.Bone(),foot=new T.Bone();shin.name=side+'Shin';foot.name=side+'Foot';shin.position.set(side==='left'?.08:-.08,.42,0);foot.position.set(0,-.42,0);shin.add(foot);coach.add(shin);}
  coach.updateMatrixWorld(true);
  const bones=['leftShin','leftFoot','rightShin','rightFoot'].map(n=>coach.getObjectByName(n));
  function makeMesh(name){
    const g=new T.BufferGeometry(),pos=[],si=[],sw=[];
    for(const side of ['left','right'])for(let ring=0;ring<3;ring++)for(let k=0;k<8;k++){
      const theta=k*Math.PI/4;pos.push((side==='left'?.08:-.08)+.025*Math.cos(theta),ring*.04,.025*Math.sin(theta));
      const first=side==='left'?0:2;si.push(first,first+1,0,0);sw.push(ring/2,1-ring/2,0,0);
    }
    const indices=[];for(let side=0;side<2;side++)for(let ring=0;ring<2;ring++)for(let k=0;k<8;k++){const a=side*24+ring*8+k,b=side*24+ring*8+(k+1)%8,c=a+8,d=b+8;indices.push(a,b,c,b,d,c);}
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));g.setIndex(indices);g.computeVertexNormals();
    const m=new T.SkinnedMesh(g,new T.MeshBasicMaterial());m.name=name;coach.add(m);m.bind(new T.Skeleton(bones));return m;
  }
  const body=makeMesh('Coach_Body'),limb=makeMesh('V2P_Base_Limbs'),shoe=makeMesh('Coach_Sneakers');
  let beforeCalls=0,afterCalls=0;const previousBefore=()=>beforeCalls++,previousAfter=()=>afterCalls++;scene.onBeforeRender=previousBefore;scene.onAfterRender=previousAfter;
  const renderer={render(){scene.onBeforeRender();scene.onAfterRender();}};const previousRender=renderer.render;
  const v={coach,scene,renderer,camera:new T.PerspectiveCamera(),motion:{capturePose(){return{};},applyPose(){},reset(){for(const b of bones)b.quaternion.identity();}}};
  globalThis.window={__toonT:T,__ankleIntegratedR4:{},__v2p:{limbs:{on:true,mesh:limb}},__makeAnkleDqsMath:makeAnkleDqsMath};globalThis.flareInspector={viewer:v};
  try{
    const pairs=Array.from({length:8},(_,i)=>['left',8+i,8+i]);const originalP=body.geometry.attributes.position.array.slice(),originalN=body.geometry.attributes.normal.array.slice(),shoeP=shoe.geometry.attributes.position.array.slice();
    const setup=installAnkleDqsInPage({pairs,mode});assert.equal(setup.shoesChanged,false);
    bones[1].rotation.x=.8;bones[3].rotation.x=.8;coach.updateMatrixWorld(true);
    const diagnostic=window.__ankleDqsR1.sample(()=>({...window.__ankleDqsR1.last}));
    if(mode==='dqs')assert.ok(diagnostic.maxMoveMm>0);else assert.equal(diagnostic.maxMoveMm,0);assert.ok(diagnostic.seamMaxGapMm<1e-5);
    assert.deepEqual(body.geometry.attributes.position.array,originalP);assert.deepEqual(body.geometry.attributes.normal.array,originalN);assert.deepEqual(shoe.geometry.attributes.position.array,shoeP);
    assert.equal(beforeCalls,1);assert.equal(afterCalls,1);
    assert.throws(()=>window.__ankleDqsR1.sample(()=>{throw Error('test sample error');}),/sample error/);
    assert.deepEqual(body.geometry.attributes.position.array,originalP);window.__ankleDqsR1.detach();
    assert.equal(scene.onBeforeRender,previousBefore);assert.equal(scene.onAfterRender,previousAfter);assert.equal(renderer.render,previousRender);
  }finally{globalThis.window=oldWindow;globalThis.flareInspector=oldInspector;}
});
