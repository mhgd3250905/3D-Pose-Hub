// s-butterfly-lfx2 (legacy-fix r1 batch 5s, 2026-11-22, codex/legacy-fix-r1): built on s-butterfly-lfx1 (unchanged file).
// Goal (开哥 b5 review, hark-sk): open palms rest on top of the feet, hand-to-foot/shoe mesh gap 3-8 mm on every frame and never
// intersecting, wrist near neutral (extension <= 25 deg, deviation <= 15 deg).
// lfx1 left the palms 16-39 mm inside the own foot. Two hand-only changes, body / legs / pelvis / hips / chest / timing unchanged:
//  1. palm heights (b5r round bf2e): palmAt +24 mm out / +24 mm up while sitting tall ('base'), +8 / +15 mm in the full fold
//     ('open' delta). This alone met the fold (f75-f155), but sitting tall the fingertips hung into the midline where the two
//     shoes meet and touched the OTHER foot's toes (0.2 mm), and the hinge (open ~0.55-0.65) still touched it.
//  2. new 'tuck' delta + track, 1 while sitting tall and through the hinge, 0 in the deep fold: palm 15 mm back and ~10 mm further
//     out, fingers turned 25 deg outward about the palm normal (away from the midline), elbow pole brought in and back so the
//     forearm turns with the hand (wrist deviation stays ~5 deg instead of 36-42 deg with the fingers turned alone). The right palm
//     sits 0.7 mm lower than the mirror: that side's shoe mesh is ~0.8 mm higher (same asymmetry the base pelvis roll evens out).
//     Measured (audit pair, signed nearest mesh distance, stride 2): no intersection on any frame.
//     The tuck must still be on at open ~0.6 (f40-f65 / f165-f195), so it fades out f57-f78 and back in f150-f177; f75-f155 of the
//     fold are bf2e exactly, f50-f75 / f155-f180 differ from bf2e by the fading tuck (still 3-8 mm).
import base from './s-butterfly-lfx1.js';
const s = structuredClone(base);
s.id = 's-butterfly-lfx2';
s.revisionOf = 's-butterfly-lfx1';
const H = s.pose.base.hands, O = s.pose.deltas.open.hands;
const mir = v => [-v[0], v[1], v[2]];
// 1. bf2e palm heights (lfx1 palmAt (0.06, 0.114, 0.40) + offsets)
H.left.palmAt = [0.084, 0.138, 0.40]; H.right.palmAt = mir(H.left.palmAt);
O.left.palmAt = [0.068, 0.129, 0.40]; O.right.palmAt = mir(O.left.palmAt);
// 2. tuck
s.timeline = { ...s.timeline, tracks: { ...s.timeline.tracks, tuck: [[0, 1], [1.9, 1], [2.6, 0], [5.0, 0], [5.9, 1]] } };
const TL = { palmAt: [0.095, 0.139, 0.385], finger: [-0.046, -0.3916, 0.9196], pole: [0.2, 0.6, -0.3] };
s.pose.deltas.tuck = { hands: {
  left: TL,
  right: { palmAt: [-0.095, 0.1383, 0.385], finger: mir(TL.finger), pole: mir(TL.pole) },
} };
export default s;
