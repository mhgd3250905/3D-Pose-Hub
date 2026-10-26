// native-open-r2 palm-floor demo (preview only; not a catalog action, not registered in specs/).
// Body/timeline of h-kneeling-pushup-rr1, moved onto the native hand profile with both hands as true floor
// supports (mode:'floor') instead of the rr1 fingertip work-around, so the palm contact itself is what is checked.
import base from '../../../specs/h-kneeling-pushup-rr1.js';
const s = structuredClone(base);
const floorHand = (h, z) => ({mode: 'floor', at: [h.at[0], z], finger: [h.finger[0], h.finger[2] ?? 0], relax: 0, poleUp: h.poleUp});
s.pose.base.hands.left = floorHand(base.pose.base.hands.left, base.pose.base.hands.left.at[1]);
s.pose.base.hands.right = floorHand(base.pose.base.hands.right, base.pose.base.hands.right.at[1]);
for (const d of Object.values(s.pose.deltas || {})) if (d.hands) throw Error('palm-floor-demo: unexpected hand deltas');
s.id = 'native-open-r2-palm-floor-demo';
s.modelProfile = 'training-human-v2plus-hands-native';
s.nativeHands = {version: '1.0.0-r3'};
s.nativeOpen = {entry: 'native-open-r2'};
delete s.v2plus.handPose;            // floor hands pick 'palm-floor' themselves
export default s;
