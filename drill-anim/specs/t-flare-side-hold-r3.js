// t-flare-side-hold-r3: current-body candidate derived from the fixed main source below.
// Right-side support and left-side mirror remain separate demonstrations; both require native palm/sole close-up review.
// Source motion and QA remain unchanged except the explicitly documented planche hold repair.
import source, {leftSide as sourceLeft} from './t-flare-side-hold.js';

function prepare(original, id, dir) {
  const spec = structuredClone(original);
  spec.id = id;
  spec.fps = 30;
  spec.size = 1080;
  spec.modelProfile = 'training-human-v2plus-hands-native';
  spec.nativeHands = {version: '1.0.0-r3'};
  spec.v2plus = {outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'};
  spec.runtimeModel = {profile: 'training-human-v3-contact', version: '0.1.0-r5'};
  spec.alignClavicles = false;
  spec.camera = {...original.camera, dir: dir, fitTimeline: true,
    drift: 0, orbitDegrees: 0, frontSweepDegrees: 0, pad: Math.max(original.camera.pad ?? 0.1, 0.18)};
  spec.shadow = {joints: [], blobs: [], bands: []};
  spec.actionCompletionV3 = {
    family: 't-flare-side-hold', sourceCommit: '56a479df170ec53d124ebc12fae7e77b7928a64a',
    sourceSpec: 'drill-anim/specs/t-flare-side-hold.js',
    status: 'source-prepared-awaiting-preview', reviewed: false, releaseEligible: false,
    cameraPolicy: 'one full-cycle fit at setup; no drift, orbit or front sweep',
    reviewNote: "Right-side support and left-side mirror remain separate demonstrations; both require native palm/sole close-up review.",
  };
  return spec;
}
const spec = prepare(source, 't-flare-side-hold-r3', [0.2,0.2,1]);
export const leftSide = prepare(sourceLeft, 't-flare-side-hold-r3-left', [-0.20, 0.20, 1]);
export default spec;

