import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {measureFootSurfacesInPage} from './foot-surface.mjs';

test('foot diagnostic skins vertices, excludes hidden ancestors, respects draw ranges and refreshes cached weights',()=>{
  const oldWindow=globalThis.window, oldInspector=globalThis.flareInspector;
  const coach=new T.Group(), g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute([0,-.1,0,0,.2,0,0,-.3,0,0,.4,0],3));
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0],4));
  g.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],4));
  const mesh=new T.SkinnedMesh(g,new T.MeshBasicMaterial());mesh.name='actual-feet';coach.add(mesh);
  const left=new T.Bone(),right=new T.Bone();left.name='leftToe';right.name='rightFoot';mesh.add(left,right);
  mesh.bind(new T.Skeleton([left,right]));
  const hidden=new T.Group();hidden.visible=false;coach.add(hidden);const omitted=mesh.clone();omitted.name='hidden-low-copy';omitted.position.y=-100;hidden.add(omitted);
  globalThis.window={__toonT:T};globalThis.flareInspector={viewer:{coach}};
  try {
    let r=measureFootSurfacesInPage();assert.ok(Math.abs(r.left.minY+.1)<1e-7);assert.equal(r.left.vertexCount,2);assert.deepEqual(r.right.meshes.map(x=>x.name),['actual-feet']);
    left.position.y=.5;right.position.y=.8;r=measureFootSurfacesInPage();
    assert.ok(Math.abs(r.left.minY-.4)<1e-7);assert.ok(Math.abs(r.right.minY-.5)<1e-7);
    g.setDrawRange(1,3);r=measureFootSurfacesInPage();assert.equal(r.left.vertexCount,1);assert.ok(Math.abs(r.left.minY-.7)<1e-7);
    g.attributes.skinIndex.setX(1,1);g.attributes.skinIndex.needsUpdate=true;
    assert.throws(()=>measureFootSurfacesInPage(),/No visible rendered left/);
  } finally {globalThis.window=oldWindow;globalThis.flareInspector=oldInspector;}
});
