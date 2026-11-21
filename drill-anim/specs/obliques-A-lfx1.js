// obliques-A-lfx1 (legacy-fix r1 batch 5 / b5-3, 2026-11-21, codex/legacy-fix-r1): built on obliques-A-r2 (unchanged file).
// Triage b5 (TRIAGE-b5.md): beast kick-through, the support leg's knee turns ~90 deg with the hip roll while the support foot only
// turned 45 deg (heading 90 -> 45), so toe line and knee differed by 89 deg (rom-footVsKnee -89, both sides): the ankle is wrenched.
// Correct (animal-flow kick-through): the support foot pivots on the ball of the foot with the hips, toes following the knee.
// Change: the support foot's end heading in the kick (delta R / L) pivots H_PIVOT deg from the bear stance instead of 45 (pitch blend
// unchanged), and the ankle tracks that keep the ball of the foot fixed on the mat (g*R / g*L, r2's measured toe-offset table) are
// recomputed for the new heading with the same geometry (toe offset = 0.18 m * cos(pitch) along the heading; this formula reproduces
// r2's table to < 0.1 mm). Hands, roll, threading leg, pelvis, timing and camera unchanged.
import base from './obliques-A-r2.js';
const H_PIVOT = 80;
const s = structuredClone(base);
s.id = 'obliques-A-lfx1'; s.revisionOf = 'obliques-A-r2';
const D = Math.PI / 180, L = 0.18, P0 = 50, X0 = 0.115702;
s.pose.deltas.R.feet.right.heading = 90 - H_PIVOT;
s.pose.deltas.L.feet.left.heading = 90 + H_PIVOT;
const tr = s.timeline.tracks;
for (const [tag, zs] of [['R', 1], ['L', -1]]) {
  const off = r => { const a = H_PIVOT * r * D, c = L * Math.cos(P0 * (1 - r) * D); return [c * Math.cos(a), c * Math.sin(a)]; };
  tr['gx' + tag] = tr[tag].map(([t, r]) => [t, +(X0 - off(r)[0]).toFixed(5), 'linear']);
  tr['gz' + tag] = tr[tag].map(([t, r]) => [t, +(-zs * off(r)[1]).toFixed(5), 'linear']);
}
export default s;
