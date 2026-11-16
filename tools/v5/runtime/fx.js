import * as THREE from 'three';

/* v3r7-fx r3（2026-11-15）：轨迹逻辑与 r2 完全相同，只换刀光 / 星点 / 接触圈的画法 ——
 *  淡淡的荧光火焰：预乘混合（一部分平涂染色 + 一部分加色发光），去掉墨线与实心色带；
 *  宽度方向平滑衰减（芯 / 外焰两层柔边色阶 + 极淡外辉光），尾端按帧号确定性噪声摇曳、分缕；
 *  参数：?fxglow=强度(默认1) ?fxflick=摇曳量(默认1) ?fxcore=白芯强度(默认1)
 * ---- 以下为 r2 原说明 ----
 * v3r7-fx r2：旧 3D-Body（Flare App）托马斯特效 1:1 移植轨迹逻辑 + 日漫三渲二光影
 * 移植自 /3D-Body/app/scene/src/fx.js（逐项照旧）：
 *  - 取点：鞋网格里 ≥95% 绑在 foot 骨上、离 foot 骨原点最远的顶点（脚尖），掌心 = hand 骨世界位置
 *  - 一圈均匀采 720 个样本（按动画墙钟时间），拖尾覆盖 0.95 s × (圈时长 / 8.9917 s)（≈1/10 圈，R17 规则）
 *  - 56 段面向相机的条带，半宽 0.024 m × (1 − 0.75·age)；透明度 = (1−age)^1.15 × 头部 0.04 渐入 × 脚速（80 分位归一）
 *  - 每只脚 18 颗星点，寿命 0.8 s，按固定相位循环生灭，向外漂移 0.05·age + 0.02·age²，脚速 > 0.35 才出现
 *  - 撑地：掌心降到最低点 2.5 cm 内的起始样本 +6 样本处出圈，寿命 0.9 s × 同一比例，最多 4 个
 * 日漫化（只改「怎么画」）：
 *  - 刀光：普通混合（不再加色辉光）；白芯 / 色带（头橙→中玫→尾青，同旧调色板 ember）/ 细墨线描边 三阶硬边；
 *    旧版辉光改为外圈一层硬边浅色光晕；旧版平滑透明度色阶化为 3 阶；尾端散成几道干笔触
 *  - 星点：四角星（白芯 + 暖边），透明度 3 阶
 *  - 接触圈：旧版高斯环 → 硬边色环 + 内墨线 + 平涂内光晕，透明度 3 阶
 *  - 地面投影：沿用 r1 的硬边两阶投影
 * 参数：?fx=0 关；?fxold=1 用旧版加色渲染（同轨迹，对照用）；?fxshadow=0 / ?fxring=0 / ?fxspark=0 单项关闭 */

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && isFinite(+Q.get(k)) ? +Q.get(k) : d);
export const FX_PARAMS = {
  // —— 旧版常量（照搬） ——
  samples: 720, trailSeconds: 0.95, segments: 56, rippleSeconds: 0.9, refTurn: 8.991662288,
  width: 0.024, motes: 18, moteLife: 0.8, plantDrop: 0.025, plantDelay: 6, ripples: 4,
  // —— r2 日漫渲染 ——
  old: num('fxold', 0) === 1,
  halo: 2.8,                          // r3：几何半宽倍数（外辉光层的范围）
  wide: num('fxwide', 1.6),          // r3：火焰半宽 = 旧版 0.024 m × wide
  glow: num('fxglow', 1), flick: num('fxflick', 1), core: num('fxcore', 1),
  shadow: num('fxshadow', 1) !== 0, ring: num('fxring', 1) !== 0, spark: num('fxspark', 1) !== 0,
  shadowCell: num('fxcell', 0.022),
  palette: { head: '#ff8a3a', mid: '#ff6a55', tail: '#ff8f9a', ripple: '#ff9348', gold: '#ffe6a8' },   // r3：暖橙 → 淡红火焰
  colors: { core: '#fffaf2', ink: '#3a1f3c', ringInk: '#b8462a', shadow1: '#d9cbbd', shadow2: '#c3b2a5' },
};

