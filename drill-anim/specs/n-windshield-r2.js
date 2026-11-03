// action-package@2 b004 candidate. Motion, solver, anchors, props and selected camera inherited unchanged.
// New-model contact/visual/source acceptance remains pending; this is not a render approval.
import base from './n-windshield.js';
export default {
  ...base, id: 'n-windshield-r2', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
};
