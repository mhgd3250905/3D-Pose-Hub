// action-package@2 b004 candidate. Motion, solver, anchors, props and selected camera inherited unchanged.
// New-model contact/visual/source acceptance remains pending; this is not a render approval.
import base from './s-9090-r3.js';
export default {
  ...base, id: 's-9090-r4', modelProfile: 'training-human-v2plus',
  fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
};
