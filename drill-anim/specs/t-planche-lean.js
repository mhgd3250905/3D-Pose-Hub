// t-planche-lean 俄挺前倾 (planche lean: straight-arm lean hold on the toes) · Thomas supplement r1 (2026-11-19), derived from serratus-A.
// Push-up top, fingers turned out to the sides, arms locked, toes on the mat. The toes push the floor: the feet roll up onto the
// tips of the toes (foot pitch 64 -> 86 deg about the toe contact) so the whole straight body moves forward and the shoulders pass in
// front of the wrists; hold, then roll back. Shoulder blades stay pushed apart the whole time (upper back rounded +6 deg, as the top
// of t-pushup-plus; V5 does not carry shoulders.shift), pelvis slightly tucked. Head points -X, body faces the floor, left = +Z.
// Loop 8 s: 0.6 s set, 1.6 s lean forward, 4.2 s hold, 1.6 s back.
import base from './serratus-A.js';
const s = structuredClone(base);
s.id = 't-planche-lean'; s.name = '俄挺前倾'; s.nameEn = 'Planche Lean';
s.modelProfile = 'training-human-v2plus'; s.fps = 30; s.size = 1080; s.alignClavicles = false;
s.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
s.timeline = { duration: 8, tracks: { lean: [[0, 0], [0.6, 0], [2.2, 1], [6.4, 1]] } };
const b = s.pose.base;
b.shoulders = { shift: [0, 0, 0] };
b.chest = { waist: [[[0, 0, 1], 6]] };
const HZ = 0.20;
const hand = (z, side) => ({ mode: 'floor', at: [-0.04, z], finger: [-0.45, Math.sign(z) * 1], poleUp: [side === 'right' ? -0.15 : 0.15, 0.95, Math.sign(z) * 0.35] });
b.hands = { right: hand(-HZ, 'right'), left: hand(HZ, 'left') };
b.constraints = b.constraints.map((c, i) => i < 2 ? { ...c, angle: 178.5, weight: 10 } : c);
const FX = b.feet.left.at[0], FZ = b.feet.left.at[1], ROLL = 0.075;   // the ankle moves 75 mm forward while the toe tip stays put
s.pose.deltas = { lean: { feet: { right: { pitch: 86, at: [FX - ROLL, -FZ] }, left: { pitch: 86, at: [FX - ROLL, FZ] } }, hips: { rot: [[[0, 0, 1], -13]] } } };
s.highlight = { groups: ['deltoids', 'serratus'], side: 'both', pulseTrack: 'lean', pulseBase: 0.3 };
s.keyFrames = [0.3, 2.2, 4.5]; s.stillAt = 4.5;
s.thomasSupplement = { version: 'r1', item: '3', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
