// h-band-pull-apart-r2: camera-only revision of h-band-pull-apart (review 2026-10-19). front-high camera only showed the front delts; rear-high 3/4 shows the T and the upper-back highlight.
// Pose, timeline, props, highlight and QA are byte-identical to the source; only camera.dir changes.
// h-band-pull-apart 弹力带水平拉开 (band pull-apart) · H 居家开肩系列.
// Standing tall, a light resistance band held in both fists (overhand, palms down) about shoulder-width apart, arms straight in
// front at shoulder height. Keeping the arms long and the ribs down, pull the band apart until the arms make a T and the band
// touches the chest line: the shoulder blades squeeze back and down (rear delts, mid traps / rhomboids). Pause, return slowly
// with control. 2 reps / 8 s: 1.3 s apart, 0.8 s squeeze, 1.5 s return, 0.4 s rest.
// Facing +Z, head up (+Y), body left = +X. Hands on world paths: straight arms swept from ~12 deg to ~68 deg horizontal
// abduction at 88 deg flexion (gripPose keeps the fist round the band). shoulders.shift adds a little retraction at the end.
import { build, keys, r4, armDir, REST } from '../lib/home-anim.mjs';
import { gripPose, G } from '../lib/grip.mjs';
const DUR = 8, PY = 0.888, DY = PY - REST.pelvis[1];
const p = keys([[0, 0], [0.3, 0], [1.6, 1], [2.4, 1], [3.9, 0], [4.3, 0], [5.6, 1], [6.4, 1], [7.9, 0]], DUR);
const SHW = side => { const S = REST.shoulder(side); return [S[0], S[1] + DY, S[2]]; };
// fist on a straight arm: search the fist distance so the wrist sits at reach R from the shoulder
const fistAt = (s, side, psi, R = 0.48) => {
  const d = armDir(side, 86, psi), S = SHW(side); let f = 0.55;
  for (let i = 0; i < 6; i++) { const F = S.map((x, k) => x + d[k] * f); const w = gripPose(side, F, [s, 0, 0], [0, 1, 0]).wrist;
    const r = Math.hypot(...w.map((x, k) => x - S[k])); f += R - r; }
  return S.map((x, k) => x + d[k] * f);
};
const psi = t => 12 + 56 * p(t);
const hand = (s, side) => {
  const g = t => gripPose(side, fistAt(s, side, psi(t)), [s, 0, 0], [0, 1, 0]);
  return { mode: 'free', frame: 'world', wrist: t => g(t).wrist, finger: t => g(t).finger, normal: t => g(t).normal, poleUp: [s * 0.6, -1.0, -0.2] };
};
const P = build(DUR, {
  pelvis: [0, PY, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  shoulders: { shift: t => [0, -0.004 * p(t), -0.012 * p(t)] },
  hands: { left: hand(1, 'left'), right: hand(-1, 'right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { pull: p });
export default {
  id: 'h-band-pull-apart-r2', name: '弹力带水平拉开', nameEn: 'Band Pull-Apart',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['scapular', 'deltoids'], side: 'both', pulseTrack: 'pull', pulseBase: 0.3 },
  camera: { dir: [0.5, 0.7, -0.9], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.85, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 840, height: 880, cx: 512, cy: 505 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [
    { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' },
    { type: 'band', from: { bone: 'leftHand', offset: G.left.c }, to: { bone: 'rightHand', offset: G.right.c }, r: 0.011, sag: 0.0, colour: '#b5523f' },
  ],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'elbow.left', min: 166 }, { j: 'elbow.right', min: 166 }],
    allowContact: [],
  },
};
