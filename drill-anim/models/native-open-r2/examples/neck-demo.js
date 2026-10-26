// native-open-r2 neck-channel demo (preview only; not a catalog action, not registered in specs/).
// Standing body of h-bent-knee-calf-raise-rr7 held at its first pose; the neck runs flexion -> extension ->
// side bend left/right -> rotation left/right, one channel at a time, so each channel can be checked alone.
import base from '../../../specs/h-bent-knee-calf-raise-rr7.js';
const zero=Object.fromEntries(Object.entries(base.timeline.tracks).map(([k,v])=>[k,[[0,v[0][1],'linear']]]));
const ch=(peaks)=>[[0,0,'cos'],...peaks.map(([t,v])=>[t,v,'cos'])];
export default {
  ...base,
  id: 'native-open-r2-neck-demo',
  name: '颈部三通道演示',
  nameEn: 'Neck channel demo (native-open-r2)',
  nativeOpen: {entry: 'native-open-r2'},
  // degrees: flex>0 chin to chest, side>0 ear toward the body's left, rot>0 face turns to the body's left
  neck: {flex: 'neckFlex', side: 'neckSide', rot: 'neckRot'},
  timeline: {duration: 8, tracks: {...zero,
    neckFlex: ch([[1, 35], [2, 0], [2.6, -25], [3.2, 0]]),
    neckSide: ch([[3.2, 0], [4, 30], [4.8, 0], [5.4, -30], [6, 0]]),
    neckRot:  ch([[6, 0], [6.6, 50], [7.2, 0], [7.6, -50], [7.95, 0]])}},
  camera: {...base.camera, dir: [-0.55, 0.12, 1], at: 0, fitTimeline: false},
  keyFrames: [0, 1, 2.6, 4, 5.4, 6.6, 7.6],
};
