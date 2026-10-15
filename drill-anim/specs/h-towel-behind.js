// h-towel-behind 背后握毛巾抬臂 (behind-the-back towel shoulder extension) · H 居家开肩系列.
// Standing tall, a towel held taut behind the back in both fists, hands a little wider than the hips, palms facing back, arms
// straight. Chest up, shoulders down and back, chin level: lift the straight arms up and away from the back as far as possible
// without leaning forward, feeling the stretch across the front of the shoulders and chest (shoulder extension - the range a
// bridge and back-support moves need). Hold, lower slowly. 2 reps / 8 s: 1.4 s up, 1.2 s hold, 1.2 s down, 0.2 s rest.
// Facing +Z, head up (+Y), body left = +X. Fists on world paths: straight arms at PSI deg abduction swept in shoulder extension
// (flexion -12 -> -48 deg); gripPose keeps the fist round the towel. Small shoulder retraction with the lift. No solver.
import { build, keys, r4, armDir, REST, sg } from '../lib/home-anim.mjs';
import { gripPose, G } from '../lib/grip.mjs';
const DUR = 8, PY = 0.888, DY = PY - REST.pelvis[1], PSI = 16, PH0 = -12, PH1 = -48;
const p = keys([[0, 0], [0.2, 0], [1.6, 1], [2.8, 1], [4.0, 0], [4.2, 0], [5.6, 1], [6.8, 1]], DUR);
const SHW = side => { const S = REST.shoulder(side); return [S[0], S[1] + DY, S[2]]; };
const palmOf = phi => { const a = phi * Math.PI / 180; return [0, Math.sin(a), Math.cos(a)].map(x => -x); };
const fistAt = (side, phi, R = 0.50) => {
  const s = sg(side), d = armDir(side, phi, PSI), S = SHW(side); let f = 0.55;
  for (let i = 0; i < 6; i++) { const F = S.map((x, k) => x + d[k] * f); const w = gripPose(side, F, [s, 0, 0], palmOf(phi)).wrist;
    f += R - Math.hypot(...w.map((x, k) => x - S[k])); }
  return S.map((x, k) => x + d[k] * f);
};
const phi = t => PH0 + (PH1 - PH0) * p(t);
const hand = side => { const s = sg(side);
  const g = t => gripPose(side, fistAt(side, phi(t)), [s, 0, 0], palmOf(phi(t)));
  return { mode: 'free', frame: 'world', wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal,
    pole: t => { const S = SHW(side); return r4([S[0] + s * 0.45, S[1] - 0.25, S[2] + 0.2]); } };
};
const P = build(DUR, {
  pelvis: [0, PY, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  shoulders: { shift: t => [0, -0.003 * p(t), -0.01 * p(t)] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { lift: p });
export default {
  id: 'h-towel-behind', name: '背后握毛巾抬臂', nameEn: 'Behind-Back Towel Shoulder Extension',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'deltoids'], side: 'both', pulseTrack: 'lift', pulseBase: 0.3 },
  camera: { dir: [1, 0.25, -0.25], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.85, drift: 3, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 900, cx: 512, cy: 500 },
  stillAt: 2.2,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'band', from: { bone: 'leftHand', offset: G.left.c }, to: { bone: 'rightHand', offset: G.right.c }, r: 0.017, sag: 0.0, colour: '#b9b2a4' },
  ],
  keyFrames: [0.1, 0.9, 2.2],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 166 }, { j: 'elbow.right', min: 166 }],
    allowContact: [],
  },
};
