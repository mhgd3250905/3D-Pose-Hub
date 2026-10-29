import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {capturePlan,validateReview,parseArgs,sampleActualRender,MODEL} from './render.mjs';
import {adaptRecipe} from './recipe.mjs';
import {analyzeQuaternionPath,rotationPathSummary} from './rotation-path.mjs';
import {installHighlightMaterial} from './highlight-material.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('highlight surface layer preserves opaque depth and prior shader hooks',()=>{
  const oldWindow=globalThis.window,oldInspector=globalThis.flareInspector;
  let calls=0;
  const mat={isMeshToonMaterial:true,transparent:false,depthWrite:true,opacity:1,onBeforeCompile(s){calls++;s.uniforms.previous={value:7};},customProgramCacheKey(){return 'existing-model';}};
  globalThis.window={};globalThis.flareInspector={viewer:{coach:{traverse(fn){fn({material:mat});fn({material:mat});}}}};
  try{
    const r=installHighlightMaterial({opacity:.48,emission:.17,fresnel:.25});
    const shader={uniforms:{},fragmentShader:'lit=mix(lit,cyl,d*0.94);'};
    mat.onBeforeCompile(shader,{});
    assert.equal(r.patched,1);assert.equal(calls,1);assert.equal(shader.uniforms.previous.value,7);
    assert.equal(mat.transparent,false);assert.equal(mat.depthWrite,true);assert.equal(mat.opacity,1);
    assert.equal(shader.uniforms.uReviewHiOpacity.value,.48);assert.match(mat.customProgramCacheKey(),/^existing-model-/);
    assert.equal(window.__reviewHighlightMaterial.compiled,1);
    mat.onBeforeCompile({uniforms:{},fragmentShader:'custom non-highlight material'},{});
    assert.equal(window.__reviewHighlightMaterial.skipped,1);
  }finally{globalThis.window=oldWindow;globalThis.flareInspector=oldInspector;}
});
const source=()=>({id:'test-r2',modelProfile:'training-human-v2plus-hands-native',runtimeModel:{profile:'old',version:'old'},nativeHands:{version:'old',twistShare:.5},
  v2plus:{outfit:'compression',skin:'realistic'},camera:{dir:[1,.2,1],drift:0,orbitDegrees:0,frontSweepDegrees:0,fitTimeline:true},timeline:{duration:8},stillAt:2,keyFrames:[0,2,4],
  props:[{type:'gripHand',side:'left'},{type:'gripHand',side:'right'},{type:'dumbbell',attach:'leftHand'},{type:'dumbbell',attach:'rightHand'}]});
const recipe=()=>({format:'pose-hub-action-recipe@1',id:'test',model:{...MODEL},hands:{left:'dumbbell-grasp',right:'dumbbell-grasp'},camera:{dir:[.4,.2,1],drift:0,orbitDegrees:0,frontSweepDegrees:0,fitTimeline:true},output:{groundShadow:false,cameraMotion:false,wholeCycleContentRect:true,fps:30}});

test('recipe selects current model explicitly, removes duplicate dumbbells, preserves source object',()=>{
  const s=source(),before=structuredClone(s),result=adaptRecipe(s,recipe());
  assert.deepEqual(s,before);assert.deepEqual(result.spec.runtimeModel,MODEL);assert.deepEqual(result.spec.nativeHands,{twistShare:.5});assert.deepEqual(result.spec.props,[]);
  assert.equal(result.handSetup.removedSourceDumbbells,2);assert.equal(result.handSetup.status,'fixed-template-accepted-action-validation-pending');
  assert.deepEqual(result.spec.camera.dir,[.4,.2,1]);
});
test('one-sided and wrong-implement fixed grasp requests fail without fallback',()=>{
  const r=recipe();r.hands.right='relaxed';assert.throws(()=>adaptRecipe(source(),r),/both hands/);
  const s=source();s.props=s.props.filter(p=>p.attach!=='rightHand');assert.throws(()=>adaptRecipe(s,recipe()),/exactly one/);
  s.props.push({type:'kettlebell',attach:'rightHand'});assert.throws(()=>adaptRecipe(s,recipe()));
  const wrong=recipe();wrong.model.version='other';assert.throws(()=>adaptRecipe(source(),wrong),/armfix/);
});
test('native support and assist have explicit pose mappings and pending status',()=>{
  const r=recipe();r.hands={left:'support',right:'assist'};const result=adaptRecipe(source(),r);
  assert.deepEqual(result.spec.v2plus.handPose,{left:'palm-floor',right:'open'});
  assert.equal(result.handSetup.status,'native-candidate-action-validation-pending');assert.equal(result.spec.props.length,4);
});

