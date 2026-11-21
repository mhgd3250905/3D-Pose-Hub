// deltoids-B-lfx1 (legacy-fix r1, 2026-11-21, codex/legacy-fix-r1): built on deltoids-B-r4 (unchanged file).
// Audit (tools/legacy-audit-r1) S1: in the high bridge (frames 110-130) the planted right foot (toes along the body, heading 90) is
// loaded and the right knee sat 12 cm inside the foot's long axis. The knee itself bends toward the toes (knee vs toe 8 deg); the
// cause is the foot placement: planted 29 cm outside the right hip in the bridge (z 0.14 vs hip z -0.15), so the shin leans in
// ~17 deg and the knee falls inside the foot line. Correct half Turkish get-up / high bridge (StrongFirst / RKC TGU standard): the
// planted foot about hip-width, near the buttock, knee stacked over the foot in line with the toes, drive through the heel.
// Tries: (1) knee pole outward only -> knee over the foot but 55 deg off the toe line; (2) foot 14 cm inward only -> the default bend
// keeps the knee in the hip-ankle plane, still 10 cm inside. Final (3) = both, solved so the shin is vertical over the planted foot:
// right foot planted 14 cm closer to the midline (z 0.14 -> 0.00; x, heading 90, flat unchanged) and a world knee pole
// [0.88, 0.95, 0.15] (above / ahead of the foot along the knee's bend direction), so the knee stacks over the foot in the bridge.
// Pelvis path, left leg, arms, dumbbell, timing and camera unchanged.
import base from './deltoids-B-r4.js';
const s = structuredClone(base);
s.id = 'deltoids-B-lfx1';
s.pose.base.feet.right = { ...s.pose.base.feet.right, at: [0.52, 0.0], pole: [0.88, 0.95, 0.15] };
export default s;
