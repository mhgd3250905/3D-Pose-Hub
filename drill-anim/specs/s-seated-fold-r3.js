// Portable migration of accepted HipLab 2026-10-17 media; original spec stays frozen.
// HipLab contact-path revision r3; source/r1/r2 and original QA are frozen.
// r2's 12 mm medial slide fixed the original f31/f197 hem gap (1.40/1.39
// mm) but keeping that offset over the whole slide caused a right-hand
// signed-gap regression at f34. Keep the original path except for a smooth
// 12 mm medial detour while the left palm crosses the shorts hem. It has
// returned to the original path by f33 and before f199 on the return.
// Body/legs, right hand, rhythm/camera, contact solver and QA are unchanged.
import source from './s-seated-fold.js';

const pose = structuredClone(source.pose);
pose.deltas.hem = {
  hands: { left: { palmAt: [0.098, 0.198, 0.29] } },
};
const timeline = structuredClone(source.timeline);
timeline.tracks.hem = [
  [0, 0], [0.95, 0], [31 / 30, 1], [1.1, 0],
  [6.5, 0], [197 / 30, 1], [6.65, 0], [8, 0],
];
export default { ...source, fps: 30, modelProfile: 'training-human-v2', alignClavicles: false, timeline, pose };
