// obliques-A 熊爬穿腿 (beast kick-through). Bear position: flat pinned hands under the shoulders, toes tucked, knees hovering
// ~8 cm off the floor. Kick R: lift the RIGHT hand, pivot on the LEFT hand and RIGHT foot, roll the body ~100° (belly to +Z)
// and thread the LEFT leg under the body out to the +Z side, straight; the right knee bends up with its sole flat; the free right
// arm sweeps up (as chest-A). Hips stay off the floor. Kick L mirrors it. 8 s = R (1.2 s out, 0.8 s hold, 1.2 s back, 0.8 s bear)
// then L. Head points +X, body faces the floor (-Y), body right = +Z.
// The roll leads (param R) and the threading leg lags (T*) so the hips have turned before the leg passes under them.
// Threading foot: a floor foot lifted off the floor (lift track = clearance), its ankle x/z on a quadratic Bezier (coordinate
// tracks with unit deltas that repeat the base on the other entries), orientation blended from tucked toes to 'toes forward'.
const DEG = Math.PI / 180, DUR = 8, TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const HZ = 0.20, FX = -1.0, FZ = 0.13, PT = 50, TH0 = 4, TH1 = 16, ROLL = 100, KY = 0.09;
const cosE = u => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, u)))) / 2;
const seg = (K, t) => { for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1]; if (t >= ta && t < tb) return va + (vb - va) * cosE((t - ta) / (tb - ta)); } return 0; };
const K = s0 => [[s0 + 0.0, 0], [s0 + 0.4, 0], [s0 + 1.6, 1], [s0 + 2.4, 1], [s0 + 3.6, 0], [s0 + 4.0, 0]];
const rR = t => seg(K(0), t), rL = t => seg(K(4), t);
// leg lag: the thread param trails the roll both ways, so the way back is the exact time-mirror of the way out (a return that
// led the roll passed the threading shin through the support shin, -36 mm)
const lag = (r, out) => cosE((r - 0.12) / 0.88);
const outR = t => t < 2.0, outL = t => t < 6.0;
const tR = t => lag(rR(t), outR(t)), tL = t => lag(rL(t), outL(t));
const lin = f => TS.map(t => [+t.toFixed(4), +f(t).toFixed(5), 'linear']);
const sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
// threading ankle path (world), for the LEFT leg in kick R; kick L mirrors z
// C0 moved from [-0.50, 0.10, -0.02] (153 deg hip flexion) back toward the feet and out toward +Z so the foot passes further from the hip
const B0 = [FX, 0.12, -FZ], C0 = [-0.66, 0.10, 0.05], E0 = [-0.35, 0.08, 0.73];
const PK = [-0.64, 0.34, 0.10];                                                          // kick pelvis (x, y, |z| toward the support side)
const bez = (u, s) => [0, 1, 2].map(i => { const z = i === 2 ? s : 1; return ((1 - u) ** 2 * B0[i] + 2 * u * (1 - u) * C0[i] + u * u * E0[i]) * z; });
// free arm sweep (as chest-A): plank-down -> out to the side, in the chest frame, plus a headward tilt at the top
const AR = 0.4847, SY = 1.3702, SZ = -0.0042, SX = 0.1879, BE = 25;
const F0 = [0, -Math.sin(TH0 * DEG), Math.cos(TH0 * DEG)];
const wristAt = (s, ph) => { const c = Math.cos(ph * DEG), n = Math.sin(ph * DEG), b = BE * (ph / 90) * DEG;
  const d = [n * Math.cos(b) * s, c * F0[1] + n * Math.sin(b), c * F0[2]], L = Math.hypot(...d);
  return [s * SX + AR * d[0] / L, SY + AR * d[1] / L, SZ + AR * d[2] / L]; };
