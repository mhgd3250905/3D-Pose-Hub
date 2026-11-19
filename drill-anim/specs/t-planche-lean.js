// t-planche-lean 俄挺前倾 (planche lean: straight-arm lean hold on the toes) · Thomas supplement r2 (2026-11-19), derived from serratus-A.
// Push-up top, fingers turned out to the sides, arms locked, toes on the mat. The toes push the floor: the feet roll forward over the
// toes (foot pitch 64 -> FP deg about the toe joints, which stay put) so the whole straight body moves forward and the shoulders pass in
// front of the wrists; hold, then roll back. Head points -X, body faces the floor, body left = +Z.
// r2 (precision pass, standard tools/thomas-sup/standards/t-planche-lean.md):
//  - shoulder blades pushed apart AND down the whole time as real scapula translation (shoulders.shift: +Z chest front = protraction,
//    -Y = depression), drawn by V5 (v5.scapulaShift, opt-in, see tools/v5/runtime/v5-hub.js); r1 only rounded the upper back 6 deg;
//  - lean ~10-11 cm (r1: 7 cm) with the toe tips fixed on the mat (r1's ankle path let the toes slide);
//  - pelvis slightly tucked (posterior tilt), body one line.
// Loop 8 s: 0.6 s set, 1.6 s lean forward, 4.2 s hold, 1.6 s back.
import base from './serratus-A.js';
const s = structuredClone(base);
s.id = 't-planche-lean'; s.name = '俄挺前倾'; s.nameEn = 'Planche Lean';
s.modelProfile = 'training-human-v2plus'; s.fps = 30; s.size = 1080; s.alignClavicles = false;
s.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
s.v5 = { scapulaShift: true };
s.timeline = { duration: 8, tracks: { lean: [[0, 0], [0.6, 0], [2.2, 1], [6.4, 1]] } };
const b = s.pose.base;
const SHIFT = [0, -0.010, 0.020];          // chest frame: 20 mm protraction + 10 mm depression, held through the whole set
b.shoulders = { shift: SHIFT };
b.chest = { waist: [[[0, 0, 1], 3]] };      // upper back slightly rounded around the spread shoulder blades
const HZ = 0.20, HX = -0.03;   // hands 10 mm further toward the feet than r1 so the start has the shoulders right over the wrists
const hand = (z, side) => ({ mode: 'floor', at: [HX, z], finger: [-0.45, Math.sign(z) * 1], poleUp: [side === 'right' ? -0.15 : 0.15, 0.95, Math.sign(z) * 0.35] });
b.hands = { right: hand(-HZ, 'right'), left: hand(HZ, 'left') };
b.constraints = b.constraints.map((c, i) => i < 2 ? { ...c, angle: 178.5, weight: 10 } : c);
// The toes stay tucked under and their tips stay put on the mat (the contact): pitching the foot 64 -> FP about the toe joint alone
// (ankle path 180 mm * (cos 64 - cos FP)) slid the tips 15 mm back, so the ankle travels TIP_FIX further.
const FX = b.feet.left.at[0], FZ = b.feet.left.at[1], FL = 0.180, P0 = 64, FP = 96, TIP_FIX = 0.0154;
const ROLL = FL * (Math.cos(P0 * Math.PI / 180) - Math.cos(FP * Math.PI / 180)) + TIP_FIX;
// The ankle path above is linear in the lean weight while the toe-tip offset is not (the lowest toe vertex also changes as the foot
// turns), so mid-roll the tips still slid up to 10.6 mm. TIP_SLIP = measured tip slip (mm, V5 lowest foot vertex, sandbox check
// 2026-11-19) every 2 frames of the 0.6-2.2 s roll with only the linear path; the 'tip' track moves the ankle back by exactly that,
// frame by frame (linear keys), and mirrored on the way back (6.4-8.0 s, same cosine ease reversed).
const TIP_SLIP = [0.0, 0.1, 0.4, 0.8, 0.3, 1.1, 2.0, 3.1, 4.2, 5.5, 6.7, 8.0, 9.3, 10.6, 9.4, 6.6, -2.4, -1.6, -1.7, -1.2, -0.7, -0.4, -0.2, -0.1, 0.0];
const slipAt = t => { const x = (t - 0.6) * 15, i = Math.min(TIP_SLIP.length - 2, Math.max(0, Math.floor(x))), f = Math.min(1, Math.max(0, x - i)); return TIP_SLIP[i] + (TIP_SLIP[i + 1] - TIP_SLIP[i]) * f; };
const tip = [[0, 0, 'linear']];
for (let k = 18; k <= 66; k++) tip.push([+(k / 30).toFixed(5), -slipAt(k / 30) / 1000, 'linear']);
for (let k = 192; k <= 240; k++) tip.push([+(k / 30).toFixed(5), -slipAt(0.6 + 8 - k / 30) / 1000, 'linear']);
s.timeline.tracks.tip = tip;
s.pose.deltas = { lean: { feet: { right: { pitch: FP, at: [FX - ROLL, -FZ] }, left: { pitch: FP, at: [FX - ROLL, FZ] } }, hips: { rot: [[[0, 0, 1], -13]] } },
  tip: { feet: { right: { at: [FX + 1, -FZ] }, left: { at: [FX + 1, FZ] } } } };   // tip = +1 moves both ankles 1 m toward +X (feet side)
s.highlight = { groups: ['deltoids', 'serratus'], side: 'both', pulseTrack: 'lean', pulseBase: 0.3 };
s.keyFrames = [0.3, 2.2, 4.5]; s.stillAt = 4.5;
s.thomasSupplement = { version: 'r2', item: '3', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
