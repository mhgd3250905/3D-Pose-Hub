// adductors-A-lfx1 哥萨克蹲 (legacy-fix r1, 2026-11-21, codex/legacy-fix-r1): built on adductors-A-r2 (unchanged file; same human
// wrapper, source adductors-A.js unchanged). Audit (tools/legacy-audit-r1, hark-sk confirmed): at the bottom of each side squat the
// centre of mass stayed ~7 cm medial of the squatting foot (S1 sidesquat-com-off-foot), the squatting knee fell 5-7 cm inside the foot
// line early in the descent (S2 knee-inside-foot) with the shin twisted ~41 deg off the knee's bending plane.
// Correct Cossack squat (NSCA/ACE descriptions; Hub text "往一边蹲，另一条腿伸直、脚尖朝天 / 蹲的那只脚后跟踩实，膝盖对着脚尖 /
// 上身微微往前，两手往前伸"): hips travel sideways over the squatting foot and sit down there, weight over that whole foot, knee over
// the 2nd toe, the other leg straight with heel down and toes up.
// Why the old pose could not get there: with the straight leg kept straight, the pelvis can only move on a circle round the straight
// foot, so how far it gets over the squatting foot is set by the stance width and the depth. The old solve let the pelvis HEIGHT
// target (weight 1) lead and the sideways target (weight 0.2) follow, and at 0.90 m between the ankles (~2.4x the 0.376 m shoulder
// joint width) the bottom pelvis was 4.5 cm short of the foot. (Two earlier tries that only re-weighted / re-timed the sideways target
// failed for this reason; a WIDER stance moves the straight foot further away and makes both the bottom weight shift and the early knee
// line worse, checked numerically before this version.)
// Changes (only legs/pelvis path and the trunk turn; timing 8 s and key times, arms, toe-up straight leg, heel pivot, camera unchanged):
//  1. stance: ankles at +-0.405 m (0.81 m apart, ~1.8x shoulder width) instead of +-0.45; toe-out 20 deg and the heel-pivot tracks kept.
//  2. pelvis path led by the sideways target: x target +-0.45 m with weight 1 (was 0.31 / 0.2), height target weak (0.47 m, weight
//     0.15); the straight-leg reach (weight 4) then sets the height, so the hips travel sideways along the straight-leg arc and sit
//     down over the squatting foot (bottom pelvis ~0.48 m, same depth as before).
//  3. at the bottom the hips turn 12 deg toward the squatting knee (the forward lean then goes toward the knee), part of the weight
//     shift onto that foot.
//  4. early descent / late ascent only (squat 0.02 < p < 0.45, 'kpR'/'kpL' bump): the squatting knee's pole moves 40 % toward a point
//     42 deg lateral of the toe line so the knee stays over the foot while the hip is still far inside it, and the thigh gets a 22 deg
//     twist so the kneecap turns with that bend (the hub leg IK keeps the thigh roll otherwise); back to the original values before the
//     knee passes 70 deg of flexion (bottom knee pole = original one, shifted with the foot).
//  5. shin twist correction 28 deg on the squatting leg while the knee is bending/straightening (0.02 < p < 0.75, 'ktR'/'ktL'), so the
//     shin stays in the knee's bending plane (audit shinFace -41 -> within 30); none at the bottom or standing.
import base from './adductors-A-r2.js';
const s = structuredClone(base);
s.id = 'adductors-A-lfx1';
const FX = 0.405, XB = 0.45, YB = 0.47, YAW = 12, TT = 22, KT = 28, PW = 0.4, PAZ = 42, HO = 20;
const B = s.pose.base, D = s.pose.deltas, LEAN = D.R.hips.rot[0][1], DEG = Math.PI / 180;
// stance
B.feet.left.at = [FX, 0]; B.feet.right.at = [-FX, 0];
B.feet.left.pole = [FX + 0.3, 0.5, 0.55]; B.feet.right.pole = [-FX - 0.3, 0.5, 0.55];        // original poles, moved with the feet
D.lx.feet.left.at = [FX + 1, 0]; D.lz.feet.left.at = [FX, 1]; D.rx.feet.right.at = [-FX + 1, 0]; D.rz.feet.right.at = [-FX, 1];
// pelvis path (sideways-led) + hips turn toward the squatting knee
B.hips.rot = [[[1, 0, 0], 0], [[0, 1, 0], 0]];
D.R.hips.rot = [[[1, 0, 0], LEAN], [[0, 1, 0], -YAW]]; D.L.hips.rot = [[[1, 0, 0], LEAN], [[0, 1, 0], YAW]];
D.R.constraints = [{}, {}, { value: YB, weight: 0.15 }, { value: -XB, weight: 1 }];
D.L.constraints = [{}, {}, { value: YB, weight: 0.15 }, { value: XB, weight: 1 }];
// early-descent knee line: pole toward a far point PAZ deg lateral of the toe line (mixed PW), shin twist correction
B.feet.left.kneeTwist = 0; B.feet.right.kneeTwist = 0; B.feet.left.thighTwist = 0; B.feet.right.thighTwist = 0;
const farPole = sx => { const h = sx * HO * DEG, a = PAZ * DEG, fd = [Math.sin(h), Math.cos(h)], lat = [sx * Math.cos(h), -sx * Math.sin(h)];
  const ax = sx * FX, d = [fd[0] * Math.cos(a) + lat[0] * Math.sin(a), fd[1] * Math.cos(a) + lat[1] * Math.sin(a)];
  return [ax + 2 * d[0], 0.084 + 0.5, 2 * d[1]]; };
const mix = (a, b, w) => a.map((v, i) => +(v + w * (b[i] - v)).toFixed(4));
D.kpR = { feet: { right: { pole: mix(B.feet.right.pole, farPole(-1), PW), thighTwist: TT } } };   // twist signs: + on the right leg = toward
D.kpL = { feet: { left: { pole: mix(B.feet.left.pole, farPole(1), PW), thighTwist: -TT } } };     // the knee's bend direction, mirrored on the left
D.ktR = { feet: { right: { kneeTwist: KT } } };
D.ktL = { feet: { left: { kneeTwist: -KT } } };
const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const bumpP = p => ss(0.02, 0.10, p) * (1 - ss(0.30, 0.45, p)), bumpT = p => ss(0.02, 0.10, p) * (1 - ss(0.45, 0.75, p));
const tr = (k, f) => s.timeline.tracks[k].map(([t, v, e]) => [t, +f(v).toFixed(5), e]);
Object.assign(s.timeline.tracks, { kpR: tr('R', bumpP), kpL: tr('L', bumpP), ktR: tr('R', bumpT), ktL: tr('L', bumpT) });
export default s;
