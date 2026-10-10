// hamstrings-C GHD 北欧离心 (GHD Nordic eccentric). Head up (+Y) at the start, body faces +Z, body left = +X.
// Kneeling on the GHD: knee joints fixed at K (lower thighs on the round pad), shins horizontal behind, feet toes-down with the soles
// on the plate and the heels hooked under the rollers. The body stays one straight line from knee to head (hips at 0 flexion) and
// pivots forward about the knees: 'c' = 1 - cos(theta) and 's' = sin(theta) carry the exact arc of the pelvis around K, 'r' =
// theta / TMAX turns the pelvis/torso with it (theta = 0 upright -> TMAX = 78 deg forward, near horizontal; v1 stopped at 62).
// Hands stay up in front of the chest as a guard; no floor push (owner decision 10-10: on a GHD the drill text's floor hand push
// does not apply) - the return is a controlled hamstring curl back up. Loop 8 s, one rep: 0.8 s top / 4.0 s slow eccentric lower / 0.5 s bottom / 1.8 s return / 0.9 s top.
const LT = 0.353, LS = 0.41, TMAX = 78, D = Math.PI / 180;
const K = [0, 0.95, 0.0];
const knee = sg => [sg * 0.082, K[1], K[2]];
const HXK = 0.08154;   // measured hip-joint x: ankle and knee pole share it, so hip, knee, ankle and pole stay in one plane x = HXK
const ankle = sg => [sg * HXK, K[1] - 0.004, K[2] - LS];
const P0 = [K[0], K[1] + LT + 0.048, K[2] + 0.004];
const add = (a, b) => a.map((v, i) => v + b[i]);
// arc pivot = the knee joint the leg IK actually lands on at theta = 0 (measured: 0.5 mm above K), so the knees stay put
const KR = [0, K[1] + 0.00049, K[2] - 0.00022];
const foot = sg => ({ mode: 'free', frame: 'world', ankle: ankle(sg), rot: [[[1, 0, 0], 90]], pole: [sg * HXK, K[1] - 0.5, K[2] + 0.3] });
const hand = sg => ({ mode: 'free', frame: 'chest', wrist: [sg * 0.17, 1.17, 0.30], finger: [sg * 0.1, 0.8, 0.55], normal: [0, -0.1, 1], poleUp: [sg * 0.42, 0.95, -0.25] });
// contact geometry (tuned with tools/propclear.js)
const PAD = [0, K[1] - 0.205 + 0.0113 - 0.004, 0.035 - 0.006], PADR = 0.14, ROL = add(ankle(0), [0, 0.095, 0.045]), PLATE = add(ankle(0), [0, -0.067, -0.084]);   // v2: pad 4 mm lower - at 78 deg the thighs reached 2.1 mm into it
const ez = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
const prof = t => t < 0.8 ? 0 : t < 4.8 ? ez((t - 0.8) / 4.0) : t < 5.3 ? 1 : t < 7.1 ? ez(1 - (t - 5.3) / 1.8) : 0;
const N = 240, cK = [], sK = [], rK = [];
for (let i = 0; i <= N; i++) { const t = 8 * i / N, p = prof(t), th = p * TMAX * D; cK.push([t, 1 - Math.cos(th), 'linear']); sK.push([t, Math.sin(th), 'linear']); rK.push([t, p, 'linear']); }
export default {
  id: 'hamstrings-C', name: 'GHD 北欧离心', nameEn: 'GHD Nordic Eccentric',
  timeline: { duration: 8, tracks: { c: cK, s: sK, r: rK } },
  pose: {
    base: {
      pelvis: P0,
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1), left: foot(1) },
      constraints: [],
      solve: { vars: [] },
    },
    deltas: {
      c: { pelvis: add(P0, [0, -(P0[1] - KR[1]), -(P0[2] - KR[2])]) },
      s: { pelvis: add(P0, [0, -(P0[2] - KR[2]), P0[1] - KR[1]]) },
      r: { hips: { rot: [[[1, 0, 0], TMAX]] } },
    },
  },
  highlight: { groups: ['hamstrings'], side: 'both', pulseTrack: 'r', pulseBase: 0.4 },
  camera: { dir: [1, 0.3, 0.2], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm'], pad: 0.3, k: 1.0, drift: 5, at: 3.4 },
  frame: { mode: 'fit', width: 654, cx: 500, cy: 566 },   // v2: was width 860 / cy 560 - the GHD base was cut by the bottom edge and the head sat 7 px under the top
  stillAt: 4.8,
  shadow: { joints: ['pelvis'], blobs: [{ j: 'pelvis', rx: 150, ry: 18, a: 0.25 }], bands: [] },
  props: [{ type: 'ghd', pad: PAD, padR: PADR, padW: 0.40, roller: ROL, plate: PLATE }],
  keyFrames: [0.4, 3.0, 5.0],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    jointPins: [{ j: 'leftKnee' }, { j: 'rightKnee' }],
    straight: [],
    allowContact: ['thighR|shinR', 'thighL|shinL', 'footL|footR', 'shinL|shinR'],
  },
};
