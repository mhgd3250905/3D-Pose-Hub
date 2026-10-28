// Use the frozen page sampler as an oracle, rather than the new helper's sampler.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {sourceTimeAt} from '../../../drill-anim/specs/_draft-native8-r1.mjs';
const engine=fs.readFileSync(new URL('../../../drill-anim/page/engine.js',import.meta.url),'utf8');
const prefix=engine.slice(engine.indexOf('const ease ='),engine.indexOf('E.pulseAt ='));
assert(prefix.includes('E.sample = function(tl, t)'));
const sample=vm.runInNewContext('const E={};'+prefix+';E.sample');
const pairs=[['chest-B-r2','chest-B'],['serratus-A-r2','serratus-A'],['triceps-A-r2','triceps-A'],['quadriceps-C-r2','quadriceps-C']];
const reports=[];
for(const [id,sourceId] of pairs){
  const candidate=(await import(`../../../drill-anim/specs/${id}.js`)).default;
  const source=(await import(`../../../drill-anim/specs/${sourceId}.js`)).default;
  assert.equal(candidate.timeline.duration,8);assert.equal(candidate.fps,30);
  assert.deepEqual(candidate.pose,source.pose,'no authored pose/targets change');
  assert.deepEqual(candidate.props,source.props,'no prop calibration change');
  assert.deepEqual(candidate.qa,source.qa,'no QA relaxation');
  assert.equal(candidate.draftNative8.releaseEligible,false);
  assert.deepEqual(Object.keys(candidate.timeline.tracks),Object.keys(source.timeline.tracks));
  for(const [a,b,from,to] of candidate.draftNative8.sourceSlices){
    assert(Math.abs(to-from)<1e-12||Math.abs((to-from)/(b-a)-1)<1e-12,'unit speed or static dwell only');
  }
  let worst=0,worstTrack=null,worstFrame=null;
  for(let frame=0;frame<240;frame++){
    const t=frame/30,mapped=sourceTimeAt(candidate.draftNative8.sourceSlices,t);
    const actual=sample(candidate.timeline,t),expected=sample(source.timeline,mapped);
    for(const name of Object.keys(actual)){
      const error=Math.abs(actual[name]-expected[name]);
      if(error>worst){worst=error;worstTrack=name;worstFrame=frame;}
    }
  }
  assert(worst<0.00002,`${id}: source track error ${worst}, ${worstTrack} frame ${worstFrame}`);
  reports.push({id,sourceId,frames:240,maxTrackError:worst,worstTrack,worstFrame,posePropsQaUnchanged:true});
}
console.log(JSON.stringify({oracle:'frozen page engine sampler',cases:reports},null,2));
