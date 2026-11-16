/* V5 托马斯全旋 (flare-arm8legs) render page. Reproduces the Pose Studio v3r7 default entry + v3r8b wrist fix
 * (app.js load order: model → wristfix-r2 → toon-r6 (+ spiky hair) → fx.js) without the editor UI:
 *   ?hair=spiky (default entry), fx on (flame toe trails, stars, ground-contact ring, hard projected shadow), camera anim.cams.v0.
 * Pose per frame = anim.frames[f] exactly like app.js setBaseFrame/applyBase (whole-frame switch, no interpolation).
 * __T.frame(f, pass): pass 'body' = everything but the fx shadow on a transparent background; pass 'shadow' = the fx shadow only
 * (original opaque two-tone colours; tools/v5/thomas/merge-shadow.py turns it into a translucent shadow under the body). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/tools/v5/runtime/vendor/meshopt_decoder.module.js';
const QS = new URLSearchParams(location.search), SIZE = +(QS.get('size') || 1080);
const PARENT = {
  spineLower: 'pelvis', spineUpper: 'spineLower', torso: 'spineUpper', neck: 'torso', head: 'neck',
  leftScapula: 'torso', leftUpperArm: 'leftScapula', leftForearm: 'leftUpperArm', leftHand: 'leftForearm',
  rightScapula: 'torso', rightUpperArm: 'rightScapula', rightForearm: 'rightUpperArm', rightHand: 'rightForearm',
  leftThigh: 'pelvis', leftShin: 'leftThigh', leftPatella: 'leftShin', leftFoot: 'leftShin',
  rightThigh: 'pelvis', rightShin: 'rightThigh', rightPatella: 'rightShin', rightFoot: 'rightShin',
};
for (const sd of ['left', 'right']) for (let k = 1; k <= 8; k++) { PARENT[sd + 'ForearmTwist' + k] = sd + 'Forearm'; PARENT[sd + 'WristBend' + k] = sd + 'Forearm'; }
const JOINTS = ['pelvis', 'spineLower', 'spineUpper', 'torso', 'neck', 'head', 'leftScapula', 'leftUpperArm', 'leftForearm', 'leftHand', 'rightScapula', 'rightUpperArm', 'rightForearm', 'rightHand', 'leftThigh', 'leftShin', 'leftFoot', 'rightThigh', 'rightShin', 'rightFoot'];
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
// app.js scene (lights only matter for non-toon materials; grid/floor are replaced/removed by toon and hidden below)
scene.add(new THREE.HemisphereLight(0xffffff, 0x8890a0, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(2, 4, 3); scene.add(sun);
const rim = new THREE.DirectionalLight(0xffffff, 0.6); rim.position.set(-3, 2, -3); scene.add(rim);
const grid = new THREE.GridHelper(4, 20, 0x8a93a3, 0xc3c8d2); scene.add(grid);
const floor = new THREE.Mesh(new THREE.CircleGeometry(2, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xdfe3ea, transparent: true, opacity: .5 }));
floor.position.y = -0.001; scene.add(floor);
const anim = await (await fetch('./anim/flare-arm8legs-v3r3.json')).json();
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('./model/coach-v3r3-wristfix.glb');
const root = gltf.scene; scene.add(root); root.updateMatrixWorld(true);
const bones = {}, skinned = [];
root.traverse(o => { if (o.isBone) bones[o.name] = o; if (o.isSkinnedMesh) { skinned.push(o); o.frustumCulled = false; } });
for (const [c, p] of Object.entries(PARENT)) if (bones[c] && bones[p]) bones[p].attach(bones[c]);
root.updateMatrixWorld(true);
for (const b of Object.values(bones)) b.quaternion.identity();
const { installWristFix } = await import('./wristfix-r2.js'); const wf = installWristFix({ bones, renderer });
const { applyToon } = await import('./toon-r6.js');
const toon = applyToon({ scene, root, bones, skinned, grid, floor, renderer, camera });
if (toon.hairReady) await toon.hairReady;
let cur = null;
const { applyFx } = await import('./fx.js');
const fx = applyFx({ scene, root, bones, skinned, renderer, anim, getFrame: () => cur, getFrames: () => anim.frames, jointIds: JOINTS });
// transparent output: no page background, no floor disc
scene.background = null; floor.visible = false;
const shadowGroup = scene.getObjectByName('v3r7-fx-shadow');
shadowGroup?.traverse(o => o.layers.set(1));   // shadow pass = camera layer 1 only; body pass = layer 0 (everything else)
// camera = app setCam(anim.cams.v0) on a square canvas
const c0 = anim.cams.v0; camera.position.fromArray(c0.p); camera.fov = c0.f; camera.aspect = 1; camera.updateProjectionMatrix(); camera.lookAt(new THREE.Vector3().fromArray(c0.t));
function setFrame(f) {
  const fr = anim.frames[f];
  for (const j of JOINTS) bones[j].quaternion.fromArray(fr.q[j] || [0, 0, 0, 1]).normalize();
  bones.pelvis.position.fromArray(fr.p); cur = f; root.updateMatrixWorld(true);
}
const BG_L = new THREE.Color(QS.get('bgL') || '#f3f2ef'), BG_D = new THREE.Color(QS.get('bgD') || '#101013');   // = profile-v5 themes
let primed = null;
const wp = n => bones[n].getWorldPosition(new THREE.Vector3());
window.__T = {
  ready: true, count: anim.count, fps: anim.fps, info: { hair: toon.hair, outlines: toon.outlines, fx: { casters: fx.casters, params: fx.params }, wrist: wf && wf.sides, shadow: !!shadowGroup },
  // pass 'bodyL' / 'bodyD': body+fx over the opaque light / dark theme colour (BG_L / BG_D). The fx glow is premultiplied-additive
  // (rgb > alpha), which a transparent canvas clamps on readback (trails/stars came out ~half as strong as in Pose Studio);
  // merge-shadow.py pulls a straight-alpha matte from the two opaque renders instead.
  frame(f, pass = 'body') {
    setFrame(f);
    // fx.js moves the ground-ring meshes in scene.onBeforeRender, i.e. after three's updateMatrixWorld, so a render shows the ring
    // where the previous render put it (one frame late; invisible live in the app, but here it broke the loop seam and made the
    // light/dark passes disagree). Prime once per new frame with a throw-away render so every pass of frame f is exact.
    if (primed !== f) { renderer.render(scene, camera); primed = f; }
    camera.layers.set(pass === 'shadow' ? 1 : 0);
    scene.background = pass === 'bodyL' ? BG_L : pass === 'bodyD' ? BG_D : null;
    renderer.render(scene, camera);
    scene.background = null; camera.layers.set(0);
    return renderer.domElement.toDataURL('image/png');
  },
  pose(f) { setFrame(f); wf.update(); const q = {}; for (const j of JOINTS) q[j] = bones[j].quaternion.toArray(); return { q, p: bones.pelvis.position.toArray(), theta: { ...wf.stats.theta }, spread: wp('leftFoot').distanceTo(wp('rightFoot')) }; },
};
