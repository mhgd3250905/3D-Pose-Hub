/* crotchfix-v5-r1.js（2026-11-21，旧动作修复 r1 第 2 批 · V5 裆部模型级修复；Hark-QUA）
 * 问题：coach-v3r3-wristfix.glb 的短裤/腿网格（CoachV3r3_3）裆部权重是硬分界且左右不对称（会阴中线相邻顶点 L/R 在 0.06↔0.85 间跳），
 *   前裆/会阴大块 100% 跟骨盆。髋深屈 / 大外展时这些顶点被单侧大腿或骨盆拖出，相对周围 4 cm 形成 33–70 mm 的局部鼓包
 *   （tools/legacy-audit-r1/audit.mjs 的 crotch.bump）。
 * 修法：只换权重，不动几何、不加骨骼、不做逐帧计算。裆点附近一个椭球区域内（区域外权重逐顶点不变）对 pelvis / spineLower /
 *   leftThigh / rightThigh 四根骨的权重做双调和（biharmonic）插值：区域外两圈顶点固定为原权重（C1 连续过渡，不出棱），
 *   区域内只保留真正中缝的骨盆约束（见 crotchfix-v5-r1.weights.json 的 params），其余自由。离线求解，结果以补丁文件给出。
 * 用法（只在渲染侧显式打开才生效；不调用时 V5 行为逐字节不变）：
 *   （动态导入本模块后，注释里不要写 ES import 语句：渲染器的 blob 改写器会把它当成真 import）
 *   const info = applyCrotchFixV5({ root: window.__v5.root, patch });   // patch = JSON.parse(crotchfix-v5-r1.weights.json)
 *   在 installV5 之后、第一次 pose()/render() 之前调用。描边网格与本体共享 geometry，自动同步。
 *   补丁权重是 0..255 整数、每顶点和恰为 255（glb 的 WEIGHTS_0 本身就是 Uint8 归一化），写入后与原 glb 同精度。
 *   安全检查：网格名、顶点数、骨骼表、补丁前原权重摘要都必须与补丁记录一致，否则抛错（模型换了就不会误打补丁）。 */
export function applyCrotchFixV5({ root, patch }) {
  if (!patch || patch.format !== 'v5-crotchfix-weights@1') throw Error('crotchfix: bad patch format');
  let mesh = null;
  root.traverse(o => { if (o.isSkinnedMesh && !o.userData.__outline && o.name === patch.mesh) mesh = mesh || o; });
  if (!mesh) throw Error('crotchfix: mesh ' + patch.mesh + ' not found');
  const g = mesh.geometry, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
  if (SI.count !== patch.vertexCount) throw Error('crotchfix: vertex count ' + SI.count + ' != ' + patch.vertexCount);
  const names = mesh.skeleton.bones.map(b => b.name);
  if (names.join(',') !== patch.bones.join(',')) throw Error('crotchfix: bone table mismatch');
  // checksum of the original weights on the patched vertices (rounded to 1e-3) → refuses a different model
  let cs = 0;
  const V = patch.v, n = V.length / 9;
  for (let k = 0; k < n; k++) { const i = V[9 * k]; for (let c = 0; c < 4; c++) cs += (i % 97 + 1) * (c + 1) * Math.round(SW.getComponent(i, c) * 1000) * (SI.getComponent(i, c) + 1); }
  if (cs !== patch.origChecksum) throw Error('crotchfix: original weights differ from the patch record (' + cs + ' != ' + patch.origChecksum + ')');
  for (let k = 0; k < n; k++) {
    const i = V[9 * k];
    for (let c = 0; c < 4; c++) { SI.setComponent(i, c, V[9 * k + 1 + c]); SW.setComponent(i, c, V[9 * k + 5 + c] / 255); }
  }
  SI.needsUpdate = true; SW.needsUpdate = true;
  const info = { version: patch.version, mesh: patch.mesh, vertices: n, weightType: SW.array.constructor.name, normalized: !!SW.normalized };
  mesh.userData.__crotchfix = info;
  return info;
}
