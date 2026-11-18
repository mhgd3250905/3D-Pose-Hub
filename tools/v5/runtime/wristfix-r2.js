/* wristfix.js r2（2026-11-16，v3r8b 候选）：coach-v3r3-wristfix.glb 的腕部辅助骨驱动。算法与 r1 相同，只加了两件事：
 *  1) 防重复（与 hub hands-native r5/r6 wrist-twist 同时开）：hub 那层会在 render 前把前臂整根绕自身轴转 φ=share·θ、手反转 φ，
 *     render 后再还原。两者都开时，扭转要么被算两遍（wristfix 先算 → 腕口又捏 5–12%），要么前臂被刚性拧（肘部捏 5–11%）。
 *     r2 把驱动挪到 scene.onBeforeRender（所有 render 包装层之后、蒙皮矩阵计算之前），并在那里把 hub 改过的前臂/手撤回原值，
 *     再按完整 θ 驱动扭转链 → 只有扭转链起作用；hub 的 finally 照常把骨骼还原。没有 hub 时与 r1 逐帧一致。
 *  2) 展开分支放宽：θ 沿上一帧连续展开，|θ|>270° 才回落主值（r1 是 225°）。hub 弯举类动作的手相对前臂扭转本身就到 219°
 *     （静止就带 109°），r1 只剩 6° 余量；从动作中段开始播放/拖进度条时会走到 −251°，r1 会在每次弯举中途把前臂扭转骨回绕一圈。
 *     270° 覆盖了 249 个动作任意起播位置下的展开范围。回落次数记在 stats.wraps。
 *     另外：相邻两次驱动之间展开后的 θ 一步变化 >90°（拖进度条、切动作；连续播放时 30fps 下最大约 40°）就直接取主值，
 *     不再把旧分支带过去（否则 seek 后可能落在 +260° 这种远分支上，腕口多缩 5%）。次数记在 stats.seeks。
 * 模型每侧多 NT+NB-1 根骨（NT=6、NB=3，共 8 根；都挂在 xxForearm 下，不进关节列表、不进分享码）：
 *   xxForearmTwist1..NT：前臂轴上 k/NT 处，转手相对前臂扭转 θ 的 k/NT；xxWristBend1..NB-1：腕枢轴，转「θ + 腕摆动 s 的 k/NB」。
 * 手骨本身、手在世界中的位置与朝向完全不变（撑地落点不变）。
 * 用法：installWristFix({ bones, renderer }) → null（模型没有辅助骨时什么都不做）或 { update, stats } */
