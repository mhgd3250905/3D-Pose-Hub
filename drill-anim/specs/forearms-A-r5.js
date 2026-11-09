// forearms-A-r5 (elbow-twist r2, 2026-11-09): second orientation pass on the elbow, supersedes -r4.
// User (2026-11-09 10:41, after r4): "肩膀好了，手肘这里又有问题了" — r4 kept the whole time-varying hand turn (fingers forward ->
// out -> back -> back-of-hand, ~210 deg on the right) in the forearm roll, so the elbow pit pinched (elbow ratio L 0.77 / R 0.66).
// References (quadruped wrist rocks: hands under the shoulders, elbows straight; the hand turns forward / sideways / back toward the
// knees; Animal Flow L1 manual, Stretch Therapy wrist guide, Fullphysio, EVO "turn out the elbow creases"): the elbow itself is a hinge,
// the hand turn is shared by the shoulder (humerus rotation) and pronation/supination along the forearm, largest at the wrist.
// Now, per side, on top of r4 (static 45 deg external humerus roll, elbow pits toward the head):
//   - the humerus takes share c of the time-varying turn, CENTRED on the middle of the turn range m (fingers out), so the shoulder
//     rolls both ways around r4's orientation instead of only one way (r3 moved 100% one way and folded the shoulder);
//     right static roll -5 deg so the fingers-back block keeps r4's shoulder roll (that block is the shoulder's weak pose);
//   - the forearm roll keeps share k = 0.3 of the turn about m; the rest is hand-vs-forearm twist, which the r6 runtime spreads along
//     the forearm toward the wrist (pronation/supination), not across the elbow;
//   - short cosine corrections of the forearm roll while a hand is in the air turning (the ht2 table lags the hand there).
// Hand targets (positions, finger directions, palms) unchanged: joints identical to r4 (0 mm).
import base from './forearms-A-r4.js';
const s = structuredClone(base);
s.id = 'forearms-A-r5';
const M = { left: -27, right: 113 };   // middle of the ht2 elbowTwist table per side (deg)
function shareTurn(side, { a = 0, c = 0, k = 1 }) {
  const h = s.pose.base.hands[side], d = s.pose.deltas['ht1_' + side].hands[side], m = M[side];
  const U = h.upperArmTwist, E = h.elbowTwist, dU = d.upperArmTwist - U, dE = d.elbowTwist - E;
  h.upperArmTwist = U + a - c * m; h.elbowTwist = E + m * (1 - k);
  d.upperArmTwist = h.upperArmTwist + dU + c; d.elbowTwist = h.elbowTwist + k * dE;
}
shareTurn('left', { a: -4, c: 0.15, k: 0.3 });
shareTurn('right', { a: -5, c: 0.2, k: 0.3 });
// in-air forearm-roll corrections [side, deg, centre s, half-width s]
const D = s.timeline.duration;
[['left', -34, 2.43, 0.28], ['left', -15, 0.5, 0.22], ['left', -12, 0.65, 0.1], ['left', -14, 6.65, 0.12],
 ['right', 26, 2.1, 0.17], ['right', 26, 0.3, 0.14], ['right', 26, 6.3, 0.14]].forEach(([side, A, tc, hw], i) => {
  const tr = [];
  for (let j = 0; j <= D * 60; j++) { const t = j / 60, u = Math.abs(t - tc) / hw; tr.push([+t.toFixed(4), +(u < 1 ? A * (1 + Math.cos(Math.PI * u)) / 2 : 0).toFixed(4), 'linear']); }
  const key = 'r5' + side[0] + i; s.timeline.tracks[key] = tr;
  s.pose.deltas[key] = { hands: { [side]: { elbowTwist: s.pose.base.hands[side].elbowTwist + 1 } } };
});
export default s;
