// forearms-A 跪姿多方向腕部摇摆 (quadruped wrist rocks), v2: all four hand positions the drill names, in order:
// fingers forward -> fingers out to the side -> fingers back (toward the knees) -> back of the hand on the mat (palm up,
// fingers toward the knees), then back to fingers forward. 16 s = 4 × 4 s; each 4 s block: the right hand, then the left hand
// lifts, turns and sets down (0.5 s each; the hand hovers ~6 cm), then one slow rock: shoulders forward over the hands (+13 cm,
// 0.9 s), hold 0.3 s, back (-9 cm, 1.0 s), hold 0.3 s, return 0.5 s.
// Arms locked straight, knees pinned on the mat under the hips (two-bone knee target), toes tucked.
// Head points +X, body faces the floor (-Y), body left = -Z (same frame as v1 / rotator-cuff-A).
// Hands: plant = flat palm on the floor (finger direction animated, changed only while the hand is in the air);
// free = a world-frame pose (the hover between two plants, or the back-of-hand pose). keepReach keeps the straight-arm reach
// constraint on the back-of-hand pose, which bears weight (engine: a free hand otherwise drops its reach constraint).
const HZ = 0.19, KX = -0.524, KZ = 0.0857, FX = -0.90, ROCK = 0.13, BACK = -0.7;
const DUR = 16, TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30), DEG = Math.PI / 180;
const cosE = u => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;
const seg = (K, t) => { for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1]; if (t >= ta && t < tb) return va + (vb - va) * cosE((t - ta) / (tb - ta)); } return K[K.length - 1][1]; };
const lin = f => TS.map(t => [+t.toFixed(4), +f(t).toFixed(5), 'linear']);
// rock per 4 s block
const RK = []; for (let b = 0; b < 4; b++) { const s = 4 * b; RK.push([s, 0], [s + 1.0, 0], [s + 1.9, 1], [s + 2.2, 1], [s + 3.2, BACK], [s + 3.5, BACK]); } RK.push([16, 0]);
const rock = t => seg(RK, t);
const HOV = 0.06, HOVF = 0.10, WY = 0.031, DWY = 0.033;     // floor-hand wrist height (getGroundHandPose), hover lift, back-of-hand wrist height
// Every hand change runs in the free (world) slot: w ramps 0 -> 1 in the first 12 % of the change, the free pose follows a
// designed path (wrist lifted on a sine, finger yaw a and palm roll b eased), and w ramps back to 0 onto the new plant in the
// last 12 % (or stays 1 for the back-of-hand block). Yaw a: 0 = fingers +X (forward), 90 = outward, 180 = back toward the knees.
// Roll b: 0 = palm down, 180 = palm up (back of the hand on the mat). The plant direction is swapped while w = 1.
const trk = {}, dl = {};
const unitA = (B, i) => B.map((v, k) => (k === i ? v + 1 : v));
const sides = [['right', 1, 0.0, 'R'], ['left', -1, 0.5, 'L']];
const base = {};
for (const [side, zs, o, tag] of sides) {
  const z = zs * HZ;
  const pose = (a, b, y) => { const f = [Math.cos(a * DEG), 0, zs * Math.sin(a * DEG)];
    const s = [-f[2] * zs, 0, f[0] * zs];                      // horizontal, perpendicular to the fingers (toward the thumb side)
    const n = [0, 1, 2].map(i => -Math.cos(b * DEG) * [0, 1, 0][i] + Math.sin(b * DEG) * s[i]);
    return { wrist: [0, y, z], finger: f, normal: n }; };
  // changes: [start, a0, a1, b0, b1, y0, y1, endsOnPlant]
  const CH = [[0 + o, 180, 0, 180, 0, DWY, WY, true], [4 + o, 0, 90, 0, 0, WY, WY, true], [8 + o, 90, 180, 0, 0, WY, WY, true], [12 + o, 180, 180, 0, 180, WY, DWY, false]];
  const D = 0.5, RMP = 0.12;
  const at = t => { for (const [s0, a0, a1, b0, b1, y0, y1, pl] of CH) { const u = (t - s0) / D; if (u >= 0 && u < 1) {
        const yaw = a0 + (a1 - a0) * cosE((u - (b0 !== b1 ? 0.35 : 0)) / (b0 !== b1 ? 0.65 : 1));   // flip first, then turn
        const roll = b0 + (b1 - b0) * cosE(u / (a0 !== a1 && b0 !== b1 ? 0.6 : 1));
        const P = pose(yaw, roll, y0 + (y1 - y0) * cosE(u) + (b0 === 180 ? HOVF : HOV) * Math.sin(Math.PI * u));   // HOVF: the palm-up -> palm-down flip lifts higher (at HOV the rolling knuckles dipped 10 mm into the mat at u 0.27)
        const w = Math.min(1, b0 === 180 ? 1 : u / RMP, pl ? (1 - u) / RMP : 1);   // leaving the back-of-hand pose: already free
        return { P, w, relax: 0.35 * Math.sin(Math.PI * u) + 0.45 * (b0 === 180 ? 1 - cosE(u / 0.4) : b1 === 180 ? cosE((u - 0.6) / 0.4) : 0), k: 0 }; } }
    const dors = t >= 12 + o + D || t < o;
    return { P: dors ? pose(180, 180, DWY) : pose(0, 0, WY), w: dors ? 1 : 0, relax: dors ? 0.45 : 0, k: dors ? 1 : 0 }; };   // palm-up fingers curl up a little: reads as the back of the hand
  // plant direction per block (swapped while the hand is in the air)
  const plantA = t => (t < 4 + o + D / 2 ? 0 : t < 8 + o + D / 2 ? 90 : 180) * DEG;
  const pf = t => [Math.cos(plantA(t)), zs * Math.sin(plantA(t))];
  const kR = t => { const d = (t - (12 + o + D)); if (t >= 12 + o + D) return Math.min(1, d / 0.15); if (t < o) return 1; return 0; };   // keepReach drops in one step as the hand leaves the mat: a partial value (2-frame ramp) made the LM solve pop the pelvis 34 cm at f1/f16
  const F0 = at(0).P;
  base[side] = { plant: { mode: 'floor', at: [0.0, z], finger: [1, 0], poleUp: [zs * -0.24, 0.95, 0.18] },
    free: { mode: 'free', frame: 'world', wrist: F0.wrist, finger: F0.finger, normal: F0.normal, poleUp: [zs * -0.24, 0.95, 0.18] },
    w: 0, arc: 0, keepReach: 0, relax: 0 };
  trk['w' + tag] = lin(t => at(t).w); dl['w' + tag] = { hands: { [side]: { w: 1 } } };
  trk['k' + tag] = lin(kR); dl['k' + tag] = { hands: { [side]: { keepReach: 1 } } };
  trk['x' + tag] = lin(t => at(t).relax); dl['x' + tag] = { hands: { [side]: { relax: 1 } } };
  [0, 1].forEach(i => { trk['pf' + i + tag] = lin(t => pf(t)[i] - [1, 0][i]); dl['pf' + i + tag] = { hands: { [side]: { plant: { finger: unitA([1, 0], i) } } } }; });
  for (const key of ['wrist', 'finger', 'normal']) [0, 1, 2].forEach(i => {
    trk['f' + key[0] + i + tag] = lin(t => at(t).P[key][i] - F0[key][i]);
    dl['f' + key[0] + i + tag] = { hands: { [side]: { free: { [key]: unitA(F0[key], i) } } } }; });
}
// QA phase markers: both hands planted and settled in block b (1.0 .. 4.0 s of the block)
const ph = b => lin(t => (t >= 4 * b + 1.0 && t < 4 * b + 4.0 - 1 / 60 ? 1 : 0));
export default {
  id: 'forearms-A', name: '跪姿多方向腕部摇摆', nameEn: 'Quadruped Wrist Rocks',
  timeline: { duration: DUR, tracks: { rock: lin(rock), qF: ph(0), qS: ph(1), qB: ph(2), qD: ph(3), ...trk } },
  pose: {
    base: {
      pelvis: [-0.52, 0.45, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], 8]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      hands: base,
      feet: {
        right: { mode: 'floor', at: [FX, KZ], heading: 90, pitch: 62, pole: [KX, 0.0765, KZ] },
        left: { mode: 'floor', at: [FX, -KZ], heading: 90, pitch: 62, pole: [KX, 0.0765, -KZ] },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'mid', limb: 'rightLeg', at: [KX, 0.0765, KZ], weight: 1 }, { type: 'mid', limb: 'leftLeg', at: [KX, 0.0765, -KZ], weight: 1 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h0', 'c0'], reg: { px: 0.3, py: 0.3, pz: 1, h0: 0.01, c0: 0.3 }, iters: 80 },
    },
    deltas: { rock: { constraints: [{}, {}, {}, {}, { value: ROCK }] }, ...dl },
  },
  highlight: { groups: ['forearms'], side: 'both', pulseAt: [2.05, 6.05, 10.05, 14.05], pulseWidth: 0.6, pulseBase: 0.3 },
  camera: { dir: [0.45, 0.55, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftShoulder'], pad: 0.14, k: 0.8, drift: 0.9 },
  frame: { mode: 'fit', width: 800, cx: 512, cy: 540 },
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightKnee', 'leftKnee', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 46, ry: 12, a: 0.7, fade: [0.03, 0.08] }, { j: 'leftPalm', rx: 46, ry: 12, a: 0.7, fade: [0.03, 0.08] }, { j: 'rightKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'leftKnee', rx: 40, ry: 11, a: 0.65 }, { j: 'rightToe', rx: 30, ry: 9, a: 0.5 }, { j: 'leftToe', rx: 30, ry: 9, a: 0.5 }],
    bands: [{ from: 'shoulderCenter', to: 'rightKnee', mid: 'pelvis', rx: 70, ry: 15, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.40, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [2.05, 6.05, 10.05, 14.05],
  qa: {
    pins: [{ c: 'handR', when: 'params.qF>0.5' }, { c: 'handL', when: 'params.qF>0.5' }, { c: 'handR', when: 'params.qS>0.5' }, { c: 'handL', when: 'params.qS>0.5' },
      { c: 'handR', when: 'params.qB>0.5' }, { c: 'handL', when: 'params.qB>0.5' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'rightKnee' }, { j: 'leftKnee' }, { j: 'rightPalm', when: 'params.qD>0.5' }, { j: 'leftPalm', when: 'params.qD>0.5' }],
    straight: [['F', 'qF'], ['S', 'qS'], ['B', 'qB'], ['D', 'qD']].flatMap(([, q]) => [{ j: 'elbow.right', min: 172, when: `params.${q}>0.5` }, { j: 'elbow.left', min: 172, when: `params.${q}>0.5` }]),
    allowContact: ['thighR|shinR', 'thighL|shinL'],
  },
};
