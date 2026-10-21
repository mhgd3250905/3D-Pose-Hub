// action-package@2 pilot: retains the accepted r2 foot orientation on the new human.
import base from './s-frog-r2.js';
// Complete new hand/finger surface clears the actual mat top Y=0 by 0.5 mm.
// Retain the original free/relaxed hand pose and fixed forearm/knee anchors.
const palmHeight = { left: 0.017849744309884938, right: 0.017850078283104434 };
const planted = side => {
  const h = base.pose.base.hands[side];
  return { ...h, palmAt: [h.palmAt[0], palmHeight[side], h.palmAt[2]] };
};
export default { ...base, id: 's-frog-r3', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  pose: { ...base.pose, base: { ...base.pose.base, hands: { left: planted('left'), right: planted('right') } } },
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' } };
