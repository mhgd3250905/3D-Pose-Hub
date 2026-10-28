// Offline structural test; not a real renderer or equivalence test.
import assert from 'node:assert/strict';
import {installAnkleMaterials} from '../../../drill-anim/models/body-v3-ankle-integrated-r4/material-r1.mjs';
import {verify} from '../../../drill-anim/models/body-v3-ankle-integrated-r4/install.mjs';
const uniform={value:0.8};class Material{constructor(name){this.name=name;this.side=0;this.onBeforeCompile=shader=>{shader.uniforms.theme=uniform;shader.uniforms.uShoe={value:name==='body'?0:1};};this.customProgramCacheKey=()=>name==='body'?'v2p-base':name;}clone(){const x=new Material(this.name);Object.assign(x,this);return x;}}
const body={isSkinnedMesh:true,material:new Material('body')},shoe={isSkinnedMesh:true,material:new Material('shoe')},detail={isSkinnedMesh:true,material:new Material('detail')},unrelated={material:shoe.material};
const originals=[body.material,shoe.material,detail.material],map={Coach_Body:body,Coach_Sneakers:shoe,Coach_Shoe_Details:detail};globalThis.window={__toonT:{FrontSide:0,DoubleSide:2},flareInspector:{viewer:{coach:{getObjectByName:n=>map[n]}}}};
const page={evaluate:fn=>fn()};verify();await installAnkleMaterials(page);
assert.notEqual(body.material,originals[0]);assert.notEqual(shoe.material,originals[1]);assert.notEqual(detail.material,originals[2]);assert.equal(unrelated.material,originals[1]);assert.equal(originals[1].side,0);assert.equal(shoe.material.side,2);assert.equal(detail.material.side,2);
const marker='if(uV2pOut>0.5){ vec3 fN=normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition))); if(!gl_FrontFacing||(abs(dot(fN,V))>0.45&&dot(Nn,V)<0.15)){ lit=shc*0.8; fr=0.0; } }';
const shader={uniforms:{},fragmentShader:'vV2p '+marker+' lit+=rimc*smoothstep(0.55,0.9,fr)*uRim*(1.0-d)*vRimK;'};body.material.onBeforeCompile(shader,{});assert.match(shader.fragmentShader,/float r13ankle=/);assert.match(shader.fragmentShader,/float r16ankle=/);assert.match(shader.fragmentShader,/if\(!gl_FrontFacing\)/);assert.equal(shader.uniforms.theme,uniform);
for(const m of [shoe.material,detail.material]){const shader={uniforms:{}};m.onBeforeCompile(shader,{});assert.equal(shader.uniforms.uShoe.value,1);assert.equal(shader.uniforms.theme,uniform);assert.match(m.customProgramCacheKey(),/ankle-shoe-inner-r17/);}
console.log('integrated material chain structural test passed; real-scene comparison remains required');
