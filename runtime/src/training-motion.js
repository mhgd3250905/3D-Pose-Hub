import * as THREE from 'three';

/** Local control demonstrations on Snow's existing version 1 pose interface.
 * These clips are independent of the user's Flare keyframes and storage. */
export const TRAINING_CLIP_IDS = Object.freeze(['scapPush', 'supportShift', 'straddleLift', 'rearSupport', 'hipOpening']);

const SIDES = ['left', 'right'];
const UP = new THREE.Vector3(0, 1, 0);
const FLOOR = .006;
const vec = values => new THREE.Vector3().fromArray(values);
const rx = angle => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle);
const wrap = (time, period) => ((time % period) + period) % period / period;
const raised = phase => (1 - Math.cos(phase * Math.PI * 2)) / 2;

function alternating(phase) {
  const side = phase < .5 ? 'left' : 'right';
  return { side, lift: Math.sin((phase % .5) * Math.PI * 2) ** 2 };
}

function dimensions(rigData) {
  if (!rigData?.landmarks) throw new Error('训练示意需要 Snow 的原始关节点。');
  const rest = Object.fromEntries(Object.entries(rigData.landmarks).map(([key, value]) => {
    if (!Array.isArray(value) || value.length !== 3 || value.some(number => !Number.isFinite(number))) {
      throw new Error(`训练示意关节点 ${key} 无效。`);
    }
    return [key, vec(value)];
  }));
  for (const name of ['pelvis', 'torso', ...SIDES.flatMap(side => ['Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle'].map(joint => side + joint))]) {
    if (!rest[name]) throw new Error(`训练示意缺少 ${name} 关节点。`);
  }
  const limbs = Object.fromEntries(SIDES.map(side => [side, {
    arm: rest[side + 'Shoulder'].distanceTo(rest[side + 'Elbow']) + rest[side + 'Elbow'].distanceTo(rest[side + 'Wrist']),
    thigh: rest[side + 'Hip'].distanceTo(rest[side + 'Knee']),
    shin: rest[side + 'Knee'].distanceTo(rest[side + 'Ankle']),
    shoulder: rest[side + 'Shoulder'].clone().sub(rest.pelvis),
    hip: rest[side + 'Hip'].clone().sub(rest.pelvis),
  }]));
  return { rest, limbs, torso: rest.torso.clone().sub(rest.pelvis) };
}

function calibratedHands(motion, positions, fingers) {
  if (typeof motion?.getGroundHandPose !== 'function') throw new Error('训练示意需要 Snow 的只读掌面校准接口。');
  return Object.fromEntries(SIDES.map(side => {
    const ground = motion.getGroundHandPose(side, fingers[side], positions[side]);
    return [side, { wrist: [...ground.wrist], handQuaternion: [...ground.handQuaternion] }];
  }));
}

function shoeClearance(motion, rest, side, rotation) {
  // Read bind geometry, not the current deformed pose. This gives the same
  // conservative rigid-shoe box used by CoachMotion's floor guard without
  // advancing the live animation or guessing an ankle height per practice.
  const box = new THREE.Box3(), vertex = new THREE.Vector3();
  motion.group?.traverse(mesh => {
    if (!mesh.isSkinnedMesh || !/^Coach_(Sneakers|Soles|Shoe_Details)(?:_|$)/.test(mesh.name)) return;
    const position = mesh.geometry.getAttribute('position'), indices = mesh.geometry.getAttribute('skinIndex');
    const weights = mesh.geometry.getAttribute('skinWeight');
    if (!position || !indices || !weights) return;
    for (let index = 0; index < position.count; index++) {
      let belongs = false;
      for (let component = 0; component < 4; component++) {
        if (weights.getComponent(index, component) > 1e-7
          && mesh.skeleton.bones[indices.getComponent(index, component)]?.name === side + 'Foot') belongs = true;
      }
      if (belongs) box.expandByPoint(vertex.fromBufferAttribute(position, index).applyMatrix4(mesh.bindMatrix));
    }
  });
  if (box.isEmpty()) throw new Error('训练示意需要 Snow 原始鞋面与绑定权重。');
  let minimum = Infinity;
  for (let corner = 0; corner < 8; corner++) {
    vertex.set(corner & 1 ? box.max.x : box.min.x, corner & 2 ? box.max.y : box.min.y, corner & 4 ? box.max.z : box.min.z);
    minimum = Math.min(minimum, vertex.sub(rest[side + 'Ankle']).applyQuaternion(rotation).y);
  }
  return FLOOR - minimum + .000002;
}

