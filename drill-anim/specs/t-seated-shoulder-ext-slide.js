// t-seated-shoulder-ext-slide 后撑肩伸展滑行（垫上版） (seated back-support shoulder-extension slide; mat version of the German hang)
// · Thomas supplement r2 (2026-11-19), derived from h-seated-reachback (same seated frame, feet and solver).
// Sitting on the mat, knees bent, feet flat; hands flat on the mat behind the hips, fingers pointing back, arms straight the whole
// time. The hips slide forward so the hands end up further and further behind the body (shoulders move into extension), the end
// position is held actively for 1.5 s (arms locked, shoulders pressed down, chest up), then the hips slide back.
// r2 (precision pass, standard tools/thomas-sup/standards/t-seated-shoulder-ext-slide.md):
//  - head: the hub rig keeps the head rigid with the chest, so as the trunk leans back the face turned to the ceiling (gaze 21-36 deg
//    above horizontal, r1). V5 now flexes the head 18 deg (chin slightly in, v5.headFlexDeg, opt-in, see tools/v5/runtime/v5-hub.js):
//    gaze 3-18 deg above horizontal;
//  - active shoulders: shoulder blades held down and slightly back the whole set (shoulders.shift, drawn by v5.scapulaShift) instead
//    of hanging in the end range;
//  - slide 0.20 m (r1 0.21): end shoulder extension 63 deg (r1 65), inside the adult norm (AAOS 60, AMA >= 50, Boone & Azen 62);
//  - hands and feet rest ON the 6 mm mat (r1: palms 4.8 mm and toes 6 mm into it): fingertips hand mode on the mat top, feet lifted.
// Loop 8 s = 1 rep: 0.3 s set, 2.2 s slide, 1.5 s hold, 2.2 s back, 1.8 s reset. Facing +Z, head up (+Y), body left = +X.
import base from './h-seated-reachback.js';
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const s = structuredClone(base);
s.id = 't-seated-shoulder-ext-slide'; s.name = '后撑肩伸展滑行'; s.nameEn = 'Seated Shoulder-Extension Slide';
s.modelProfile = 'training-human-v2plus'; s.fps = 30; s.size = 1080;
s.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
s.v5 = { scapulaShift: true, headFlexDeg: 18 };
const DUR = 8, p = keys([[0, 0], [0.3, 0], [2.5, 1], [4.0, 1], [6.2, 0]], DUR);
s.timeline = { duration: DUR, tracks: { slide: track(DUR, p) } };
const b = s.pose.base, MAT = 0.006, HAND_CLEAR = 0.004;
b.constraints = b.constraints.map(c => c.type === 'reach' ? { ...c, angle: 178 } : c);
b.shoulders = { shift: [0, -0.008, -0.006] };   // chest frame: 8 mm depression + 6 mm retraction (active shoulders), whole set
for (const side of ['left', 'right']) {
  const h = b.hands[side], x = h.at[0];
  b.hands[side] = { mode: 'fingertips', at: [x, h.at[1]], floor: MAT, clear: HAND_CLEAR, finger: [Math.sign(x) * 0.15, 0, -1], normal: [0, -1, 0], poleUp: h.poleUp };
  b.feet[side].lift = MAT;
}
// Seat on the mat: as the trunk leans back the lowest buttock vertex rose up to 9 mm off the mat (pelvis height fixed, r1 too).
// SEAT_MM = that clearance (mm, V5 lowest pelvis/torso vertex over the mat top) every 2 frames with no correction (sandbox check
// 2026-11-19); the 'seat' track lowers the pelvis by SEAT_MM - 2.2 frame by frame (linear keys): buttocks 2-3 mm over, backs of the thighs on the mat.
const SEAT_MM = [4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.4, 4.6, 4.8, 5.1, 5.4, 5.8, 6.2, 6.6, 7, 7.4, 7.9, 8.4, 8.9, 8.7, 8.1, 7.5, 6.9, 6.4, 5.8, 5.3, 4.9, 4.4, 4, 3.7, 3.3, 3.1, 2.8, 2.6, 2.5, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.5, 2.6, 2.7, 2.9, 3.2, 3.5, 3.8, 4.2, 4.6, 5.1, 5.6, 6.1, 6.6, 7.2, 7.8, 8.4, 9, 8.7, 8.2, 7.7, 7.2, 6.8, 6.4, 6, 5.6, 5.3, 5, 4.7, 4.5, 4.4, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3, 4.3];
const seat = SEAT_MM.map((v, i) => [+(i * 2 / 30).toFixed(5), -(v - 2.2) / 1000, 'linear']);
seat.push([DUR, seat[0][1], 'linear']);
s.timeline.tracks.seat = seat;
s.pose.deltas = { slide: { pelvis: [0, 0.119, 0.20] }, seat: { pelvis: [0, 0.119 + 1, 0] } };   // seat = +1 raises the pelvis 1 m
s.highlight = { groups: ['deltoids', 'chest', 'biceps'], side: 'both', pulseTrack: 'slide', pulseBase: 0.3 };
s.keyFrames = [0.2, 2.5, 3.3]; s.stillAt = 3.3;
s.camera = { ...s.camera, dir: [1, 0.25, 0.1], drift: 0, at: 3.3 };
s.qa = { ...s.qa, straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }] };
s.thomasSupplement = { version: 'r2', item: '5', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
