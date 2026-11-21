// n-squat-shift-lfx1 (legacy-fix r1 batch 3, 2026-11-21, codex/legacy-fix-r1): rebuilt from n-squat-shift.js + the
// n-squat-shift-r2 wrapper (both files unchanged; the motion code below is copied verbatim except the knee pole).
// Audit (tools/legacy-audit-r1) S1: while the pelvis travels over one foot, that loaded knee bent with the patella 74 deg off
// its flexion direction and the hinge axis 64 deg off (frames 30-100 left, 150-220 right) -- same fault as h-squat (batch 1).
// Cause: the knee pole was a point in the hips frame ([+-(0.95..1.10), 0.5, 0.85]); the pelvis tips 24-28 deg forward and
// tilts sideways during the shift, so that point swings down/out and the IK twists the loaded knee.
// Correct (NSCA / ACE squat & lateral squat cues): the loaded knee bends in the plane of its foot, tracking over the 2nd-3rd toe.
// Change (loaded leg only, scaled by its load: 0 at centre, 1 at the full shift; lengthening leg and centre squat untouched):
//  1. knee pole blended from the original hips-frame point to a fixed world point 2 m out along the foot heading + 6 deg (toes stay
//     36 deg out), expressed back in the hips frame, so the knee bends in the foot plane and sits over the 2nd-3rd toe.
//  2. thigh roll 30 deg / shin roll 15 deg at full load (engine thighTwist / kneeTwist, same convention as adductors-A-lfx1) so the
//     kneecap and shin turn with that bend (the hub leg IK keeps the thigh roll otherwise).
// At load 0 every value is the original one (pole bit-identical; twists 0). Feet, toe-out, stance width, pelvis path, depth, chest,
// hands, timing (8 s, left then right), camera and props unchanged.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { REST } from '../lib/ss-geo.mjs';
const DUR = 8, FX = 0.38, TOE = 36, SHIFT = 0.15;
const sh = keys([[0, 0], [0.3, 0], [1.8, 1], [2.8, 1], [4.0, 0], [4.3, 0], [5.8, -1], [6.8, -1], [8.0, 0]], DUR);   // +1 = toward the left foot
const a = t => Math.abs(sh(t));
const hand = s => ({ mode: 'free', frame: 'chest', palmAt: [sg(s) * 0.0345, 1.12, 0.27],
  finger: [0, 0.85, 0.53], normal: [-sg(s), 0, 0], poleLow: [sg(s) * 0.6, 0.6, 0.25] });
const pelvisAt = t => r4([SHIFT * sh(t), 0.53 - 0.03 * a(t), -0.03]);
const tiltX = t => 24 + 4 * a(t), tiltZ = t => -4 * sh(t);
// --- lfx1 knee pole ---
const D = 2, PO = 6, H = (TOE + PO) * Math.PI / 180;   // PO: pole aimed 6 deg lateral of the toe line so the knee sits over the 2nd-3rd toe, not over the ankle-to-big-toe line
const toePole = s => [sg(s) * (FX + D * Math.sin(H)), 0.5, D * Math.cos(H)];          // world, along the foot heading
const DEGR = Math.PI / 180;
const TT = 30, KT = 15;   // thigh / shin roll on the loaded leg at full load (deg; + on the right leg = toward the knee's bend direction, mirrored on the left)
const twist = (s, amt) => t => +(-sg(s) * amt * Math.max(0, sg(s) * sh(t))).toFixed(4) + 0;
const rotX = (v, d) => { const c = Math.cos(d * DEGR), n = Math.sin(d * DEGR); return [v[0], v[1] * c - v[2] * n, v[1] * n + v[2] * c]; };
const rotZ = (v, d) => { const c = Math.cos(d * DEGR), n = Math.sin(d * DEGR); return [v[0] * c - v[1] * n, v[0] * n + v[1] * c, v[2]]; };
// engine: world = Rz(tiltZ) * Rx(tiltX) * (src - REST.pelvis) + P   ->   src = Rx(-tiltX) * Rz(-tiltZ) * (world - P) + REST.pelvis
const toHips = (w, t) => { const P = pelvisAt(t); const d = [w[0] - P[0], w[1] - P[1], w[2] - P[2]];
  const v = rotX(rotZ(d, -tiltZ(t)), -tiltX(t)); return [v[0] + REST.pelvis[0], v[1] + REST.pelvis[1], v[2] + REST.pelvis[2]]; };
const kneeOrig = (s, t) => { const load = Math.max(0, sg(s) * sh(t)); return [sg(s) * (0.95 + 0.15 * load), 0.5, 0.85]; };
const knee = s => t => { const load = Math.max(0, sg(s) * sh(t)); const o = kneeOrig(s, t);
  if (load <= 0) return r4(o);
  const w = toHips(toePole(s), t); return r4(o.map((x, i) => x + (w[i] - x) * load)); };
const P = build(DUR, {
  pelvis: pelvisAt,
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], tiltX], [[0, 0, 1], tiltZ]] },
  chest: { waist: [[[1, 0, 0], -4], [[0, 0, 1], t => 6 * sh(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [FX, 0.0], heading: TOE, pitch: 0, poleLow: knee('left'), thighTwist: twist('left', TT), kneeTwist: twist('left', KT) },
    right: { mode: 'floor', at: [-FX, 0.0], heading: -TOE, pitch: 0, poleLow: knee('right'), thighTwist: twist('right', TT), kneeTwist: twist('right', KT) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { shift: a });
export default {
  id: 'n-squat-shift-lfx1', name: '低位蹲姿左右移重心', nameEn: 'Low Squat Side-to-Side Shift',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'glute-max'], side: 'both', pulseTrack: 'shift', pulseBase: 0.3 },
  camera: { dir: [0.35, 0.3, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.2, k: 0.85, drift: 3, at: 2.2, fitTimeline: true },
  frame: { mode: 'fit', width: 800, height: 680, cx: 512, cy: 580 },
  stillAt: 2.2,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 90, ry: 14, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.05], size: [0.61, 1.4, 0.006], yaw: 90 }],
  keyFrames: [0.2, 2.2, 6.2],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handL|handR', 'forearmL|forearmR', 'upperArmL|thighL', 'upperArmR|thighR', 'forearmL|thighL', 'forearmR|thighR', 'upperArmL|kneeL', 'upperArmR|kneeR'],
  },
};
