// h-db-curl-r2-ht1 (pose-fix r6, 2026-11-05): on armfix-r2 the arm solve rolls the forearm ~-140 deg about its own axis
// while the elbow flexes, and the fist (held in the chest frame) counter-rolls ~+200 deg against the forearm
// (hand-vs-forearm twist -11 -> 197 deg, docs/reviews/pose-fix-r1 r6). A time-varying forearm roll (elbowTwist, deg,
// a function of each arm's curl phase q, measured on the rig) cancels that solver roll so the real supination
// (~50-70 deg, neutral -> palm-up) is split about evenly between forearm and hand. Hand positions/orientations, grip,
// dumbbells, poles, timing and camera are unchanged.
import base from './h-db-curl-r2.js';
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const s = structuredClone(base);
s.id = 'h-db-curl-r2-ht1';
const DUR = 8;
const rep = st => keys([[0, 0], [st + 0.3, 0], [st + 1.6, 1], [st + 2.0, 1], [st + 3.6, 0]], DUR);
// measured (q, roll) pairs, right arm; left arm mirrored
const Q = [[0, 0], [0.067, 15], [0.184, 44], [0.309, 75], [0.56, 114], [0.629, 122], [0.9, 158], [1, 174]];
const F = q => { for (let i = 1; i < Q.length; i++) if (q <= Q[i][0]) { const [a, x] = Q[i - 1], [b, y] = Q[i]; return x + (y - x) * (q - a) / (b - a); } return Q[Q.length - 1][1]; };
const SIGN = { right: 1, left: -1 }, START = { right: 0, left: 4 };
for (const side of ['right', 'left']) {
  const k = 'ht1_' + side, p = rep(START[side]);
  s.timeline.tracks[k] = track(DUR, t => SIGN[side] * F(p(t)));
  s.pose.base.hands[side].elbowTwist = 0;
  s.pose.deltas[k] = { hands: { [side]: { elbowTwist: 1 } } };
}
export default s;
