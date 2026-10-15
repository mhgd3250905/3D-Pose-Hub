// h-reverse-crunch 反向卷腹 (reverse crunch) · H 居家核心力量系列.
// Supine, arms long by the sides with palms pressing the mat, hips and knees at 90/90 (tabletop). The lower abs curl the pelvis
// off the mat (posterior tilt, ~32 deg about the lumbar spine) so the knees travel toward the chest, pause, then the pelvis
// lowers slowly back to the mat without the feet dropping. No swinging. 2 reps / 8 s: 1.3 s curl, 0.5 s hold, 1.5 s lower, 0.7 s.
// Head points -X, face up (+Y), body left = -Z (frame of w-dead-bug). No solver: the pelvis rotates about the waist joint and the
// waist counter-rotates, so the rib cage stays flat on the mat.
import { build, keys, armWrist, armDir, sg, r4, DEG } from '../lib/home-anim.mjs';
import { leg } from '../lib/ss-geo.mjs';
const DUR = 8, TH = 32;
const p = keys([[0, 0], [0.3, 0], [1.6, 1], [2.1, 1], [3.6, 0], [4.3, 0], [5.6, 1], [6.1, 1], [7.6, 0]], DUR);
const W0 = [-0.141, 0.123], P0 = [0.0, 0.122];                     // waist joint (pivot) and pelvis at rest, world x/y
const th = t => TH * p(t);
const pelvis = t => { const a = th(t) * DEG, rx = P0[0] - W0[0], ry = P0[1] - W0[1];
  return r4([W0[0] + rx * Math.cos(a) - ry * Math.sin(a), W0[1] + rx * Math.sin(a) + ry * Math.cos(a), 0]); };
const legPose = s => ({ mode: 'free', frame: 'hips', ankle: t => leg(s, 88 + 10 * p(t), 92).ankle, rot: [[[0, 0, 1], t => -(8 - (88 + 10 * p(t) - 92)) - th(t)]],
  poleLow: [sg(s) * 0.1, 0.62, 0.7] });
const hand = s => ({ mode: 'free', frame: 'chest', wrist: r4(armWrist(s, 5, 15, 0.4838)), finger: r4(armDir(s, 5, 15)), normal: [0, 0, -1], poleUp: [sg(s) * 0.6, 0.2, -1], relax: 0.4 });
const P = build(DUR, {
  pelvis,
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], th]] },
  chest: { waist: [[[0, 0, 1], t => -th(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legPose('left'), right: legPose('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { up: p });
export default {
  id: 'h-reverse-crunch', name: '反向卷腹', nameEn: 'Reverse Crunch',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['abs'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.45, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.1, k: 0.75, drift: 3, at: 1.0, fitTimeline: true },
  frame: { mode: 'fit', width: 740, height: 560, cx: 500, cy: 600 },
  stillAt: 1.0,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 14, a: 0.6, fade: [0.13, 0.25] }, { j: 'waist', rx: 70, ry: 13, a: 0.5 }, { j: 'shoulderCenter', rx: 85, ry: 14, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 }],
    bands: [{ from: 'shoulderCenter', to: 'waist', mid: 'waist', rx: 70, ry: 13, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.0, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.15, 1.0, 1.85],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 170 }, { j: 'elbow.left', min: 170 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
