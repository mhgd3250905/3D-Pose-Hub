import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('layer shader injection stays idempotent under profile hook wrapping',()=>{
  const material={onBeforeCompile(){},customProgramCacheKey(){return 'toon-drill1';}};
  const mesh={isMesh:true,material};
  const context={window:{},__toonT:{},flareInspector:{viewer:{scene:{traverse:f=>f(mesh)}}},WeakMap,Map};
  vm.runInNewContext(fs.readFileSync(new URL('./browser-layers.js',import.meta.url),'utf8'),context);
  context.window.__v2Layers.patch();
  const inner=material.onBeforeCompile;material.onBeforeCompile=function(s,r){inner.call(this,s,r);};
  context.window.__v2Layers.patch();
  const sh={uniforms:{},fragmentShader:'void main(){ float d=0.7; vec3 lit=vec3(0.0); vec3 cyl=vec3(1.0); lit=mix(lit,cyl,d*0.94); }'};
  material.onBeforeCompile(sh,{});
  assert.equal(sh.fragmentShader.match(/uniform float uV2LayerPass;/g).length,1);
  assert.equal(sh.fragmentShader.match(/float v2LayerMask=d;/g).length,1);
  assert.match(sh.fragmentShader,/if\(uV2LayerPass<0.5\) d=0.0/);
  assert.match(sh.fragmentShader,/vec4\(vec3\(v2LayerMask\),1.0\)/);
});

test('props remain black depth occluders in mask pass',()=>{
  const m={onBeforeCompile(){},customProgramCacheKey(){return 'toon-prop1';}};
  const context={window:{},__toonT:{},flareInspector:{viewer:{scene:{traverse:f=>f({isMesh:true,material:m})}}},WeakMap,Map};
  vm.runInNewContext(fs.readFileSync(new URL('./browser-layers.js',import.meta.url),'utf8'),context);
  context.window.__v2Layers.patch();const s={uniforms:{},fragmentShader:'void main(){ gl_FragColor=vec4(1.0); }'};m.onBeforeCompile(s,{});
  assert.match(s.fragmentShader,/gl_FragColor=vec4\(0.0,0.0,0.0,1.0\)/);
  assert.equal(m.depthWrite,undefined); // Adapter leaves Three's enabled default intact.
});

test('stale collar hook remains distinguishable from the regions hook for native repair',()=>{
  const regionsHook=function(sh){sh.fragmentShader='uniform float uV2pRon;\n'+sh.fragmentShader;};
  const nativeCollarHook=function(){};
  // Training-collar restores a cached pre-regions hook. The regions loader must
  // still see this identity mismatch after the layer adapter wraps that hook.
  const material={onBeforeCompile:nativeCollarHook,__v2prHook:regionsHook,
    customProgramCacheKey(){return 'toon-drill1-v2p|trainingNativeCollar1';}};
  const context={window:{},__toonT:{},flareInspector:{viewer:{scene:{traverse:f=>f({isMesh:true,material})}}},WeakMap,Map};
  vm.runInNewContext(fs.readFileSync(new URL('./browser-layers.js',import.meta.url),'utf8'),context);
  context.window.__v2Layers.patch();
  const sh={uniforms:{},fragmentShader:'void main(){ float d=0.0; vec3 lit=vec3(0.0); vec3 cyl=vec3(1.0); lit=mix(lit,cyl,d*0.94); }'};
  material.onBeforeCompile(sh,{});
  assert.match(sh.fragmentShader,/uV2LayerPass/);
  assert.doesNotMatch(sh.fragmentShader,/uV2pRon/);
  assert.equal(material.__v2prHook,regionsHook,'Wrapping a stale collar hook must not mark it as region-patched');
  assert.notEqual(material.onBeforeCompile,material.__v2prHook,'Native setRegions must detect the mismatch and reattach its shader');
});

