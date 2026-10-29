// r8: current-body knee-floor clearance candidate; historical r7 stays unchanged.
import previous from './h-mountain-climber-r7.js';
const spec=structuredClone(previous);
// Numeric timeline deltas are absolute values. Shift every existing value at the
// same path so the original 15mm pelvis modulation and timing remain unchanged.
function offsetPoseNumber(keys,delta){
  for(const root of [spec.pose.base,...Object.values(spec.pose.deltas)]){
    let node=root;for(const key of keys.slice(0,-1))node=node?.[key];
    const last=keys.at(-1);if(node&&typeof node[last]==='number')node[last]+=delta;
  }
}
offsetPoseNumber(['pelvis',1],.04);
const heightConstraint=spec.pose.base.constraints.findIndex(c=>c.type==='joint'&&c.joint==='pelvis'&&c.axis?.[1]===1);
if(heightConstraint<0)throw Error('Missing original mountain pelvis-height constraint');
offsetPoseNumber(['constraints',heightConstraint,'value'],.04);
spec.pose.base.constraints[heightConstraint].weight=.5;
spec.id='h-mountain-climber-r8';
spec.actionCorrective={id:'mountain-airborne-foot-r2',version:'0.1.0-r2',required:true};
spec.templateAdaptation={status:'cpu-cleared-knee-surface-awaiting-gpu',source:'h-mountain-climber-r7.js',changes:['Pelvis base and height target +40mm; original 15mm modulation preserved','Height soft-constraint weight 0.05 to0.5','Foot drive, knee pole, support anchors, hand anchors, 8-second timing and QA unchanged','Retain airborne shin-follow foot orientation via independent r2 adapter'],requiredVisualChecks:['Whole-cycle knee and clothing surface remains above floor','No conspicuous pike: CPU sagittal hip line bends up to7.60deg versus original1.01deg','Both hands and support foot remain planted; knee drive stays recognizably slow mountain climber'],reviewed:false,releaseEligible:false};
spec.qaStatus='candidate-pending-knee-clearance-and-no-pike-gpu-review';
spec.reviewed=false;spec.releaseEligible=false;
export default spec;
