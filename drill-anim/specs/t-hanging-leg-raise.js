// t-hanging-leg-raise 悬垂举腿 (hanging straight-leg raise) · Thomas supplement r1 (2026-11-19), derived from h-straight-arm-hang-native.
// Pull-up bar hang, hands shoulder-width (the same bar, grip and arm solve as the straight-arm hang), shoulders held down (arms
// 178 deg, no shoulders.shift: V5 copies bone rotations only). Both legs stay straight and together and lift from hanging to level
// with the floor, 1 s hold, then lower slowly over 3 s; no swing. The pelvis tips back a little as the legs rise (hip pitch -10 deg)
// and the body moves back 4 cm to stay balanced under the bar. Head up (+Y), body faces +Z, body left = +X (t-* convention).
// Legs from the armfix leg() helper (world leg direction -> hips-frame ankle, knee pole and foot rotation for the current hip pitch).
// Loop 8 s, one rep: 0.6 s hang, 1.6 s raise, 1.0 s hold, 3.0 s lower, 1.8 s hang.
import previous from './h-straight-arm-hang-native.js';
import { leg, legFields, dirW, scripted, curve } from './_thomas-armfix-r1.mjs';
const T = 8, u = curve([[0, 0], [0.6, 0], [2.2, 1], [3.2, 1], [6.2, 0]], T);
const s = structuredClone(previous);
s.id = 't-hanging-leg-raise'; s.name = '悬垂举腿'; s.nameEn = 'Hanging Straight-Leg Raise';
const b = s.pose.base;
b.hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] };
b.feet = { left: { mode: 'free', frame: 'hips' }, right: { mode: 'free', frame: 'hips' } };
const fn = t => { const k = u(t), pitch = -10 * k, elev = -88 + 86 * k, o = { 'hips.rot.0.1': pitch, 'pelvis.2': -0.075 - 0.04 * k };
  for (const side of ['left', 'right']) Object.assign(o, legFields(side, leg(side, dirW(side === 'left' ? 1 : -1, elev, 3), pitch, 25 + 10 * k, 178)));
  return o; };
const S = scripted(b, fn, T);
S.tracks.up = Array.from({ length: T * 30 }, (_, i) => [+(i / 30).toFixed(5), +u(i / 30).toFixed(5), 'linear']);
s.timeline = { duration: T, tracks: S.tracks };
s.pose.deltas = { ...S.deltas, up: {} };
s.highlight = { groups: ['hipFlexors', 'abs'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 };
s.props = s.props.filter(p => p.type !== 'wall');   // the door-frame walls of the hang would hide the side view; the bar keeps its own posts
s.camera = { ...s.camera, dir: [1, 0.12, 0.55], at: 2.7, drift: 0 };
s.stillAt = 2.7; s.keyFrames = [0.3, 2.7, 4.7];
s.qa = { ...(s.qa || {}), straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }] };
s.thomasSupplement = { version: 'r1', item: '8', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
