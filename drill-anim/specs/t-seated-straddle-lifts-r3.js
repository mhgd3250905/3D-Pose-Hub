// t-seated-straddle-lifts-r3: current-body candidate derived from the fixed main source below.
// Keep the four two-second lifts and seated support; prior 24-frame solver warning report remains pending new-model review.
// Keep the authored leg/hip timeline and QA; repair the conflicting arm-reach target below.
import source from './t-seated-straddle-lifts.js';

const spec = structuredClone(source);
spec.id = 't-seated-straddle-lifts-r3';
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
// The source requested 170-degree arms while its unchanged QA requires >=176.
// Request 178 instead; reach and actual joint straightness remain GPU-review gates.
for (const constraint of spec.pose.base.constraints) {
  if (constraint.type === 'reach' && ['leftArm', 'rightArm'].includes(constraint.limb)) constraint.angle = 178;
}
spec.actionCompletionV3 = {
  family: 't-seated-straddle-lifts', sourceCommit: '56a479df170ec53d124ebc12fae7e77b7928a64a',
  sourceSpec: 'drill-anim/specs/t-seated-straddle-lifts.js',
  status: 'source-prepared-awaiting-preview', reviewed: false, releaseEligible: false,
  cameraPolicy: 'one full-cycle fit at setup; no drift, orbit or front sweep',
  reviewNote: "Keep the four two-second lifts and seated support; arm reach targets170->178 repair their mismatch with unchanged QA>=176. Prior 24-frame warnings and actual reach remain pending GPU review.",
};
export default spec;

