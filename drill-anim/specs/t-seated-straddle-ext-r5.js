// Keep the supported torso fixed while the knees extend; do not warm-drift along the arm arc.
import source from './t-seated-straddle-ext-r4.js';
const spec=structuredClone(source);
spec.id='t-seated-straddle-ext-r5';
const upper=.2567805323,forearm=.2280465039,dx=.15-.1879072;
const reach=Math.sqrt(upper*upper+forearm*forearm-2*upper*forearm*Math.cos(177.5*Math.PI/180));
const wristY=(.02799060380588472+.028446361967827082)/2;
const shoulderOffset=[0,.3318523375778411,.18889052912315302];
spec.pose.base.pelvis=[0,wristY+Math.sqrt(reach*reach-dx*dx)-shoulderOffset[1],.32-shoulderOffset[2]];
spec.pose.base.solve={vars:[],reg:{},iters:1};
spec.templateAdaptation={...spec.templateAdaptation,source:'t-seated-straddle-ext-r4.js',rootMethod:'Analytical fixed torso root from current shoulder offsets, fixed-support wrist heights and177.5degree arm reach; leg curves remain active.',reviewed:false,releaseEligible:false};
export default spec;
