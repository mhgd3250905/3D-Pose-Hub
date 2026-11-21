// h-sumo-pry-lfx2 (legacy-fix r1 batch 5s, 2026-11-22, codex/legacy-fix-r1): copy of h-sumo-pry-lfx1 (unchanged file) with
// only the hand targets changed. 开哥 (b5 sample review): text「两手合十，用手肘把膝盖往外推」 -- the hands sat low between the knees
// with the fingers pointing forward and the palms apart. hark-sk 2026-11-22 plan ①+③: real prayer hands in front of the chest
// (palms pressed together, fingers together pointing up, no palm-through-palm), wrist extension allowed up to 90 deg (prayer is
// 60-90 deg anatomically), radial/ulnar deviation <= 20 deg, elbows as far out as the arms allow; the text cue1 becomes
// 「两手胸前合十，膝盖主动往外撑」 (knees press out by themselves; the elbows cannot reach the knees: shoulder-to-knee 0.45 m at the
// bottom vs upper arm 0.257 m, b5r geometry), see catalog/production/legacy-fix-r1/text/h-sumo-pry.json (unreviewed).
// Measured on V5 (audit-cf2 r2 + sandbox pair measure + wrist, stride 10): palm-to-palm nearest mesh distance 1.3 mm on every frame
// (no crossing), wrist extension 62-68 deg, deviation 1-11 deg, elbows 0.23-0.24 m out from the midline (prayer hands at the
// midline with a 0.228 m forearm cap this at ~0.26 m: the forearms already run almost straight inward); analyze: no findings.
// Knee fix (lfx1 round 2) and stance unchanged.
// h-sumo-pry-lfx1 (legacy-fix r1 batch 5 / b5-2, 2026-11-21, codex/legacy-fix-r1): rebuilt from h-sumo-pry.js + the h-sumo-pry-r2
// wrapper (both files unchanged; the motion code below is copied verbatim except the knee pole and the r2 wrapper fields).
// Triage b5 (TRIAGE-b5.md): loaded sumo squat, on the way down (f40-60 / f160-180) the knees sat ~20 deg inside the toe line and at the
// start frames the knee fell inside the turned-out foot (knee-valgus 20 deg, knee-inside-foot 21 cm, shinFace -48, kneeAxisDev 47).
// Cause: the knee pole was a point in the hips frame ([+-(0.95..1.07), 0.5, 0.85]); the hips lean 12 -> 32 deg forward during the
// squat, so that point swings down and in and the IK bends the knee inward of the 38 deg toe-out (same fault as h-squat / n-squat-shift).
// Correct (NSCA / ACE sumo squat cues): knees track over the toes (2nd-3rd toe) the whole way down; in the pry the elbows push the
// knees a little further out.
// Change: each knee pole is a fixed world point 2 m out along its foot heading + 6 deg (as n-squat-shift-lfx1), plus up to 6 deg more
// while the elbows pry (same 'pry' track that already widened the old pole). Feet, toe-out, stance, pelvis path, depth, lean, chest,
// hands, timing, camera and props unchanged.
// Round 2 (b5): pole 22 deg past the toe heading (+6 in the pry) and thigh / shin roll toward the bend 40->60 / 20->25 deg
// (engine thighTwist / kneeTwist): knee 15..23 deg outside the toe line, 3 cm inside..1 cm outside the foot, thighFace -34,
// shinFace -44, kneeAxisDev 38 (analyze: no findings). Round 1 left thighFace -66 / kneeAxisDev 62 (S1); PO 26 + twist 30/15
// left thighFace -56 / kneeAxisDev 53 (S1).
// h-sumo-pry 相扑深蹲肘推膝停留 (sumo squat hold with elbow pry) · H 居家开胯系列.
// Feet about twice hip width, toes turned out ~35 deg, heels flat throughout. From a half squat the hips sink straight down
// to a deep sumo squat (thighs a little below parallel) with the chest tall; the palms press together in front of the
// sternum and the elbows push the knees out over the toes (inner thighs / adductors and the hip external rotators open).
// Hold and breathe, then rise back to the half squat. 2 reps / 8 s: 1.6 s down, 1.4 s hold (knees pressed a little wider),
// 1.0 s up. Facing +Z, head up (+Y), body left = +X. No solver.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8;
const p = keys([[0, 0], [0.2, 0], [1.8, 1], [3.2, 1], [4.0, 0], [4.2, 0], [5.8, 1], [7.2, 1]], DUR);
const pry = keys([[0, 0], [1.8, 0], [2.4, 1], [3.0, 1], [3.6, 0], [5.8, 0], [6.4, 1], [7.0, 1], [7.6, 0]], DUR);
const FX = 0.36, TOE = 38;
const TOP = [0, 0.70, 0.02], BOT = [0, 0.47, -0.02];
const lean = t => 12 + 20 * p(t);
// prayer hands in the chest frame (rest coordinates): palms together in front of the lower sternum
// lfx2: palms pressed together in front of the chest (PY 1.22 -> 1.30, PZ 0.20 -> 0.18: mid-chest instead of the upper belly). PX = hub palm centre either side of the midline; on the V5 hand mesh
// 0.005 leaves the two palms 1.3 mm apart (0.016 -> 23 mm, 0.004 -> crossing 0.9 mm). FG = fingers together pointing up and a
// little forward in the chest frame (at PY 1.22: [0, 0.94, 0.34] gave deviation 16-26 deg, [0, 1, 0] 22-32 deg, [0, 0.8, 0.6] 8-17 deg; at PY 1.30 1-11 deg).
// poleLow unchanged (a wider / lower pole moved the elbows 1-2 cm INWARD; the elbow is capped by the forearm length, see above).
const PX = 0.005, PY = 1.30, PZ = 0.18, FG = [0, 0.8, 0.6];
const hand = s => ({ mode: 'free', frame: 'chest', palmAt: t => r4([sg(s) * PX, PY - 0.02 * p(t), PZ + 0.02 * p(t)]),
  finger: FG, normal: [-sg(s), 0, 0], poleLow: t => r4([sg(s) * (0.6 + 0.08 * pry(t)), 0.75 - 0.2 * p(t), 0.25]) });