/* ---------- 旧版着色器（?fxold=1 对照用，原样） ---------- */
const oldRibbonFS = /* glsl */`
  uniform float uOpacity; uniform vec3 uHead; uniform vec3 uMid; uniform vec3 uTail;
  varying float vAge; varying float vSide; varying float vSpeed;
  void main() {
    vec3 c = vAge < 0.5 ? mix(uHead, uMid, vAge * 2.0) : mix(uMid, uTail, vAge * 2.0 - 1.0);
    float edge = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
    float fade = pow(1.0 - vAge, 1.15) * smoothstep(0.0, 0.04, vAge + 0.02);
    float core = smoothstep(0.55, 0.0, abs(vSide)) * (0.9 - 0.6 * vAge);
    float a = uOpacity * fade * edge * clamp(vSpeed, 0.0, 1.0);
    gl_FragColor = vec4(c * 1.25 + vec3(core * 0.55), a);
    #include <colorspace_fragment>
  }`;
const oldRippleFS = /* glsl */`
  uniform float uOpacity; uniform float uProgress; uniform vec3 uColor; varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0; float ring = uProgress * 0.92 + 0.06; float w = 0.05 + 0.05 * uProgress;
    float band = exp(-pow((r - ring) / w, 2.0));
    float glow = exp(-pow(r / max(ring, 0.05), 2.0) * 3.0) * 0.18 * (1.0 - uProgress);
    float a = uOpacity * (band * 0.85 + glow) * pow(1.0 - uProgress, 1.4);
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }`;
const oldMoteFS = /* glsl */`uniform float uOpacity; uniform vec3 uHead; uniform vec3 uTail; uniform vec3 uCore; uniform vec3 uEdge; varying float vAge;
  void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0; if (d > 1.0) discard;
    float a = uOpacity * pow(1.0 - vAge, 2.0) * exp(-d * d * 4.0);
    gl_FragColor = vec4(mix(uHead, uTail, vAge) * 1.4 + 0.25, a);
    #include <colorspace_fragment>
  }`;