function poseBase(pelvis, bodyQuaternion, pelvisQuaternion = bodyQuaternion) {
  return { version: 1, pelvis: pelvis.toArray(), bodyQuaternion: bodyQuaternion.toArray(),
    pelvisQuaternion: pelvisQuaternion.toArray(), groundLock: true, limbs: {} };
}

function limbPose(hand, ankle, elbowPole, kneePole, footQuaternion) {
  return { wrist: [...hand.wrist], handQuaternion: [...hand.handQuaternion], handLocked: true,
    ankle: ankle.toArray(), elbowPole: elbowPole.toArray(), kneePole: kneePole.toArray(),
    footQuaternion: footQuaternion.toArray() };
}

const DETAILS = {
  scapPush: {
    label: '直臂推地 · 肩带控制示意', period: 4.8,
    framingBounds: { min: [-.65, -.02, -1.50], max: [.65, 1.05, .48] },
    note: '整体直臂支撑变化的教学示意；Snow 没有独立肩胛滑动，不把此动画当作孤立肩胛运动重建。',
  },
  supportShift: {
    label: '双手支撑 · 小幅左右移重', period: 6,
    framingBounds: { min: [-.68, -.02, -1.50], max: [.68, 1.05, .48] },
    note: '双手和脚辅助支撑，示意小幅横向移重；没有演示实测卸载或落手交接。',
  },
  straddleLift: {
    label: '坐姿分腿 · 单腿压缩抬起', period: 6.4,
    framingBounds: { min: [-1.0, -.02, -.30], max: [1.0, 1.05, 1.05] },
    note: '舒适开腿下交替小幅抬整条腿，动作幅度只是可视化选择，不是统一标准角度。',
  },
  rearSupport: {
    label: '脚辅助后撑 · 单腿小幅抬起', period: 6.4,
    framingBounds: { min: [-.68, -.02, -.90], max: [.68, 1.05, 1.0] },
    note: '脚分担重量的后撑基础示意；交替抬腿没有替代托马斯后半圈的换手专项。',
  },
  hipOpening: {
    label: '坐姿开腿 · 主动开合控制', period: 6,
    framingBounds: { min: [-1.0, -.02, -.85], max: [1.0, 1.05, 1.05] },
    note: '双手辅助的坐姿小幅主动开合基础；不是被动劈叉、后方扫腿或空中开度的精准示范。',
  },
};

/** Construct once, then sample without touching the live rig, camera or sequence.
 * Use motion.applyPose(clip.sample(time), clip.applyOptions) to display it. */
