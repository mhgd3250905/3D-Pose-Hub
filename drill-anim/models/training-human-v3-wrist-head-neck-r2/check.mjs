// Static integrity and rejection paths; actual composition requires a browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as combined from './loader.mjs';
const result=await combined.verify();
assert.equal(result.headNeck.version,'1.0.0-r2');assert.equal(result.wrist,'0.1.0-r1');
const page={calls:0,async evaluate(){this.calls++;return {fragment:true,wrist:false};}};
await assert.rejects(combined.applyV3(page,{v2plus:{head:'custom'}}),/alternative head/);assert.equal(page.calls,0);
await assert.rejects(combined.applyV3(page,{}, {handDir:'hands-native-r8'}),/hands-native-c1r2/);assert.equal(page.calls,0);
await assert.rejects(combined.applyV3(page,{}),/already installed/);assert.equal(page.calls,1);
// Check patch isolation from an already-attached head material. This mocks
// shader compilation only; it does not test the real renderer or visual output.
const headHook=()=>{},handHook=()=>{},headMaterial={onBeforeCompile:headHook},handMaterial={userData:{},onBeforeCompile:handHook,customProgramCacheKey(){return 'base';}};
const window={__v2p:{hands:{mesh:{name:'V2P_Base_Hands',material:handMaterial}}},__v3HeadNeckFragment:{fragment:{mesh:{material:headMaterial}}}};
vm.runInNewContext(fs.readFileSync(new URL('../../../tools/body-v3/wrist-gradient-r2.js',import.meta.url),'utf8'),{window});
const installed=window.__installBodyV3WristGradientR2();assert.equal(installed.transitionMm,25);assert.equal(headMaterial.onBeforeCompile,headHook);
const shader={fragmentShader:'uniform float uV2pOut;\nfloat v2cuff=0.0;\nvec3 alb=vec3(0.0)'};handMaterial.onBeforeCompile(shader);assert.match(shader.fragmentShader,/uV2pSleeve < 0\.5/);assert.match(shader.fragmentShader,/smoothstep\(0\.006, 0\.031/);
assert.equal(window.__installBodyV3WristGradientR2().already,true);
console.log(JSON.stringify({verified:result,alternativeHeadRejected:true,alternateHandsRejected:true,duplicateRejected:true,headMaterialUnchanged:true,wristShaderHookInstalled:true}));
