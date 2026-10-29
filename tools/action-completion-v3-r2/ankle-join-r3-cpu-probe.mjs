import fs from 'node:fs';
import path from 'node:path';
import * as T from 'three';
import {makeAnkleJoinMath,fairAnkleContours} from './ankle-join-r3.mjs';
const base=process.argv[2],out=process.argv[3];
if(!base||!out)throw Error('Usage: node ankle-join-r3-cpu-probe.mjs BASELINE_DIR NEW_OUTPUT_DIR');
fs.mkdirSync(out,{recursive:true});
const rest=JSON.parse(fs.readFileSync(path.join(base,'probe.json'))).rest,math=makeAnkleJoinMath(T),lo=.014,hi=.185;
const smoother=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
const n={};for(const side of ['left','right']){const ankle=new T.Vector3().fromArray(rest.bones[side+'Foot'].worldPosition),axis=new T.Vector3().fromArray(rest.bones[side+'Shin'].worldPosition).sub(ankle).normalize(),X=new T.Vector3(1,0,0).addScaledVector(axis,-axis.x).normalize(),Z=X.clone().cross(axis).normalize(),basis=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(X,axis,Z));n[side]={ankle,axis,basis,inverse:basis.clone().invert(),footInv:new T.Matrix4().fromArray(rest.bones[side+'Foot'].matrixWorld).invert(),shinInv:new T.Matrix4().fromArray(rest.bones[side+'Shin'].matrixWorld).invert()};}
const R=Object.fromEntries(Object.entries(rest.meshes).map(([name,m])=>[name,new Map(m.vertices.map(v=>[v.id,v]))]));
const filtered={};let maxRestFairingMm=0;
for(const [side,N]of Object.entries(n)){
 const nodes=[],lookup=new Map(),refs=[],active={};
 const node=(v,flag=false)=>{const local=new T.Vector3().fromArray(v.world).sub(N.ankle).applyQuaternion(N.inverse),key=v.world.map(x=>Math.round(x*1e6)).join(',');let id=lookup.get(key);if(id===undefined){id=nodes.length;lookup.set(key,id);nodes.push({p:local.toArray(),active:flag,adj:new Set()});}else if(flag)nodes[id].active=true;return id;};
 for(const name of ['Coach_Body','V2P_Base_Limbs']){
  active[name]=new Set();filtered[name]??=new Map();
  for(const r of rest.meshes[name].vertices){const local=new T.Vector3().fromArray(r.world).sub(N.ankle).applyQuaternion(N.inverse),h=local.y;if((r.world[0]>=0?'left':'right')!==side||h<lo||h>hi||Math.hypot(local.x,local.z)>.105||r.weights.some(w=>![side+'Foot',side+'Shin'].includes(w.bone)))continue;active[name].add(r.id);refs.push([name,r.id,node(r,true)]);}
  for(const f of rest.meshes[name].facesOriginalIndices){if(!f.some(i=>active[name].has(i)))continue;const ids=f.map(i=>node(R[name].get(i)));for(let k=0;k<3;k++){nodes[ids[k]].adj.add(ids[(k+1)%3]);nodes[ids[(k+1)%3]].adj.add(ids[k]);}}
 }
 const weights=nodes.map(r=>{const t=(r.p[1]-lo)/(hi-lo);return r.active?smoother(t/.25)*smoother((1-t)/.25):0;});
 const fair=fairAnkleContours(nodes.map(r=>r.p),nodes.map(r=>[...r.adj]),weights);
 for(const [name,id,i]of refs){filtered[name].set(id,fair[i]);maxRestFairingMm=Math.max(maxRestFairingMm,Math.hypot(fair[i][0]-nodes[i].p[0],fair[i][2]-nodes[i].p[2])*1000);}
}
const reports=[];
for(const frame of [0,60,120]){
 const filename=`frame-${String(frame).padStart(4,'0')}-geometry.json`,p=JSON.parse(fs.readFileSync(path.join(base,filename))),states={};
 for(const [side,v]of Object.entries(n)){const F=new T.Matrix4().fromArray(p.bones[side+'Foot'].matrixWorld).multiply(v.footInv),S=new T.Matrix4().fromArray(p.bones[side+'Shin'].matrixWorld).multiply(v.shinInv);states[side]=math.state(new T.Vector3(0,lo,0).applyQuaternion(v.basis).add(v.ankle).applyMatrix4(F),new T.Vector3(0,hi,0).applyQuaternion(v.basis).add(v.ankle).applyMatrix4(S),new T.Quaternion().setFromRotationMatrix(F).multiply(v.basis),new T.Quaternion().setFromRotationMatrix(S).multiply(v.basis),hi-lo);}
 let maxMoveMm=0,changed=0;const move=[];
 for(const name of ['Coach_Body','V2P_Base_Limbs'])for(const v of p.meshes[name].vertices){const r=R[name].get(v.id);if(!r)continue;const rp=new T.Vector3().fromArray(r.world),side=rp.x>=0?'left':'right',N=n[side],local=rp.clone().sub(N.ankle).applyQuaternion(N.inverse),h=local.y,rad=Math.hypot(local.x,local.z);if(h<lo||h>hi||rad>.105||r.weights.some(w=>![side+'Foot',side+'Shin'].includes(w.bone)))continue;const t=(h-lo)/(hi-lo),mask=1,old=new T.Vector3().fromArray(v.world),target=math.point(states[side],t,filtered[name].get(v.id)[0],filtered[name].get(v.id)[2]).lerp(old,1-mask),d=old.distanceTo(target)*1000;v.world=target.toArray();maxMoveMm=Math.max(maxMoveMm,d);changed++;move.push(d);}
 fs.writeFileSync(path.join(out,filename),JSON.stringify(p));move.sort((a,b)=>a-b);reports.push({frame,maxMoveMm,maxRestFairingMm,changed,moveP95Mm:move[Math.floor(move.length*.95)],method:'offline exact contour kernel on actual captured bone transforms; not a render'});
}
fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({rest}));fs.writeFileSync(path.join(out,'cpu-kernel-report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
