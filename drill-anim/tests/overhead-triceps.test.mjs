import test from 'node:test';
import assert from 'node:assert/strict';
import old from '../specs/h-db-overhead-triceps-extension-rr1.js';
import spec from '../specs/h-db-overhead-triceps-extension-rr2.js';
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const len=a=>Math.hypot(...a);
const shoulder=[-.1879072,1.3586918,-.0083789];
const elbow=spec.pose.base.hands.right.pole;
const u=sub(elbow,shoulder).map(x=>x/len(sub(elbow,shoulder)));
const n=[u[1],-u[0],0];
const wrist=i=>[0,1,2].map(k=>spec.timeline.tracks['k'+k][i][1]);
test('new trajectory is a fixed-radius arc in the upper-arm bend plane',()=>{
 for(let i=0;i<=240;i++) {
  const f=sub(wrist(i),elbow);
  assert.ok(Math.abs(len(f)-.22804635532676243)<1e-12);
  assert.ok(Math.abs(dot(f,n))<1e-12);
  const angle=180-Math.acos(Math.min(1,Math.max(-1,dot(f,u)/len(f))))*180/Math.PI;
  assert.ok(angle>=70-1e-9 && angle<=165+1e-9);
 }
});
test('grip and support contract remain unchanged',()=>{
 assert.deepEqual(spec.props,old.props);
 assert.deepEqual(spec.v2plus,old.v2plus);
 assert.deepEqual(spec.pose.base.feet,old.pose.base.feet);
 assert.deepEqual(spec.pose.base.pelvis,old.pose.base.pelvis);
 assert.deepEqual(spec.pose.base.hands.left,old.pose.base.hands.left);
});
test('tracks close the loop without degenerate hand basis',()=>{
 for(const track of Object.values(spec.timeline.tracks))assert.deepEqual(track.at(-1).slice(1),track[0].slice(1));
 for(let i=0;i<=240;i++) {
  const finger=[3,4,5].map(k=>spec.timeline.tracks['k'+k][i][1]);
  const normal=[6,7,8].map(k=>spec.timeline.tracks['k'+k][i][1]);
  assert.ok(len(finger)>.999 && len(normal)>.999);
  assert.ok(Math.abs(dot(finger,normal))<.001);
 }
});
