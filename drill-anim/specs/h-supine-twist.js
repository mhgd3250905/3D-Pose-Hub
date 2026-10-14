// h-supine-twist 仰卧屈膝扭转 (supine knee-drop twist) · H 居家核心拉伸系列.
// Supine, arms out in a T on the mat (palms up), hips and knees bent ~90 deg. The knees lower slowly to the RIGHT while both
// shoulders stay on the mat (the pelvis rolls ~55 deg, the lumbar/thoracic spine counter-rotates), hold and breathe, return
// through the centre and lower to the LEFT. One cycle (both sides) / 8 s: 1.4 s down, 1.2 s hold, 1.1 s up, 0.3 s centre.
// Head points -X, face up (+Y), body left = -Z (frame of w-dead-bug). No solver: the pelvis rolls on its back like an ellipse
// (centre height and sideways travel follow the roll), the waist turns back by the same angle so the chest stays flat.
import { build, keys, armDir, sg, r4, DEG, norm } from '../lib/home-anim.mjs';
import { leg, restToWorld, REST } from '../lib/ss-geo.mjs';
const DUR = 8, ROLL = 55, ADD = 12;
const s = keys([[0, 0], [0.3, 0], [1.7, 1], [2.9, 1], [4.0, 0], [4.3, 0], [5.7, -1], [6.9, -1]], DUR);   // +1 knees right
const th = t => ROLL * s(t);
const hipsAt = t => ({ up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], th(t)]] });
const pelvis = t => { const a = Math.abs(th(t)) * DEG, A = 0.165, B = 0.12;
  return r4([0, Math.sqrt((A * Math.sin(a)) ** 2 + (B * Math.cos(a)) ** 2) + 0.002, 0.03 * Math.sin(th(t) * DEG)]); };
const arch = t => { const lift = pelvis(t)[1] - pelvis(0)[1]; return Math.asin(Math.min(0.3, lift / 0.36)) / DEG; };   // head end back down onto the mat
const F = 90, K = 95, PITCH = 8;
const legPose = side => ({ mode: 'free', frame: 'hips',
  ankle: t => leg(side, F, K, [[[0, 1, 0], -ADD * s(t)]]).ankle,
  rot: [[t => restToWorld(hipsAt(t), [1, 0, 0]), PITCH - (F - K)], [t => restToWorld(hipsAt(t), [0, 1, 0]), t => -ADD * s(t)]],
  poleLow: t => { const L = leg(side, F, K, [[[0, 1, 0], -ADD * s(t)]]); return r4([L.knee[0], L.knee[1] + 0.3, L.knee[2] + 0.25]); } });
const hand = side => { const S = REST.shoulder(side), d = norm([sg(side) * 0.97, 0.12, -0.125]), AR = 0.484;
  return { mode: 'free', frame: 'chest', wrist: r4([S[0] + d[0] * AR, S[1] + d[1] * AR, S[2] + d[2] * AR]), finger: r4(d), normal: [0, 0, 1],
    poleUp: r4([S[0] + sg(side) * 0.25, S[1], S[2] - 0.3]), relax: 0.6 }; };
const P = build(DUR, {
  pelvis,
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], th]] },
  chest: { waist: [[[1, 0, 0], t => -th(t)], [[0, 0, 1], arch]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legPose('left'), right: legPose('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { tw: t => Math.abs(s(t)) });
export default {
  id: 'h-supine-twist', name: '仰卧屈膝扭转', nameEn: 'Supine Knee-Drop Twist',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['obliques', 'erectors'], side: 'both', pulseTrack: 'tw', pulseBase: 0.35 },
  camera: { dir: [-1, 1.25, 0.12], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.1, k: 0.8, drift: 2, at: 0, fitTimeline: true },
  frame: { mode: 'fit', width: 820, height: 760, cx: 512, cy: 530 },
  stillAt: 2.3,
  shadow: { joints: ['pelvis', 'waist', 'shoulderCenter', 'head', 'leftPalm', 'rightPalm'],
    blobs: [{ j: 'pelvis', rx: 80, ry: 16, a: 0.6 }, { j: 'shoulderCenter', rx: 85, ry: 16, a: 0.55 }, { j: 'head', rx: 50, ry: 12, a: 0.45 },
      { j: 'leftPalm', rx: 34, ry: 10, a: 0.4 }, { j: 'rightPalm', rx: 34, ry: 10, a: 0.4 }],
    bands: [{ from: 'shoulderCenter', to: 'pelvis', mid: 'waist', rx: 70, ry: 14, a: 0.3, dy: 4, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.0, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 2.3, 6.3],
  qa: {
    // the relaxed palms ride with the chest (straight arms in a T); they slide up to ~2.5 cm on the mat as the chest settles, so
    // they are not pinned (a world pin bends the elbows to ~125 deg). Not weight-bearing.
    pins: [],
    straight: [{ j: 'elbow.right', min: 168 }, { j: 'elbow.left', min: 168 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', 'kneeL|kneeR'],
  },
};
