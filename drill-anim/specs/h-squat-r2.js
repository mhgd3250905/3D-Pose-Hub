// action-package@2 production b001: new human wrapper; source motion, timing, props and camera are retained.
// Contact and visual approval are pending; do not calibrate the original source in place.
import base from './h-squat.js';
export default { ...base, id: 'h-squat-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' } };
