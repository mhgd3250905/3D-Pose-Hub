const SIDES=['left','right'];
const POINTS=['wrist','elbowPole','ankle','kneePole'];
const ROTATIONS=['handQuaternion','footQuaternion'];
const TWISTS=['elbowTwist','kneeTwist','upperArmTwist','thighTwist'];

function values(value,length,label){
  if(!Array.isArray(value)||value.length!==length||value.some(number=>typeof number!=='number'||!Number.isFinite(number)))throw new Error(`${label}的数据不完整。`);
  return value;
}

// Reflection across the character's model-space sagittal plane, X=0.
// These quaternions are deformation deltas, so reflection is M R M;
// an axial quaternion vector transforms as (x,-y,-z), with w unchanged.
const mirrorPoint=value=>{const [x,y,z]=values(value,3,'位置');return [-x,y,z];};
const mirrorRotation=value=>{const [x,y,z,w]=values(value,4,'朝向');if(Math.hypot(x,y,z,w)<1e-12)throw new Error('朝向不能为零。');return [x,-y,-z,w];};

export const mirrorText=value=>String(value??'').replace(/[左右]/g,side=>side==='左'?'右':'左');

export function mirrorPose(pose){
  if(pose?.version!==1||typeof pose.groundLock!=='boolean')throw new Error('请选择有效的已保存姿势。');
  const limbs={};
  for(const side of SIDES){
    const source=pose.limbs?.[side==='left'?'right':'left'];
    if(!source||typeof source.handLocked!=='boolean')throw new Error('姿势缺少左右手的支撑状态。');
    limbs[side]={};
    for(const key of POINTS)limbs[side][key]=mirrorPoint(source[key]);
    for(const key of ROTATIONS)limbs[side][key]=mirrorRotation(source[key]);
    limbs[side].handLocked=source.handLocked;
    for(const key of TWISTS){
      if(Object.hasOwn(source,key)){
        if(typeof source[key]!=='number'||!Number.isFinite(source[key]))throw new Error('关节扭转角度必须为有限数值。');
        limbs[side][key]=-source[key];
      }
    }
  }
  const mirrored={version:1,pelvis:mirrorPoint(pose.pelvis),bodyQuaternion:mirrorRotation(pose.bodyQuaternion),limbs,groundLock:pose.groundLock};
  if(Object.hasOwn(pose,'torsoQuaternion'))mirrored.torsoQuaternion=mirrorRotation(pose.torsoQuaternion);
  if(Object.hasOwn(pose,'pelvisQuaternion'))mirrored.pelvisQuaternion=mirrorRotation(pose.pelvisQuaternion);
  return mirrored;
}

export function mirroredTemplate(template){
  if(!template)return null;
  const technique=template.technique;
  return {...template,name:mirrorText(template.name),summary:mirrorText(template.summary),viewDirection:template.viewDirection?.map((value,index)=>index===0?-value:value),technique:technique?{...technique,...Object.fromEntries(['hands','feet','body','cue'].map(key=>[key,mirrorText(technique[key])]))}:undefined};
}

export function mirrorContinuationSources(steps){
  if(!Array.isArray(steps)||steps.length<5)return [];
  // The rear double support (5) joins the two halves. Reversing the
  // mirrored half preserves the circle's original direction of travel.
  return [3,2,1,0].map(index=>({step:steps[index],number:index+1}));
}

export function mirroredStep(source,{id,createdAt,number}){
  return {id,name:mirrorText(source.name).slice(0,80),pose:mirrorPose(source.pose),sourcePreset:source.sourcePreset||null,mirrored:!source.mirrored,mirrorOf:source.id,mirrorSourceNumber:number,createdAt};
}
