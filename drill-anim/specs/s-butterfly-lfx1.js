// s-butterfly-lfx1 (legacy-fix r1 batch 5, 2026-11-21, codex/legacy-fix-r1): built on s-butterfly-r2 (unchanged file; motion from
// s-butterfly.js, unchanged).
// 开哥 (b4 sample review): both palms pressed flat on the lower shins, wrist dorsiflexed 82-113 deg and ulnar/radial deviated
// 40-60 deg, forearms near vertical = "pressing the legs"; the text says cue3「两手握住脚」and lists「用手硬压膝盖」as an error.
// V5 hands are one rigid open-hand mesh (no finger bones), so a real grip is not possible without a runtime change (out of scope).
// "Doable" version (hark-sk 2026-11-21): each open palm rests on top of its own foot (fingers forward toward the toes, thumb on the
// sole side between the feet), wrist near neutral, forearm along the shin, elbow slightly bent and resting above the inner thigh
// (not on the knee). Only the two hand targets change:
//  - palmAt world-fixed at (+-0.06, 0.114, 0.40) = over the forefoot/instep of each foot (the feet never move, so the hands cannot
//    slide through the fold). Reach limit: with the trunk tall (t = 0) the shoulder is 0.56 m from the toes' ball and the arm is
//    0.49 m to the wrist, so the palm sits just in front of the ankle with the fingers over the forefoot; further forward the arm
//    locks straight. Height set so the hand-foot gap stays 0-10 mm through the fold (measured, engine handClip).
//  - the 'touch' solve is dropped: with the palm 0-10 mm above the foot it is not needed, and its bisect step slid the palm 6-11 mm.
//  - finger / palm normal follow the forearm (base = trunk tall, 'open' delta = full fold) turned ~12 deg toward the toe line, so the
//    wrist stays within 20 deg extension / 15 deg deviation; elbow pole out and slightly back (elbow over the inner thigh).
// Body, legs, pelvis/hips/chest tracks, timing, props and camera are r2's.
import base from './s-butterfly-r2.js';
const s = structuredClone(base);
s.id = 's-butterfly-lfx1';
s.revisionOf = 's-butterfly-r2';
const H = s.pose.base.hands;
const mir = v => [-v[0], v[1], v[2]];
const L0 = { palmAt: [0.06, 0.114, 0.40], finger: [-0.454, -0.432, 0.78], normal: [0.217, -0.902, -0.373], pole: [0.7, 0.5, -0.1] };
const L1 = { finger: [-0.718, -0.122, 0.685], normal: [0.088, -0.993, -0.084] };
H.left = { ...H.left, ...L0 };
H.right = { ...H.right, palmAt: mir(L0.palmAt), finger: mir(L0.finger), normal: mir(L0.normal), pole: mir(L0.pole) };
delete H.left.touch; delete H.right.touch;
s.pose.deltas.open = { ...s.pose.deltas.open, hands: { left: { ...L1 }, right: { finger: mir(L1.finger), normal: mir(L1.normal) } } };
// hub QA: the hands now rest 0-10 mm above the feet (no touch solve), so the per-side touch gap limit is 10 mm (was 1 mm on the shins)
s.qa = { ...s.qa, touch: [{ side: 'left', max_gap: 10.0 }, { side: 'right', max_gap: 10.0 }] };
export default s;
