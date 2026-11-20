// t-standing-wrist-flexor-stretch 站姿屈腕拉伸（无墙）(standing wrist-flexor stretch, no wall) · Flare 2.0 cool-down, r2 batch 1
// (2026-11-21). Standard: tools/flare2-moves-r2/standards/t-standing-wrist-flexor-stretch.md. (h-wall-wrist-flexor-stretch is the
// wall version; this one uses the other hand, as the brief asks.)
// Standing tall. RIGHT arm straight forward at shoulder height, palm facing forward, fingers pointing down; the LEFT hand takes the
// right fingers on their palm side and gently draws them back toward the body (wrist extension + fingers bent back at the knuckles)
// until the inside of the forearm stretches; elbow stays straight; static hold, then ease off a little and repeat the gentle draw.
// One side shown (right hand; the app mirrors for the left, like the r1 wrist actions); the dose is a hold per side.
// 8 s loop: 0.6-1.8 s draw back, hold to 6.6 s, 6.6-7.6 s ease off. Finger poses are V5-only (spec v5r2.hands).
// Frame: head +Y, front +Z, body left +X; hands in the chest frame (rest coordinates).
import { build, keys, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
import { mix, perFrame, V } from '../lib/flare2-r2.mjs';
const DUR = 8, PELY = 0.957, FX = 0.10;
const pull0 = keys([[0, 0], [0.6, 0], [1.8, 1], [6.6, 1], [7.6, 0]], DUR);
// r2 check: the hand only eases off a little (never lets go): fully relaxed fingers put the left hand out of reach (8.8 mm clash)
const pull = t => 0.8 + 0.2 * pull0(t);
const EXT0 = 70, EXT1 = 80, MCP1 = 30;                 // wrist extension (deg) relaxed / drawn back; finger back-bend at the knuckles
// r2 check: with the arm straight forward (psi 2) the right fingers sat ~0.64 m from the left shoulder, out of the left arm's reach (the
// left hand stopped ~5 cm short, no contact); the arm now points 26 deg toward the midline, as people do in this stretch, and is fully long.
const ADD = -26;
const WR = armWrist('right', 88, ADD, 0.487);          // right arm forward (toward the midline), shoulder height, straight
const FA = V.norm(armDir('right', 88, ADD));           // forearm direction
const AX = V.norm(V.cross([0, 1, 0], FA));            // wrist bend axis (horizontal, across the forearm)
const LATR = [-1, 0, 0];                               // lateral (body right)
const right = t => { const e = (EXT0 + (EXT1 - EXT0) * pull(t)) * Math.PI / 180;
  // finger direction: forearm direction turned down by e about the lateral axis (wrist extension with the palm facing forward)
  const f = V.norm(V.rot(FA, AX, e * 180 / Math.PI)); const n = V.norm(V.rot(FA, AX, e * 180 / Math.PI - 90));
  return { f, n, e }; };
// left hand on the right fingers' palm side: middle of the fingers after the knuckle back-bend, plus the hand thickness
const MCP_AT = 0.082, MID = 0.034, SURF = 0.011, LPALM = 0.012;
const leftOn = t => { const r = right(t), b = MCP1 * pull(t);
  const f2 = V.norm(V.rot(r.f, AX, b)), n2 = V.norm(V.rot(r.n, AX, b));   // fingers bent back toward the dorsum
  const mid = V.add(V.add(V.add(WR, V.mul(r.f, MCP_AT)), V.mul(f2, MID)), V.mul(n2, SURF));
  return { palm: V.add(mid, V.mul(n2, LPALM)), f: V.mul(AX, -1), n: V.mul(n2, -1) }; };
const P = build(DUR, {
  pelvis: [0, PELY, 0.012],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 1]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: {
    right: { mode: 'free', frame: 'chest', wrist: r4(WR), finger: t => r4(right(t).f), normal: t => r4(right(t).n), poleUp: [-0.5, 1.0, 0.0] },
    left: { mode: 'free', frame: 'chest', palmAt: t => r4(leftOn(t).palm), finger: t => r4(leftOn(t).f), normal: t => r4(leftOn(t).n), poleUp: [0.6, 0.9, 0.1] },
  },
  feet: {
    left: { mode: 'floor', at: [FX, 0.005], heading: 4, pole: [0.25, 0.6, 1] },
    right: { mode: 'floor', at: [-FX, 0.005], heading: -4, pole: [-0.25, 0.6, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { stretch: pull });
export default {
  id: 't-standing-wrist-flexor-stretch', name: '站姿屈腕拉伸', nameEn: 'Standing Wrist Flexor Stretch (No Wall)',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  v5r2: { fps: 30, hands: { right: perFrame(DUR, t => { const w = pull(t); return mix({ pulled: w, rest: 1 - w }); }), left: perFrame(DUR, () => mix({ hook: 1 })) } },
  highlight: { groups: ['forearms'], side: 'right', pulseTrack: 'stretch', pulseBase: 0.3 },
  camera: { dir: [-1, 0.15, 0.55], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'rightElbow'], pad: 0.14, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 800, height: 820, cx: 512, cy: 510 },
  stillAt: 4,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [], bands: [] },
  props: [],
  keyFrames: [0.3, 4.0, 7.0],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], straight: [{ j: 'elbow.right', min: 170 }], allowContact: [] },
  flare2: { version: 'r2', batch: 1, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
