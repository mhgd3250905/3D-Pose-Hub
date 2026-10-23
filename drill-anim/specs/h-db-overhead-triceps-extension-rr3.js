import previous from './h-db-overhead-triceps-extension-rr2.js';
import {createRequire} from 'node:module';
const fit=createRequire(import.meta.url)('../models/grip-native-r1/fit.json');
const s=structuredClone(previous);
s.id='h-db-overhead-triceps-extension-rr3';
s.modelProfile='training-human-v2plus-overhead-native';
s.overheadNative={version:'1.0.0-r1'};
// Retain every wrist target and elbow arc. Mirror the fitted left-hand rod
// frame into the right hand, where the dumbbell follows it rigidly.
const axis=fit.axis.map((x,i)=>i===0?-x:x);
const dumbbell=s.props.find(p=>p.type==='dumbbell');
dumbbell.offset=fit.center.map((x,i)=>i===0?-x:x);
dumbbell.rot=[[[0,-axis[2],axis[1]],Math.acos(axis[0])*180/Math.PI]];
export default s;
