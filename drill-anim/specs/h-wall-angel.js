// h-wall-angel 靠墙天使 (wall angel) · H 居家开肩系列.
// Standing with the back, hips and back of the head against a wall, heels a few cm out, knees soft, ribs down. Arms in a W:
// upper arms ~80 deg out to the sides, elbows bent 90 deg, forearms up, backs of the hands toward the wall. Keeping the forearms
// and hands close to the wall, slide the arms up into a Y until the elbows are almost straight, without the lower back arching
// or the ribs flaring; slide back down to the W. Trains overhead shoulder flexion with external rotation (lower traps, rotator
// cuff) - the shoulder position of a handstand / flare plant. 2 reps / 8 s: 1.5 s up, 0.5 s hold, 1.5 s down, 0.5 s rest.
// Facing +Z, head up (+Y), body left = +X; the wall face is at z = WZ behind the athlete. Hands in the chest frame (rest
// coordinates): planar 2-link FK (abduction a, elbow flex f) in a plane tipped BETA deg back toward the wall. No solver.
import { build, keys, r4, REST, sg } from '../lib/home-anim.mjs';
const DUR = 8, WZ = -0.135, BETA = 16 * Math.PI / 180, UA = 0.2567, FA = 0.2281 * 0.985;
const p = keys([[0, 0], [0.3, 0], [1.8, 1], [2.3, 1], [3.8, 0], [4.3, 0], [5.8, 1], [6.3, 1], [7.8, 0]], DUR);
const D = (s, ang) => { const a = ang * Math.PI / 180; return [sg(s) * Math.sin(a) * Math.cos(BETA), -Math.cos(a), -Math.sin(a) * Math.sin(BETA)]; };
const A0 = 78, A1 = 134, F0 = 92, F1 = 14;
const arm = (s, t) => { const q = p(t), a = A0 + (A1 - A0) * q, f = F0 + (F1 - F0) * q, S = REST.shoulder(s);
  const u = D(s, a), v = D(s, a + f); const E = S.map((x, k) => x + u[k] * UA), W = E.map((x, k) => x + v[k] * FA);
  return { E, W, v, u }; };
const hand = s => ({ mode: 'free', frame: 'chest',
  wrist: t => r4(arm(s, t).W), finger: t => r4(arm(s, t).v), normal: [0, 0, 1],
  poleUp: t => { const { E, u } = arm(s, t); return r4([E[0] + sg(s) * 0.25, E[1] - 0.3, E[2] - 0.12]); } });
const P = build(DUR, {
  pelvis: [0, 0.885, 0.006],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.03], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.03], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { slide: p });
export default {
  id: 'h-wall-angel', name: '靠墙天使', nameEn: 'Wall Angel',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['chest', 'lats', 'scapular'], side: 'both', pulseTrack: 'slide', pulseBase: 0.3 },
  camera: { dir: [0.85, 0.25, 0.85], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.12, k: 0.85, drift: 3, at: 2.0, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 900, cx: 512, cy: 500 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'wall', at: [0, 0, WZ], yaw: 0, size: [1.5, 2.2, 0.12] }],
  keyFrames: [0.2, 1.0, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [],
    allowContact: [],
  },
};
