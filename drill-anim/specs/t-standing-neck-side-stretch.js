// t-standing-neck-side-stretch 站姿颈侧拉伸 (standing neck side stretch / upper-trapezius stretch) · Flare 2.0 cool-down, r2 batch 1
// (2026-11-21). Standard: tools/flare2-moves-r2/standards/t-standing-neck-side-stretch.md.
// Standing tall, feet hip-width. The head tilts sideways - ear toward the same-side shoulder, face forward (no turn, no chin poke, no
// backward tilt) - the hand of that side reaches over the top of the head and rests lightly on the opposite side of the head (no
// pulling), and the opposite arm hangs long with that shoulder pressed down (shoulder blade depressed, hand reaching to the floor).
// Static hold. One 16 s loop = right side 0-8 s (tilt 0.4-1.6 s, hold to 6.6 s, release) then the left side mirrored; the dose is a
// longer hold per side (text / voice), the loop shows one entry, hold and exit per side.
// The hub rig cannot tilt the head, so the head tilt is V5-only (spec v5r2.head, tools/flare2-moves-r2/v5/v5r2-ext.js); the hand on
// the head is placed from the same tilt (V5 neck / head pivots measured in the sandbox standing at pelvis 0.948).
// Frame: head +Y, front +Z, body left +X. Hands in world coordinates (the body stands still).
import { build, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
import { perFrame, win, mix, V } from '../lib/flare2-r2.mjs';
const DUR = 16, HALF = 8, PELY = 0.957, FX = 0.10, LAT = 36;
// V5 pivots standing at PELY (sandbox measure): neck, head bone; the tilt is split neck 45 % / head 55 % (v5r2-ext.js)
const NECK = [0, 1.4033, 0.017], HEADP = [0, 1.5352, 0.0348];   // measured at pelvis 0.948, +9 mm for PELY 0.957 (straight knees)
const tiltPt = (p, lat) => {   // a point rigid with the head (rest world coords) after a lateral tilt lat (deg, + = right ear down)
  const Z = [0, 0, 1], a1 = 0.45 * lat, h = V.add(NECK, V.rot(V.sub(HEADP, NECK), Z, a1));
  return V.add(h, V.rot(V.sub(p, HEADP), Z, lat)); };
const tiltDir = (d, lat) => V.rot(d, [0, 0, 1], lat);
// side s ('right' = tilt to the right, right hand over the head onto the LEFT side of the head)
const sideW = (s, t) => { const u = ((t % DUR) + DUR) % DUR; const k = s === 'right' ? u : u - HALF; if (k < 0 || k >= HALF) return 0;
  return win(k, 0.4, 1.6) * (1 - win(k, 6.6, 7.6)); };
const latAt = t => LAT * (sideW('right', t) - sideW('left', t));
// contact on the far side of the head, above the ear (head-rigid rest coords), outward normal, finger direction (toward the ear)
const S_LOC = s => [-sg(s) * 0.068, 1.6, 0.03];       // s = the reaching hand; contact is on the opposite (sg) side of the head
const N_LOC = s => V.norm([-sg(s) * 0.92, 0.38, 0.05]);
const F_LOC = s => V.norm([-sg(s) * 0.36, -0.86, 0.36]);
const PALM_OFF = 0.041;                               // palm joint off the head surface (hand thickness; r2 check: 16 mm sank the hand 24 mm into the head)
const onHead = (s, lat) => { const S = tiltPt(S_LOC(s), lat), n = tiltDir(N_LOC(s), lat);
  return { palm: V.add(S, V.mul(n, PALM_OFF)), f: tiltDir(F_LOC(s), lat), n: V.mul(n, -1) }; };
const hang = (s, abd) => ({ w: armWrist(s, 2, abd, 0.481), f: armDir(s, 2, abd), n: [-sg(s), 0.04, 0] });
// the reaching arm goes up out to the side first (over the head), then onto it
const upSide = s => ({ w: [sg(s) * 0.33, 1.78, 0.06], f: V.norm([-sg(s) * 0.5, 0.75, 0.1]), n: V.norm([-sg(s) * 0.4, -0.6, 0.1]) });
const lerp = (a, b, w) => a.map((x, i) => x + (b[i] - x) * w);
// wrist of the hub palm joint: the hub places 'palmAt' itself; during the transfer we blend wrist targets, so we keep both forms:
// reach phase uses 'wrist' (hang -> upSide), contact phase uses 'palmAt' (onHead). Weight track switches between them.
const local = (s, t) => { const u = ((t % DUR) + DUR) % DUR; return s === 'right' ? u : ((u - HALF) % DUR + DUR) % DUR; };
const reachArm = (s, t) => { const k = local(s, t), lat = Math.abs(latAt(t)) * (s === 'right' ? 1 : -1), H = hang(s, 6), U = upSide(s);
  if (k < 0.4 || k >= 7.9) return { mode: 'w', ...H };
  if (k < 1.0) { const w = win(k, 0.4, 1.0); return { mode: 'w', w: lerp(H.w, U.w, w), f: V.norm(lerp(H.f, U.f, w)), n: V.norm(lerp(H.n, U.n, w)) }; }
  if (k < 7.0) { const o = onHead(s, lat), w = win(k, 1.0, 1.5) * (1 - win(k, 6.6, 7.0)); return { mode: 'p', w: o.palm, f: o.f, n: o.n, blend: w, U }; }
  const w = win(k, 7.0, 7.9); return { mode: 'w', w: lerp(U.w, H.w, w), f: V.norm(lerp(U.f, H.f, w)), n: V.norm(lerp(U.n, H.n, w)) };
};
// the other arm: long, slightly away from the thigh, shoulder pressed down while its side is active
const pressArm = (s, t) => { const k = local(s === 'right' ? 'left' : 'right', t), w = k < HALF ? win(k, 0.6, 1.6) * (1 - win(k, 6.6, 7.6)) : 0;
  const H = hang(s, 6 + 8 * w); return { mode: 'w', ...H, press: w }; };
// one descriptor per hand: wrist target (reach / hang) and palmAt target (on the head) blended by the hand's 'free' weight
const armAt = (s, t) => { const u = ((t % DUR) + DUR) % DUR, active = (s === 'right') === (u < HALF); return active ? reachArm(s, t) : pressArm(s, t); };
const plantW = (s, t) => { const a = armAt(s, t); return a.mode === 'p' ? lerp(a.U.w, a.U.w, 0) : a.w; };
const plantF = (s, t) => { const a = armAt(s, t); return a.mode === 'p' ? a.U.f : a.f; };
const plantN = (s, t) => { const a = armAt(s, t); return a.mode === 'p' ? a.U.n : a.n; };
const freeW = (s, t) => { const a = armAt(s, t); return a.mode === 'p' ? a.blend : 0; };
const head = s => ({ palmAt: t => r4(armAt(s, t).mode === 'p' ? armAt(s, t).w : onHead(s, (s === 'right' ? 1 : -1) * LAT).palm),
  finger: t => r4(armAt(s, t).mode === 'p' ? armAt(s, t).f : onHead(s, (s === 'right' ? 1 : -1) * LAT).f),
  normal: t => r4(armAt(s, t).mode === 'p' ? armAt(s, t).n : onHead(s, (s === 'right' ? 1 : -1) * LAT).n) });
const hand = s => ({ w: t => freeW(s, t),
  plant: { mode: 'free', frame: 'world', wrist: t => r4(plantW(s, t)), finger: t => r4(plantF(s, t)), normal: t => r4(plantN(s, t)), poleUp: [sg(s) * 0.5, 1.2, -0.4] },
  free: { mode: 'free', frame: 'world', ...head(s), poleUp: [sg(s) * 0.6, 1.9, -0.1] } });
const P = build(DUR, {
  pelvis: [0, PELY, 0.012],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 2]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  shoulders: { left: t => r4([0, -0.022 * pressArm('left', t).press, 0]), right: t => r4([0, -0.022 * pressArm('right', t).press, 0]) },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [FX, 0.005], heading: 4, pole: [0.25, 0.6, 1] },
    right: { mode: 'floor', at: [-FX, 0.005], heading: -4, pole: [-0.25, 0.6, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { stretch: t => Math.abs(latAt(t)) / LAT });
export default {
  id: 't-standing-neck-side-stretch', name: '站姿颈侧拉伸', nameEn: 'Standing Neck Side Stretch',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  v5: { scapulaShift: true },
  v5r2: { fps: 30, head: perFrame(DUR, t => [0, +latAt(t).toFixed(2), 0]),
    hands: { left: perFrame(DUR, t => (local('left', t) < HALF && freeW('left', t) > 0 ? mix({ rest: 1 }) : mix({ relax: 1 }))),
      right: perFrame(DUR, t => (local('right', t) < HALF && freeW('right', t) > 0 ? mix({ rest: 1 }) : mix({ relax: 1 }))) } },
  highlight: { groups: ['trapezius'], side: 'both', pulseTrack: 'stretch', pulseBase: 0.3 },
  camera: { dir: [0.0, 0.1, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 640, height: 860, cx: 512, cy: 512 },
  stillAt: 4,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [], bands: [] },
  props: [],
  keyFrames: [0.2, 4.0, 12.0],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], straight: [{ j: 'knee.left', min: 165 }, { j: 'knee.right', min: 165 }],
    allowContact: ['thighL|thighR', 'upperArmL|torso', 'upperArmR|torso'] },
  flare2: { version: 'r2', batch: 1, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
