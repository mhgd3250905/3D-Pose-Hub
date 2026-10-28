// Validate seam sharing through different actual bone / object transforms.
import fs from 'node:fs';
import * as T from 'three';
import { influencesAt, skinMatrices, solveBindPosition } from './bindspace-solve-r1.mjs';
const root = new T.Group();
function piece(name, worldPositions, indices, angle, offset, scale) {
  const bone = new T.Bone(); bone.name = 'testBone'; root.add(bone); root.updateMatrixWorld(true);
  const skeleton = new T.Skeleton([bone]), g = new T.BufferGeometry(), count = worldPositions.length / 3;
  g.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(Array(count).fill([0, 0, 1]).flat(), 3));
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(Array(count).fill([1, 0, 0, 0]).flat(), 4));
  g.setIndex(indices);
  const mesh = new T.SkinnedMesh(g, new T.MeshBasicMaterial()); mesh.name = name;
  mesh.position.set(...offset); mesh.scale.set(...scale); root.add(mesh); root.updateMatrixWorld(true); mesh.bind(skeleton);
  bone.quaternion.setFromAxisAngle(new T.Vector3(0, 0, 1), angle); root.updateMatrixWorld(true); skeleton.update();
  const attr = g.attributes.position;
  for (let i = 0; i < count; i++) {
    const p = solveBindPosition(mesh, [{ name: 'testBone', weight: 1 }], worldPositions.slice(i * 3, i * 3 + 3));
    attr.setXYZ(i, p.x, p.y, p.z);
  }
  return mesh;
}
const source = piece('source', [0,0,0, 1,0,0, 0,1,0, 0,0,-1], [0,1,2], .2, [.1,.2,-.1], [1.2,.8,1.1]);
const torso = piece('torso', [0,0,0, 1,0,0, 0,1,0], [0,1,2], -.3, [-.2,.1,.2], [.8,1.2,1.1]);
const limbs = piece('limbs', [0,0,0, 1,0,0, 0,0,-1], [0,1,2], .4, [.2,-.1,.1], [1.1,.9,.8]);
const hands = piece('hands', [0,0,0, 0,1,0, 0,0,1], [0,1,2], -.5, [-.1,.1,-.2], [.9,1.1,1.2]);
root.updateMatrixWorld(true);
function worldNormal(mesh) {
  mesh.skeleton.update();
  return new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.normal, 0)
    .applyMatrix3(new T.Matrix3().setFromMatrix4(skinMatrices(mesh, influencesAt(mesh, 0)).skin))
    .applyMatrix3(new T.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize();
}
const original = worldNormal(source).clone();
const swap = { na: limbs.geometry.attributes.normal, idx: [0], a0: new Float32Array(3), a1: new Float32Array(3) };
const V = { torso: { on: true, mesh: torso }, limbs: { on: true, mesh: limbs },
  hands: { on: true, mesh: hands, nrmSwap: swap, swaps: [{ g: source.geometry, prev: new T.Uint16BufferAttribute([0,2,3], 1) }] },
  setHands(on) { this.hands.on = on; const a = on ? swap.a1 : swap.a0; swap.na.setXYZ(0, a[0], a[1], a[2]); },
  setOutfit(on) { this.torso.on = this.limbs.on = this.hands.on = !!on; } };
const window = { __toonT: T, __v2p: V, flareInspector: { viewer: { coach: root, motion: { reset() {} } } } };
new Function('window', fs.readFileSync(new URL('./piece-normals-r1.js', import.meta.url), 'utf8'))(window);
const seams = Object.fromEntries(['torso', 'limbs', 'hands'].map(name => [name, { first: 0, vid: [0], mesh: ['source'] }]));
const report = window.__fixBodyV3PieceNormalsR1(seams);
const same = (a, b) => a.dot(b) > .999999;
if (!same(worldNormal(source), worldNormal(torso)) || !same(worldNormal(source), worldNormal(limbs)) || !same(worldNormal(source), worldNormal(hands))) throw new Error('active transformed seam differs');
V.setHands(false); if (!same(worldNormal(source), worldNormal(limbs))) throw new Error('hand-off transformed seam differs');
V.setHands(true); if (!same(worldNormal(source), worldNormal(hands))) throw new Error('hand-on transformed seam differs');
V.setOutfit(false); if (!same(worldNormal(source), original)) throw new Error('profile-exit transformed normal differs');
console.log('transformed-skeleton seam and state switches passed', JSON.stringify(report));
