// t-kneeling-wrist-pushup 跪姿手腕俯卧撑 (kneeling wrist push-up / palm-heel raise) · Flare 2.0 练后 专项补强, r3 batch 2a (2026-11-21).
// Standard: tools/flare2-moves-r3/standards/t-kneeling-wrist-pushup.md.
// Kneeling plank (knees on the mat, knee-hip-shoulder one straight line), hands flat under the shoulders, fingers forward, ELBOWS
// LOCKED the whole time. Both hands together: press the fingers into the mat and lift the heels of the palms until only the fingers
// (from the finger roots) are down, then lower the palms SLOWLY (3 s) back to flat. The fingers stay flat on the mat; the knuckles
// (finger roots) are the pivot and do not move. The arms stay straight, so the shoulders rise and fall with the wrists (the straight
// body pivots about the knees).
// Kneeling set-up of t-kneeling-scap-pushup (knees pinned on the mat, arms locked, solver px / py / h0). Hands: free world hands whose
// V5 metacarpal line (wrist pivot -> middle MCP centre, 80 mm) turns about the MCP centre by the lift angle; the fingers are bent back at
// the knuckles by the same angle (V5-only finger pose, drill-anim/lib/flare2-r3.mjs fingersFlatUnderLift), so they stay flat.
// Head points -X, body faces the floor, body left = +Z.
// Loop 10 s = 2 reps of 5 s: 0.4 s flat, 1.0 s lift, 0.5 s at the top, 3.0 s slow lower, 0.1 s (x2).
import { build, keys } from '../lib/home-anim.mjs';
import { perFrame, fingersFlatUnderLift, V } from '../lib/flare2-r3.mjs';
const DUR = 10;
const KNEE = [0.826, 0.049];               // knee joint centre (x, height) on the mat
const HX = 0.115, HZ = 0.20;               // flat hands: wrist pivots (x) under the shoulders, hand width
const MY = 0.0345;                         // middle MCP centre height above the mat (the pivot; measured on V5: palm flat and fingers down)
const OFF = -4.7;                          // the V5 metacarpal line sits 4.7 deg wrist-up of the commanded flat hub hand: level it
const LIFT = 58;                           // palm heel lift at the top (deg, metacarpal line above the mat)
const MCP = 0.080;                         // V5 wrist pivot -> middle MCP centre
const YAW = 10;                            // the V5 metacarpal line sits ~10 deg toward the little-finger side of the hub finger axis: aim in
const lift = keys([[0, 0], [0.4, 0], [1.4, 1], [1.9, 1], [4.9, 0], [5.0, 0], [5.4, 0], [6.4, 1], [6.9, 1], [9.9, 0]], DUR);
const ang = t => OFF + LIFT * lift(t);
const hand = s => { const sg = s === 'left' ? 1 : -1;
  const f0 = V.norm(V.rot([-1, 0, 0], [0, 1, 0], -sg * YAW));        // hub finger axis, yawed in so V5 fingers point straight forward
  const a0 = [-1, 0, 0];                                              // V5 metacarpal line (forward, flat)
  const M = [HX - MCP, MY, sg * HZ];                                 // MCP centre = the pivot
  const R = (v, t) => V.rot(v, [0, 0, 1], ang(t));                    // heel up: the wrist end of the hand rises (about +Z)
  return { mode: 'free', frame: 'world', relax: 0, poleUp: [sg * 0.4, 0.95, 0.13],
    wrist: t => V.sub(M, V.mul(R(a0, t), MCP)).map(x => +x.toFixed(5)), finger: t => R(f0, t).map(x => +x.toFixed(5)), normal: t => R([0, -1, 0], t).map(x => +x.toFixed(5)) }; };
const P = build(DUR, {
  pelvis: [0.42404, 0.26142, 0],
  hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -32.25971]] },
  chest: { waist: [[[0, 0, 1], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [1.201, 0.085], heading: -90, pitch: 62, pole: [0.8155, 0.04, 0.085] },
    right: { mode: 'floor', at: [1.201, -0.085], heading: -90, pitch: 62, pole: [0.8155, 0.04, -0.085] },
  },
  constraints: [
    { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 20 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 20 },
    ...['leftKnee', 'rightKnee'].flatMap(j => [{ type: 'joint', joint: j, axis: [0, 1, 0], value: KNEE[1], weight: 20 }, { type: 'joint', joint: j, axis: [1, 0, 0], value: KNEE[0], weight: 20 }]),
  ],
  solve: { vars: ['px', 'py', 'h0'], reg: { px: 0.01, py: 0.01, h0: 0.001 }, iters: 60 },
}, { lift });
// knuckle back-bend vs palm lift (deg): fitted on V5 in the sandbox so the finger pads stay pressed on the mat through the whole lift
// (bending back by the full palm angle left the fingertips up to 19 mm above the mat; the flat open hand rests on the palm heel with the
// fingertips ~5-7 mm up, so the fingers are curled 8 deg down there)
const ext = a => -8 + 0.52 * a + 0.0039 * a * a;
const fingers = t => fingersFlatUnderLift(ext(LIFT * lift(t)));
export default {
  id: 't-kneeling-wrist-pushup', name: '跪姿手腕俯卧撑', nameEn: 'Kneeling Wrist Push-Up',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  v5r2: { fps: 30, hands: { left: perFrame(DUR, fingers), right: perFrame(DUR, fingers) } },
  highlight: { groups: ['forearms'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [-0.3, 0.22, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.14, k: 1, drift: 0, at: 1.6, fitTimeline: true },
  frame: { mode: 'fit', width: 800, height: 780, cx: 512, cy: 535 },
  stillAt: 1.6,
  shadow: { joints: ['leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 1.6, 3.4],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], jointPins: [{ j: 'leftKnee' }, { j: 'rightKnee' }],
    allowContact: ['thighL|shinL', 'thighR|shinR'], straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }] },
  flare2: { version: 'r3', batch: '2a', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
