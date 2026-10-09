// chest-A 俯卧撑转侧撑 (push-up to side-plank rotation). High plank on flat pinned hands, toes tucked; a push-up, then the
// whole body turns (chest and pelvis together, one hips roll) into a side plank on one straight arm while the free arm sweeps
// up to the ceiling, holds, turns back. 12 s loop = right arm up (support left) then left arm up (support right).
// Head points +X, body faces the floor (-Y), body right = +Z.
// Hips rot = roll about the long axis FIRST, then the pitch TH (+ solver h1) about world Z, so the body stays inclined
// head-up after the roll (pitch-then-roll turned the incline into a sideways yaw and the body could not rise).
// The free hand's w track starts at 0.03 so the hand unlocks on the same frame its reach constraint drops (engine: reach is skipped
// once w > 1e-4, the floor lock releases once smooth(w) > 1e-4; a gap between the two made a 2-frame knee/elbow pop).
// The support shoulder is held over its hand (shoulder x/z constraints) so the support arm is vertical in the side plank.
// The free arm: plant -> free (chest frame) in the first 20 % of the turn, then it rotates about the shoulder in the chest frame
// from 'down to the floor' to 'out to the side' by phi = 90°·turn. With the 90° roll this sweeps the hand through the front of
// the chest at shoulder height (world angle 180°·turn), never through the body. Free wrist/finger are coordinate tracks
// (unit deltas repeating the base on the other entries). Feet roll from tucked toes onto their outer edges; the top leg is 8° forward (legAlign flex) so its foot sits in front (belly side).
const TH = 18, HX = 0.0, HZ = 0.23, FX = -1.17, FZ = 0.10, DEG = Math.PI / 180;
const DUR = 12, TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const cosE = u => (1 - Math.cos(Math.PI * u)) / 2;
const seg = (K, t) => { for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1]; if (t >= ta && t < tb) return va + (vb - va) * cosE((t - ta) / (tb - ta)); } return 0; };
const pushK = s0 => [[s0 + 0.3, 0], [s0 + 1.15, 1], [s0 + 2.0, 0]];                     // 0.85 s down, 0.85 s up
const turnK = s0 => [[s0 + 2.0, 0], [s0 + 3.0, 1], [s0 + 4.0, 1], [s0 + 5.0, 0]];        // 1 s turn, 1 s hold, 1 s back
const down = t => seg(pushK(0), t) + seg(pushK(6), t), rR = t => seg(turnK(0), t), rL = t => seg(turnK(6), t);
const lin = f => TS.map(t => [+t.toFixed(4), +f(t).toFixed(5), 'linear']);
const sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const AR = 0.4847, SY = 1.3702, SZ = -0.0042, SX = 0.1879;                               // rest arm length, rest shoulder
const F0 = [0, -Math.sin(TH * DEG), Math.cos(TH * DEG)];                                  // chest-frame arm direction in the plank
// at the top the arm also tilts headward by BE (the body's incline turns the chest's side axis toward the feet), so it ends vertical
const BE = 30;
const wristAt = (s, ph) => { const c = Math.cos(ph * DEG), n = Math.sin(ph * DEG), b = BE * (ph / 90) * DEG;
  const d = [n * Math.cos(b) * s, c * F0[1] + n * Math.sin(b), c * F0[2]], L = Math.hypot(...d);
  return [s * SX + AR * d[0] / L, SY + AR * d[1] / L, SZ + AR * d[2] / L]; };
