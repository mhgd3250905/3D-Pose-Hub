// Review candidate only. The independent profile retains the complete source
// mesh topology and native-r3 hands. No registration or production override.
export default {
 id:'h-kneeling-thread-needle-rr1',name:'跪姿低位穿针（小范围修订）',fps:30,
 modelProfile:'training-human-v2plus-threadneedle-native',
 threadneedleNative:{version:'1.0.0-r1'},nativeHands:{version:'1.0.0-r3'},
 v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',handPose:{left:'open',right:'open'}},
 breath:0,highlight:{groups:['scapular','deltoids','lats'],side:'left',pulseBase:.55},props:[],timeline:{duration:8,tracks:{}},
 camera:{dir:[.65,.55,1.25],fit:['pelvis','head','leftWrist','rightWrist','leftKnee','rightKnee'],at:3,pad:.10,fov:35,drift:0},
 reviewed:false,releaseEligible:false,
};
