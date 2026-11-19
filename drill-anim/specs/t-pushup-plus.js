// t-pushup-plus 俯卧撑加推 (push-up plus, scapular push-up) · Thomas supplement r1 (2026-11-19), derived from serratus-A.
// Push-up top: hands under the shoulders, arms locked straight, body one straight line from the head to the heels; only the
// shoulder blades move: the chest sinks toward the floor (blades squeezed together), then the floor is pushed away and the upper
// back rounds (blades spread), 1 s hold at the top. Head points -X, body faces the floor, body left = +Z (as serratus-A).
// V5 note: the V5 render copies bone rotations only, so the scapula translation of serratus-A (shoulders.shift) does not reach the
// V5 body (its hands then slide 15-30 mm). Here the shoulder blades are shown the way V5 can draw them: the upper back rounds up
// (waist flexion, +) and sinks (waist extension, -) while hands and toes stay planted and the elbows stay locked; the solver moves
// the pelvis/hip pitch so the body line follows. No shoulders.shift.
// Loop 8 s = 2 reps of 4 s: 0.4 s top, 1.1 s sink, 1.3 s push and round, 1.0 s hold, 0.2 s settle.
import base from './serratus-A.js';
const s = structuredClone(base);
s.id = 't-pushup-plus'; s.name = '俯卧撑加推'; s.nameEn = 'Push-Up Plus';
s.modelProfile = 'training-human-v2plus'; s.fps = 30; s.size = 1080; s.alignClavicles = false;
s.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
const rep = t0 => [[t0, 0], [t0 + 0.4, 0], [t0 + 1.5, -1], [t0 + 2.8, 1], [t0 + 3.8, 1]];
s.timeline = { duration: 8, tracks: { scap: [...rep(0), ...rep(4)] } };
s.pose.base.shoulders = { shift: [0, 0, 0] };
s.pose.base.chest = { waist: [[[0, 0, 1], 0]] };
s.pose.deltas = { scap: { chest: { waist: [[[0, 0, 1], 9]] } } };   // scap = +1 upper back rounded 9 deg, -1 chest sunk 9 deg
s.highlight = { groups: ['serratus'], side: 'both', pulseAt: [3.3, 7.3], pulseWidth: 0.8, pulseBase: 0.25 };
s.keyFrames = [0.2, 1.5, 3.3];
s.stillAt = 0.2;
s.thomasSupplement = { version: 'r1', item: '1', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
