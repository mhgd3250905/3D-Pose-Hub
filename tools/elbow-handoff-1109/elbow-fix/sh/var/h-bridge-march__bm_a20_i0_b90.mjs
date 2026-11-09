import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/h-bridge-march-et1.js';
import {fixSide,rollHand} from 'file:///workspace/work/elbow-fix/sh/xf.mjs';
const s=structuredClone(b);
s.id='h-bridge-march-arms';
for (const [side,sg] of [['left',-1],['right',1]]){const h=s.pose.base.hands[side];
  h.mode='floor';h.at=[0.033,sg*0.348];h.finger=[1,sg*0.364];h.poleUp=[0,-1,sg*0.3];delete h.elbowTwist;delete h.upperArmTwist;}
fixSide(s,'left',0,90,0);fixSide(s,'right',0,-90,0);
export default s;