const fingerAt = (s, ph) => { const n = Math.sin(ph * DEG), b = BE * (ph / 90) * DEG; return [s * n * Math.cos(b), Math.cos(ph * DEG) + n * Math.sin(b), 0]; };
const W0R = wristAt(-1, 0), W0L = wristAt(1, 0), FN0R = fingerAt(-1, 0), FN0L = fingerAt(1, 0);
const floorHand = z => ({ mode: 'floor', at: [0, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.3, 0.95, 0.18] });
const freeHand = (W, FN) => ({ mode: 'free', frame: 'chest', wrist: W, finger: FN, normal: [0, 0, 1], poleUp: [Math.sign(W[0]) * 0.4, 1.6, -0.2], relax: 0.4 });
const unit = (Bv, i) => Bv.map((v, k) => (k === i ? v + 1 : v));
const tucked = z => ({ mode: 'floor', at: [FX, z], heading: 90, pitch: PT, roll: 0, lift: 0, pole: [-0.2, -0.4, z] });
const lift = u => 0.035 * u + 0.06 * 4 * u * (1 - u);                                   // clearance of the threading foot's lowest point
// v2: (toe - ankle) x/z of the support foot measured at EVERY roll value r the loop samples (kick R frames 0..120; kick L
// samples the same r values 120 frames later), [r, dx, dz]. v1 interpolated a 21-entry table (r step 0.05): toe slide 0.13 mm.
const TOFF = [[0, 0.115702, 0], [0.001906, 0.115931, 0.000174], [0.007594, 0.116611, 0.000696], [0.01704, 0.117729, 0.001576], [0.030167, 0.119258, 0.002826], [0.046833, 0.121157, 0.004459], [0.06699, 0.123389, 0.006498], [0.090447, 0.125895, 0.008958], [0.116953, 0.128604, 0.011846], [0.14645, 0.131458, 0.015188], [0.178645, 0.134374, 0.018978], [0.213175, 0.137263, 0.023199], [0.25, 0.14006, 0.02786], [0.28873, 0.142676, 0.032921], [0.32895, 0.14503, 0.038326], [0.37059, 0.147066, 0.044056], [0.413223, 0.148721, 0.050036], [0.456377, 0.149946, 0.056173], [0.5, 0.150717, 0.062429], [0.543623, 0.151018, 0.068705], [0.586777, 0.150852, 0.0749], [0.62941, 0.150237, 0.080974], [0.67105, 0.149208, 0.086831], [0.71127, 0.147817, 0.092392], [0.75, 0.146117, 0.097632], [0.786825, 0.144179, 0.102489], [0.821355, 0.142084, 0.106916], [0.85355, 0.139895, 0.110919], [0.883047, 0.137697, 0.114469], [0.909553, 0.135569, 0.117557], [0.93301, 0.133568, 0.120204], [0.953167, 0.131764, 0.12241], [0.969833, 0.130214, 0.124185], [0.98296, 0.128957, 0.125551], [0.992406, 0.128033, 0.126515], [0.998094, 0.127469, 0.127088], [1, 0.127279, 0.127279]];
const toeOff = r => { r = Math.max(0, Math.min(1, r)); let i = 0; while (i < TOFF.length - 2 && TOFF[i + 1][0] <= r) i++;
  const [r0, x0, z0] = TOFF[i], [r1, x1, z1] = TOFF[i + 1], f = r1 > r0 ? Math.min(1, (r - r0) / (r1 - r0)) : 0; return [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f]; };
