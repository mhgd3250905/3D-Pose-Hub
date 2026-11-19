// t-pushup-plus 俯卧撑加推 (push-up plus, scapular push-up) · Thomas supplement r2 (2026-11-19), derived from serratus-A.
// Push-up top: hands under the shoulders, arms locked straight, body one straight line from the head to the heels; only the
// shoulder blades move: the chest sinks toward the floor (blades squeezed together, retraction), then the floor is pushed away and
// the chest rises (blades spread around the ribs, protraction), 1 s hold at the top. Head points -X, body faces the floor, left = +Z.
// r2 (precision pass, standard tools/thomas-sup/standards/t-pushup-plus.md): the shoulder blades really translate (shoulders.shift
// along the chest front axis, +-20 mm -> ~40 mm chest travel) and V5 draws that translation (v5.scapulaShift, opt-in, see
// tools/v5/runtime/v5-hub.js). r1 faked it by rounding/arching the upper back +-9 deg with the shoulders fixed, so the chest never
// rose and the hips rocked up and down 6 cm; r2 keeps the spine still (no waist bend) and the body line straight.
// Loop 8 s = 2 reps of 4 s, starting at the top: 1.0 s hold at the top, 1.3 s sink, 0.2 s pause, 1.5 s push.
import base from './serratus-A.js';
const s = structuredClone(base);
s.id = 't-pushup-plus'; s.name = '俯卧撑加推'; s.nameEn = 'Push-Up Plus';
s.modelProfile = 'training-human-v2plus'; s.fps = 30; s.size = 1080; s.alignClavicles = false;
s.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
s.v5 = { scapulaShift: true };
const rep = t0 => [[t0, 1], [t0 + 1.0, 1], [t0 + 2.3, -1], [t0 + 2.5, -1]];
s.timeline = { duration: 8, tracks: { scap: [...rep(0), ...rep(4)] } };
s.pose.base.shoulders = { shift: [0, 0, 0] };
s.pose.base.chest = { waist: [[[0, 0, 1], 0]] };
s.pose.deltas = { scap: { shoulders: { shift: [0, 0, 0.02] } } };   // scap +1 = protraction (+20 mm, chest up), -1 = retraction
s.highlight = { groups: ['serratus'], side: 'both', pulseAt: [0.5, 4.5], pulseWidth: 0.9, pulseBase: 0.25 };
s.keyFrames = [0.5, 2.4, 3.4];
s.stillAt = 0.5;
s.thomasSupplement = { version: 'r2', item: '1', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
