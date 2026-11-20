// t-wall-handstand-shift 靠墙倒立移重 (chest-to-wall handstand weight shift, side to side) · Flare 2.0 new moves r1 (2026-11-20), P1.
// Standard: tools/flare2-moves/standards/t-wall-handstand-shift.md. Same set-up, frame and hold as t-wall-handstand-hold (imported).
// From the chest-to-wall handstand the shoulders travel slowly sideways over one hand (body left first), that arm stays locked and
// takes the weight, the other hand unloads to the fingertips (heel of the hand lifts ~4 cm, fingertips stay on the mat); pause; back to
// the middle with both palms flat; then the same to the other side. One loop = left + right = 1 rep (dose "每侧").
// The body pivots a little about the toes on the wall (hips roll about the wall normal) so the feet only slide a few cm on the wall.
// Loop 8 s: 0.5 s centre, 1.5 s shift left, 1.0 s pause, 1.0 s back, 0.5 s centre, 1.5 s shift right, 1.0 s pause, 1.0 s back.
import base from './t-wall-handstand-hold.js';
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const s = structuredClone(base);
s.id = 't-wall-handstand-shift'; s.name = '靠墙倒立移重'; s.nameEn = 'Chest-to-Wall Handstand Weight Shift';
const DUR = 8, SHIFT = 0.15, ROLL = -4;   // shoulder-centre travel (m) toward the support hand; hip roll (deg) that keeps the feet near the middle
const shL = keys([[0, 0], [0.5, 0], [2.0, 1], [3.0, 1], [4.0, 0]], DUR), shR = keys([[0, 0], [4.5, 0], [6.0, 1], [7.0, 1], [8.0, 0]], DUR);
// the free hand unloads together with the shift (its reach constraint is released as soon as it starts, so the support arm stays locked)
const liR = keys([[0, 0], [0.5, 0], [2.0, 1], [3.0, 1], [4.0, 0]], DUR), liL = keys([[0, 0], [4.5, 0], [6.0, 1], [7.0, 1], [8.0, 0]], DUR);
s.timeline = { duration: DUR, tracks: { shiftL: track(DUR, shL), shiftR: track(DUR, shR), lightR: track(DUR, liR), lightL: track(DUR, liL) } };
const b = s.pose.base;
const HX = 0.175, HZ = 0.28;
const tips = (sg) => ({ mode: 'fingertips', at: [sg * HX, HZ - 0.035], floor: 0, clear: -0.0095, finger: [sg * 0.2, -0.35, -1], normal: [sg * 0.05, -1, 0.25] });
for (const [side, sg] of [['left', 1], ['right', -1]]) b.hands[side] = { plant: b.hands[side], free: tips(sg), w: 0, blendPole: true };
b.shoulders = { shift: [0, 0.026, 0] };           // pushed tall the whole set
b.hips.rot = [[[1, 0, 0], b.hips.rot[0][1]], [[0, 0, 1], 0]];
b.constraints.splice(2, 1);                         // no pelvis-x pin: the shoulders move sideways
b.constraints.push({ type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0, weight: 3 });
const C = b.constraints.length;
const cons = v => Array.from({ length: C }, (_, i) => i === C - 1 ? { value: v } : {});
s.pose.deltas = {
  shiftL: { constraints: cons(SHIFT), hips: { rot: [{}, [[0, 0, 1], ROLL]] } },
  shiftR: { constraints: cons(-SHIFT), hips: { rot: [{}, [[0, 0, 1], -ROLL]] } },
  lightR: { hands: { right: { w: 1 } } },
  lightL: { hands: { left: { w: 1 } } },
};
s.highlight = { groups: ['deltoids', 'triceps'], side: 'both', pulseTrack: 'shiftL', pulseBase: 0.3 };
s.keyFrames = [0.3, 2.5, 6.5]; s.stillAt = 2.5;
s.camera = { ...s.camera, dir: [0.25, 0.12, 1], at: 2.5 };
s.qa = { ...s.qa, pins: [], straight: [] };
s.flare2 = { version: 'r1', priority: 'P1', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