const fingerAt = (s, ph) => { const n = Math.sin(ph * DEG), b = BE * (ph / 90) * DEG; return [s * n * Math.cos(b), Math.cos(ph * DEG) + n * Math.sin(b), 0]; };
const W0R = wristAt(-1, 0), W0L = wristAt(1, 0), FN0R = fingerAt(-1, 0), FN0L = fingerAt(1, 0);
const floorHand = z => ({ mode: 'floor', at: [HX, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.3, 0.95, 0.18] });
const freeHand = (W, FN) => ({ mode: 'free', frame: 'chest', wrist: W, finger: FN, normal: [0, 0, 1], poleUp: [Math.sign(W[0]) * 0.4, 1.6, -0.2], relax: 0.4 });
const unit = (B, i) => B.map((v, k) => (k === i ? v + 1 : v));                          // unit delta on entry i, base elsewhere
const hd = (side, key, B, i) => ({ hands: { [side]: { free: { [key]: unit(B, i) } } } });
const trk = {};
for (const [s, side, r, W0, FN0, tag] of [[-1, 'right', rR, W0R, FN0R, 'R'], [1, 'left', rL, W0L, FN0L, 'L']]) {
  const ph = t => 90 * r(t);
  ['x', 'y', 'z'].forEach((a, i) => { trk['w' + a + tag] = lin(t => wristAt(s, ph(t))[i] - W0[i]); });
  ['x', 'y'].forEach((a, i) => { trk['f' + a + tag] = lin(t => fingerAt(s, ph(t))[i] - FN0[i]); });
  trk['h' + tag] = lin(t => (r(t) > 1e-4 ? Math.max(0.03, sm(r(t) / 0.2)) : 0));   // starts at 0.03: the hand unlocks the same frame its reach constraint drops
}
const dl = {};
for (const [side, W0, FN0, tag] of [['right', W0R, FN0R, 'R'], ['left', W0L, FN0L, 'L']]) {
  ['x', 'y', 'z'].forEach((a, i) => { dl['w' + a + tag] = hd(side, 'wrist', W0, i); });
  ['x', 'y'].forEach((a, i) => { dl['f' + a + tag] = hd(side, 'finger', FN0, i); });
  dl['h' + tag] = { hands: { [side]: { w: 1 } } };
}
export default {
  id: 'chest-A', name: '俯卧撑转侧撑', nameEn: 'Push-Up to Side Plank Rotation',
  timeline: { duration: DUR, tracks: { down: lin(down), rotR: lin(rR), rotL: lin(rL), rot: lin(t => rR(t) + rL(t)), ...trk } },   // rot: QA gate only
  pose: {
    base: {
      pelvis: [-0.42, 0.40, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[1, 0, 0], 0], [[0, 0, 1], TH]] },
      hands: {
        right: { plant: floorHand(HZ), free: freeHand(W0R, FN0R), w: 0, arc: 0 },
        left: { plant: floorHand(-HZ), free: freeHand(W0L, FN0L), w: 0, arc: 0 },
      },
      feet: {
        right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: 66, roll: 0 },
        left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: 66, roll: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 8 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 8 },
        { type: 'reach', limb: 'rightLeg', angle: 178, weight: 12 }, { type: 'reach', limb: 'leftLeg', angle: 178, weight: 12 },
        { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: 0, weight: 0.3 },
        { type: 'joint', joint: 'leftShoulder', axis: [0, 0, 1], value: -HZ, weight: 0 }, { type: 'joint', joint: 'leftShoulder', axis: [1, 0, 0], value: HX, weight: 0 },
        { type: 'joint', joint: 'rightShoulder', axis: [0, 0, 1], value: HZ, weight: 0 }, { type: 'joint', joint: 'rightShoulder', axis: [1, 0, 0], value: HX, weight: 0 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.3 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.3 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h1'], reg: { px: 1, py: 1, pz: 1, h1: 0.05 }, iters: 60 },
    },
    deltas: {
      down: { constraints: [{ angle: 85 }, { angle: 85 }, {}, {}, {}, {}, {}, {}, {}, {}, {}] },
      // support LEFT hand, chest opens to +Z (roll -90 about the long axis), right arm to the ceiling
      rotR: { hips: { rot: [[[1, 0, 0], -90], [[0, 0, 1], TH]] },
        feet: { right: { at: [FX - 0.03, 0.20], heading: 0, pitch: 0, roll: -80 }, left: { at: [FX - 0.12, -0.08], heading: 0, pitch: 0, roll: -80 } },
        constraints: [{}, { weight: 8 }, {}, {}, { weight: 0 }, { weight: 0.3 }, { weight: 0.3 }, {}, {}, { flex: 12 }, {}] },
      rotL: { hips: { rot: [[[1, 0, 0], 90], [[0, 0, 1], TH]] },
        feet: { left: { at: [FX - 0.03, -0.20], heading: 180, pitch: 0, roll: 80 }, right: { at: [FX - 0.12, 0.08], heading: 180, pitch: 0, roll: 80 } },
        constraints: [{ weight: 8 }, {}, {}, {}, { weight: 0 }, {}, {}, { weight: 0.3 }, { weight: 0.3 }, {}, { flex: 12 }] },
      ...dl,
    },
  },
  highlight: { groups: ['chest'], side: 'both', pulseAt: [1.15, 3.5, 7.15, 9.5], pulseWidth: 0.5, pulseBase: 0.3 },
  camera: { dir: [1, 0.42, 0.0], driftPeriod: 12, driftPhase: 2.83, drift: 42,
    fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.16, k: 1.0, at: 3.5 },
  frame: { mode: 'fit', width: 820, height: 780, cx: 512, cy: 520 },
  stillAt: 3.5,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [1.15, 3.5, 9.5],
  qa: {
    pins: [{ c: 'handR', when: 'locked.right' }, { c: 'handL', when: 'locked.left' }, { c: 'footR', when: 'params.rot<0.001' }, { c: 'footL', when: 'params.rot<0.001' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.rotL>0.999' }, { j: 'elbow.left', min: 176, when: 'params.rotR>0.999' },
      { j: 'elbow.right', min: 174, when: 'params.rotR>0.2' }, { j: 'elbow.left', min: 174, when: 'params.rotL>0.2' },
      { j: 'knee.right', min: 176, when: 'params.rot<0.001' }, { j: 'knee.left', min: 176, when: 'params.rot<0.001' },
      { j: 'knee.right', min: 176, when: 'params.rot>0.999' }, { j: 'knee.left', min: 176, when: 'params.rot>0.999' },
      { j: 'knee.right', min: 174, when: 'params.rot>0.001' }, { j: 'knee.left', min: 174, when: 'params.rot>0.001' }],   // mid-turn: feet pivot, ≥174°
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'footL|footR', 'shinL|shinR', 'thighL|thighR'],
  },
};
