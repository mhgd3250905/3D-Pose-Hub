// Static V hold: solve root analytically once instead of warm-start drift along arm-reach arc.
import source from './t-vsit-r4.js';
const spec=structuredClone(source);
spec.id='t-vsit-r5';
const upper=.2567805323,forearm=.2280465039,dx=.235-.1879072;
const reach=Math.sqrt(upper*upper+forearm*forearm-2*upper*forearm*Math.cos(178*Math.PI/180));
const wristY=(.02799060380588472+.028446361967827082)/2;
// Current armfix pose shoulder-minus-pelvis, including authored shoulder depression.
const shoulderOffset=[0,.3345017020661696,-.09181468907548923];
spec.pose.base.pelvis=[0,wristY+Math.sqrt(reach*reach-dx*dx)-shoulderOffset[1],-.025-shoulderOffset[2]];
spec.pose.base.solve={vars:[],reg:{},iters:1};
spec.templateAdaptation={...spec.templateAdaptation,source:'t-vsit-r4.js',rootMethod:'Closed-form arm reach with fixed current-pose shoulder offsets and actual fixed-support wrist heights; no per-frame warm translation solve.',reviewed:false,releaseEligible:false};
export default spec;
