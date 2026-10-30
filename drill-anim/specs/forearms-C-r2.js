// forearms-C r2: same bottoms-up carry, kettlebell held by the native grasp-32mm closed fist (the cylinder grip) on a kettlebell whose grip
// section is a straight 32 mm cylinder (bell profile from CC0 TheBaseMesh kettlebell-01). Replaces the baked gripHand fist + kbBottomsUp placeholder.
// Bell sits distal of the fist, so with the forearm vertical and knuckles up it stands upside-down above the hand.
import prior from './forearms-C.js';
const spec = structuredClone(prior);
spec.id = 'forearms-C-r2';
spec.props = [{ type: 'kettlebell', attach: 'rightHand', fixedKettlebellGrasp: 'grasp-32mm', model: 'straight-grip-kettlebell-r1' }];
spec.modelProfile = 'training-human-v2plus-hands-native';
spec.runtimeModel = { profile: 'training-human-v3-armfix', version: '0.1.0-r2' };
spec.nativeHands = { twistShare: 1 };
spec.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic', handPose: { left: 'relaxed', right: 'grasp-32mm' } };
spec.reviewed = false; spec.releaseEligible = false; spec.qaStatus = 'candidate-awaiting-user-review';
export default spec;