test('fixed band grip keeps band endpoints and hides the dumbbell geometry',()=>{
  const s=source();s.props=[{type:'band',from:{joint:'leftWrist'},to:{joint:'leftAnkle'}}];
  const r=recipe();r.hands={left:'fixed-grasp',right:'fixed-grasp'};
  const a=adaptRecipe(s,r);assert.deepEqual(a.spec.props,s.props);assert.equal(a.handSetup.showDumbbells,false);assert.equal(a.handSetup.removedSourceDumbbells,0);
  s.props=[{type:'kettlebell'}];assert.throws(()=>adaptRecipe(s,r),/band actions only/);
});
test('optional floor removal retains required head cushions',()=>{
  const s=source(),r=recipe();r.hands={left:'relaxed',right:'relaxed'};r.output.exerciseMat=false;
  s.props=[{type:'mat'},{type:'mat',required:true},{type:'bench'}];
  assert.deepEqual(adaptRecipe(s,r).spec.props,[{type:'mat',required:true},{type:'bench'}]);
});
test('optional highlight appearance validates finite values and does not mutate source',()=>{
  const s=source(),before=structuredClone(s),r=recipe();
  assert.equal(adaptRecipe(s,r).spec.renderAppearance,undefined);
  r.appearance={highlight:{color:'#F05A36',shade:[.5,.42,.08],intensity:[.75,1]}};
  const adapted=adaptRecipe(s,r);assert.deepEqual(adapted.spec.renderAppearance,r.appearance);assert.deepEqual(s,before);
  assert.notStrictEqual(adapted.spec.renderAppearance,r.appearance);
  for(const mutate of [h=>h.color='orange',h=>h.shade[0]=NaN,h=>h.shade[1]=Infinity,h=>h.intensity=[1,.75],h=>h.intensity[0]=-.1]){
    const bad=structuredClone(r);mutate(bad.appearance.highlight);assert.throws(()=>adaptRecipe(s,bad));
  }
});
test('preview playback covers complete loop at 12fps while solve and endpoint stay 30fps',()=>{
  const spec=adaptRecipe(source(),recipe()).spec,p=capturePlan(spec,30,12);
  assert.equal(p.frameCount,240);assert.equal(p.previewPlaybackFrames.length,96);assert.equal(new Set(p.previewPlaybackFrames).size,96);
  assert.equal(p.previewPlaybackFrames[0],0);assert.ok(p.previewPlaybackFrames.at(-1)<240);
  for(const f of [...p.previewPlaybackFrames,0,60,120,239,240])assert.ok(p.previewFrames.includes(f));
  const moved=structuredClone(spec);moved.camera.orbitDegrees=180;assert.throws(()=>capturePlan(moved),/motion/);
  assert.throws(()=>capturePlan(spec,30,31),/FPS/);
});
test('CLI handles explicit low-resolution review knobs and rejects duplicates',()=>{
  const args=parseArgs(['--recipe','recipe.json','--out','new','--runtime','pin','--size','360','--preview-fps','12']);
  assert.equal(args.size,360);assert.equal(args.previewFps,12);assert.throws(()=>parseArgs(['--recipe','a','--recipe','b']));
});
test('360-degree sampled motion is distinguished from identical endpoints and sign flips',()=>{
  const rows=Array.from({length:37},(_,i)=>({frame:i,time:i/30,quaternion:[0,Math.sin(i*Math.PI/36),0,Math.cos(i*Math.PI/36)]}));
  const p=analyzeQuaternionPath(rows);assert.ok(Math.abs(p.totalAngularTravelDeg-360)<1e-8);assert.ok(p.endpointShortestDeg<1e-8);assert.ok(Math.abs(p.maxAdjacentShortestDeg-10)<1e-8);
  const signs=analyzeQuaternionPath([{frame:0,time:0,quaternion:[0,0,0,1]},{frame:1,time:1/30,quaternion:[0,0,0,-1]}]);assert.equal(signs.totalAngularTravelDeg,0);
  assert.equal(rotationPathSummary([{frame:0,time:0,rotations:{}}]).missing.length,12);
});
test('actual-render sampling observes temporary twist and restores prior hook on success and failure',()=>{
  let rotation='solver',priorCalls=0,renders=0;
  const oldAfter=()=>{priorCalls++;};
  const viewer={scene:{onAfterRender:oldAfter},camera:{},renderer:{render(scene){renders++;rotation='temporary-render-twist';try{scene.onAfterRender();}finally{rotation='solver';}}}};
  const sampled=sampleActualRender(viewer,null,()=>rotation);
  assert.equal(sampled.rotations,'temporary-render-twist');assert.equal(sampled.capturedAt,'scene.onAfterRender');assert.equal(rotation,'solver');assert.equal(priorCalls,1);assert.equal(renders,1);assert.strictEqual(viewer.scene.onAfterRender,oldAfter);
  assert.throws(()=>sampleActualRender(viewer,null,()=>{throw Error('read failure');}),/read failure/);
  assert.strictEqual(viewer.scene.onAfterRender,oldAfter);assert.equal(rotation,'solver');
});
test('active wrist sampling uses its own actual-render callback without an extra render',()=>{
  let calls=0,phase='solver';const sides={left:{swingDegrees:30,twistDegrees:20,bodySeamMaxGapMm:0}};
  const wrist={active:true,last:sides,sample(fn){calls++;phase='after-render';try{return fn();}finally{phase='solver';}}};
  const viewer={renderer:{render(){throw Error('duplicate render');}}};
  const actual=sampleActualRender(viewer,wrist,()=>phase);
  assert.equal(calls,1);assert.equal(actual.rotations,'after-render');assert.deepEqual(actual.sides,sides);assert.notStrictEqual(actual.sides,sides);assert.equal(phase,'solver');
});
test('full receipt binds recipe, source, runtime, camera, report and viewed bytes',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'pose-completion-r2-test-'));
  try{
    const identity={sourceSha256:'s',specId:'a',runtimeSha256:'r',cameraScale:1.15,recipeSha256:'recipe'};
    const image=path.join(root,'synthetic.bin'),capture=path.join(root,'capture.json');fs.writeFileSync(image,'test fixture only');fs.writeFileSync(capture,JSON.stringify({...identity,mode:'preview',complete:true}));
    const receipt={format:'pose-hub-completion-preview-review@1',actualViewing:true,technicalProceed:true,reviewedBy:'synthetic-test',reviewedAt:'2026-10-28T00:00:00Z',...identity,preview:{path:capture,sha256:hash(fs.readFileSync(capture))},viewedFiles:[{path:image,sha256:hash(fs.readFileSync(image))}]};
    assert.equal(validateReview(receipt,identity).complete,true);assert.throws(()=>validateReview(receipt,{...identity,recipeSha256:'changed'}));fs.writeFileSync(image,'changed');assert.throws(()=>validateReview(receipt,identity));
  }finally{
    const resolved=path.resolve(root);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('pose-completion-r2-test-'));fs.rmSync(resolved,{recursive:true});
  }
});