import * as THREE from 'three';
export function installWristFix({ bones, renderer }) {
  const sides = ['left', 'right'].filter(s => bones[s + 'ForearmTwist1'] && bones[s + 'Hand'] && bones[s + 'Forearm']);
  if (!sides.length) return null;
  const S = {};
  for (const s of sides) {
    const fa = bones[s + 'Forearm'], h = bones[s + 'Hand'];
    const tw = [], bd = []; for (let k = 1; bones[s + 'ForearmTwist' + k]; k++) tw.push(bones[s + 'ForearmTwist' + k]); for (let k = 1; bones[s + 'WristBend' + k]; k++) bd.push(bones[s + 'WristBend' + k]);
    for (const b of [...tw, ...bd]) if (b.parent !== fa) fa.attach(b);
    S[s] = { a: h.position.clone().normalize(), fa, hand: h, tw, bd, prev: null, snapF: new THREE.Quaternion(), snapH: new THREE.Quaternion() };
  }
  const t = new THREE.Quaternion(), ti = new THREE.Quaternion(), sw = new THREE.Quaternion(), q = new THREE.Quaternion(), I = new THREE.Quaternion(), r = new THREE.Quaternion();
  const stats = { theta: {}, swing: {}, wraps: 0, seeks: 0, hubUndone: 0 };
  const LIM = 1.5 * Math.PI, SEEK = Math.PI / 2;
  function drive() {
    for (const s of sides) {
      const st = S[s], a = st.a; q.copy(st.hand.quaternion).normalize(); if (q.w < 0) q.set(-q.x, -q.y, -q.z, -q.w);
      const raw = 2 * Math.atan2(q.x * a.x + q.y * a.y + q.z * a.z, q.w); let th = raw;
      if (st.prev != null) {   // 连续播放：沿上一帧的分支展开，避免 ±180° 处整段前臂甩一圈；超出 ±270° 才回落主值
        while (th - st.prev > Math.PI) th -= 2 * Math.PI; while (th - st.prev < -Math.PI) th += 2 * Math.PI;
        if (Math.abs(th - st.prev) > SEEK) { th = raw; stats.seeks++; }   // 一步跳 >90°：拖进度条/换动作，不再沿用旧分支，取主值
        else if (Math.abs(th) > LIM) { th = raw; stats.wraps++; }
      }
      st.prev = th;
      t.setFromAxisAngle(a, th); ti.copy(t).invert(); sw.copy(q).multiply(ti);
      const NT = st.tw.length, NB = st.bd.length + 1;
      st.tw.forEach((b, k) => b.quaternion.setFromAxisAngle(a, th * (k + 1) / NT));
      st.bd.forEach((b, k) => b.quaternion.copy(I).slerp(sw, (k + 1) / NB).multiply(t));
      stats.theta[s] = +(th * 180 / Math.PI).toFixed(1); stats.swing[s] = +(2 * Math.acos(Math.min(1, Math.abs(sw.w))) * 180 / Math.PI).toFixed(1);
    }
  }
  // hub hands-native r5/r6 wrist-twist 是否在场（它会在 window 上留下 __wristTwistStats，并在 __drill 上留标记）
  const hubOn = () => { const E = window.__drill; return !!(E && (E.__wristTwistR5 || E.__wristTwistR6) && window.__wristTwistStats); };
  function undoHub() {   // 在所有 render 包装层之后执行：把 hub 本帧对前臂/手的改动撤回
    for (const s of sides) {
      const st = S[s];
      if (!st.fa.quaternion.equals(st.snapF) || !st.hand.quaternion.equals(st.snapH)) {   // wristfix 在外层：hub 在我们快照之后改过 → 直接还原快照
        st.fa.quaternion.copy(st.snapF); st.hand.quaternion.copy(st.snapH); stats.hubUndone++;
      } else {   // wristfix 在内层（hub 先改、我们后快照）：按 hub 本帧记录的 φ 反转回去
        const phi = (window.__wristTwistStats.applied?.[s] || 0) * Math.PI / 180; if (!phi) continue;
        r.setFromAxisAngle(st.a, phi); st.fa.quaternion.multiply(ti.copy(r).invert()); st.hand.quaternion.premultiply(r); stats.hubUndone++;
      }
    }
  }
  let armed = false;
  function hook(scene) {   // scene.onBeforeRender：three 在 updateMatrixWorld 之后、蒙皮矩阵（skeleton.update）之前调用
    const prevHook = scene.onBeforeRender;
    scene.onBeforeRender = function (...args) {
      scene.onBeforeRender = prevHook;   // 一次性
      try { if (armed) { armed = false; if (hubOn()) undoHub(); drive(); for (const s of sides) S[s].fa.updateMatrixWorld(true); } }
      finally { return prevHook.apply(this, args); }
    };
  }
  const render = renderer.render.bind(renderer);
  renderer.render = function (scene, camera) {
    if (!hubOn()) { drive(); return render(scene, camera); }   // 无 hub：与 r1 完全一致（render 前驱动）
    for (const s of sides) { S[s].snapF.copy(S[s].fa.quaternion); S[s].snapH.copy(S[s].hand.quaternion); }
    armed = true; hook(scene);
    try { return render(scene, camera); } finally { armed = false; }
  };
  return { update: drive, stats, sides };
}
