// Verification and preflight rejection only; no real scene or browser.
import assert from 'node:assert/strict';
import * as model from '../../../drill-anim/models/training-human-v3-completed-r4/loader.mjs';
const verified=await model.verify(),page={evaluations:0,mutations:0,async evaluate(){this.evaluations++;return {baseNormals:false};},async addScriptTag(){this.mutations++;}};
await assert.rejects(model.applyV3(page,{}),/initial torso, limbs and hands/);
await assert.rejects(model.applyV3(page,{v2plus:{torso:'base',limbs:'base',hands:'base',head:'other'}}),/alternative head/);
await assert.rejects(model.applyV3(page,{v2plus:{torso:'base',limbs:'base',hands:'base'}},{handDir:'other'}),/c1r2 hands/);
assert.equal(page.evaluations,0);assert.equal(page.mutations,0);
await assert.rejects(model.applyV3(page,{v2plus:{torso:'base',limbs:'base',hands:'base'}}),/fresh normals-r1 boot/);
assert.equal(page.evaluations,1);assert.equal(page.mutations,0);
console.log(JSON.stringify({verified,preflightRejected:true,mutations:0,limitations:'No actual v3 scene or browser.'}));
