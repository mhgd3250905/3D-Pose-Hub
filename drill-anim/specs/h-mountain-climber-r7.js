// Explicit opt-in candidate. Requires mountain-airborne-foot-r1 before sampling.
// Retains r6 floor supports, ankle trajectory, knee drive, hands and solver unchanged.
import previous from './h-mountain-climber-r6.js';
const spec=structuredClone(previous);
spec.id='h-mountain-climber-r7';
spec.actionCorrective={id:'mountain-airborne-foot-r1',version:'0.1.0-r1',required:true};
spec.qaStatus='candidate-pending-real-engine-cpu-and-gpu';
spec.reviewed=false;spec.releaseEligible=false;
export default spec;
