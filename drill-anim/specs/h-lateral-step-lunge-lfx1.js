// h-lateral-step-lunge-lfx1 (legacy-fix r1 batch 5 / b5-2, 2026-11-21, codex/legacy-fix-r1): built on h-lateral-step-lunge-sc1-et1-kn2
// (unchanged file).
// Triage b5 (TRIAGE-b5.md): in each loaded side lunge (right f70-90, left f220-240) the bent leg's knee sat ~7 cm inside the foot
// (shin slanting inward seen from the front; analyze knee-inside-foot 7 cm).
// Cause: the knee poles were fixed world points [+-0.3, 0.5, 1] while the stepping foot travels out to x = +-0.542, so in the lunge
// the pole lies ~0.24 m medial of the loaded foot and the IK bends that knee inward.
// Correct (NSCA / ACE lateral lunge cues): the loaded knee tracks over the toes (2nd-3rd toe), shin near vertical from the front.
// Change: each knee pole now travels with its own foot: x = foot x +- 0.105 (6 deg lateral of the straight-ahead toe line at the
// pole's 1 m reach, as n-squat-shift-lfx1), driven by the same keyframe tracks that move the foot (k4 left, k7 right; linear, so the
// pole stays exactly 0.105 lateral of the foot every frame). Feet, step width, pelvis path, depth, chest, hands, timing, camera and
// props unchanged.
import base from './h-lateral-step-lunge-sc1-et1-kn2.js';
const s = structuredClone(base);
s.id = 'h-lateral-step-lunge-lfx1';
s.revisionOf = 'h-lateral-step-lunge-sc1-et1-kn2';
const PO = 0.105;
const F = s.pose.base.feet, Dl = s.pose.deltas;
if (F.left.at[0] !== 0 || F.right.at[0] !== 0 || Dl.k4.feet.left.at[0] !== 1 || Dl.k7.feet.right.at[0] !== 1) throw Error('lfx1: unexpected foot keyframe layout');
F.left.pole = [PO, F.left.pole[1], F.left.pole[2]];
F.right.pole = [-PO, F.right.pole[1], F.right.pole[2]];
// delta values are absolute at p = 1: pole.x = base + p * (d - base) = foot.x +- PO when d = 1 +- PO
Dl.k4.feet.left.pole = [1 + PO];
Dl.k7.feet.right.pole = [1 - PO];
export default s;
