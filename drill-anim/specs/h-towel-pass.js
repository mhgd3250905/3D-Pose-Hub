// h-towel-pass 毛巾过头转肩 (towel shoulder pass-through, partial) · H 居家开肩系列.
// Standing tall, a long bath towel (or a broomstick) held taut in both fists with a wide overhand grip, arms straight in front of
// the thighs. Keeping the elbows straight and the ribs down, raise the towel in a big arc in front of you, overhead and on back
// behind the head as far as the shoulders allow without arching the lower back; pause, then bring it back the same way. Opens
// the front of the shoulders and chest for overhead positions (handstand, flare plant). Widen the grip if the elbows bend.
// 1 rep / 8 s: 0.4 s rest, 3.0 s up and over, 0.8 s hold, 3.0 s back, 0.8 s rest.
// Facing +Z, head up (+Y), body left = +X. Fists on world paths: straight arms at PSI deg abduction swept in shoulder flexion
// 34 -> 212 deg (gripPose keeps the fist round the towel; the palm turns with the arm). No solver.
import { build, keys, r4, armDir, REST, sg } from '../lib/home-anim.mjs';
import { gripPose, G } from '../lib/grip.mjs';
const DUR = 8, PY = 0.888, DY = PY - REST.pelvis[1], PSI = 44, PH0 = 34, PH1 = 212;
const p = keys([[0, 0], [0.4, 0], [3.4, 1], [4.2, 1], [7.2, 0]], DUR);
const SHW = side => { const S = REST.shoulder(side); return [S[0], S[1] + DY, S[2]]; };
const palmOf = phi => { const a = phi * Math.PI / 180; return [0, Math.sin(a), Math.cos(a)]; };
const fistAt = (side, phi, R = 0.492) => {
  const s = sg(side), d = armDir(side, phi, PSI), S = SHW(side); let f = 0.55;
  for (let i = 0; i < 6; i++) { const F = S.map((x, k) => x + d[k] * f); const w = gripPose(side, F, [s, 0, 0], palmOf(phi)).wrist;
    f += R - Math.hypot(...w.map((x, k) => x - S[k])); }
  return S.map((x, k) => x + d[k] * f);
};
const phi = t => PH0 + (PH1 - PH0) * p(t);
const hand = side => { const s = sg(side);
  const g = t => gripPose(side, fistAt(side, phi(t)), [s, 0, 0], palmOf(phi(t)));
  return { mode: 'free', frame: 'world', wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal,
    pole: t => { const S = SHW(side), pa = palmOf(phi(t)); return r4([S[0] + s * 0.5, S[1] - 0.3 * pa[1], S[2] - 0.3 * pa[2]]); } };
};
const P = build(DUR, {
  pelvis: [0, PY, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.14, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.14, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { pass: p });
export default {
  id: 'h-towel-pass', name: '毛巾过头转肩', nameEn: 'Towel Shoulder Pass-Through',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'deltoids'], side: 'both', pulseTrack: 'pass', pulseBase: 0.3 },
  camera: { dir: [1, 0.3, 0.75], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.85, drift: 3, at: 3.8, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 900, cx: 512, cy: 500 },
  stillAt: 3.8,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'band', from: { bone: 'leftHand', offset: G.left.c }, to: { bone: 'rightHand', offset: G.right.c }, r: 0.017, sag: 0.0, colour: '#b9b2a4' },
  ],
  keyFrames: [0.2, 2.0, 3.8],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 166 }, { j: 'elbow.right', min: 166 }],
    allowContact: [],
  },
};
