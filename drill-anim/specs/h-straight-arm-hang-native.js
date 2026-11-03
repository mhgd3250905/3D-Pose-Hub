// Static isolation of known passive-hang mechanism, not a novel muscle mechanism.
import previous from './h-fixed-bar-vertical-pull-rr7.js';
const s=structuredClone(previous);s.id='h-straight-arm-hang-native';s.name='单杠直臂悬垂保持';s.nameEn='Fixed-Bar Straight-Arm Hang Hold';
s.timeline={duration:8,tracks:{}};s.pose.base.pelvis=[0,1.1317686873,-.075];s.pose.deltas={};
s.pose.base.constraints=[{type:'reach',limb:'leftArm',angle:178},{type:'reach',limb:'rightArm',angle:178}];s.pose.base.solve={vars:['py'],reg:{py:.02}};
s.highlight={groups:['lats','forearms'],side:'both',pulseBase:.35};s.camera={...s.camera,dir:[.15,.08,1],at:0,drift:0};s.stillAt=0;s.keyFrames=[0,8];
export default s;
