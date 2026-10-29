// t-straddle-hold-r3: current-body candidate derived from the fixed main source below.
// Keep the authored lift/hold/sit-down timeline; overlap with t-lsit-wide and prior 40-frame warnings remain open.
// Source motion and QA remain unchanged except the explicitly documented planche hold repair.
import source from './t-straddle-hold.js';

const spec = structuredClone(source);
spec.id = 't-straddle-hold-r3';
spec.fps = 30;
spec.size = 1080;
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.nativeHands = {version: '1.0.0-r3'};
spec.v2plus = {outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'};
spec.runtimeModel = {profile: 'training-human-v3-contact', version: '0.1.0-r5'};
spec.alignClavicles = false;
spec.camera = {...source.camera, dir: [0.3,0.2,1], fitTimeline: true,
  drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, pad: Math.max(source.camera.pad ?? 0.1, 0.18)};
spec.shadow = {joints: [], blobs: [], bands: []};
spec.actionCompletionV3 = {
  family: 't-straddle-hold', sourceCommit: '56a479df170ec53d124ebc12fae7e77b7928a64a',
  sourceSpec: 'drill-anim/specs/t-straddle-hold.js',
  status: 'source-prepared-awaiting-preview', reviewed: false, releaseEligible: false,
  cameraPolicy: 'one full-cycle fit at setup; no drift, orbit or front sweep',
  reviewNote: "Keep the authored lift/hold/sit-down timeline; overlap with t-lsit-wide and prior 40-frame warnings remain open.",
};
export default spec;

