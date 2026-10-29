import test from 'node:test';
import assert from 'node:assert/strict';
import {makeUpperArmContourMath} from './upper-arm-contour-r1.mjs';
function fixture(){
  const input={meshes:{a:{vertices:[],facesOriginalIndices:[]},b:{vertices:[],facesOriginalIndices:[]}},joints:{},pairs:[]};
  for(const side of ['left','right']){
    const sx=side==='left'?1:-1;input.joints[side]={shoulder:[sx,0,0],elbow:[sx,0,.3]};
    for(const [name,zs]of [['a',[.08,.10,.12,.14,.16]],['b',[.16,.18,.20,.22,.24]]]){
      const m=input.meshes[name],start=m.vertices.length;
      for(const z of zs)for(let k=0;k<28;k++){
        const theta=k*2*Math.PI/28,r=.04+.008*Math.exp(-(((z-.16)/.025)**2)),id=m.vertices.length;
        m.vertices.push({id,world:[sx+r*Math.cos(theta),r*Math.sin(theta),z],weights:[{bone:side+'UpperArm',weight:1}]});
      }
      for(let j=0;j<zs.length-1;j++)for(let k=0;k<28;k++){
        const a=start+j*28+k,b=start+j*28+(k+1)%28,c=b+28,d=a+28;m.facesOriginalIndices.push([a,b,c],[a,c,d]);
      }
      if(name==='a')for(let k=0;k<28;k++)input.pairs.push({side,a:{mesh:'a',id:start+4*28+k},b:{mesh:'b',id:input.meshes.b.vertices.length+k}});
    }
  }
  return input;
}
test('bounded bilateral contour preserves connected seam and convex volume',()=>{
  const i=fixture(),before=JSON.stringify(i),r=makeUpperArmContourMath().plan(i);
  assert.equal(JSON.stringify(i),before);assert.equal(r.summary.seamMaxGapMm,0);
  assert.ok(r.summary.maxMoveMm>1&&r.summary.maxMoveMm<=6);assert.ok(r.summary.minimumFaceNormalDot>0);
  assert.ok(Math.abs(r.summary.sides.left.maxMoveMm-r.summary.sides.right.maxMoveMm)<1e-9);
  for(const p of i.pairs)assert.deepEqual(new Map(r.changes.a).get(p.a.id),new Map(r.changes.b).get(p.b.id));
  for(const [name,changes]of Object.entries(r.changes))for(const [id,pos]of changes){
    const old=i.meshes[name].vertices[id].world;assert.ok(old[2]>.105&&old[2]<.215);assert.equal(pos[2],old[2]);
  }
});
test('unmodified bones, topology, outside band and low arm weights remain protected',()=>{
  const i=fixture();i.meshes.a.vertices.push({id:i.meshes.a.vertices.length,world:[1.07,0,.16],weights:[{bone:'leftUpperArm',weight:.5},{bone:'torso',weight:.5}]});
  const id=i.meshes.a.vertices.at(-1).id,r=makeUpperArmContourMath().plan(i);
  assert.equal(new Map(r.changes.a).has(id),false);
  assert.equal(new Map(r.changes.a).has(0),false);
});
test('source seam gaps reject before candidate delivery',()=>{
  const i=fixture();i.meshes.b.vertices[0].world[0]+=.001;
  assert.throws(()=>makeUpperArmContourMath().plan(i),/Source cuff seam open/);
});
test('rigid pose change does not change the correction in bone coordinates',()=>{
  const a=fixture(),r=makeUpperArmContourMath().plan(a),b=structuredClone(a),move=p=>[p[2]+.7,p[0]-.3,p[1]+1.1];
  for(const m of Object.values(b.meshes))for(const v of m.vertices)v.world=move(v.world);
  for(const j of Object.values(b.joints)){j.shoulder=move(j.shoulder);j.elbow=move(j.elbow);}
  const q=makeUpperArmContourMath().plan(b);
  for(const [name,list]of Object.entries(r.changes)){const next=new Map(q.changes[name]);for(const [id,p]of list)assert.ok(Math.hypot(...move(p).map((x,k)=>x-next.get(id)[k]))<1e-12);}
});
