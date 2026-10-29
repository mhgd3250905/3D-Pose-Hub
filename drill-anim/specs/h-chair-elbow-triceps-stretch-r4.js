// Armfix-r2 template candidate, 2026-10-29. Original source retained. Low-resolution review required.
// h-chair-elbow-triceps-stretch 扶椅背屈肘肱三头肌拉伸 (chair-supported bent-elbow triceps stretch) · 缺口批次 1（gap-batch1-20261026，三头拉伸）.
// Standing a step behind a sturdy chair with a low backrest (top 0.78 m), hip-hinged so the trunk is roughly level with the floor (frame of h-chair-lat).
// Both arms are raised overhead (relative to the trunk) with the elbows bent deeply: the backs of the upper arms / elbows rest on
// the top of the backrest shoulder-width apart, and the forearms fold back so the hands rest near the back of the neck without
// touching the head. 'sink' 0 = trunk ~78 deg forward; 1 = the hips slide back and the chest sinks a little lower between the
// arms (hinge 82 deg) while the shoulders flex a further 14 deg, taking the shoulders further into flexion with the elbows bent: the stretch runs along the back of the
// upper arms (triceps long head) into the armpits. Elbows stay on the backrest, knees soft, back long, neck in line (the head
// stays between the arms; no neck movement). Gentle range only.
// Distinct from h-overhead-triceps-stretch-rr1 (standing upright, helper hand on the elbow, one arm) and h-chair-lat (straight
// arms, hands on the rail, lats): both arms, elbows bent and supported, no hand contact.
// Design prescription (author, this file): 8 s loop, same tempo as h-chair-lat: 0.4 s still, 2.2 s sink, 2.4 s hold with a
// breath, 2.0 s ease up to 15 %, 1.0 s back to start (hold >= 2 s).
// Facing +Z (toward the chair), head +Y, body left = +X. Arms in the chest frame: upper arm u and forearm f (elbow ~45 deg) turn
// together by FLEX*sink; the pelvis adds measured skin-contact compensation above the two rear posts. Foot floor anchors remain unchanged.
import { REST, restPtW, r4, rot } from '../lib/ss-geo.mjs';
import { build, keys, sg } from '../lib/home-anim.mjs';
const UA=.2567805323279002,FA=.2280465039306538;
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const nrm = a => mul(a, 1 / Math.hypot(...a));
const DUR = 8, L0 = 78, L1 = 82, FLEX = 14, CZ = 0.62, RAILY = 0.78, BACK = 0.33, RAILZ = CZ - 0.183, ELR = 0.048;
const p = keys([[0, 0], [0.4, 0], [2.6, 1], [5.0, 1], [7.0, 0.15]], DUR);
const lean = t => L0 + (L1 - L0) * p(t);
// Same armfix-r2+r3 contour: actual triangle/post-footprint gaps at t0 and t3.6.
// This action supports on the rear-post pair, NOT the 23.1mm-lower center panel.
export const CHAIR_ELBOW_CONTACT = Object.freeze({variant:'rear-post-pair',postCenterX:0.193,postTopY:0.78,postCenterZ:0.437,restGap:0.029587792884,sunkGap:0.026938892147,clearance:0.0005});
export const elbowSurfaceOffsetY = t => -CHAIR_ELBOW_CONTACT.restGap-(CHAIR_ELBOW_CONTACT.sunkGap-CHAIR_ELBOW_CONTACT.restGap)*p(t)+CHAIR_ELBOW_CONTACT.clearance;
const hipsAt = a => ({ up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], a]] });
// shoulder flexion grows by FLEX*p(t): upper arm and forearm turn together about the lateral axis (toward behind the head)
const U = (s, t) => rot(nrm([-sg(s) * 0.08, 0.85, 0.5]), [1, 0, 0], -FLEX * p(t)), F = (s, t) => rot(nrm([-sg(s) * 0.1, -0.25, -0.97]), [1, 0, 0], -FLEX * p(t));   // elbow ~45 deg, hand beside the back of the head
const ER = (s, t) => add(REST.shoulder(s), mul(U(s, t), UA));            // elbow, rest coordinates
const WRr = (s, t) => add(ER(s, t), mul(F(s, t), FA));                    // wrist, rest coordinates
// elbow target: on top of the rail, ELR above it (back of the upper arm resting on the bar); the pelvis follows so it stays put
const pelvisAt = t => { const a = lean(t); const E0 = restPtW(hipsAt(a), [0, 0, 0], ER('left', t));
  const delta=rot([0,0.0639701718590191,-0.00195420168849446],[1,0,0],a);
  return r4(add([0, RAILY + ELR - E0[1] + elbowSurfaceOffsetY(t), RAILZ - 0.01 - E0[2]],delta)); };
const hand = s => ({ mode: 'free', frame: 'chest', relax: 0.6, wrist: t => r4(WRr(s, t)), finger: t => r4(F(s, t)), normal: r4(nrm([-sg(s) * 0.9, 0.0, 0.3])),
  poleUp: t => r4(ER(s,t)) });
const P = build(DUR, {
  pelvis: pelvisAt,
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], lean]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, -0.42], heading: 4, pitch: 0, pole: [0.2, 0.5, 0.6] },
    right: { mode: 'floor', at: [-0.12, -0.42], heading: -4, pitch: 0, pole: [-0.2, 0.5, 0.6] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { sink: p });
export default {
  contactCalibration: CHAIR_ELBOW_CONTACT,
  id: 'h-chair-elbow-triceps-stretch-r4', revisionOf: 'h-chair-elbow-triceps-stretch-r3', sourceBatch: 'remaining32-template-r2-20261029', name: '扶椅背屈肘肱三头肌拉伸', nameEn: 'Chair-Supported Bent-Elbow Triceps Stretch',
  modelProfile: 'training-human-v2plus-hands-native', alignClavicles: false,
  runtimeModel: {profile:'training-human-v3-armfix',version:'0.1.0-r2'}, nativeHands:{twistShare:1}, reviewed:false,releaseEligible:false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic', handPose: { right: 'relaxed', left: 'relaxed' } },
  fps: 30, size: 1080,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['triceps', 'lats'], side: 'both', pulseTrack: 'sink', pulseBase: 0.35 },
  camera: { dir: [1, 0.35, 0.2], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'leftPalm', 'rightPalm', 'leftElbow'], pad: 0.14, k: 0.95, drift: 0, at: 3.6, fitTimeline: true },
  frame: { mode: 'fit', width: 860, height: 760, cx: 512, cy: 520 },
  stillAt: 3.6,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [{ type: 'chair', at: [0, 0, CZ], yaw: 0, height: 0.45, width: 0.44, depth: 0.42, back: BACK }],   // backrest top 0.78 m
  keyFrames: [0.2, 2.6, 3.6, 7.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    jointPins: [{ j: 'leftElbow' }, { j: 'rightElbow' }],
    straight: [],
    allowContact: ['upperArmL|forearmL', 'upperArmR|forearmR'],
  },
};
