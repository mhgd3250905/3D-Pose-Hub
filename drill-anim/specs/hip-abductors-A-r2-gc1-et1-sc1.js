// hip-abductors-A-r2-gc1-et1-sc1 (pose-fix r8 gc-overlap, 2026-11-05): self-collision fix on top of the ground-contact spec chain
// (hip-abductors-A-r2-gc1 -> -et1), NOT on the PR #29 version. Right hand on the hip: fingers sank 25.2 mm into the torso
// (813 vertices >10 mm, full-chain self-collision-audit); its touch clearance grows by the depth + 5 mm (+30 mm), so the hand
// sits that much further out along the same surface normal. Hand orientation / poles, left support arm, legs, trunk,
// timing, camera and the ground-contact fix are unchanged.
import base from './hip-abductors-A-r2-gc1-et1.js';
const s = structuredClone(base);
s.id = 'hip-abductors-A-r2-gc1-et1-sc1';
const ADD = {"right": 0.030};
for (const [side, a] of Object.entries(ADD)) { const t = s.pose.base.hands[side].touch; t.clear = +((t.clear ?? 0.002) + a).toFixed(4); }
export default s;
