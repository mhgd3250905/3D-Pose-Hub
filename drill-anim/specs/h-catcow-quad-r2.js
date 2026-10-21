// action-package@2 pilot: new human production revision; original motion is retained.
import base from './h-catcow-quad.js';
// Preserve WRIST x/z and locked support, using the height-aware ground resolver.
// Its legacy name "fingertips" does not select the hand mesh pose: the explicit
// palm-floor pose below is flat. All new finger vertices clear the Y=0 mat by 0.5 mm.
const clearance = { left: 0.01693780349613076, right: 0.01693820744751578 };
const planted = side => {
  const h = base.pose.base.hands[side];
  return { ...h, mode: 'fingertips', floor: 0, clear: clearance[side],
    finger: [h.finger[0], 0, h.finger[1]], normal: [0, -1, 0], relax: 0 };
};
// Compensate the new wrist-surface height without moving the fixed knee/foot anchors.
// The old 0.5157 m shoulder target would fold the elbows to ~150 degrees.
const constraints = base.pose.base.constraints.map(c => c.type === 'joint' &&
  c.joint === 'shoulderCenter' && c.axis[1] === 1 ? { ...c, value: 0.5266380467243577 } : c);
export default { ...base, id: 'h-catcow-quad-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  pose: { ...base.pose, base: { ...base.pose.base, constraints,
    hands: { left: planted('left'), right: planted('right') } } },
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic',
    handPose: { left: 'palm-floor', right: 'palm-floor' } } };
