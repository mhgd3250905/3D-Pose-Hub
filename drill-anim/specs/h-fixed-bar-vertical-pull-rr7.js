import previous from '../../docs/diagnostics/122/attempt-2.mjs';
import {nativeGripPose} from '../models/grip-native-r1/pose.mjs';
const s=structuredClone(previous);
s.id='h-fixed-bar-vertical-pull-rr7';
s.modelProfile='training-human-v2plus-native-grip';
s.nativeGrip={version:'1.0.0-r1'};
for(const [side,sign]of [['left',1],['right',-1]]){
 Object.assign(s.pose.base.hands[side],nativeGripPose(side,[sign*.31,2.15,.02],[-sign,0,0],[0,0,-1]));
}
export default s;
