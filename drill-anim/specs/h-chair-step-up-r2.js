// action-package@2 pilot: new human production revision; original motion is retained.
import base from './h-chair-step-up.js';
export default { ...base, id: 'h-chair-step-up-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' } };
