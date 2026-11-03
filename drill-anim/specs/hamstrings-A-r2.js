// action-package@2 production b002: new human wrapper; source motion, timing, props and camera are retained.
// Contact and visual approval are pending; do not calibrate the original source in place.
import base from './hamstrings-A.js';
export default {
  ...base, id: 'hamstrings-A-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
};
