// Explicit v3-contact candidate; preserve the imported source motion, timing, props and QA.
// Fixed camera prioritizes action readability. Visible contact, clipping and loop QA remain pending GPU review.
import previous from './h-pike-pushup.js';
const spec = structuredClone(previous);
spec.id = 'h-pike-pushup-r3';
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.nativeHands = {version: '1.0.0-r3'};
spec.v2plus = {outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'};
spec.alignClavicles = false;
spec.runtimeModel = {profile: 'training-human-v3-contact', version: '0.1.0-r5'};
spec.camera = {
  "dir": [
    -0.12,
    0.25,
    1
  ],
  "fit": [
    "head",
    "leftPalm",
    "rightPalm",
    "leftToe",
    "rightToe",
    "pelvis",
    "leftElbow",
    "rightElbow",
    "shoulderCenter",
    "leftKnee",
    "rightKnee"
  ],
  "pad": 0.14,
  "k": 0.8,
  "drift": 0,
  "at": 2.2,
  "fitTimeline": true,
  "orbitDegrees": 0,
  "frontSweepDegrees": 0
};
spec.reviewed = false;
spec.releaseEligible = false;
spec.qaStatus = 'pending-gpu-review';
export default spec;