// --- lfx1 knee pole (world, along the foot heading) ---
const D = 2, PO = 22, PRY = 6, TT0 = 40, TT1 = 20, KT0 = 20, KT1 = 5;
const kneeW = s => t => { const h = (TOE + PO + PRY * pry(t)) * Math.PI / 180; return r4([sg(s) * (FX + D * Math.sin(h)), 0.5, D * Math.cos(h)]); };
// thigh / shin roll toward the knee's bend direction (engine thighTwist / kneeTwist; + on the right leg, mirrored on the left)
const thighTw = s => t => +(-sg(s) * (TT0 + TT1 * p(t))).toFixed(4) + 0;
const kneeTw = s => t => +(-sg(s) * (KT0 + KT1 * p(t))).toFixed(4) + 0;
const P = build(DUR, {
  pelvis: t => r4(TOP.map((x, i) => x + (BOT[i] - x) * p(t))),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], t => -4 * p(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [FX, 0.0], heading: TOE, pitch: 0, pole: kneeW('left'), thighTwist: thighTw('left'), kneeTwist: kneeTw('left') },
    right: { mode: 'floor', at: [-FX, 0.0], heading: -TOE, pitch: 0, pole: kneeW('right'), thighTwist: thighTw('right'), kneeTwist: kneeTw('right') },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { down: p, pry });
export default {
  id: 'h-sumo-pry-lfx2', revisionOf: 'h-sumo-pry-lfx1', name: '相扑深蹲肘推膝停留', nameEn: 'Sumo Squat Hold with Elbow Pry',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['adductors', 'glute-max'], side: 'both', pulseTrack: 'down', pulseBase: 0.3 },
  camera: { dir: [0.55, 0.25, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee', 'leftElbow', 'rightElbow'], pad: 0.2, k: 0.85, drift: 3, at: 2.6, fitTimeline: true },
  frame: { mode: 'fit', width: 760, height: 680, cx: 512, cy: 580 },
  stillAt: 2.6,
  shadow: { joints: ['leftAnkle', 'rightAnkle', 'leftToe', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 90, ry: 14, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [{ type: 'mat', at: [0, 0, 0.05], size: [0.61, 1.4, 0.006], yaw: 90 }],
  keyFrames: [0.2, 1.2, 2.6],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handL|handR', 'forearmL|forearmR', 'upperArmL|thighL', 'upperArmR|thighR', 'forearmL|thighL', 'forearmR|thighR', 'upperArmL|kneeL', 'upperArmR|kneeR'],
  },
};
