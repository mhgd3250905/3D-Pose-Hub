// erectors-B-lfx1 (legacy-fix r1 batch 5 / b5 wrist, 2026-11-21, codex/legacy-fix-r1): built on erectors-B-r3 (unchanged file).
// Wrist screen b5 (TRIAGE-b5.md): Swiss-ball back extension, hands on the head: both hands were bent toward the back of the hand by
// 103-106 deg with 47-48 deg deviation for the whole clip, fingertips lifted off the scalp.
// Change: only the hand orientation (chest frame, both sides mirrored). Each open hand continues its forearm line (wrist extension
// ~15 deg, no deviation) with the palm turned onto the side/back of the head (fingers forward toward the temple, behind the ear);
// the existing touch solve (clear 2 mm) keeps the palm on the head. Wrist targets, elbow poles, arms' upper-arm roll (r3), body,
// ball, wall, timing and camera unchanged.
import base from './erectors-B-r3.js';
const s = structuredClone(base);
s.id = 'erectors-B-lfx1'; s.revisionOf = 'erectors-B-r3';
const L = { finger: [-0.203, 0.498, 0.843], normal: [-0.959, 0.075, -0.275] };
const mir = v => [-v[0], v[1], v[2]];
Object.assign(s.pose.base.hands.left, L);
Object.assign(s.pose.base.hands.right, { finger: mir(L.finger), normal: mir(L.normal) });
export default s;
