import previous from './h-db-overhead-triceps-extension-rr3.js';
import {createRequire} from 'node:module';
const orientation=createRequire(import.meta.url)('../models/overhead-native-r2/neutral-orientation.json');
const s=structuredClone(previous);
s.id='h-db-overhead-triceps-extension-rr4';
s.overheadNative={version:'1.0.0-r2'};
// A neutral wrist follows the actual forearm, including its axial rotation.
// Every wrist position, fixed elbow arc, body/leg track and prop size is kept.
for(const row of orientation.rows){
 const i=row.frame;
 for(let axis=0;axis<3;axis++){
  s.timeline.tracks['k'+(3+axis)][i][1]=row.right.finger[axis];
  s.timeline.tracks['k'+(6+axis)][i][1]=row.right.normal[axis];
 }
}
s.pose.base.hands.left.finger=[0,0,0];
s.pose.base.hands.left.normal=[0,0,0];
for(const [kind,prefix]of [['finger','lf'],['normal','ln']])for(let axis=0;axis<3;axis++){
 const key=prefix+axis,delta=Array.from({length:axis+1},()=>({}));delta[axis]=1;
 s.pose.deltas[key]={hands:{left:{[kind]:delta}}};
 s.timeline.tracks[key]=orientation.rows.map(row=>[row.frame/30,row.left[kind][axis],'linear']);
}
export default s;
