// t-floor-tuck-hold 地面团身支撑 (floor tuck support hold, hands flat on the mat) · Flare 2.0 r3 batch 2b (2026-11-21), new id.
// Standard: tools/flare2-moves-r3/standards/t-floor-tuck-hold.md. t-tuck-lsit-hold (hands on yoga blocks, r1) is not touched.
// Sitting on the mat, palms flat on the mat beside the hips (fingers forward), knees bent, feet on the mat. Straight arms push the mat
// down and the shoulders down (scapular depression); with no blocks the arms are short for the seated trunk, so the trunk leans forward
// and rounds a little while the hips come off the mat (a few cm, as on the floor), then the knees are pulled in to the chest and the
// feet come off the mat; static hold; feet and hips set back down. Same set-up/tempo as t-tuck-lsit-hold, hands at floor level.
// Facing +Z, head up (+Y), body left = +X. Solver: pelvis y/z and the hips' forward tilt (h0) so that both arms are locked straight
// while the pelvis sits at the commanded height (hips lifted LIFT above the seated height) and fore-aft place (PZ, hands just in front).
// Loop 8 s: 0.5 s seated, 0.9 s press up (hips off), 0.8 s tuck (feet off), 3.8 s hold, 0.8 s feet down, 0.8 s hips down, 0.4 s seated.
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const DUR = 8;
const P = { HX: 0.25, HZ: 0.06, PZ: 0.06, PY0: 0.098, LIFT: 0.03, LEAN0: 4, WAIST0: 6, WAISTT: 18, ELB_SEAT: 170, SEATED: { x: 0.11, y: 0.084, z: 0.55, rot: 0 }, TUCK: { x: 0.09, y: 0.15, z: 0.60, rot: 10 } };
const up = keys([[0, 0], [0.5, 0], [1.4, 1], [7.2, 1], [7.6, 0]], DUR);
const tuck = keys([[0, 0], [1.4, 0], [2.2, 1], [6.0, 1], [6.8, 0]], DUR);
const floorHand = (sg) => ({ mode: 'floor', at: [sg * P.HX, P.HZ], finger: [sg * 0.12, 1], poleUp: [sg * 0.3, 0.3, -1] });
const foot = (sg, a) => ({ mode: 'free', frame: 'world', ankle: [sg * a.x, a.y, a.z], rot: [[[1, 0, 0], a.rot]], poleLow: [sg * 0.10, 1.6, 0.45] });
export default {
  id: 't-floor-tuck-hold', name: '地面团身支撑', nameEn: 'Floor Tuck Support Hold',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: { up: track(DUR, up), tuck: track(DUR, tuck) } },
  pose: {
    base: {
      pelvis: [0, P.PY0, 0.0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], P.LEAN0]] },
      chest: { waist: [[[1, 0, 0], P.WAIST0]] },
      shoulders: { shift: [0, 0.0, 0] },
      hands: { left: floorHand(1), right: floorHand(-1) },
      feet: { left: foot(1, P.SEATED), right: foot(-1, P.SEATED) },
      constraints: [
        { type: 'reach', limb: 'leftArm', angle: P.ELB_SEAT, weight: 0 }, { type: 'reach', limb: 'rightArm', angle: P.ELB_SEAT, weight: 0 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: P.PY0, weight: 5 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.0, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: P.PZ, weight: 5 },
      ],
      solve: { vars: ['py', 'pz', 'h0'], reg: { py: 0.05, pz: 0.2, h0: 0.02 } },
    },
    deltas: {
      up: { constraints: [{ angle: 178.5, weight: 10 }, { angle: 178.5, weight: 10 }, { value: P.PY0 + P.LIFT, weight: 1 }, {}, {}], shoulders: { shift: [0, -0.030, 0.008] } },
      tuck: { feet: { left: foot(1, P.TUCK), right: foot(-1, P.TUCK) }, chest: { waist: [[[1, 0, 0], P.WAISTT]] } },
    },
  },
  highlight: { groups: ['abs', 'hip-flexors', 'triceps'], side: 'both', pulseTrack: 'tuck', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.2, 0.66], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.12, k: 1, drift: 0, at: 4 },
  frame: { mode: 'fit', width: 760, height: 820, cx: 520, cy: 520 },
  stillAt: 4,
  shadow: { joints: ['leftPalm', 'rightPalm', 'pelvis'], blobs: [], bands: [] },
  props: [{ type: 'mat', at: [0, 0, 0.2], size: [1.0, 1.0, 0.006] }],
  keyFrames: [0.3, 1.4, 4.0],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172, when: 'params.up>0.999' }, { j: 'elbow.left', min: 172, when: 'params.up>0.999' }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'thighL|torso', 'thighR|torso', 'thighL|shinL', 'thighR|shinR'],
  },
  flare2: { version: 'r3', batch: '2b', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false,
    doseBrief: '表：静态保持；草稿 10 秒 × 3 组（秒数/组数待定）', doseStatus: 'draft (AI, 开哥 to confirm)' },
};
