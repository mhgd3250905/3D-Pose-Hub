import test from 'node:test';
import assert from 'node:assert/strict';
import {prepare,validate,aliases,installInPage} from './native-action-hand-pose-r2.mjs';
const joints=['thumb','index','middle','ring','pinky'].flatMap(f=>[1,2,3].map(j=>f+j));
const descriptor=()=>({id:'native-action-hand-pose-r2',version:'0.1.0-r2',required:true,specId:'h-biceps-self-r8',basePoses:{left:'open'},poses:{left:{thumb1:[0,0,Math.sin(.2),Math.cos(.2)]}}});
const setup=()=>{const poses={open:Object.fromEntries(joints.map(j=>[j,[0,0,0,1]]))},bones={};for(const s of ['L','R'])for(const j of joints){const q={value:[0,0,0,1],toArray(){return this.value.slice();}};bones['v2p_'+s+'_'+j]={quaternion:q};}const V={poses,bones,hands:{on:true,mesh:{visible:true}},cur:{},setHandPose(){}};globalThis.window={__v2p:V};return V;};
test('prepare snapshots deterministic aliases without mutating source or unrelated side',()=>{
 const s={id:'h-biceps-self-r8',actionCorrective:descriptor(),v2plus:{handPose:{left:'open',right:'relaxed'}}},before=structuredClone(s),out=prepare(s);
 assert.deepEqual(s,before);assert.equal(out.v2plus.handPose.left,aliases(s.actionCorrective).left);assert.equal(out.v2plus.handPose.right,'relaxed');
 assert.throws(()=>prepare({...s,id:'other'}));assert.throws(()=>validate({...descriptor(),poses:{left:{thumb4:[0,0,0,1]}}}));assert.throws(()=>validate({...descriptor(),poses:{left:{thumb1:[1,1,1,1]}}}));
});
test('runtime verifies actual bones, preserves base pose/setter and detects alias without application',()=>{
 const V=setup(),d=descriptor(),base=structuredClone(V.poses.open),setter=V.setHandPose;installInPage({descriptor:d,aliases:aliases(d)});const api=window.__nativeActionHandPoseR2;
 assert.throws(()=>api.verifyApplied());V.cur.left=aliases(d).left;assert.throws(()=>api.verifyApplied());
 for(const j of joints)V.bones['v2p_L_'+j].quaternion.value=V.poses[V.cur.left][j].slice();assert.equal(api.verifyApplied().applied,true);assert.deepEqual(V.poses.open,base);assert.equal(V.setHandPose,setter);
 V.poses.open.thumb2=[1,0,0,0];assert.throws(()=>api.verifyApplied());
});
test('right-hand convention and atomic failure on missing second side',()=>{
 const V=setup(),d=descriptor();d.basePoses.right='missing';d.poses.right={thumb1:[0,0,0,1]};assert.throws(()=>installInPage({descriptor:d,aliases:aliases(d)}));assert.deepEqual(Object.keys(V.poses),['open']);
 delete d.basePoses.left;delete d.poses.left;d.basePoses.right='open';d.poses.right.thumb1=[0,Math.sin(.2),0,Math.cos(.2)];installInPage({descriptor:d,aliases:aliases(d)});
 V.cur.right=aliases(d).right;for(const j of joints){const q=V.poses[V.cur.right][j].slice();q[1]*=-1;q[2]*=-1;V.bones['v2p_R_'+j].quaternion.value=q;}assert.equal(window.__nativeActionHandPoseR2.verifyApplied().applied,true);
});
