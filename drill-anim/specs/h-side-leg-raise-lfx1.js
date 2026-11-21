// h-side-leg-raise-lfx1 (legacy-fix r1 batch 5 / b5-4, 2026-11-21, codex/legacy-fix-r1): built on h-side-leg-raise-r5 (unchanged).
// Triage b5 (TRIAGE-b5.md): while the right leg is up (f30-90) the body stands on the left foot only, but the pelvis stayed where it
// was on two feet (x 0.035, the left foot is at x 0.105), so the centre of mass sat 4.5-5.6 cm outside the standing foot (com-outside-
// support): statically the figure would fall toward the lifted leg.
// Correct (ACE / NSCA single-leg stance cues): before the leg lifts, shift the weight onto the standing foot (pelvis over the foot,
// hips level, trunk tall).
// Change: a new 'shift' track (0 = both feet, 1 = on the left foot; leads the lift by 0.3 s and returns 0.2 s after the foot is
// down, so the weight is over the foot before it leaves the floor) moves the pelvis x target of the solver (constraint 'joint pelvis
// x', 0.04) and the pelvis rest x toward the standing foot by DX, and the pelvis rest z forward by DZ (over the midfoot instead of
// the heel). Feet, leg path, hands, trunk, timing and camera unchanged.
// Round 1 (DX 0.07 / DZ 0.03 on the lift track): com 1.1 cm outside at f30, only 1.0 cm inside at the top.
import base from './h-side-leg-raise-r5.js';
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const s = structuredClone(base);
s.id = 'h-side-leg-raise-lfx1'; s.revisionOf = 'h-side-leg-raise-r5';
const DX = 0.09, DZ = 0.04, DUR = s.timeline.duration;
const shift = keys([[0, 0], [0.1, 0], [1.1, 1], [2.6, 1], [3.8, 0], [4.1, 0], [5.1, 1], [6.6, 1], [7.8, 0]], DUR);
s.timeline.tracks.shift = track(DUR, shift);
const P0 = s.pose.base.pelvis, C = s.pose.base.constraints;
const ci = C.findIndex(c => c.type === 'joint' && c.joint === 'pelvis' && c.axis[0] === 1);
const cons = C.map((c, i) => i === ci ? { value: c.value + DX } : {});
s.pose.deltas.shift = { pelvis: [P0[0] + DX, P0[1], P0[2] + DZ], constraints: cons };
export default s;