const TOE0 = [FX + TOFF[0][1], FZ + TOFF[0][2]];                                        // bear toe (x, |z|)
const trk = {}, dl = {};
for (const [s, side, r, th, W0, FN0, tag, kick] of [[-1, 'right', rR, tR, W0R, FN0R, 'R', 'left'], [1, 'left', rL, tL, W0L, FN0L, 'L', 'right']]) {
  const ph = t => 90 * r(t), zs = kick === 'left' ? 1 : -1;
  ['x', 'y', 'z'].forEach((a, i) => { trk['w' + a + tag] = lin(t => wristAt(s, ph(t))[i] - W0[i]); dl['w' + a + tag] = { hands: { [side]: { free: { wrist: unit(W0, i) } } } }; });
  ['x', 'y'].forEach((a, i) => { trk['f' + a + tag] = lin(t => fingerAt(s, ph(t))[i] - FN0[i]); dl['f' + a + tag] = { hands: { [side]: { free: { finger: unit(FN0, i) } } } }; });
  // w starts at 0.03: unlock + reach drop on the same frame (see chest-A)
  trk['h' + tag] = lin(t => (r(t) > 1e-4 ? Math.max(0.03, sm(r(t) / 0.2)) : 0)); dl['h' + tag] = { hands: { [side]: { w: 1 } } };
  const A0 = [FX, -FZ * zs];
  [['x', 0], ['z', 2]].forEach(([a, i], j) => { trk['a' + a + tag] = lin(t => bez(th(t), zs)[i] - A0[j]); dl['a' + a + tag] = { feet: { [kick]: { at: unit(A0, j) } } }; });
  trk['l' + tag] = lin(t => lift(th(t))); dl['l' + tag] = { feet: { [kick]: { lift: 1 } } };
  // knee pole of the threading leg: down (bear) -> forward toward the hands (knee drives through under the chest) -> up (kick)
  const P0 = [-0.2, -0.4, -FZ * zs], P1 = [-0.1, -0.4, 0.7 * zs], P2 = [-0.3, 0.4, 1.0 * zs]  /* knee opens sideways (+Z) at the end of the thread, not up: less flexion */;
  const pole = u => [0, 1, 2].map(i => (1 - u) ** 2 * P0[i] + 2 * u * (1 - u) * P1[i] + u * u * P2[i]);
  ['x', 'y', 'z'].forEach((a, i) => { trk['p' + a + tag] = lin(t => pole(th(t))[i] - P0[i]); dl['p' + a + tag] = { feet: { [kick]: { pole: unit(P0, i) } } }; });
  trk['b' + tag] = lin(t => 0.16 * 4 * th(t) * (1 - th(t)));   // pelvis rises 16 cm mid-thread so the leg has room under the body
  dl['b' + tag] = { constraints: [{}, {}, {}, {}, {}, {}, { value: 0.441 + 1 }, {}, {}] };
  // support foot pivots on the ball of the foot: its ankle (= the floor foot's `at`) is placed at toe0 - (toe - ankle)(r), the
  // toe offset the heading/pitch blend gives at roll r (measured table, kick R; kick L mirrors z). Before, the ankle stepped 12 cm
  // and the toe swung 18 cm across the mat.
  const sup = kick === 'left' ? 'right' : 'left', S0 = [FX, FZ * zs];
  ['x', 'z'].forEach((a, j) => { trk['g' + a + tag] = lin(t => { const o = toeOff(r(t)); return (j ? (TOE0[1] - o[1]) * zs : TOE0[0] - o[0]) - S0[j]; });
    dl['g' + a + tag] = { feet: { [sup]: { at: unit(S0, j) } } }; });
  trk['T' + tag] = lin(th); trk['s' + tag] = lin(t => Math.max(0, (th(t) - 0.75) / 0.25) ** 2);
}
export default {
  id: 'obliques-A', name: '熊爬穿腿', nameEn: 'Kick-Through (Beast Flow)',
  timeline: { duration: DUR, tracks: { R: lin(rR), L: lin(rL), rot: lin(t => rR(t) + rL(t)), ...trk } },
  pose: {
    base: {
      pelvis: [-0.52, 0.50, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[1, 0, 0], 0], [[0, 0, 1], TH0]] },
      hands: { right: { plant: floorHand(HZ), free: freeHand(W0R, FN0R), w: 0, arc: 0 }, left: { plant: floorHand(-HZ), free: freeHand(W0L, FN0L), w: 0, arc: 0 } },
      feet: { right: tucked(FZ), left: tucked(-FZ) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 4 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 4 },
        { type: 'mid', limb: 'rightLeg', at: [0, KY, 0], axes: [0, 1, 0], weight: 1 }, { type: 'mid', limb: 'leftLeg', at: [0, KY, 0], axes: [0, 1, 0], weight: 1 },
        { type: 'reach', limb: 'leftLeg', angle: 176, weight: 0 }, { type: 'reach', limb: 'rightLeg', angle: 176, weight: 0 },
        // authored pelvis path: the solved bear pelvis -> the kick pelvis (the kick is otherwise under-determined and the LM wandered)
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.441, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: 0, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: -0.591, weight: 1 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h1'], reg: { px: 1, py: 1, pz: 1, h1: 0.05 }, iters: 60 },
    },
    deltas: {
      R: { hips: { rot: [[[1, 0, 0], -ROLL], [[0, 0, 1], TH1]] }, feet: { right: { heading: 45, pitch: 0, pole: [-0.3, 1.2, 0.9] } },
        constraints: [{}, { weight: 8 }, { weight: 0 }, { weight: 0 }, {}, {}, {}, {}, {}] },
      L: { hips: { rot: [[[1, 0, 0], ROLL], [[0, 0, 1], TH1]] }, feet: { left: { heading: 135, pitch: 0, pole: [-0.3, 1.2, -0.9] } },
        constraints: [{ weight: 8 }, {}, { weight: 0 }, { weight: 0 }, {}, {}, {}, {}, {}] },
      TR: { feet: { left: { heading: 0, pitch: -10 } }, constraints: [{}, {}, {}, {}, {}, {}, { value: PK[1] }, { value: -PK[2] }, { value: PK[0] }] },   // the pelvis drops with the thread, not the roll
      sR: { constraints: [{}, {}, {}, {}, { weight: 3 }, {}, {}, {}, {}] },   // the threading leg is held straight only at the end of the thread
      TL: { feet: { right: { heading: 180, pitch: -10 } }, constraints: [{}, {}, {}, {}, {}, {}, { value: PK[1] }, { value: PK[2] }, { value: PK[0] }] },
      sL: { constraints: [{}, {}, {}, {}, {}, { weight: 3 }, {}, {}, {}] },
      ...dl,
    },
  },
  highlight: { groups: ['obliques'], side: 'both', pulseAt: [2.0, 6.0], pulseWidth: 0.7, pulseBase: 0.3 },
  // v2 (review r1): low side camera from the body's right (+Z) side, no yaw sway (v1/WIP: front-high [1, 0.5, 0] swaying +-42 deg).
  // The bear shape, both kicks and the oblique highlight read from the side; the mat stays whole in frame.
  camera: { dir: [0.2, 0.25, 1], drift: 0,
    fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder', 'leftKnee', 'rightKnee'], pad: 0.22, k: 1.0, at: 2.0 },
  frame: { mode: 'fit', width: 760, height: 720, cx: 512, cy: 520 },   // v2: was 820/780/cy 550, the mat's near edge left the frame in the bear frames
  stillAt: 2.0,
  // v2: contact blobs fade out as soon as the hand/foot leaves the floor (probe footh.js: grounded palm joint 6 mm, grounded
  // tucked toe joint 84-94 mm incl. the support-foot pivot; the threading foot's toe joint sits at 158 mm while that foot hovers
  // 37 mm up, so the WIP fade [0.10, 0.20] still drew a 42% blob under it). Palm [8, 30] mm, toe [95, 105] mm -> 0 when airborne.
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7, fade: [0.008, 0.03] }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7, fade: [0.008, 0.03] }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6, fade: [0.095, 0.105] }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6, fade: [0.095, 0.105] }, { j: 'pelvis', rx: 70, ry: 18, a: 0.35 }] },
  props: [{ type: 'mat', at: [-0.45, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0, 2.0, 6.0],
  qa: {
    // Hip flexion limit raised for this drill only (default 135). The threading leg's knee has to pass under the chest while the
    // support foot (pivoting on its ball) and its bent-up shin block the space behind: a bear-crawl kick-through briefly needs ~140+ deg
    // of hip flexion with the knee bent ~45 deg (active hip flexion with a bent knee reaches 120-140 deg, passive ~150). Measured peak
    // 144.5 deg for 2-3 frames per side (f32). A wider foot path (C0 x -0.72/-0.78/-0.85) gets under 135 only by driving the threading
    // shin through the support shin (capsule overlap -28 to -44 mm), so the limit is 150 here.
    hipFlexMax: 150,
    pins: [{ c: 'handR', when: 'locked.right' }, { c: 'handL', when: 'locked.left' }, { c: 'footR', when: 'params.rot<0.001' }, { c: 'footL', when: 'params.rot<0.001' }],
    // the support foot pivots on its ball during its kick (heel swings, toe joint rolls up ~6 mm): pin the toe joint's horizontal slide
    jointPins: [{ j: 'rightToe', when: 'params.L<0.001', axes: 'xz' }, { j: 'leftToe', when: 'params.R<0.001', axes: 'xz' }],
    straight: [{ j: 'elbow.left', min: 176, when: 'params.R>0.2' }, { j: 'elbow.right', min: 176, when: 'params.L>0.2' },
      { j: 'knee.left', min: 175, when: 'params.TR>0.999' }, { j: 'knee.right', min: 175, when: 'params.TL>0.999' },
      { j: 'elbow.left', min: 176, when: 'params.rot<0.001' }, { j: 'elbow.right', min: 176, when: 'params.rot<0.001' }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'footL|footR', 'thighR|shinR', 'thighL|shinL'],
  },
};
