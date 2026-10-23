import previous from './h-bent-knee-calf-raise-rr6.js';
const s=structuredClone(previous);
s.id='h-bent-knee-calf-raise-rr7';
s.nativeHands={version:'1.0.0-r3'};
// Let the free hand follow the forearm slightly, retaining its palm target.
for(const [side,hand] of Object.entries(s.pose.base.hands))
  hand.finger=[side==='left'?-.12:.12,-.95,.34];
export default s;
