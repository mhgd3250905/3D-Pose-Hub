import test from 'node:test';
import assert from 'node:assert/strict';
import {gripPose} from '../../drill-anim/lib/grip.mjs';
import {recoverBar,gripPoseFixed,G} from './fixed-bar-grip-r1.mjs';
const close=(a,b,e=2e-3)=>a.every((x,i)=>Math.abs(x-b[i])<e);
test('old gripPose targets invert back to the bar they were built from',()=>{
  for(const [side,sg] of [['right',-1],['left',1]]){const bar=[sg*0.26,0.34,0],old=gripPose(side,bar,[0,0,1],[sg,0,0]);
    const r=recoverBar(side,old);assert.ok(close(r.bar,bar),side);assert.ok(close(r.axis,[0,0,1]));assert.ok(close(r.palm,[sg,0,0]));}
});
test('fixed pose puts the frozen shaft centre on the bar and its axis along the bar',()=>{
  const p=gripPoseFixed('right',[-0.25,1.15,0],[0,0,1],[-1,0,0]);
  assert.ok(Math.abs(Math.hypot(...p.finger)-1)<1e-3&&Math.abs(Math.hypot(...p.normal)-1)<1e-3);
  const lenC=Math.hypot(...G.right.c),d=Math.hypot(...p.wrist.map((x,i)=>x-[-0.25,1.15,0][i]));assert.ok(Math.abs(d-lenC)<1e-3);
});
