import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {data} from '../../drill-anim/models/fixed-hand-presets-r1/loader.mjs';
import {installKettlebellGripInPage} from './kettlebell-grip.mjs';

test('opt-in kettlebell matches fitted grip under mirrored moving hand frames', () => {
  const oldWindow = globalThis.window, oldInspector = globalThis.flareInspector;
  const fit = data().grasp, scene = new T.Scene(), coach = new T.Group(); scene.add(coach);
  const bones = ['left', 'right'].map(side => {const b = new T.Bone(); b.name = side+'Hand'; coach.add(b); return b;});
  let delegated = 0;
  const P = {list:[], mat:() => new T.MeshBasicMaterial(), add:() => ++delegated, place:() => ++delegated};
  globalThis.window = {__props:P, __toonT:T, __fixedGrasp:{pose:'grasp-32mm', fit}};
  globalThis.flareInspector = {viewer:{scene, coach}};
  try {
    installKettlebellGripInPage();
    const theme = {props:{base:'#333333'}};
    P.add(theme,{type:'kettlebell'}); assert.equal(delegated,1);
    for (const b of bones) {
      const sign = b.name === 'rightHand' ? -1 : 1;
      const mirror = a => a.map((x,i) => i === 0 ? sign*x : x);
      const o = P.add(theme,{type:'kettlebell', attach:b.name, r:.095, fixedKettlebellGrasp:'grasp-32mm'});
      const handle = o.getObjectByName('fixed-kettlebell-handle');
      assert.equal(handle.geometry.parameters.radiusTop,.016);
      assert.equal(handle.geometry.parameters.height,.165);
      // Full rotations, including crossing 180 degrees, must preserve the same
      // bone-local center, axis and bell direction without a frame switch.
      for (let i=0;i<=48;i++) {
        b.position.set(.2,.8,.3); b.quaternion.setFromEuler(new T.Euler(i*.17,i*.11,i*.23));
        P.place(o);
        const q = b.getWorldQuaternion(new T.Quaternion());
        const center = new T.Vector3(...mirror(fit.center)).applyQuaternion(q).add(b.position);
        assert.ok(o.position.distanceTo(center)<1e-12);
        const rodAxis = new T.Vector3(1,0,0).applyQuaternion(o.quaternion);
        assert.ok(rodAxis.distanceTo(new T.Vector3(...mirror(fit.axis)).applyQuaternion(q))<1e-9);
        assert.ok(Math.abs(o.quaternion.length()-1)<1e-12);
      }
      const bell = o.getObjectByName('fixed-kettlebell-bell');
      assert.equal(bell.position.y,-.16);
      for (const connector of o.children.filter(c=>c.name==='fixed-kettlebell-connector')) {
        const end = new T.Vector3(0,connector.geometry.parameters.height/2,0).applyQuaternion(connector.quaternion).add(connector.position);
        assert.ok(end.distanceTo(bell.position)<.095,'connector ends embedded in bell');
      }
    }
    assert.throws(()=>P.add(theme,{type:'kettlebell',attach:'rightHand',fixedKettlebellGrasp:'grasp-32mm',offset:[0,0,0]}),/Unsupported/);
    assert.throws(()=>P.add(theme,{type:'dumbbell',attach:'rightHand',fixedKettlebellGrasp:'grasp-32mm'}),/Unsupported/);
    assert.throws(()=>installKettlebellGripInPage(),/fresh/);
  } finally {globalThis.window=oldWindow;globalThis.flareInspector=oldInspector;}
});
