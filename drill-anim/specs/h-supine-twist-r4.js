// action-package@2 production b003: inherit the explicitly selected historical motion revision.
// New-human contact, geometry, source and visual acceptance remain pending; source anchors are retained.
import base from './h-supine-twist-r3.js';
export default {
  ...base, id: 'h-supine-twist-r4', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
};