export function createTrainingClip(id, { rigData, motion } = {}) {
  if (!TRAINING_CLIP_IDS.includes(id)) throw new Error(`尚无本地训练示意：${id}`);
  const { rest, limbs, torso } = dimensions(rigData), detail = DETAILS[id];
  const frontHands = id === 'scapPush' || id === 'supportShift';
  const positions = Object.fromEntries(SIDES.map(side => {
    const sign = side === 'left' ? 1 : -1;
    return [side, frontHands ? [sign * .215, FLOOR, .17]
      : id === 'straddleLift' ? [sign * .245, FLOOR, .405]
        : id === 'hipOpening' ? [sign * .245, FLOOR, -.405] : [sign * .215, FLOOR, -.45]];
  }));
  const fingers = Object.fromEntries(SIDES.map(side => [side, [side === 'left' ? .10 : -.10, 0, 1]]));
  const hands = calibratedHands(motion, positions, fingers);
  const frontFoot = rx(Math.PI / 2), seatedFoot = rx(-Math.PI / 2), rearFoot = new THREE.Quaternion();
  const ankleHeight = Object.fromEntries(SIDES.map(side => [side, shoeClearance(motion, rest, side,
    frontHands ? frontFoot : id === 'rearSupport' ? rearFoot : seatedFoot)]));

  function frontPose(phase) {
    const push = raised(phase), shift = id === 'supportShift' ? .082 * Math.sin(phase * Math.PI * 2) : 0;
    const rotation = rx(77 * Math.PI / 180);
    const shoulderY = id === 'scapPush' ? .482 + .018 * push : .489;
    // Push stays near straight at the elbow. The shoulder moves on the arm's
    // reach arc, rather than making a bending-elbow push-up or stretching bones.
    const height = shoulderY - hands.left.wrist[1];
    const armRadius = limbs.left.arm * .998;
    const lateral = limbs.left.shoulder.x - positions.left[0];
    const shoulderZ = id === 'scapPush'
      ? positions.left[2] - Math.sqrt(Math.max(.0001, armRadius ** 2 - height ** 2 - lateral ** 2)) : .080;
    const upper = torso.clone().applyQuaternion(rotation);
    const pelvis = new THREE.Vector3(shift, shoulderY - upper.y, shoulderZ - upper.z);
    const pose = poseBase(pelvis, rotation);
    for (const side of SIDES) {
      const sign = side === 'left' ? 1 : -1;
      const hip = limbs[side].hip.clone().applyQuaternion(rotation).add(pelvis);
      const shoulder = limbs[side].shoulder.clone().applyQuaternion(rotation).add(pelvis);
      const ankle = new THREE.Vector3(sign * .135, ankleHeight[side], id === 'supportShift' ? -1.15 : -1.19);
      const elbowPole = shoulder.clone().add(new THREE.Vector3(sign * .18, -.10, -.32));
      const kneePole = hip.clone().lerp(ankle, .46).add(new THREE.Vector3(0, .25, .015));
      pose.limbs[side] = limbPose(hands[side], ankle, elbowPole, kneePole, frontFoot);
    }
    return pose;
  }

  function seatedPose(phase) {
    const { side: liftingSide, lift } = alternating(phase);
    const openingPractice = id === 'hipOpening';
    const rotation = rx((openingPractice ? -54 : 56) * Math.PI / 180), pelvis = new THREE.Vector3(0, .232, 0);
    const hipsRotation = new THREE.Quaternion();
    const pose = poseBase(pelvis, rotation, hipsRotation);
    for (const side of SIDES) {
      const sign = side === 'left' ? 1 : -1, length = (limbs[side].thigh + limbs[side].shin) * .998;
      const hip = limbs[side].hip.clone().add(pelvis);
      const opening = (openingPractice ? 39 + 18 * raised(phase) : 53) * Math.PI / 180;
      const groundAngle = Math.asin((ankleHeight[side] - hip.y) / length);
      const elevation = groundAngle + (!openingPractice && side === liftingSide ? .145 * lift : 0);
      const direction = new THREE.Vector3(sign * Math.sin(opening) * Math.cos(elevation),
        Math.sin(elevation), Math.cos(opening) * Math.cos(elevation));
      const ankle = hip.clone().addScaledVector(direction, length);
      const shoulder = limbs[side].shoulder.clone().applyQuaternion(rotation).add(pelvis);
      const elbowPole = shoulder.clone().add(new THREE.Vector3(sign * .22, -.16, openingPractice ? .12 : -.12));
      const kneePole = hip.clone().lerp(ankle, .47).addScaledVector(UP, .24);
      const footRotation = new THREE.Quaternion().setFromAxisAngle(UP, sign * opening).multiply(seatedFoot);
      pose.limbs[side] = limbPose(hands[side], ankle, elbowPole, kneePole, footRotation);
    }
    return pose;
  }

  function rearPose(phase) {
    const { side: liftingSide, lift } = alternating(phase);
    const pelvis = new THREE.Vector3(0, .337 + .030 * lift, 0);
    const shoulderY = .507;
    const length = torso.length(), vertical = shoulderY - pelvis.y;
    const desiredDirection = new THREE.Vector3(0, vertical, -Math.sqrt(length ** 2 - vertical ** 2));
    const rotation = new THREE.Quaternion().setFromUnitVectors(torso.clone().normalize(), desiredDirection.normalize());
    const pose = poseBase(pelvis, rotation);
    for (const side of SIDES) {
      const sign = side === 'left' ? 1 : -1;
      const hip = limbs[side].hip.clone().applyQuaternion(rotation).add(pelvis);
      const ankle = new THREE.Vector3(sign * .165, ankleHeight[side] + (side === liftingSide ? .130 * lift : 0), .62);
      const shoulder = limbs[side].shoulder.clone().applyQuaternion(rotation).add(pelvis);
      const elbowPole = shoulder.clone().add(new THREE.Vector3(sign * .15, -.10, .30));
      const kneePole = hip.clone().lerp(ankle, .44).add(new THREE.Vector3(0, .36, 0));
      pose.limbs[side] = limbPose(hands[side], ankle, elbowPole, kneePole, rearFoot);
    }
    return pose;
  }

  function sample(time = 0) {
    if (!Number.isFinite(time)) throw new Error('训练示意采样时间需要有限数值。');
    const phase = wrap(time, detail.period);
    return frontHands ? frontPose(phase) : id === 'rearSupport' ? rearPose(phase) : seatedPose(phase);
  }

  function describe(time = 0) {
    if (!Number.isFinite(time)) throw new Error('训练示意采样时间需要有限数值。');
    const progress = wrap(time, detail.period), turn = alternating(progress);
    let phase, cue;
    if (id === 'scapPush') {
      phase = progress < .42 ? '主动推地' : progress < .58 ? '维持支撑空间' : '受控返回';
      cue = '肘受控伸直，肩带主动推地；胸廓小幅远离地面，再缓慢返回。';
    } else if (id === 'supportShift') {
      phase = Math.abs(Math.sin(progress * Math.PI * 2)) < .15 ? '经过中间' : progress < .5 ? '移向左侧' : '移向右侧';
      cue = '双手保持原落点，小幅左右移重；胸廓与骨盆一起移动，保持支撑空间。';
    } else if (id === 'hipOpening') {
      phase = progress < .43 ? '主动打开' : progress < .57 ? '控制开度' : '缓慢回收';
      cue = '双手辅助，躯干受控；长腿小幅打开再回收，膝与脚随髋一起转向。';
    } else {
      const sideLabel = turn.side === 'left' ? '左' : '右';
      phase = turn.lift < .04 ? '回到起点' : `${sideLabel}腿${progress % .5 < .25 ? '抬起' : '放回'}`;
      cue = id === 'straddleLift' ? '保持舒适开度，膝伸长，小幅抬整条腿；躯干保持受控。'
        : '脚辅助后撑，保持身体离地空间；一腿小幅抬起后缓慢放回，再换侧。';
    }
    return { id, label: detail.label, phase, cue, progress, supportHands: [...SIDES],
      auxiliarySupport: id === 'straddleLift' || id === 'hipOpening' ? '坐姿' : '脚辅助', illustrative: true,
      measuredForce: false, measuredActivation: false, note: detail.note };
  }

  return { id, label: detail.label, period: detail.period, sample, describe,
    applyOptions: Object.freeze({ alignBendPlanes: true }), framingBounds: structuredClone(detail.framingBounds) };
}

export function createTrainingMotion(options) {
  return { ids: [...TRAINING_CLIP_IDS], createClip: id => createTrainingClip(id, options) };
}
