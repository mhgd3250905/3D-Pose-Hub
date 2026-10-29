import test from 'node:test';
import assert from 'node:assert/strict';
import {makeChairContactMath} from './chair-elbow-contact-diagnostic-r1.mjs';
const {clipTriangleOverTop:clip}=makeChairContactMath(),top=[[0,.75,0],[1,.75,0],[0,.75,1]];
test('triangle overlap detects vertical skin gap even when all skin vertices outside footprint',()=>{
  const result=clip([[-1,.76,-1],[3,.76,-1],[-1,.76,3]],top);
  assert.ok(result.length>=3);assert.ok(result.every(p=>Math.abs((p[1]-.75)*1000-10)<1e-10));
});
test('missed support footprint remains empty; top winding does not change overlap',()=>{
  assert.deepEqual(clip([[2,.8,2],[3,.8,2],[2,.8,3]],top),[]);
  const skin=[[-1,.76,-1],[3,.76,-1],[-1,.76,3]];
  assert.deepEqual(clip(skin,top.slice().reverse()).map(x=>x.join(',')).sort(),clip(skin,top).map(x=>x.join(',')).sort());
});
test('clipped sloped skin preserves interpolated height rather than vertex-only sample',()=>{
  const result=clip([[-1,.70,0],[2,1,0],[0,.80,2]],top);
  assert.ok(result.some(p=>Math.abs(p[0])<1e-9&&Math.abs(p[2])<1e-9&&Math.abs(p[1]-.8)<1e-9));
});
