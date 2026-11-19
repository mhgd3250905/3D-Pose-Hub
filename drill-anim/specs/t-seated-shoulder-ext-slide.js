// t-seated-shoulder-ext-slide 后撑肩伸展滑行（垫上版） (seated back-support shoulder-extension slide; mat version of the German hang)
// · Thomas supplement r1 (2026-11-19), derived from h-seated-reachback (same seated frame, hands, feet and solver).
// Sitting on the mat, knees bent, feet flat; hands flat on the mat behind the hips, fingers pointing back, arms straight the whole
// time. The hips slide forward so the hands end up further and further behind the body (shoulders move into extension), the end
// position is held actively for 1.5 s (arms locked, chest up), then the hips slide back. Differences from h-seated-reachback: a
// longer slide (0.15 -> 0.21 m, to the end of the shoulder range), arms held at 178 deg (was 176), active hold instead of a
// passive stretch, and 6 s reps paced for 6-8 reps a set (loop 8 s: 0.3 s set, 2.2 s slide, 1.5 s hold, 2.2 s back, 1.8 s reset).
// Facing +Z, head up (+Y), body left = +X.
import base from './h-seated-reachback.js';
import { keys } from '../lib/home-anim.mjs';
import { track } from '../lib/ss-geo.mjs';
const s = structuredClone(base);
s.id = 't-seated-shoulder-ext-slide'; s.name = '后撑肩伸展滑行'; s.nameEn = 'Seated Shoulder-Extension Slide';
s.modelProfile = 'training-human-v2plus'; s.fps = 30; s.size = 1080;
s.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
const DUR = 8, p = keys([[0, 0], [0.3, 0], [2.5, 1], [4.0, 1], [6.2, 0]], DUR);
s.timeline = { duration: DUR, tracks: { slide: track(DUR, p) } };
s.pose.base.constraints = s.pose.base.constraints.map(c => c.type === 'reach' ? { ...c, angle: 178 } : c);
s.pose.deltas = { slide: { pelvis: [0, 0.119, 0.21] } };
s.highlight = { groups: ['deltoids', 'chest', 'biceps'], side: 'both', pulseTrack: 'slide', pulseBase: 0.3 };
s.keyFrames = [0.2, 2.5, 3.3]; s.stillAt = 3.3;
s.camera = { ...s.camera, dir: [1, 0.25, 0.1], drift: 0, at: 3.3 };
s.qa = { ...s.qa, straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }] };
s.thomasSupplement = { version: 'r1', item: '5', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
