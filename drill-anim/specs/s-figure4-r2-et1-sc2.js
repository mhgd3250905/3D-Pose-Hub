// s-figure4-r2-et1-sc2: amplitude restore of s-figure4-r2-et1-sc1 (pose-fix r1 b10, 2026-11-05). sc1 lifted the crossed right
// ankle ~8 cm onto the solved left thigh (fixes shoe->left thigh 69 mm), which tilted the right hip->ankle axis toward the
// knee pole's Y, so the same 'open' pole swing ([-1,-0.15,0.25] -> [-1,-0.4,0.25]) only turned the knee open half as far
// (motion-contact audit: rightHip 12.2 deg / rightKnee 88 mm on main -> 5.9 deg / 45 mm). Only the 'open' delta pole is
// deepened to [-1,-0.6,0.25] (one probe sweep -0.55/-0.6/-0.7/-1.0): knee falls open 11.7 deg / 87 mm again. sc1 ankle
// placement (both base and open), base pole, foot rotation, arms (et1), left leg, timing and camera unchanged.
import base from './s-figure4-r2-et1-sc1.js';
const s = structuredClone(base);
s.id = 's-figure4-r2-et1-sc2';
s.pose.deltas.open.feet.right.pole = [-1.0, -0.6, 0.25];
export default s;
