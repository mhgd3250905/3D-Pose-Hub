// obliques-B 弹力带抗旋转推 (banded Pallof press). Standing tall side-on to a band post (post on the body's RIGHT, -X),
// feet a little wider than the hips, knees soft. Both hands hold ONE D-handle at the sternum; 'press' pushes the hands
// straight out in front of the chest until the arms are locked, holds 2 s while the trunk refuses to twist toward the
// post (anti-rotation, obliques), and brings the hands back. Hips and shoulders stay square. 2 reps / 8 s.
// v2 (Hark self-QA): the band ends on a D-handle (dHandle #23 + anchor/band-to-anchor-name #82) held by both hands stacked on
// its 32 cm grip (centred between the hands so the D-loop clears both fists), both closed power grips (right = dHandle's baked fist, left = gripHand). Thumbs up, fingers forward; the left
// hand's wrist/finger/normal are solved so its baked grip cylinder lies on the handle axis SEP below the right one (same solve as
// obliques-C). The press end W1 is chosen so BOTH wrists sit at the locked-arm reach (elbows 177.5 deg).
// Head points +Y, front faces +Z, body left = +X (rest frame; hands in the chest frame).
const GR = { c: [-0.01646, 0.09267, 0.03555], a: [0.94419, 0.29495, 0.14666], pal: [0.4422, -0.812, -0.381] }, GL = { c: [0.01646, 0.09267, 0.03555], a: [-0.94419, 0.29495, 0.14666], pal: [-0.4422, -0.812, -0.381] };
const v3 = { add: (a, b, k = 1) => a.map((x, i) => x + k * b[i]), dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nrm: a => { const n = Math.hypot(...a); return a.map(x => x / n); } };
const basis = (f, n) => { f = v3.nrm(f); const z = v3.nrm(v3.add(n, f, -v3.dot(n, f))); return [v3.cross(f, z), f, z]; };
const mul = (B, x) => [0, 1, 2].map(i => B[0][i] * x[0] + B[1][i] * x[1] + B[2][i] * x[2]);
const r4 = a => a.map(x => +x.toFixed(4));
const solveL = (A, C, PAL) => { const a = v3.nrm(GL.a), pa = v3.nrm(v3.add(GL.pal, a, -v3.dot(GL.pal, a))), Ml = [a, pa, v3.cross(a, pa)];
  const Aw = v3.nrm(A), Pw = v3.nrm(v3.add(PAL, Aw, -v3.dot(PAL, Aw))), Mw = [Aw, Pw, v3.cross(Aw, Pw)];
  const R = x => { const l = [v3.dot(Ml[0], x), v3.dot(Ml[1], x), v3.dot(Ml[2], x)]; return mul(Mw, l); };
  return { wrist: v3.add(C, R(GL.c), -1), finger: R([0, 1, 0]), normal: R([0, 0, 1]) }; };
const SEP = 0.115, FR = [-0.08, 0, 1], NR = [1, 0, 0];
const leftFor = w => { const B = basis(FR, NR), C = v3.add(w, mul(B, GR.c)), A = mul(B, GR.a), P = mul(B, GR.pal); return solveL(A.map(x => -x), v3.add(C, A, -SEP), P); };
const W1 = [0, 1.29, 0.4356], W0 = [0, 1.26, 0.21];             // right wrist: locked out / at the sternum (straight-line press)
const L0 = leftFor(W0), L1 = leftFor(W1);
const right = w => ({ mode: 'free', frame: 'chest', relax: 0, wrist: w, finger: FR, normal: NR, poleUp: [-0.9, 0.9, -0.3] });
const left = L => ({ mode: 'free', frame: 'chest', relax: 0, wrist: r4(L.wrist), finger: r4(L.finger), normal: r4(L.normal), poleUp: [0.9, 0.9, -0.3] });
const PX = -0.95, PZ = 0.33, TIE = 1.22;
const rep = s => [[s + 0.3, 0], [s + 1.2, 1], [s + 3.2, 1], [s + 4.0, 0]];
export default {
  id: 'obliques-B', name: '弹力带抗旋转推', nameEn: 'Banded Pallof Press',
  timeline: { duration: 8, tracks: { press: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0, 0.87, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 3]] },
      chest: { body: [[[1, 0, 0], -3]] },
      hands: { right: right(W0), left: left(L0) },
      feet: {
        right: { mode: 'floor', at: [-0.15, 0.0], heading: -8, pitch: 0 },
        left: { mode: 'floor', at: [0.15, 0.0], heading: 8, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 172, weight: 1 }, { type: 'reach', limb: 'rightLeg', angle: 172, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: { press: { hands: { right: { wrist: W1 }, left: { wrist: r4(L1.wrist) } } } },
  },
  highlight: { groups: ['obliques'], side: 'both', pulseTrack: 'press', pulseBase: 0.3 },
  camera: { dir: [0.45, 0.15, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm', 'rightElbow', 'leftElbow'], pad: 0.12, k: 1.0, drift: 2, at: 2.0 },
  frame: { mode: 'fit', width: 600, height: 860, cx: 580, cy: 520 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }], bands: [] },
  props: [
    { type: 'bandPost', at: [PX, 0, PZ], height: 1.5, tieY: TIE },
    { type: 'anchor', name: 'post', at: [PX + 0.04, TIE, PZ] },
    { type: 'dHandle', side: 'right', name: 'handle', toward: 'post', shift: -SEP / 2, len: 0.32, lean: 0.25 },
    { type: 'gripHand', side: 'left' },
    { type: 'band', from: [PX + 0.04, TIE, PZ], to: 'handle', r: 0.007, sag: 0, colour: '#7a4a32' },
  ],
  keyFrames: [0.3, 1.2, 2.2],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.press>0.999' }, { j: 'elbow.left', min: 176, when: 'params.press>0.999' }],
    // hands stacked on one handle: hands/forearms side by side (mesh hand_clip still checks hand vs hand); capsule hulls overlap there
    allowContact: ['handL|handR', 'forearmL|forearmR', 'handL|forearmR', 'handR|forearmL'],
  },
};