test('custom shadow depth retains the active vertex program and shared deformation uniforms',()=>{
  const breath={value:.001},sink={value:1};let compiled;
  const material={colorWrite:true,depthWrite:true,onBeforeCompile(sh){sh.uniforms.uBreath=breath;sh.uniforms.uSinkK=sink;
    sh.vertexShader='uniform float uBreath; uniform float uSinkK;\n'+sh.vertexShader.replace('gl_Position=vec4(0.0);','gl_Position=vec4(uBreath+uSinkK);');},customProgramCacheKey(){return 'toon-test';}};
  material.__v2prHook=material.onBeforeCompile;
  const mesh={isMesh:true,name:'body',visible:true,material},catcher={visible:false};
  const viewer={coach:{position:{x:0},updateMatrixWorld(){}},shadowCatcher:catcher,scene:{traverse:f=>f(mesh)},renderer:{shadowMap:{},domElement:{toDataURL:()=>''},render(){
    const shader={uniforms:{},vertexShader:'standard depth vertex',fragmentShader:'standard depth packing'};
    mesh.customDepthMaterial.onBeforeCompile(shader,{});compiled=shader;
  }}};
  const T={MeshDepthMaterial:class{dispose(){}},RGBADepthPacking:3201,UniformsUtils:{clone:()=>({})},ShaderLib:{toon:{vertexShader:'void main(){gl_Position=vec4(0.0);}',fragmentShader:'void main(){gl_FragColor=vec4(1.0);}',uniforms:{}}}};
  const context={window:{},__toonT:T,__toonUni:{uBreath:breath,uSinkK:sink},flareInspector:{viewer},WeakMap,Map};
  vm.runInNewContext(fs.readFileSync(new URL('./browser-layers.js',import.meta.url),'utf8'),context);
  context.window.__v2Layers.patch();assert.equal(material.__v2prHook,material.onBeforeCompile);
  context.window.__v2Layers.shadowProbe();
  assert.match(compiled.vertexShader,/gl_Position=vec4\(uBreath\+uSinkK\)/);
  assert.match(compiled.vertexShader,/vHighPrecisionZW=gl_Position.zw/);
  assert.equal(compiled.fragmentShader,'standard depth packing');
  assert.equal(compiled.uniforms.uBreath,breath);assert.equal(compiled.uniforms.uSinkK,sink);
  assert.equal(breath.value,.001);assert.equal(sink.value,1);assert.equal(material.depthWrite,true);
});

test('hand surface scan includes left/right finger bones and excludes undrawn vertices',()=>{
  class V{set(x,y,z){Object.assign(this,{x,y,z});return this;}applyMatrix4(){return this;}}
  const m={onBeforeCompile(){},customProgramCacheKey(){return 'test';}};
  const ys=[.015,.005,.007,.014,-.003,.009,-99],boneIds=[0,2,2,1,3,3,0];
  const mesh={isMesh:true,isSkinnedMesh:true,name:'V2P_Base_Hands',visible:true,material:m,matrixWorld:{},
    getVertexPosition(i,p){return p.set(0,ys[i],0);},
    geometry:{drawRange:{start:0,count:6},index:{count:6,getX:i=>i},attributes:{position:{count:7},
      skinIndex:{getComponent:(i)=>boneIds[i]},skinWeight:{getComponent:(_,k)=>k===0?1:0}}},
    skeleton:{bones:['leftHand','rightHand','v2p_L_index1','v2p_R_index1'].map(name=>({name})),update(){}}};
  const viewer={coach:{updateMatrixWorld(){},traverse:f=>f(mesh)},scene:{traverse:f=>f(mesh)},
    renderer:{render(){},domElement:{toDataURL(){return'';}}},camera:{matrixWorld:{elements:[]},projectionMatrix:{elements:[]}}};
  const context={window:{},__toonT:{Vector3:V},__glowU:{value:0},__drill:{frame:()=>({M:{x:[]}})},flareInspector:{viewer},WeakMap,Map,Set};
  vm.runInNewContext(fs.readFileSync(new URL('./browser-layers.js',import.meta.url),'utf8'),context);
  const s=context.window.__v2Layers.capture({},0,0,null,[]).metrics.visibleSurface;
  assert.equal(s.hands.left.vertices,3);assert.equal(s.hands.right.vertices,3);
  assert.equal(s.hands.left.minY,.005);assert.equal(s.hands.right.minY,-.003);assert.equal(s.minY,-.003);
});
