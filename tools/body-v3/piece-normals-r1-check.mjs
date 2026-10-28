// Synthetic skinning check for seam sharing and hand on/off normal swaps.
// No application state or asset is modified.
import fs from 'node:fs';
import * as T from 'three';
const root = new T.Group(), bone = new T.Bone(); bone.name = 'testBone'; root.add(bone); root.updateMatrixWorld(true);
const skeleton = new T.Skeleton([bone]);
function piece(name, positions, indices) {
  const g = new T.BufferGeometry(), n = positions.length / 3;
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(Array(n).fill([0, 0, 1]).flat(), 3));
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(Array(n * 4).fill(0), 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(Array(n).fill([1, 0, 0, 0]).flat(), 4));
  g.setIndex(indices);
  const mesh = new T.SkinnedMesh(g, new T.MeshBasicMaterial()); mesh.name = name;
  root.add(mesh); mesh.updateMatrixWorld(true); mesh.bind(skeleton); return mesh;
}
const source = piece('source', [0,0,0, 1,0,0, 0,1,0, 0,0,-1], [0,1,2]);
const torso = piece('torso', [0,0,0, 1,0,0, 0,1,0], [0,1,2]);
const limbs = piece('limbs', [0,0,0, 1,0,0, 0,0,-1], [0,1,2]);
const hands = piece('hands', [0,0,0, 0,1,0, 0,0,1], [0,1,2]);
root.updateMatrixWorld(true);
const normal = mesh => new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.normal, 0).normalize();
const original = normal(source).clone();
const swap = { na: limbs.geometry.attributes.normal, idx: [0], a0: new Float32Array(3), a1: new Float32Array(3) };
const V = {
  torso: { on: true, mesh: torso }, limbs: { on: true, mesh: limbs },
  hands: { on: true, mesh: hands, nrmSwap: swap, swaps: [{ g: source.geometry, prev: new T.Uint16BufferAttribute([0,2,3], 1) }] },
  setHands(on) { this.hands.on = on; const a = on ? swap.a1 : swap.a0; swap.na.setXYZ(0, a[0], a[1], a[2]); },
  setOutfit(on) { this.torso.on = this.limbs.on = !!on; this.hands.on = !!on; },
};
const window = { __toonT: T, __v2p: V, flareInspector: { viewer: { coach: root, motion: { reset() {} } } } };
new Function('window', fs.readFileSync(new URL('./piece-normals-r1.js', import.meta.url), 'utf8'))(window);
const seams = Object.fromEntries(['torso', 'limbs', 'hands'].map(name => [name, { first: 0, vid: [0], mesh: ['source'] }]));
const result = window.__fixBodyV3PieceNormalsR1(seams);
const aligned = (a, b) => a.dot(b) > .999999;
if (!aligned(normal(source), normal(torso)) || !aligned(normal(source), normal(limbs)) || !aligned(normal(source), normal(hands))) throw new Error('active seam normals differ');
if (!aligned(normal(limbs), new T.Vector3(...swap.a1).normalize())) throw new Error('hand-on swap not updated');
V.setHands(false);
if (!aligned(normal(source), normal(limbs)) || !aligned(normal(limbs), new T.Vector3(...swap.a0).normalize())) throw new Error('hand-off seam or swap differs');
V.setHands(true);
if (!aligned(normal(source), normal(limbs)) || !aligned(normal(limbs), normal(hands))) throw new Error('hand-on restore differs');
V.setOutfit(false);
if (!aligned(normal(source), original)) throw new Error('source normal not restored on profile exit');
if (!window.__fixBodyV3PieceNormalsR1) throw new Error('missing installer');
console.log('synthetic seam sharing and hand/profile switches passed', JSON.stringify(result));
