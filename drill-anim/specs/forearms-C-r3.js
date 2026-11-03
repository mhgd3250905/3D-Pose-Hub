// forearms-C r3: same bottoms-up carry, kettlebell held by the frozen user-accepted webxr-dumbbell-wrist-r1 fist (the dumbbell grasp),
// dumbbells hidden. The recipe's fixedKettlebell puts the straight 32 mm grip of straight-grip-kettlebell-r1 on that fist's shaft axis.
// The two source dumbbells only satisfy the accepted two-hand wrist installer; they are removed and never drawn.
import prior from './forearms-C-r2.js';
const spec = structuredClone(prior);
spec.id = 'forearms-C-r3';
spec.props = [{ type: 'dumbbell', attach: 'leftHand' }, { type: 'dumbbell', attach: 'rightHand' }];
spec.modelProfile = 'training-human-v2plus';
delete spec.nativeHands;
spec.v2plus = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
spec.reviewed = false; spec.releaseEligible = false; spec.qaStatus = 'candidate-awaiting-user-review';
export default spec;
