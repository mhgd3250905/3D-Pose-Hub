// h-kneeling-thread-needle-r2-gc1-hp1 (pose-fix r10, 2026-11-05): built on the ground-contact spec h-kneeling-thread-needle-r2-gc1 (fix/ground-contact-r1), NOT on the PR #29 version.
// The threading hand used to slerp straight from the planted orientation (fingers +x, palm down) to the threaded one (fingers -z, palm up):
// those two are exactly 180 deg apart, so the path direction was arbitrary and the hand rolled ~318 deg against its forearm the long way.
// Now the free (threaded) target is itself swept: during 1.8-2.6 s (and mirrored 5.4-6.2 s) its palm normal turns from -1x (thumb up, palm
// facing -1x) to +y, so the blend goes plant -> thumb-up -> palm-up along one defined supination path. At w=1 (hold 3-5 s) the target is
// exactly the GC one, so the hold pose, the right elbow ground clearance and every other GC fix are unchanged. No forearm-roll table.
import base from './h-kneeling-thread-needle-r2-gc1.js';
import { track } from '../lib/ss-geo.mjs';
const s = structuredClone(base);
s.id = 'h-kneeling-thread-needle-r2-gc1-hp1';
const DUR = s.timeline.duration, sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const psi = t => { const u = t <= 4 ? t : DUR - t; return Math.PI / 2 * sm((u - 1.8) / 0.8); };
s.timeline.tracks.hp1_nx = track(DUR, t => Math.cos(psi(t)));
s.timeline.tracks.hp1_ny = track(DUR, t => 1 - Math.sin(psi(t)));
s.pose.deltas = { ...s.pose.deltas, hp1_nx: { hands: { right: { free: { normal: [-1] } } } }, hp1_ny: { hands: { right: { free: { normal: [{}, 0] } } } } };
export default s;
