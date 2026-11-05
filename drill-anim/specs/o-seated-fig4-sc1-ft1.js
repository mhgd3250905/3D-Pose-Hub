// o-seated-fig4-sc1-ft1: crossed (right) foot orientation fix of o-seated-fig4-sc1 (pose-fix r3, 2026-11-05). User: the crossed
// leg's foot pointed the wrong way. Before: feet.right.rot [[Y,80],[Z,-10]] laid the shoe sole-down with the toes along the shin
// (+X) = ~90 deg plantar flexion + ~90 deg inversion relative to the shin. After: ankle ~neutral relative to the real solved shin
// (knee -> ankle), lateral malleolus resting on the left thigh: toes forward and slightly up/outward, sole facing the outer side
// (+X) and a little up, like a real figure-4 sit. Built with /workspace/work/pose-fix-r3/design.mjs (shin roll 15, relaxed plantar
// flexion 20, eversion 8 deg; eversion 20 put the heel 19 mm into the left hand). Only the right foot rotation changes: ankle position, arms (sc1 hand offsets), trunk, left leg,
// timing and camera are the source's.
import base from './o-seated-fig4-sc1.js';
const s = structuredClone(base);
s.id = 'o-seated-fig4-sc1-ft1';
s.pose.base.feet.right.rot = [[[-0.0596, 0.1773, 0.9823], 90.6375]];
export default s;
