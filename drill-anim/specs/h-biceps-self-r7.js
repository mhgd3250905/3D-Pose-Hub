// Action-owned thumb extension for palm/forearm contact. r5/r6 and shared presets remain frozen.
import previous from './h-biceps-self-r6.js';
const spec=structuredClone(previous);
spec.id='h-biceps-self-r7';
spec.revisionOf='h-biceps-self-r6';
spec.actionCorrective={
  id:'native-action-hand-pose-r1',version:'0.1.0-r1',required:true,specId:spec.id,
  basePoses:{left:'open'},
  // Local native thumb flexion axis, -22 degrees at CMC; distal joints extend to rest.
  // This changes only this action's left thumb, not hand scale, mesh or the right hand.
  poses:{left:{thumb1:[-0.1049098158515736,0,0.1593800591498046,0.981627183447664],thumb2:[0,0,0,1],thumb3:[0,0,0,1]}}
};
spec.reviewed=false;spec.releaseEligible=false;
export default spec;
