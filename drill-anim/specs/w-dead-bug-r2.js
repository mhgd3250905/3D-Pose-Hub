// action-package@2 pilot: new human production revision; original motion is retained.
import base from './w-dead-bug.js';
export default { ...base, id: 'w-dead-bug-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' } };
