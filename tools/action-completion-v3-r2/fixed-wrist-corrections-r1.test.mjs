import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {remapRequiredSourceIds,createRenderGate,assertBoundaryUnchanged} from './fixed-wrist-corrections-r1.mjs';
const json=url=>JSON.parse(fs.readFileSync(new URL(url,import.meta.url),'utf8'));
test('actual accepted wrist recipe retains all 56 ankle source seam vertices bijectively',()=>{
  const r=json('../../drill-anim/models/webxr-dumbbell-wrist-r1/recipe.json'),l=json('../../drill-anim/models/training-human-v2plus-limbs-base.json');
  const ids=l.seam.ring.flatMap((s,i)=>/^ankle_(left|right)$/.test(s)?[l.seam.first+i]:[]);
  assert.equal(ids.length,56);const map=remapRequiredSourceIds(r.meshes.limbs.vertices,ids,r.sourcePins.limbs.sourceVertices);
  assert.equal(new Set(Object.values(map)).size,56);
  for(const id of ids)assert.deepEqual(r.meshes.limbs.vertices[map[id]].source,[[id,1]]);
});
test('topology mapper refuses interpolation, missing and duplicate retained seam identities',()=>{
  assert.throws(()=>remapRequiredSourceIds([{source:[[0,.5],[1,.5]]}],[0],2),/one-to-one/);
  assert.throws(()=>remapRequiredSourceIds([{source:[[0,1]]}],[1],2),/one-to-one/);
  assert.throws(()=>remapRequiredSourceIds([{source:[[0,1]]},{source:[[0,1]]}],[0],2),/one-to-one/);
  assert.throws(()=>remapRequiredSourceIds([{source:[[0,.7]]}],[0],2),/Non-unit/);
  assert.throws(()=>remapRequiredSourceIds([{source:[[2,1]]}],[0],2),/Invalid/);
});
test('wrist boundary guard checks exact positions and normals, rejecting non-finite data',()=>{
  assert.equal(assertBoundaryUnchanged([0,1,.123],[0,1,.123]),true);
  assert.throws(()=>assertBoundaryUnchanged([0,1,.123],[0,1,.12300001]),/boundary/);
  assert.throws(()=>assertBoundaryUnchanged([NaN],[NaN]),/boundary/);
});
function compositionFixture(throwAt){
  // Mimic independently owned wrappers: wrist hashes its full geometry, while
  // dynamics save their selected spans. A draw invokes composed scene hooks.
  const state={position:[0,0],normal:[0,0],cache:[0],bones:[0]},events=[];
  const saved=structuredClone(state),hash=()=>JSON.stringify(state),original=hash();
  const fail=stage=>{if(throwAt===stage)throw Error(stage);};
  let before=()=>{},after=()=>{};
  const base=function(){events.push('draw');before();fail('draw');after();return 7;};
  const gate=createRenderGate(base);
  const wristBefore=()=>{state.position[0]=1;state.normal[0]=1;fail('wrist-update');};
  const wristAfter=()=>{assert.equal(state.position[0],1);assert.equal(state.position[1],2);fail('sample-callback');};
  const wrist=function(){const h=hash();try{return gate.forward.call(this);}finally{state.position[0]=0;state.normal[0]=0;events.push('wrist-restore');assert.equal(hash(),h,'full wrist restore/hash must include restored dynamic region');}};
  const dynamic=function(){try{return base.call(this);}finally{state.position[1]=0;state.normal[1]=0;events.push('dynamic-restore');}};
  before=()=>{wristBefore();state.position[1]=2;state.normal[1]=2;fail('dynamic-update');};after=wristAfter;
  gate.target=dynamic;
  if(throwAt)assert.throws(()=>wrist(),new RegExp(throwAt));else assert.equal(wrist(),7);
  assert.equal(gate.depth,0);assert.equal(hash(),original);assert.deepEqual(state,saved);
  assert.deepEqual(events.slice(-2),['dynamic-restore','wrist-restore']);
}
test('normal draw restores dynamics before the unmodified wrist full-buffer check',()=>compositionFixture());
for(const stage of ['wrist-update','dynamic-update','draw','sample-callback'])test('exception at '+stage+' restores both layers and original error',()=>compositionFixture(stage));
test('gate preserves renderer receiver and arguments; nested draw unwinds depth',()=>{
  const receiver={marker:9},g=createRenderGate(function(a){assert.equal(this,receiver);return a+this.marker;});
  assert.equal(g.forward.call(receiver,4),13);assert.equal(g.depth,0);
  g.target=function(){assert.equal(g.depth,1);g.target=g.base;return g.forward.call(this,2);};
  assert.equal(g.forward.call(receiver),11);assert.equal(g.depth,0);
});
