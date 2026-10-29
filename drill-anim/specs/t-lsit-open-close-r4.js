// t-lsit-open-close-r4: current-body candidate derived from the fixed main source below.
// Preserve the centred elevated front view selected in main r2; floor palm reach and knee/hand clearance remain unreviewed.
// Source motion and QA remain unchanged except the explicitly documented planche hold repair.
import source from './t-lsit-open-close-r2.js';

const spec = structuredClone(source);
spec.id = 't-lsit-open-close-r4';
spec.fps = 30;
spec.size = 1080;
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.nativeHands = {version: '1.0.0-r3'};
spec.v2plus = {outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'};
spec.runtimeModel = {profile: 'training-human-v3-contact', version: '0.1.0-r5'};
spec.alignClavicles = false;
spec.camera = {...source.camera, dir: [0,0.42,0.91], fitTimeline: true,
  drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, pad: Math.max(source.camera.pad ?? 0.1, 0.18)};
spec.shadow = {joints: [], blobs: [], bands: []};
spec.actionCompletionV3 = {
  family: 't-lsit-open-close', sourceCommit: '56a479df170ec53d124ebc12fae7e77b7928a64a',
  sourceSpec: 'drill-anim/specs/t-lsit-open-close-r2.js',
  status: 'source-prepared-awaiting-preview', reviewed: false, releaseEligible: false,
  cameraPolicy: 'one full-cycle fit at setup; no drift, orbit or front sweep',
  reviewNote: "Preserve the centred elevated front view selected in main r2; floor palm reach and knee/hand clearance remain unreviewed.",
};
export default spec;

