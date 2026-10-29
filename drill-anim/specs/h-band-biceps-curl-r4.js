// Native fixed power-grip for band ends; not a dumbbell asset substitution.
import source from './h-band-biceps-curl-r3.js';
const center=[.0769774574025722,-.023653730297674272,.026809497446246666];
export default {...source,id:'h-band-biceps-curl-r4',revisionOf:'h-band-biceps-curl-r3',
 v2plus:{...source.v2plus,handPose:{left:'grasp-32mm',right:'grasp-32mm'}},
 props:source.props.map(p=>p.type==='band'?{...p,from:{...p.from,offset:center.map((x,i)=>i===0&&p.from.bone==='rightHand'?-x:x)}}:p)};
