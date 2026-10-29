// PR23 gap candidate on the explicit r7/r5 runtime. Original source remains unchanged.
// Motion, timing, props and QA are inherited; no content/GPU acceptance is implied.
import source from './h-db-zottman-curl.js';

export default {
  ...source,
  id: 'h-db-zottman-curl-r2',
  revisionOf: 'h-db-zottman-curl',
  sourceBatch: 'action-completion-v3-gap-20261028-r1',
  modelProfile: 'training-human-v2plus-hands-native',
  alignClavicles: false,
  nativeHands: {version: '1.0.0-r3'},
  v2plus: {...source.v2plus, outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'},
  runtimeModel: {profile: 'training-human-v3-contact', version: '0.1.0-r5'},
  camera: {
    ...source.camera,
    fit: [...new Set([...source.camera.fit, 'head', 'pelvis', 'leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'leftKnee', 'rightKnee', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'])],
    fitTimeline: true,
    drift: 0,
    orbitDegrees: 0,
    frontSweepDegrees: 0,
  },
  reviewed: false,
  releaseEligible: false,
};
