// t-tuck-planche-r3: current-body candidate derived from the fixed main source below.
// Eight-second static tuck-planche hold candidate derived from the exported historic final pose; 178-degree arm targets retain QA >=176. Reach and visual identity still require GPU review.
// Source motion and QA remain unchanged except the explicitly documented planche hold repair.
import source from './t-tuck-planche.js';

const spec = structuredClone(source);
spec.id = 't-tuck-planche-r3';
spec.fps = 30;
spec.size = 1080;
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.nativeHands = {version: '1.0.0-r3'};
spec.v2plus = {outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'};
spec.runtimeModel = {profile: 'training-human-v3-contact', version: '0.1.0-r5'};
spec.alignClavicles = false;
spec.camera = {...source.camera, dir: [1,0.18,0.15], fitTimeline: true,
  drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, pad: Math.max(source.camera.pad ?? 0.1, 0.18)};
spec.shadow = {joints: [], blobs: [], bands: []};
// The main export is a static 24-second restored pose, not its earlier private 8-second transition.
// Keep that exported pose; repair the requested arm-angle/QA conflict without relaxing QA.
spec.timeline = {duration: 8, tracks: structuredClone(source.timeline.tracks)};
for (const constraint of spec.pose.base.constraints) {
  if (constraint.type === 'reach' && ['leftArm', 'rightArm'].includes(constraint.limb)) constraint.angle = 178;
}
spec.keyFrames = [0, 2, 4, 6];
spec.stillAt = 4;
spec.camera.at = 4;
spec.restoration = {...source.restoration, cameraOnly: false, derivativeOf: 't-tuck-planche',
  sourceDurationSeconds: 24, sourceFrontSweepDegrees: 180,
  derivativeChanges: ['8-second static hold', '178-degree arm reach targets', 'fixed side camera']};
spec.actionCompletionV3 = {
  family: 't-tuck-planche', sourceCommit: '56a479df170ec53d124ebc12fae7e77b7928a64a',
  sourceSpec: 'drill-anim/specs/t-tuck-planche.js',
  status: 'source-prepared-awaiting-preview', reviewed: false, releaseEligible: false,
  cameraPolicy: 'one full-cycle fit at setup; no drift, orbit or front sweep',
  reviewNote: "Eight-second static tuck-planche hold candidate derived from the exported historic final pose; 178-degree arm targets retain QA >=176. Reach and visual identity still require GPU review.",
};
export default spec;

