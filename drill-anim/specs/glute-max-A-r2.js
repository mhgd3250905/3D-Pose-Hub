// action-package@2 pilot: one anatomical side per loop; switch cue is at the loop boundary.
// A mirror asset is not generated. Source support side and timing remain unchanged.
// The new palm/finger mesh is calibrated to 0.5 mm above the actual mat top (Y=0).
// The existing height-aware resolver is named "fingertips" but keeps floor=true;
// the explicit palm-floor hand pose below makes this a flat-palm support.
// Preserve the old WRIST x/z (floor.at is not a palm target) and support lock.
import base from './glute-max-A.js';
const clearance = { left: 0.016937803496130735, right: 0.016938207447515723 };
const planted = side => {
  const h = base.pose.base.hands[side];
  return { ...h, mode: 'fingertips', floor: 0, clear: clearance[side],
    finger: [h.finger[0], 0, h.finger[1]], normal: [0, -1, 0], relax: 0 };
};
export default { ...base, id: 'glute-max-A-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  pose: { ...base.pose, base: { ...base.pose.base, hands: { left: planted('left'), right: planted('right') } } },
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic',
    handPose: { left: 'palm-floor', right: 'palm-floor' } } };
