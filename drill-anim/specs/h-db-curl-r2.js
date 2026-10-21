// action-package@2 pilot: new human production revision; original motion is retained.
import base from './h-db-curl.js';
export default { ...base, id: 'h-db-curl-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' } };
