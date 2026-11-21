// hamstrings-A-lfx1 (legacy-fix r1 batch 5 / b5-4, 2026-11-21, codex/legacy-fix-r1): built on hamstrings-A-r3 (unchanged).
// Triage b5 (TRIAGE-b5.md): single-leg Romanian deadlift, the body stands on the left foot the whole time (right foot 44-424 mm off
// the floor), but the pelvis was held on the midline between where two feet would be (solver targets pelvis x = 0, z = 0; the left foot
// sits at z -0.085), so the centre of mass was 3.3-4.5 cm outside the standing foot (com-outside-support).
// Correct (NSCA single-leg RDL): hips square, the weight over the standing foot (mid-foot) through the whole hinge.
// Change: pelvis z target (constraint 'joint pelvis z') and pelvis rest z move DZ toward the standing foot for the whole clip.
// Feet, hinge / bow tracks, arms, timing and camera unchanged.
import base from './hamstrings-A-r3.js';
const s = structuredClone(base);
s.id = 'hamstrings-A-lfx1'; s.revisionOf = 'hamstrings-A-r3';
const DZ = -0.065;
const b = s.pose.base;
for (const c of b.constraints) if (c.type === 'joint' && c.joint === 'pelvis' && c.axis[2] === 1) c.value += DZ;
b.pelvis = [b.pelvis[0], b.pelvis[1], b.pelvis[2] + DZ];
for (const d of Object.values(s.pose.deltas)) if (Array.isArray(d.pelvis)) d.pelvis = [d.pelvis[0], d.pelvis[1], d.pelvis[2] + DZ];
export default s;
