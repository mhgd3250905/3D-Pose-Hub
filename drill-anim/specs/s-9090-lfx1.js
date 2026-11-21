// s-9090-lfx1 (legacy-fix r1, 2026-11-21, codex/legacy-fix-r1): 90/90 坐姿换髋 redone as a real left-right hip switch.
// Audit (tools/legacy-audit-r1) P0 text-no-switch: the action name (90/90 坐姿换髋) and the Flare warm-up text ("脚跟压稳，双膝翻到另一侧，
// 上身尽量坐直") describe switching both knees to the other side, but s-9090-r7 is a single-side forward lean (no switch; nearest mirror
// pose 76 cm away), with the front knee twisted (patella vs flexion 66 deg).
// Motion source: drill-anim/revisions/hark-4080-v1/s-9090-switch/spec.js (90/90左右换髋 v1-local, user-confirmed 2026-10-11, delivered
// in dab78b5; unchanged file): 90/90 with the right shin in front -> both knees lift and turn over the planted heels -> mirrored
// 90/90 (left shin in front) -> back, sitting tall, hands resting on the mat behind, knees exactly 90 deg.
// Adaptation only: model profile / v2plus as s-9090-r7 (V5 render path), and the 12 s source time-scaled to the s-9090 duration
// (8 s; every track key time x 2/3, so A hold 1.0 s, each half-switch 1.0 s, B hold 1.33 s). Camera comes from the recipe (unchanged).
// Two pose edits so the motion matches the Flare text "上身尽量坐直" (legacy audit 9090-torso-upright, first pass 43 deg):
//  - the source leaned the trunk back 43 deg (28 deg mid-switch) onto both hands planted behind; the backward lean
//    (chest_body_1_1) is scaled to 0.3 (13 deg at the 90/90 holds, 8 deg mid-switch) = sitting tall;
//  - the hands therefore no longer reach the mat behind; they are held in front at chest height (arms forward, chest frame,
//    the a-9090 "A 松 / sitting tall, hands off the mat" arm pose), which moves with the trunk through the switch.
// Legs, feet, pelvis, hip rotation and the knee path are the source's.
import src from '../revisions/hark-4080-v1/s-9090-switch/spec.js';
import r7 from './s-9090-r7.js';
const s = structuredClone(src);
const K = 8 / src.timeline.duration;
s.id = 's-9090-lfx1';
s.name = '90/90 坐姿换髋';
s.nameEn = '90/90 Hip Switch';
s.modelProfile = r7.modelProfile;
s.v2plus = structuredClone(r7.v2plus);
s.alignClavicles = r7.alignClavicles;
s.fps = 30;
s.timeline.duration = 8;
for (const k of Object.keys(s.timeline.tracks)) s.timeline.tracks[k] = s.timeline.tracks[k].map(([t, v, e]) => [+(t * K).toFixed(5), v, e]);
if (Array.isArray(s.keyFrames)) s.keyFrames = s.keyFrames.map(t => +(t * K).toFixed(4));
if (typeof s.stillAt === 'number') s.stillAt = +(s.stillAt * K).toFixed(4);
s.timeline.tracks.chest_body_1_1 = s.timeline.tracks.chest_body_1_1.map(([t, v, e]) => [t, +(v * 0.3).toFixed(4), e]);
for (const k of Object.keys(s.pose.deltas)) if (/^hands_/.test(k)) { delete s.pose.deltas[k]; delete s.timeline.tracks[k]; }
s.pose.base.hands = {
  left: { mode: 'free', frame: 'chest', wrist: [0.2255, 1.3534, 0.4763], finger: [0.1392, -0.0346, 0.9897], normal: [0, -1, 0.3], poleUp: [0.5, 1, -0.3], relax: 0.25 },
  right: { mode: 'free', frame: 'chest', wrist: [-0.2255, 1.3534, 0.4763], finger: [-0.1392, -0.0346, 0.9897], normal: [0, -1, 0.3], poleUp: [-0.5, 1, -0.3], relax: 0.25 },
};
export default s;
