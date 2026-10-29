// r5 raises tucked feet 60 mm and reduces pointing for unambiguous floor clearance.
// Actual eight-second airborne tuck-planche hold. Historical grounded export remains intact.
import {floorDrill,qaStd} from './_thomas-armfix-r1.mjs';
const T=8;
const spec=floorDrill({
  id:'t-tuck-planche-r5',name:'团身俄挺',nameEn:'Tuck Planche',T,
  hands:{left:[.20,0,[.75,.66]],right:[-.20,0,[-.75,.66]]},
  poleUp:sg=>[sg*.6,.2,-1],
  fn:()=>({pitch:70,waist:0,py:.36,pw:.05,pz:-.30,pzw:.05,shift:.04,elbow:178,
    legs:{left:{rel:[.08,-.14,-.08],pf:25,kneeUp:[0,-.6,1]},right:{rel:[-.08,-.14,-.08],pf:25,kneeUp:[0,-.6,1]}}}),
  solve:{vars:['py','pz'],reg:{py:.1,pz:.05},iters:80},
  extra:()=>({'constraints.0.weight':20,'constraints.1.weight':20}),
  tags:{up:()=>1},
  highlight:{groups:['deltoids','serratus'],side:'both',pulseTrack:'up',pulseBase:.3},
  camera:{dir:[1,.18,.25],fit:['head','leftPalm','rightPalm','leftToe','rightToe','pelvis','leftKnee','rightKnee'],pad:.22,k:1,drift:0,orbitDegrees:0,frontSweepDegrees:0,at:4,fitTimeline:true},
  keyFrames:[0,2,4,6],
  qa:qaStd({straightLegs:[],straightArms:[{j:'elbow.right',min:176},{j:'elbow.left',min:176}],more:{hipFlexMax:150},allow:['torso|thighL','torso|thighR']}),
});
spec.fps=30;spec.size=1080;
spec.modelProfile='training-human-v2plus-hands-native';
spec.runtimeModel={profile:'training-human-v3-armfix',version:'0.1.0-r2'};
spec.nativeHands={twistShare:1};
spec.v2plus={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'};
spec.alignClavicles=false;spec.breath=0;
spec.shadow={joints:[],blobs:[],bands:[]};
spec.templateAdaptation={status:'semantic-hold-repair-awaiting-gpu-review',source:'t-tuck-planche.js',changes:['Held raised phase rather than frozen grounded end frame','Current-body leg pivots and lengths','Both arms target 178 degrees','No foot-floor pin in airborne hold'],requiredVisualChecks:['Both toes and feet remain clearly off floor throughout','Hands alone support body; knees tucked under trunk','Shoulders forward of palms; no wrist reversal'],reviewed:false,releaseEligible:false};
export default spec;
