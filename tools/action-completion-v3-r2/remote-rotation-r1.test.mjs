import test from 'node:test';
import assert from 'node:assert/strict';
import {twistDeg,unwrap,analyzeTwist} from './remote-rotation-r1.mjs';
const qAxis=(deg,a)=>{const h=deg*Math.PI/360;return [a[0]*Math.sin(h),a[1]*Math.sin(h),a[2]*Math.sin(h),Math.cos(h)];};
test('twist about axis is signed and ignores swing',()=>{
  assert.ok(Math.abs(twistDeg(qAxis(40,[0,1,0]),[0,1,0])-40)<1e-6);
  assert.ok(Math.abs(twistDeg(qAxis(-70,[0,1,0]),[0,1,0])+70)<1e-6);
  assert.ok(Math.abs(twistDeg(qAxis(50,[1,0,0]),[0,1,0]))<1e-6);
});
test('a 360 degree turn with equal endpoints is flagged',()=>{
  const t=Array.from({length:37},(_,i)=>i/36),s=t.map(x=>{const d=x*360;return twistDeg(qAxis(d,[0,1,0]),[0,1,0]);});
  const u=unwrap(s);assert.ok(Math.abs(u.at(-1)-u[0]-360)<1e-6);
  const r=analyzeTwist(t,s);assert.ok(r.flags.includes('net-turn')&&r.flags.includes('twist-range'));
});
test('a small oscillation passes',()=>{
  const t=Array.from({length:61},(_,i)=>i/60),s=t.map(x=>30*Math.sin(2*Math.PI*x));
  assert.deepEqual(analyzeTwist(t,s).flags,[]);
});

test('suggestMat: lying body along z gives long mat yaw +-90, standing gives none',async()=>{
  const {suggestMat}=await import('./remote-rotation-r1.mjs');
  const pts=[];for(let z=-0.9;z<=0.9;z+=0.1)pts.push([0.02,z],[0.2,z],[-0.2,z]);
  const m=suggestMat(pts,['hips'],[]);
  assert.equal(m.floorBased,true);assert.equal(m.specHasMat,false);
  assert.ok(Math.abs(Math.abs(m.prop.yaw)-90)<1);assert.ok(m.prop.size[0]>=2.0&&m.prop.size[1]>=0.61);
  assert.ok(Math.abs(m.prop.at[2])<0.02);
  const s=suggestMat([[0,0]],[],[{type:'mat'}]);assert.equal(s.floorBased,false);assert.equal(s.prop,null);assert.equal(s.specHasMat,true);
});