/* ---------- r2 日漫着色器 ---------- */
const ribbonVS = /* glsl */`
attribute float aAge; attribute float aSide; attribute float aSpeed;
varying float vAge; varying float vSide; varying float vSpeed;
void main(){ vAge = aAge; vSide = aSide; vSpeed = aSpeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const NOISE = /* glsl */`
float h11(float x){ return fract(sin(x * 127.1 + uSeed * 31.7) * 43758.5453); }
float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f) * 2.0 - 1.0; }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.0) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
vec3 toS(vec3 c){ return pow(max(c, 0.0), vec3(1.0 / 2.2)); }   // 线性 → sRGB（预乘输出不走 colorspace_fragment）
`;
const ribbonFS = /* glsl */`
uniform float uOpacity; uniform float uHalo; uniform float uWide; uniform float uSeed; uniform vec3 uShoe; uniform float uTime; uniform float uFlick; uniform float uCoreK;
uniform vec3 uHead; uniform vec3 uMid; uniform vec3 uTail; uniform vec3 uCore; uniform vec3 uGold;
varying float vAge; varying float vSide; varying float vSpeed;
${NOISE}
void main(){
  // 沿长度的强度：照 r2/旧版 —— (1−age)^1.15 渐隐 × 头部 0.04 渐入 × 脚速
  float k = pow(1.0 - vAge, 1.15) * smoothstep(0.0, 0.04, vAge + 0.02) * clamp(vSpeed, 0.0, 1.0);
  if (k < 0.004) discard;
  float t = uTime, A = vAge;
  // 火焰舌：沿轨迹的确定性噪声（按帧号 → uTime），越靠尾端越摇曳
  float tail = smoothstep(0.06, 0.7, A) * uFlick;
  float wob = n1(A * 7.0 - t * 5.0) * 0.6 + n1(A * 15.0 - t * 9.0) * 0.4;
  float wid = 1.0 + 0.40 * tail * wob;                                   // 宽度起伏
  float off = 0.32 * tail * n1(A * 5.0 - t * 4.0 + 7.3);                  // 中线左右摆
  float x = (vSide * uHalo / uWide - off) / max(0.35, wid * mix(0.5, 1.0, smoothstep(0.0, 0.08, A)));   // 头端收尖
  float ax = abs(x);
  // 分缕：尾段沿宽度切成几缕火舌，缕的位置随时间流动
  float strands = n2(vec2(x * 2.4 + 3.0, A * 6.0 - t * 4.0));
  float split = mix(1.0, smoothstep(0.25, 0.75, strands), smoothstep(0.25, 0.8, A) * uFlick);
  float flick = 1.0 + 0.22 * uFlick * n1(A * 11.0 - t * 7.0 + 2.1);        // 亮度闪烁
  // 横向两层柔边色阶：外焰（宽、柔）+ 白芯（窄、边稍收）+ 极淡外辉光（高斯）
  float flame = 1.0 - smoothstep(0.20, 1.0, ax);
  float core = (1.0 - smoothstep(0.14, 0.34, ax)) * (1.0 - smoothstep(0.25, 0.75, A)) * uCoreK;
  float glow = exp(-ax * ax * 0.55) * (1.0 - smoothstep(0.0, 0.6, A));
  flame *= split;
  // 鞋面上压低（白鞋上不叠白块）：鞋屏幕圆内淡掉，边缘柔过渡
  float shoe = 1.0;
  if (uShoe.z > 0.0) shoe = mix(1.0, smoothstep(uShoe.z * 0.55, uShoe.z * 1.1, length(gl_FragCoord.xy - uShoe.xy)), 1.0 - smoothstep(0.25, 0.55, A));
  vec3 fc = A < 0.5 ? mix(uHead, uMid, A * 2.0) : mix(uMid, uTail, A * 2.0 - 1.0);
  vec3 cc = mix(uCore, uGold, smoothstep(0.0, 0.5, A));
  float kk = k * flick * shoe * uOpacity;
  // 预乘输出：染色部分（over，给出暖色相）+ 发光部分（加色）
  float aT = clamp(kk * (0.50 * flame + 0.14 * glow + 0.10 * core), 0.0, 0.55);
  vec3 tint = toS(mix(fc, cc, core * 0.8));
  vec3 add = toS(fc) * kk * (0.28 * flame + 0.14 * glow) + toS(cc) * kk * 0.5 * core;
  if (aT < 0.003 && max(add.r, max(add.g, add.b)) < 0.004) discard;
  gl_FragColor = vec4(tint * aT + add, aT);
}`;
const moteVS = /* glsl */`attribute float aAge; attribute float aSize; uniform float uScale; uniform float uStar; varying float vAge;
void main(){ vAge = aAge; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = aAge >= 1.0 ? 0.0 : aSize * uStar * (1.0 - 0.6 * aAge) * uScale / max(0.1, -mv.z); }`;
const moteFS = /* glsl */`uniform float uOpacity; uniform vec3 uHead; uniform vec3 uMid; uniform vec3 uTail; uniform vec3 uCore; uniform vec3 uEdge; uniform float uSeed; varying float vAge;
vec3 toS(vec3 c){ return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
void main(){ if (vAge >= 1.0) discard; vec2 q = (gl_PointCoord - 0.5) * 2.0; float r = length(q); if (r > 1.0) discard;
  // 柔光点：高斯光斑 + 很淡的四向细芒，无描边
  float spot = exp(-r * r * 9.0);
  float ray = exp(-abs(q.x) * 18.0) * exp(-abs(q.y) * 2.6) + exp(-abs(q.y) * 18.0) * exp(-abs(q.x) * 2.6);
  float k = pow(1.0 - vAge, 2.0) * uOpacity;
  float i = k * (spot + 0.35 * ray * (1.0 - r));
  vec3 c = toS(mix(uCore, mix(uHead, uMid, vAge * 0.6), smoothstep(0.0, 0.5, r)));
  float aT = clamp(i * 0.45, 0.0, 0.5);
  gl_FragColor = vec4(c * aT + c * i * 0.4, aT);
}`;
const rippleFS = /* glsl */`
uniform float uOpacity; uniform float uProgress; uniform vec3 uColor; uniform vec3 uInk; varying vec2 vUv;
vec3 toS(vec3 c){ return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
void main(){
  float r = length(vUv - 0.5) * 2.0;
  float ring = uProgress * 0.92 + 0.06, w = 0.05 + 0.05 * uProgress;   // 旧版环半径 / 宽度
  float fall = pow(1.0 - uProgress, 1.4);
  // r3：柔光环（高斯）+ 极淡内光，无墨线；两层柔边：亮的环心 + 外层淡晕
  float d = (r - ring) / w;
  float band = exp(-d * d * 1.6) * 0.75 + exp(-d * d * 0.35) * 0.25;
  float inner = exp(-pow(r / max(ring, 0.05), 2.0) * 3.0) * 0.15 * (1.0 - uProgress);
  float i = uOpacity * fall * (band + inner);
  if (i < 0.003) discard;
  vec3 c = toS(uColor);
  float aT = clamp(i * 0.85, 0.0, 0.5);
  gl_FragColor = vec4(c * aT + c * i * 0.22, aT);
}`;
const shadowVS = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
uniform vec3 uL; uniform float uCut; varying float vH;
void main(){
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 w = modelMatrix * vec4(transformed, 1.0);
  vH = w.y;
  w.xyz -= uL * (w.y / uL.y);
  w.y = vH < uCut ? 0.0026 : 0.0014;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const shadowFS = /* glsl */`
uniform vec3 uC1; uniform vec3 uC2; uniform float uCut; varying float vH;
void main(){ gl_FragColor = vec4(vH < uCut ? uC2 : uC1, 1.0);
  #include <colorspace_fragment>
}`;

// 顶点聚类简化（投影专用代理网格）：按网格单元合并顶点，保留第一个顶点的蒙皮，去掉退化三角形
function decimate(g, cell, skin) {
  const P = g.attributes.position, n = P.count, map = new Int32Array(n), cells = new Map(), pos = [], si = [], sw = [], cnt = [];
  const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
  for (let i = 0; i < n; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), key = Math.floor(x / cell) + ',' + Math.floor(y / cell) + ',' + Math.floor(z / cell);
    let k = cells.get(key);
    if (k === undefined) { k = cnt.length; cells.set(key, k); cnt.push(0); pos.push(0, 0, 0); if (skin) { si.push(SI.getX(i), SI.getY(i), SI.getZ(i), SI.getW(i)); sw.push(SW.getX(i), SW.getY(i), SW.getZ(i), SW.getW(i)); } }
    pos[k * 3] += x; pos[k * 3 + 1] += y; pos[k * 3 + 2] += z; cnt[k]++; map[i] = k;
  }
  for (let k = 0; k < cnt.length; k++) { pos[k * 3] /= cnt[k]; pos[k * 3 + 1] /= cnt[k]; pos[k * 3 + 2] /= cnt[k]; }
  const I = g.index, tri = I ? I.count : n, idx = [];
  for (let t = 0; t < tri; t += 3) { const a = map[I ? I.getX(t) : t], b = map[I ? I.getX(t + 1) : t + 1], c = map[I ? I.getX(t + 2) : t + 2]; if (a !== b && b !== c && a !== c) idx.push(a, b, c); }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (skin) { o.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); o.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); }
  o.setIndex(idx); return o;
}


const fract = x => x - Math.floor(x);

export function applyFx({ scene, root, bones, skinned, renderer, anim, getFrame, getFrames, jointIds, params = {} }) {
  const P = { ...FX_PARAMS, ...params }, C = P.colors, PAL = P.palette, N = anim.count, fps = anim.fps || 120;
  const S = P.samples, duration = N / fps;
  // 旧版 R17 规则：拖尾 / 接触圈时长按「圈时长 / v41 的 8.99 s」缩放，保持约 1/10 圈
  const windowScale = duration / P.refTurn;
  const trailSeconds = P.trailSeconds * windowScale, rippleSeconds = P.rippleSeconds * windowScale;
  const group = new THREE.Group(); group.name = 'v3r7-fx3'; scene.add(group);
  const meshes = skinned.filter(m => !m.userData.__outline);
  const info = { params: { old: P.old, trailSeconds, trailFrames: trailSeconds * fps, rippleFrames: rippleSeconds * fps, moteFrames: P.moteLife * fps, shadow: P.shadow, ring: P.ring, spark: P.spark } };

  /* ---------- 取点（旧版）：鞋网格里 ≥95% 绑 foot 骨、离 foot 骨原点最远的顶点 ---------- */
  root.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const region = m => { const R = m.geometry.attributes._region; if (!R) return -1; const c = [0, 0, 0, 0]; for (let i = 0; i < R.count; i += 7) c[Math.round(R.getX(i))]++; return c.indexOf(Math.max(...c)); };
  const shoeMeshes = meshes.filter(m => /Sneaker|Sole/i.test(m.name) || region(m) === 3);
  const pickToe = side => {
    const bone = bones[side + 'Foot'], o = bone.getWorldPosition(new THREE.Vector3()); let best = null, far = -1;
    for (const m of (shoeMeshes.length ? shoeMeshes : meshes)) {
      const bi = m.skeleton.bones.indexOf(bone); if (bi < 0) continue; const SI = m.geometry.attributes.skinIndex, SW = m.geometry.attributes.skinWeight;
      for (let i = 0; i < SI.count; i++) { let w = 0; for (let k = 0; k < 4; k++) if (SI.getComponent(i, k) === bi) w += SW.getComponent(i, k); if (w < 0.95) continue;
        m.getVertexPosition(i, v).applyMatrix4(m.matrixWorld); const d = v.distanceTo(o); if (d > far) { far = d; best = { m, i }; } }
    }
    return best;
  };
  const toe = { left: pickToe('left'), right: pickToe('right') };
  info.toe = { left: toe.left?.i ?? -1, right: toe.right?.i ?? -1, mesh: toe.left?.m.name };

  /* ---------- 逐帧 → 720 样本（旧版按墙钟均匀采样） ---------- */
  const fr3 = { left: new Float32Array(N * 3), right: new Float32Array(N * 3) }, hand3 = { left: new Float32Array(N * 3), right: new Float32Array(N * 3) };
  const paths = { left: new Float32Array(S * 3), right: new Float32Array(S * 3) }, palm = { left: new Float32Array(S * 3), right: new Float32Array(S * 3) };
  const speed = { left: new Float32Array(S), right: new Float32Array(S) };
  let plants = [], cachedFrames = null;
  const cr = (arr, t, out) => { // 循环 Catmull-Rom（帧间插值）
    const i1 = Math.floor(t), u = t - i1, g = k => ((k % N) + N) % N, i0 = g(i1 - 1), j1 = g(i1), i2 = g(i1 + 1), i3 = g(i1 + 2), u2 = u * u, u3 = u2 * u;
    for (let c = 0; c < 3; c++) { const p0 = arr[i0 * 3 + c], p1 = arr[j1 * 3 + c], p2 = arr[i2 * 3 + c], p3 = arr[i3 * 3 + c];
      out.setComponent(c, 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3)); }
    return out;
  };
  function precompute(frames) {
    const saveQ = jointIds.map(id => bones[id].quaternion.clone()), saveP = bones.pelvis.position.clone(), q = new THREE.Quaternion();
    for (let f = 0; f < N; f++) {
      const fr = frames[f];
      for (const id of jointIds) bones[id].quaternion.copy(q.fromArray(fr.q[id] || [0, 0, 0, 1]).normalize());
      bones.pelvis.position.fromArray(fr.p); root.updateMatrixWorld(true);
      for (const s of ['left', 'right']) {
        const t = toe[s]; if (t) t.m.getVertexPosition(t.i, v).applyMatrix4(t.m.matrixWorld); else bones[s + 'Foot'].getWorldPosition(v);
        v.toArray(fr3[s], f * 3);
        bones[s + 'Hand'].getWorldPosition(v).toArray(hand3[s], f * 3);
      }
    }
    jointIds.forEach((id, k) => bones[id].quaternion.copy(saveQ[k])); bones.pelvis.position.copy(saveP); root.updateMatrixWorld(true);
    for (const s of ['left', 'right']) for (let i = 0; i < S; i++) { cr(fr3[s], i / S * N, v).toArray(paths[s], i * 3); cr(hand3[s], i / S * N, v).toArray(palm[s], i * 3); }
    // 脚速（旧版）：前向差分 / dt，按 80 分位归一，截到 1
    const dt = duration / S;
    for (const s of ['left', 'right']) {
      const a = paths[s], vv = new Float32Array(S);
      for (let i = 0; i < S; i++) { const n = (i + 1) % S; vv[i] = Math.hypot(a[n * 3] - a[i * 3], a[n * 3 + 1] - a[i * 3 + 1], a[n * 3 + 2] - a[i * 3 + 2]) / dt; }
      const ref = [...vv].sort((x, y) => x - y)[Math.floor(S * 0.8)] || 1;
      for (let i = 0; i < S; i++) speed[s][i] = Math.min(1, vv[i] / ref);
    }
    // 撑地（旧版）：掌心降到最低点 2.5 cm 内的起始样本，圈放在 +6 样本处
    plants = [];
    for (const s of ['left', 'right']) {
      const y = i => palm[s][i * 3 + 1]; let low = Infinity; for (let i = 0; i < S; i++) low = Math.min(low, y(i));
      const down = i => y(i) < low + P.plantDrop;
      for (let i = 0; i < S; i++) if (down(i) && !down((i - 1 + S) % S)) { const k = (i + P.plantDelay) % S; plants.push({ side: s, wall: i / S * duration, x: palm[s][k * 3], z: palm[s][k * 3 + 2] }); }
    }
    info.plants = plants.map(p => ({ side: p.side, frame: +(p.wall * fps).toFixed(1) }));
    cachedFrames = frames;
  }
  precompute(getFrames());
  const sample = (array, wall, out) => {
    const f = ((wall / duration) % 1 + 1) % 1 * S, i = Math.floor(f), j = (i + 1) % S, t = f - i;
    return out.set(array[i * 3] + (array[j * 3] - array[i * 3]) * t, array[i * 3 + 1] + (array[j * 3 + 1] - array[i * 3 + 1]) * t, array[i * 3 + 2] + (array[j * 3 + 2] - array[i * 3 + 2]) * t);
  };
  const sampleScalar = (array, wall) => { const f = ((wall / duration) % 1 + 1) % 1 * S, i = Math.floor(f), j = (i + 1) % S, t = f - i; return array[i] + (array[j] - array[i]) * t; };

  /* ---------- 刀光条带（旧版几何：56 段、面向相机、半宽 0.024·(1−0.75·age)） ---------- */
  const col = c => new THREE.Color(c);
  const HALO = P.old ? 1 : P.halo, SEG = P.segments;
  // r3：预乘混合（src·1 + dst·(1−a)）：a 部分 = 染色 over，rgb 多出的部分 = 加色发光
  const PRE = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, premultipliedAlpha: true };
  const blend = () => P.old ? { blending: THREE.AdditiveBlending } : PRE;
  const uHead = { value: col(PAL.head) }, uMid = { value: col(PAL.mid) }, uTail = { value: col(PAL.tail) }, uCore = { value: col(C.core) };
  const ribbonMats = [0, 1].map(k => new THREE.ShaderMaterial({ name: 'fx2-ribbon', vertexShader: ribbonVS, fragmentShader: P.old ? oldRibbonFS : ribbonFS, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, ...blend(),
    uniforms: { uOpacity: { value: P.old ? 1 : P.glow }, uHalo: { value: HALO }, uWide: { value: P.wide }, uSeed: { value: k * 3.7 + 1.3 }, uShoe: { value: new THREE.Vector3(-1e4, -1e4, 0) }, uTime: { value: 0 }, uFlick: { value: P.flick }, uCoreK: { value: P.core },
      uHead, uMid, uTail, uCore, uGold: { value: col(PAL.gold) }, uInk: { value: col(C.ink) } } }));
  const ribbons = ['left', 'right'].map((side, k) => {
    const count = (SEG + 1) * 2, geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const age = new Float32Array(count), across = new Float32Array(count);
    for (let i = 0; i <= SEG; i++) { age[i * 2] = age[i * 2 + 1] = i / SEG; across[i * 2] = -1; across[i * 2 + 1] = 1; }
    geometry.setAttribute('aAge', new THREE.BufferAttribute(age, 1)); geometry.setAttribute('aSide', new THREE.BufferAttribute(across, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage));
    const index = []; for (let i = 0; i < SEG; i++) { const a = i * 2; index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geometry.setIndex(index);
    const mesh = new THREE.Mesh(geometry, ribbonMats[k]); mesh.frustumCulled = false; mesh.renderOrder = 3; group.add(mesh); return { side, mesh, geometry };
  });
  const points = Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), tangent = new THREE.Vector3(), view = new THREE.Vector3(), across = new THREE.Vector3();
  const _c = new THREE.Vector3(), _e = new THREE.Vector3(), _bs = new THREE.Vector2();
  function updateRibbons(wall, cam, rr) {
    const span = trailSeconds;
    for (const m of ribbonMats) m.uniforms.uTime.value = wall;
    rr.getDrawingBufferSize(_bs);
    for (const r of ribbons) {
      // 鞋屏幕圆：foot 骨→脚尖 45% 处，半径 = 0.46 × 骨到脚尖距离的投影（脚尖本身留在圆外）
      const t = toe[r.side]; if (t) t.m.getVertexPosition(t.i, _e).applyMatrix4(t.m.matrixWorld); bones[r.side + 'Foot'].getWorldPosition(_c);
      const rad = _c.distanceTo(_e) * 0.46; _c.lerp(_e, 0.45); const d = cam.position.distanceTo(_c); _c.project(cam);
      const px = cam.isPerspectiveCamera ? rad / (d * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)) * _bs.y / 2 : 0;
      r.mesh.material.uniforms.uShoe.value.set((_c.x * 0.5 + 0.5) * _bs.x, (_c.y * 0.5 + 0.5) * _bs.y, (!P.old && _c.z < 1) ? px : 0);
      const position = r.geometry.attributes.position, sp = r.geometry.attributes.aSpeed;
      for (let i = 0; i <= SEG; i++) sample(paths[r.side], wall - span * i / SEG, points[i]);
      for (let i = 0; i <= SEG; i++) {
        const a = points[Math.max(0, i - 1)], b = points[Math.min(SEG, i + 1)];
        tangent.subVectors(a, b); if (tangent.lengthSq() < 1e-10) tangent.set(1, 0, 0);
        view.subVectors(cam.position, points[i]); across.crossVectors(tangent, view).normalize();
        const age = i / SEG, width = P.width * (1 - age * 0.75) * HALO;
        position.setXYZ(i * 2, points[i].x - across.x * width, points[i].y - across.y * width, points[i].z - across.z * width);
        position.setXYZ(i * 2 + 1, points[i].x + across.x * width, points[i].y + across.y * width, points[i].z + across.z * width);
        const s = sampleScalar(speed[r.side], wall - span * age); sp.setX(i * 2, s); sp.setX(i * 2 + 1, s);
      }
      position.needsUpdate = true; sp.needsUpdate = true;
    }
  }

  /* ---------- 星点（旧版：每脚 18 颗、寿命 0.8 s、固定相位、外漂） ---------- */
  const M = P.motes;
  const moteMat = new THREE.ShaderMaterial({ name: 'fx2-mote', transparent: true, depthWrite: false, ...blend(),
    uniforms: { uOpacity: { value: P.old ? 0.9 : 0.9 * P.glow }, uScale: { value: 400 }, uStar: { value: P.old ? 1 : 2.6 }, uHead, uMid, uTail, uCore, uEdge: { value: col(PAL.head) } },
    vertexShader: moteVS, fragmentShader: P.old ? oldMoteFS : moteFS });
  const motes = ['left', 'right'].map((side, si) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aAge', new THREE.BufferAttribute(new Float32Array(M), 1).setUsage(THREE.DynamicDrawUsage));
    const size = new Float32Array(M), seed = [];
    for (let j = 0; j < M; j++) { const h = fract(Math.sin((j + 1) * 12.9898 + si * 78.233) * 43758.5453); size[j] = 0.010 + 0.012 * h;
      seed.push(new THREE.Vector3(fract(h * 7.13) - 0.5, fract(h * 3.71) - 0.2, fract(h * 5.29) - 0.5).normalize()); }
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const mesh = new THREE.Points(geometry, moteMat); mesh.frustumCulled = false; mesh.renderOrder = 4; group.add(mesh); return { side, mesh, geometry, seed };
  });
  const p = new THREE.Vector3();
  function updateMotes(wall, cam) {
    moteMat.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov || 35) / 2));
    const L = P.moteLife;
    for (const m of motes) {
      const position = m.geometry.attributes.position, ageAttr = m.geometry.attributes.aAge;
      for (let j = 0; j < M; j++) {
        const age = fract(wall / L + j / M), born = wall - age * L;
        sample(paths[m.side], born, p);
        const drift = 0.05 * age + 0.02 * age * age, k = sampleScalar(speed[m.side], born);
        position.setXYZ(j, p.x + m.seed[j].x * drift, p.y + m.seed[j].y * drift + 0.015 * age, p.z + m.seed[j].z * drift);
        ageAttr.setX(j, k > 0.35 ? age : 1);
      }
      position.needsUpdate = true; ageAttr.needsUpdate = true;
    }
  }

  /* ---------- 接触圈（旧版：0.5 m 方片、寿命 0.9 s×比例、最多 4 个） ---------- */
  const ripples = Array.from({ length: P.ripples }, () => {
    const material = new THREE.ShaderMaterial({ name: 'fx2-ripple',
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: P.old ? oldRippleFS : rippleFS, transparent: true, depthWrite: false, ...blend(),
      uniforms: { uOpacity: { value: 0 }, uProgress: { value: 0 }, uColor: { value: col(PAL.ripple) }, uInk: { value: col(C.ringInk) } } });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), material);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.0036; mesh.visible = false; mesh.renderOrder = 1; mesh.frustumCulled = false; group.add(mesh); return mesh;
  });
  function updateRipples(wall) {
    let used = 0;
    for (const plant of plants) {
      let age = wall - plant.wall; if (age < 0) age += duration;
      if (age > rippleSeconds || used >= ripples.length) continue;
      const mesh = ripples[used++]; mesh.visible = true; mesh.position.x = plant.x; mesh.position.z = plant.z;
      mesh.material.uniforms.uProgress.value = age / rippleSeconds; mesh.material.uniforms.uOpacity.value = P.old ? 0.75 : 0.75 * P.glow;
    }
    for (let i = used; i < ripples.length; i++) ripples[i].visible = false;
  }

  /* ---------- 地面投影（硬边两阶） ---------- */
  const shadowUni = { uL: { value: new THREE.Vector3(0.4, 1, -0.2).normalize() }, uCut: { value: 0.16 }, uC1: { value: new THREE.Color(C.shadow1) }, uC2: { value: new THREE.Color(C.shadow2) } };
  const casters = [], rigid = []; info.shadowVerts = 0;
  const shadowGroup = new THREE.Group(); shadowGroup.name = 'v3r7-fx-shadow'; scene.add(shadowGroup);
  if (P.shadow) {
    const mat = new THREE.ShaderMaterial({ name: 'fx-shadow', uniforms: shadowUni, vertexShader: shadowVS, fragmentShader: shadowFS });
    // 挂在场景根下（不进人体层级）：attached 绑定模式下 modelMatrix 与 bindMatrixInverse 抵消，世界位置与原网格一致
    for (const m of meshes) { const g = decimate(m.geometry, P.shadowCell, true); info.shadowVerts += g.attributes.position.count; const s = new THREE.SkinnedMesh(g, mat); s.bind(m.skeleton, m.bindMatrix); s.frustumCulled = false; s.renderOrder = -2; s.raycast = () => { }; shadowGroup.add(s); casters.push(s); }
    bones.head?.traverse(o => { if (o.isMesh && o.name.startsWith('hair') && !o.userData.__outline) { const g = decimate(o.geometry, P.shadowCell, false); info.shadowVerts += g.attributes.position.count; const s = new THREE.Mesh(g, mat); s.matrixAutoUpdate = false; s.frustumCulled = false; s.renderOrder = -2; s.raycast = () => { }; shadowGroup.add(s); casters.push(s); rigid.push([s, o]); } });
  }
  const LV = new THREE.Vector3(-0.45, 0.75, 0.55);   // 与 toon 光同向（视空间左上前方）
  function updateShadow(cam) {
    const L = shadowUni.uL.value.copy(LV).applyQuaternion(cam.quaternion); L.y = Math.max(L.y, 0.2); L.normalize();
    if (L.y < 0.62) { const h = Math.hypot(L.x, L.z), t = Math.sqrt(1 - 0.62 * 0.62) / (h || 1); L.set(L.x * t, 0.62, L.z * t); }
  }


  /* ---------- 每次渲染前按当前帧更新 ---------- */
  let last = null;
  const prev = scene.onBeforeRender;
  scene.onBeforeRender = (r, sc, cam, rt) => {
    prev && prev.call(scene, r, sc, cam, rt);
    const f = getFrame();
    const fr = getFrames(); if (fr && fr !== cachedFrames && fr.length === N) precompute(fr);
    if (casters.length) { updateShadow(cam); for (const [s, o] of rigid) { s.matrix.copy(o.matrixWorld); s.matrixWorld.copy(o.matrixWorld); } }
    const on = f != null; group.visible = on;
    if (!on) return;
    const wall = f / fps;
    updateRibbons(wall, cam, r);
    for (const m of motes) m.mesh.visible = P.spark; if (P.spark) updateMotes(wall, cam);
    if (P.ring) updateRipples(wall); else ripples.forEach(m => m.visible = false);
    last = f;
  };
  info.casters = casters.length; info.shadowTris = casters.reduce((a, c) => a + c.geometry.index.count / 3, 0); info.group = group;
  info.debug = () => ({ last, speed: { left: Array.from(speed.left), right: Array.from(speed.right) }, paths: { left: Array.from(paths.left), right: Array.from(paths.right) } });
  return info;
}
