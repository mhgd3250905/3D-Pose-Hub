import test from 'node:test';
import assert from 'node:assert/strict';
import {locatePixel} from './probe-pixel-hit.mjs';
const camera={position:[0,0,2],target:[0,0,0],fov:60};
const triangle=(z,reverse=false)=>({material:{side:0},vertices:[[-1,-1,z],[1,-1,z],[0,1,z]].map((world,id)=>({id,world,weights:[{bone:'joint'+id,weight:1}]})),facesOriginalIndices:[reverse?[2,1,0]:[0,1,2]]});
test('finds nearer surface with perspective-correct barycentric weights',()=>{
  const r=locatePixel({meshes:{far:triangle(0),near:triangle(1)}},camera,{x:239.5,y:239.5});
  assert.equal(r.hits[0].mesh,'near');assert.deepEqual(r.hits[0].world,[0,0,1]);
  assert.deepEqual(r.hits[0].barycentric,[.25,.25,.5]);assert.equal(r.hits[1].distanceMetres,2);
});
test('respects face winding and reports explicit backface requests',()=>{
  const g={meshes:{back:triangle(0,true)}};
  assert.equal(locatePixel(g,camera,{x:239.5,y:239.5}).hits.length,0);
  assert.equal(locatePixel(g,camera,{x:239.5,y:239.5,includeBackfaces:true}).hits[0].culledByMaterial,true);
});
test('does not invent visibility for unrecorded material groups',()=>{
  const m=triangle(0);m.material=[{side:0},{side:2}];
  assert.equal(locatePixel({meshes:{m}},camera,{x:239.5,y:239.5}).hits[0].materialVisibilityKnown,false);
});
