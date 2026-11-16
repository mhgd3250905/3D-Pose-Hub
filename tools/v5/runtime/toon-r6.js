/* toon-r6（2026-11-16 腕部修复候选）= toon-r5 + 描边粗细把 WristBend 辅助骨折算回原手权重（模型 coach-v3r3-wristfix.glb）；其余逐字相同。
 toon-r5（v3r7-fx r4 改）：默认身体与头发均无边缘光/菲涅耳/第三阶深影，两阶平涂；?rim=1 回 r3 明暗；?ol=0 回 v3r6b 原样。
 toon-r5：同 toon-r4，仅发型 glb 改为 model/hair-v3r5.glb（v3r5 精修发型）。
 日漫三渲二皮肤 r4（?model=v3r3&skin=toon 时由 app.js 动态加载；r3 的超集）
 * 新增：?hair=spiky|mid|beanie|none（默认 none）发型，独立 glb（model/hair-v3r4.glb）刚性挂在 head 骨骼上，分区 hair/beanie，两阶明暗+描边
 *       ?outfit=default|mono|redblack（默认 default）配色预设，只改已有分区（上衣/裤/袜/鞋）颜色
 *       ?cap=<hex6> 毛线帽颜色、?hairc=black|brown 发色（可选）
 * 不加参数时与 toon-r3 完全一致（同一着色器、同一调色板，不加载发型 glb）。
 * - 硬色阶两段明暗 + 暖色阴影 + 硬边缘光（fwidth 抗锯齿）
 * - 反向外壳描边（#2b2230，沿法线外扩 0.0045 m，背面渲染）
 * - 按部位平涂：皮肤 / 上衣 / 裤 / 鞋（不用 v3 原顶点色）
 * - 脸：豆豆眼 + 等宽粗直眉（挂 head 骨骼），抹平鼻孔与人中 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

const PAL = {
  base: ['#f7d9c4', '#3f6fd8', '#2b2f45', '#f3f1ee'],   // 皮肤 上衣 裤 鞋
  shade: ['#d99a8e', '#2a3f8f', '#1a1c2e', '#b9b3c4'],
};
const QS = new URLSearchParams(location.search);
// 配色预设：[皮肤, 上衣, 裤, 鞋] + 袜（袜原与鞋同色；袜是独立 primitive，单独给材质）+ 帽色
const OUTFITS = {
  default: { base: PAL.base, shade: PAL.shade, sock: null, cap: ['#d8343a', '#8e1d2c'] },
  mono: { base: ['#f7d9c4', '#f2f0ec', '#26242c', '#2a2830'], shade: ['#d99a8e', '#b6b0c2', '#121016', '#141219'], sock: ['#f2f0ec', '#b6b0c2'], cap: ['#2a2830', '#141219'] },
  redblack: { base: ['#f7d9c4', '#d8343a', '#26242c', '#d8343a'], shade: ['#d99a8e', '#8e1d2c', '#121016', '#8e1d2c'], sock: ['#26242c', '#121016'], cap: ['#26242c', '#121016'] },
};
const HAIRC = { black: ['#363044', '#18141f', '#6f6c8e'], brown: ['#5a3a2c', '#2c1a16', '#a77a5e'] };   // 亮 暗 高光
const HAIR = ['spiky', 'mid', 'beanie'].includes(QS.get('hair')) ? QS.get('hair') : 'none';
const OUTFIT = OUTFITS[QS.get('outfit')] ? QS.get('outfit') : 'default';
// r2（v3r7-fx r2）：?ol=0 回到 v3r6b 原描边与原明暗（像素一致）；默认启用粗描边 + 三阶明暗 + 侧逆光边缘高光
const STYLE2 = QS.get('ol') !== '0';
// r4（v3r7-fx r4）：默认去掉身体/头发上所有边缘光、菲涅耳 rim、第三阶背光深影、裤子蓝灰线 → 干净两阶平涂（亮/暗硬边）；?rim=1 找回 r3 的明暗
const RIM = QS.get('rim') === '1';
const TSM = (() => { const v = QS.get('tsm'); return v != null && isFinite(+v) ? Math.max(0, Math.round(+v)) : 48; })();   // 明暗法线额外扩散迭代数（0=关）
const qn = (k, d) => (QS.has(k) && isFinite(+QS.get(k)) ? +QS.get(k) : d);
const OL2 = { frac: qn('olw', 0.0048), k: qn('olk', 0.5), refP11: 1 / Math.tan(15 * Math.PI / 180), refZ: 4.95, push: qn('olpush', 0.012),
  hand: 0.5, head: 0.7, shoe: 0.8, hair: 0.78, ink: '#2a1d33', hairInk: '#1a1430' };
const LINE = '#2b2230', LINE_W = 0.0045, FACE_INK = '#231c26', BG = '#f4efe6';
const SKIN = 0, SHIRT = 1, PANTS = 2, SHOE = 3;

// glb 里各 primitive 的来源（build-v3glb.mjs 的 geo.meshes 顺序）
const PRIM = ['Coach_Body', 'Coach_Shoe_Details', 'Coach_Sneakers', 'Coach_Soles', 'Coach_Training_Shorts', 'Mesh005', 'Mesh005_1', 'V2P_Base_Limbs', 'V3_Head_Neck_Torso_Shared_R26', 'V2P_Base_Hands'];
const SLEEVE_X = 0.305;  // 袖口（世界 |x|，T 字静止姿势）
const WAIST_Y = 1.0;     // 上衣下摆 / 裤腰

/* ---------- 着色器 ---------- */
const toonVS = /* glsl */`
attribute vec4 toonW;
#ifdef TOONN
attribute vec3 toonN;
#endif
varying vec4 vW;
varying vec3 vN;
varying vec3 vV;
#include <common>
#include <skinning_pars_vertex>
void main() {
  vW = toonW;
  #include <beginnormal_vertex>
  #ifdef TOONN
  objectNormal = toonN;   // r4：明暗用更平滑的法线（描边仍用原法线）→ 暗部形状干净
  #endif
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  vN = normalize(transformedNormal);
  #include <begin_vertex>
  #include <skinning_vertex>
  #ifdef INFLATE
  transformed += normalize(objectNormal) * INFLATE;   // 领口/袖口罗纹略微外浮，避免与身体共面闪烁
  #endif
  #include <project_vertex>
  vV = -mvPosition.xyz;
}`;
const toonFS = /* glsl */`
uniform vec3 uBase[4];
uniform vec3 uShade[4];
uniform vec3 uLight;
varying vec4 vW;
varying vec3 vN;
varying vec3 vV;
void main() {
  // 部位：取插值后权重最大的那一项，边界落在三角形中线上，不会糊
  int r = 0; float m = vW.x;
  if (vW.y > m) { m = vW.y; r = 1; }
  if (vW.z > m) { m = vW.z; r = 2; }
  if (vW.w > m) { m = vW.w; r = 3; }
  vec3 alb = uBase[0], shc = uShade[0];
  if (r == 1) { alb = uBase[1]; shc = uShade[1]; }
  else if (r == 2) { alb = uBase[2]; shc = uShade[2]; }
  else if (r == 3) { alb = uBase[3]; shc = uShade[3]; }
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV);
  float nl = dot(n, normalize(uLight));
  float aB = max(fwidth(nl), 1e-4);
  float b = smoothstep(0.10 - aB, 0.10 + aB, nl);          // 硬色阶两段
  shc = mix(shc, alb * vec3(0.78, 0.64, 0.70), 0.55);        // 暖色阴影
  #if defined(STYLE2) && !defined(RIM)
  vec3 lit = mix(shc, alb * 1.04, b);                          // r4：纯两阶平涂（亮/暗硬边），无边缘光
  #elif defined(STYLE2)
  float b2 = smoothstep(-0.42 - aB, -0.42 + aB, nl);          // 第三阶：背光深影（冷一点）
  vec3 deep = shc * vec3(0.80, 0.80, 0.93);
  vec3 lit = mix(mix(deep, shc, b2), alb * 1.04, b);
  float fr = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.6);
  float aR = max(fwidth(fr), 1e-4);
  lit += mix(alb, vec3(1.0), 0.5) * smoothstep(0.62 - aR, 0.62 + aR, fr) * 0.35 * b;   // 原受光侧硬边缘光
  // 侧逆光 rim：屏幕右侧轮廓一条暖白硬边高光（与左上主光相对），暗面也有
  float rd = dot(normalize(n.xy + 1e-5), normalize(vec2(0.85, 0.35)));
  float rm = smoothstep(0.50 - aR, 0.50 + aR, fr) * smoothstep(0.30, 0.36, rd);
  float lum = dot(alb, vec3(0.2126, 0.7152, 0.0722));
  lit = mix(lit, mix(alb, vec3(1.0, 0.96, 0.90), 0.55), rm * 0.72 * mix(0.28, 1.0, smoothstep(0.03, 0.30, lum)));   // 深色（裤）只留淡蓝灰一线
  #else
  vec3 lit = mix(shc, alb * 1.04, b);
  float fr = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.6);   // 与 hub toon 相同的菲涅尔
  float aR = max(fwidth(fr), 1e-4);
  lit += mix(alb, vec3(1.0), 0.5) * smoothstep(0.62 - aR, 0.62 + aR, fr) * 0.35 * b;   // 硬边缘光
  #endif
  gl_FragColor = vec4(lit, 1.0);
  #include <colorspace_fragment>
}`;
const outlineVS = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  transformed += normalize(objectNormal) * ${LINE_W.toFixed(4)};   // 蒙皮后（米）沿法线外扩
  #include <project_vertex>
}`;
const outlineFS = /* glsl */`
uniform vec3 uColor;
void main() { gl_FragColor = vec4(uColor, 1.0);
  #include <colorspace_fragment>
}`;

/* r2 描边：屏幕空间外扩（反向外壳，背面渲染）。粗细 = 屏幕高度比例 frac 与「世界粗细」的几何平均（k=0.5）：
   近处变粗、远处变细，但只按距离的平方根变化；按部位乘系数（手 0.5、头 0.62、鞋 0.8）；
   外壳在视空间往后推 olpush 米，内部的折角（腋下、裤裆、指缝）不会冒黑块，只留外轮廓 */
const ol2Pars = /* glsl */`
uniform float uF; uniform float uW0; uniform float uK; uniform float uPush;
vec4 ol2Clip(vec4 mv, vec3 nv, float mult) {
  float z = max(0.05, -mv.z);
  float P11 = projectionMatrix[1][1], asp = projectionMatrix[1][1] / projectionMatrix[0][0];
  float wf = uW0 * P11 / (2.0 * z);
  float frac = clamp(uF * pow(wf / uF, uK), uF * 0.4, uF * 3.0) * mult;
  vec2 d = nv.xy; float l = length(d); d = l > 1e-4 ? d / l : vec2(0.0);
  mv.z -= uPush * (z / 4.95);
  vec4 c = projectionMatrix * mv;
  c.xy += d * vec2(1.0 / asp, 1.0) * 2.0 * frac * c.w;
  return c;
}`;
const outline2VS = /* glsl */`
attribute float olW; attribute vec4 toonW; varying vec4 vW;
#include <common>
#include <skinning_pars_vertex>
${ol2Pars}
void main() {
  vW = toonW;
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = ol2Clip(mv, normalize(normalMatrix * objectNormal), olW);
}`;
const outline2FS = /* glsl */`
uniform vec3 uShade[4]; uniform vec3 uInk; varying vec4 vW;
void main() {
  int r = 0; float m = vW.x;
  if (vW.y > m) { m = vW.y; r = 1; }
  if (vW.z > m) { m = vW.z; r = 2; }
  if (vW.w > m) { m = vW.w; r = 3; }
  vec3 s = uShade[0]; if (r == 1) s = uShade[1]; else if (r == 2) s = uShade[2]; else if (r == 3) s = uShade[3];
  gl_FragColor = vec4(mix(s * 0.42, uInk, 0.38), 1.0);    // 色线：各部位暗色 + 深紫墨（不是纯黑）
  #include <colorspace_fragment>
}`;
const ol2Uniforms = () => ({ uF: { value: OL2.frac }, uW0: { value: OL2.frac / (OL2.refP11 / (2 * OL2.refZ)) }, uK: { value: OL2.k }, uPush: { value: OL2.push } });

function makeToonMaterial(pal = PAL) {
  return new THREE.ShaderMaterial({ ...(STYLE2 ? { defines: RIM ? { STYLE2: '', RIM: '' } : { STYLE2: '', ...(TSM > 0 ? { TOONN: '' } : {}) } } : {}),
    name: 'toon3r2',
    uniforms: {
      uBase: { value: pal.base.map(c => new THREE.Color(c)) },
      uShade: { value: pal.shade.map(c => new THREE.Color(c)) },
      uLight: { value: new THREE.Vector3(-0.45, 0.75, 0.55) },   // 视空间左上前方（同 hub toon 的 Ld），跟随相机
    },
    vertexShader: toonVS, fragmentShader: toonFS,
  });
}

/* ---------- 部位划分（按骨骼权重 + 静止姿势位置） ---------- */
function collarProfile(P) {   // 领口罗纹（Mesh005）：按绕颈角度分 24 格，取上沿高度与外半径，格间线性插值
  const N = 24, ymax = new Array(N).fill(-9), rmax = new Array(N).fill(0);
  let zc = 0; for (const p of P) zc += p.z; zc /= P.length;
  for (const p of P) {
    const k = Math.floor(((Math.atan2(p.x, p.z - zc) / Math.PI + 1) / 2) * N) % N, r = Math.hypot(p.x, p.z - zc);
    ymax[k] = Math.max(ymax[k], p.y); rmax[k] = Math.max(rmax[k], r);
  }
  const at = (arr, p) => { const u = ((Math.atan2(p.x, p.z - zc) / Math.PI + 1) / 2) * N - 0.5, k0 = Math.floor(u), f = u - k0, a = ((k0 % N) + N) % N, b = (a + 1) % N; return arr[a] * (1 - f) + arr[b] * f; };
  return { zc, top: p => at(ymax, p), rad: p => at(rmax, p) };
}
const one = r => { const w = [0, 0, 0, 0]; w[r] = 1; return w; };
// 软分界：s>0 偏向 b。权重在 ±1 cm 内线性，片元里取插值后的最大项 → 分界线是平滑等值线而不是三角形锯齿
const soft = (a, b, s) => { const t = Math.min(1, Math.max(0, 0.5 + s / 0.02)), w = [0, 0, 0, 0]; w[a] += 1 - t; w[b] += t; return w; };
function regionOf(prim, bone, p, collar) {
  if (prim === 1 || prim === 2 || prim === 3) return one(SHOE);
  if (prim === 5 || prim === 6) return one(SHIRT);             // 领口罗纹、袖口
  if (prim === 9) return one(SKIN);                            // 手
  if (/Foot/.test(bone)) return one(SHOE);
  if (/Hand|Forearm/.test(bone)) return one(SKIN);
  if (/Thigh|Shin|Patella/.test(bone)) return one(PANTS);
  if (prim === 4) return soft(SHIRT, PANTS, WAIST_Y - p.y);    // 短裤网格露出腰上的一圈算上衣下摆
  if (bone === 'head') return one(SKIN);
  // 颈 / 躯干一族：在领口罗纹圈内、且高过罗纹上沿的是皮肤；罗纹底下和外面都算上衣
  if (collar) {
    const inside = Math.hypot(p.x, p.z - collar.zc) < collar.rad(p) + 0.005;
    if (inside) return soft(SHIRT, SKIN, p.y - collar.top(p) - 0.002);
    if (bone === 'neck') return one(SKIN);
  } else if (bone === 'neck') return one(SKIN);
  if (/UpperArm|Scapula/.test(bone)) return soft(SHIRT, SKIN, Math.abs(p.x) - SLEEVE_X);
  return soft(SHIRT, PANTS, WAIST_Y - p.y);                    // pelvis / spine / torso
}

/* 静止姿势下把几何顶点变到世界（本模型骨骼静止旋转为单位，boneWorld*boneInverse 对所有骨骼相同） */
function restMatrix(mesh, boneName) {
  const sk = mesh.skeleton, i = sk.bones.findIndex(b => b.name === boneName);
  return new THREE.Matrix4().multiplyMatrices(sk.bones[i].matrixWorld, sk.boneInverses[i]).multiply(mesh.bindMatrix);
}


/* glb 法线噪声很大（三渲二会把它放大成碎斑、描边也会被顶穿）：按位置焊接后重算平滑法线 */
function smoothNormals(g, iters = 12) {
  const P = g.attributes.position, n = P.count, v = new THREE.Vector3();
  const key = i => { v.fromBufferAttribute(P, i); return Math.round(v.x * 2e4) + ',' + Math.round(v.y * 2e4) + ',' + Math.round(v.z * 2e4); };
  const id = new Map(), rep = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = key(i); if (!id.has(k)) id.set(k, id.size); rep[i] = id.get(k); }
  const acc = new Float32Array(id.size * 3), idx = g.index ? g.index.array : null, tc = idx ? idx.length : n;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < tc; t += 3) {
    const i0 = idx ? idx[t] : t, i1 = idx ? idx[t + 1] : t + 1, i2 = idx ? idx[t + 2] : t + 2;
    a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1); c.fromBufferAttribute(P, i2);
    c.sub(b); a.sub(b); c.cross(a);   // 面积加权面法线
    for (const i of [i0, i1, i2]) { const r = rep[i] * 3; acc[r] += c.x; acc[r + 1] += c.y; acc[r + 2] += c.z; }
  }
  // 表面本身有雕刻级的细碎起伏（边长 ~6 mm、起伏 ~1.5 mm），两段硬色阶会把它放大成碎斑：
  // 在焊接后的网格上做法线扩散（只改法线，不动位置），去掉高频起伏
  const U = id.size, nbS = [], nbC = new Int32Array(U + 1);
  { const sets = Array.from({ length: U }, () => new Set());
    for (let t = 0; t < tc; t += 3) { const x = rep[idx ? idx[t] : t], y = rep[idx ? idx[t + 1] : t + 1], z = rep[idx ? idx[t + 2] : t + 2]; sets[x].add(y).add(z); sets[y].add(x).add(z); sets[z].add(x).add(y); }
    for (let u = 0; u < U; u++) { nbC[u + 1] = nbC[u] + sets[u].size; for (const k of sets[u]) nbS.push(k); } }
  let cur = new Float32Array(acc), nxt = new Float32Array(U * 3);
  for (let u = 0; u < U; u++) { const l = Math.hypot(cur[3 * u], cur[3 * u + 1], cur[3 * u + 2]) || 1; cur[3 * u] /= l; cur[3 * u + 1] /= l; cur[3 * u + 2] /= l; }
  for (let it = 0; it < iters; it++) {
    for (let u = 0; u < U; u++) {
      let x = cur[3 * u], y = cur[3 * u + 1], z = cur[3 * u + 2];
      for (let j = nbC[u]; j < nbC[u + 1]; j++) { const k = nbS[j]; x += cur[3 * k]; y += cur[3 * k + 1]; z += cur[3 * k + 2]; }
      const l = Math.hypot(x, y, z) || 1; nxt[3 * u] = x / l; nxt[3 * u + 1] = y / l; nxt[3 * u + 2] = z / l;
    }
    [cur, nxt] = [nxt, cur];
  }
  const N = g.attributes.normal;
  for (let i = 0; i < n; i++) { const r = rep[i] * 3; N.setXYZ(i, cur[r], cur[r + 1], cur[r + 2]); }
  N.needsUpdate = true;
}

/* ---------- 脸 ---------- */
function faceFix(mesh, head, opt) {   // 抹平鼻孔与人中：head 局部 |x|<hx、y0~y1 拉普拉斯平滑 + 重算法线
  const sk = mesh.skeleton, hi = sk.bones.indexOf(head);
  const M = new THREE.Matrix4().multiplyMatrices(sk.boneInverses[hi], mesh.bindMatrix), Mi = M.clone().invert();
  const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, n = P.count, v3 = new THREE.Vector3();
  const hl = []; for (let i = 0; i < n; i++) hl.push(v3.fromBufferAttribute(P, i).applyMatrix4(M).clone());
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const w = hl.map(p => p.z < 0.06 ? 0 : (1 - sm(opt.hx, opt.hx + opt.f, Math.abs(p.x))) * sm(opt.y0 - opt.f, opt.y0, p.y) * (1 - sm(opt.y1, opt.y1 + opt.f, p.y)));
  const key = p => Math.round(p.x * 1e5) + ',' + Math.round(p.y * 1e5) + ',' + Math.round(p.z * 1e5);
  const id = new Map(), rep = [];
  for (let i = 0; i < n; i++) { const k = key(hl[i]); if (!id.has(k)) id.set(k, id.size); rep.push(id.get(k)); }
  const U = id.size, pos = new Array(U), W = new Float32Array(U), nb = Array.from({ length: U }, () => new Set());
  for (let i = 0; i < n; i++) { pos[rep[i]] = hl[i].clone(); W[rep[i]] = Math.max(W[rep[i]], w[i]); }
  const idx = g.index ? g.index.array : null, tc = idx ? idx.length : n;
  for (let t = 0; t < tc; t += 3) { const a = rep[idx ? idx[t] : t], b = rep[idx ? idx[t + 1] : t + 1], c = rep[idx ? idx[t + 2] : t + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
  let act = 0; for (let u = 0; u < U; u++) if (W[u] > 0) act++;
  for (let it = 0; it < opt.iters; it++) {
    const np = pos.map(p => p.clone());
    for (let u = 0; u < U; u++) { if (!(W[u] > 0)) continue; const avg = new THREE.Vector3(); for (const k of nb[u]) avg.add(pos[k]); avg.multiplyScalar(1 / nb[u].size); np[u].lerp(avg, 0.6 * W[u]); }
    for (let u = 0; u < U; u++) pos[u] = np[u];
  }
  for (let i = 0; i < n; i++) if (W[rep[i]] > 0) { v3.copy(pos[rep[i]]).applyMatrix4(Mi); P.setXYZ(i, v3.x, v3.y, v3.z); }
  P.needsUpdate = true;
  smoothNormals(g);   // 法线整体重新扩散，平滑区与周围一致
  g.computeBoundingSphere();
  return { verts: n, welded: U, active: act };
}

function headLocalProxy(mesh, head) {   // 静止姿势、head 局部坐标的不蒙皮代理网格，用于沿 -z 射线取脸面
  const sk = mesh.skeleton, hi = sk.bones.indexOf(head);
  const M = new THREE.Matrix4().multiplyMatrices(sk.boneInverses[hi], mesh.bindMatrix);
  const g = new THREE.BufferGeometry(); const P = mesh.geometry.attributes.position, a = new Float32Array(P.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); a.set([v.x, v.y, v.z], 3 * i); }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3)); g.setIndex(mesh.geometry.index); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  return (x, y) => { rc.set(new THREE.Vector3(x, y, 0.4), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObject(m, false)[0]; return h ? h.point.z : null; };
}

function addFace(head, zAt) {
  const ink = new THREE.MeshBasicMaterial({ color: FACE_INK });
  const out = { eyes: [], brows: [] };
  // 豆豆眼：扁椭圆，head 局部 (±0.032, 0.069)，贴脸面外 0.002（toon-face 定稿值 z≈0.1045）
  for (const s of [-1, 1]) {
    const x = s * 0.032, y = 0.069, zs = zAt(x, y);
    const e = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), ink);
    e.position.set(x, y, zs != null ? zs + 0.002 : 0.1045);
    e.quaternion.set(-0.020044549351510503, 0, 0, 0.9997990878377991);
    e.scale.set(0.00819, 0.013125, 0.00315);
    e.userData.__face = true; head.add(e); out.eyes.push({ p: e.position.toArray().map(v => +v.toFixed(4)), surf: zs });
  }
  // 等宽粗直眉：粗 0.0105、长 0.046、y 0.104、x ±0.034，贴额头曲面外 0.004
  const th = 0.0105, L = 0.046, Y = 0.104, X = 0.034, OFF = 0.004, NX = 6;
  for (const s of [-1, 1]) {
    const xc = s * X;
    const geo = new THREE.CapsuleGeometry(th / 2, L - th, 6, 12); geo.rotateZ(Math.PI / 2); geo.scale(1, 1, 0.25);
    const G = [-th / 2, 0, th / 2].map(dy => Array.from({ length: NX + 1 }, (_, k) => zAt(xc - L / 2 - 0.002 + (L + 0.004) * k / NX, Y + dy)));
    const gz = (x, y) => {
      const u = Math.min(NX, Math.max(0, (x + L / 2 + 0.002) / (L + 0.004) * NX)), k = Math.min(NX - 1, Math.floor(u)), f = u - k;
      const vv = Math.min(2, Math.max(0, (y + th / 2) / (th / 2))), j = Math.min(1, Math.floor(vv)), g = vv - j;
      const r = jj => (G[jj][k] ?? 0.1) * (1 - f) + (G[jj][k + 1] ?? 0.1) * f; return r(j) * (1 - g) + r(j + 1) * g;
    };
    const gp = geo.attributes.position;
    for (let i = 0; i < gp.count; i++) { const x = gp.getX(i); const zs = Math.max(gz(x, -th / 2), gz(x, 0), gz(x, th / 2)); gp.setZ(i, gp.getZ(i) + zs + OFF); }
    gp.needsUpdate = true; geo.computeVertexNormals();
    const b = new THREE.Mesh(geo, ink); b.position.set(xc, Y, 0); b.userData.__face = true; head.add(b);
    out.brows.push({ xc, z: G[1].map(z => z == null ? null : +z.toFixed(4)) });
  }
  return out;
}

/* ---------- 入口 ---------- */
export function applyToon({ scene, root, bones, skinned, grid, floor, renderer, camera }) {
  root.updateMatrixWorld(true);
  const info = { prims: [], counts: [0, 0, 0, 0] };
  scene.background = new THREE.Color(BG);
  if (grid) grid.removeFromParent();
  if (floor) floor.material = new THREE.MeshBasicMaterial({ color: 0xe6dccd, transparent: true, opacity: .6 });
  const head = bones.head;
  // primitive 编号按 glb 顺序（three 拆成同名多网格，按遍历顺序）
  const meshes = skinned.slice();
  const pIdx = new Map(meshes.map((m, i) => [m, i]));
  // 领口轮廓
  let collar = null;
  { const m = meshes[5]; if (m) { const R = restMatrix(m, 'torso'), P = m.geometry.attributes.position, v = new THREE.Vector3(), pts = [];
    for (let i = 0; i < P.count; i++) pts.push(v.fromBufferAttribute(P, i).applyMatrix4(R).clone()); collar = collarProfile(pts); } }
  const OF = OUTFITS[OUTFIT];
  const toonMat = makeToonMaterial(OF), ribMat = makeToonMaterial(OF); ribMat.defines = { ...(ribMat.defines || {}), INFLATE: '0.0015' };
  let sockMat = null;
  if (OF.sock) { sockMat = makeToonMaterial({ base: OF.base.map((c, i) => i === 3 ? OF.sock[0] : c), shade: OF.shade.map((c, i) => i === 3 ? OF.sock[1] : c) }); }
  info.outfit = OUTFIT; info.hair = HAIR;
  for (const m of meshes) {
    const prim = pIdx.get(m), g = m.geometry, P = g.attributes.position, J = g.attributes.skinIndex, Wt = g.attributes.skinWeight;
    const R = restMatrix(m, 'pelvis'), v = new THREE.Vector3(), tw = new Float32Array(P.count * 4), names = m.skeleton.bones.map(b => b.name);
    for (let i = 0; i < P.count; i++) {
      let bi = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = Wt.getComponent(i, k); if (w > bw) { bw = w; bi = J.getComponent(i, k); } }
      v.fromBufferAttribute(P, i).applyMatrix4(R);
      const RA = g.attributes._region; const w = RA ? one(Math.round(RA.getX(i))) : regionOf(prim, names[bi], v, collar); tw.set(w, 4 * i); info.counts[w.indexOf(Math.max(...w))]++;
    }
    g.setAttribute('toonW', new THREE.BufferAttribute(tw, 4));
    smoothNormals(g);
    const srcName = m.material && m.material.name;
    m.material = (!g.attributes._region && (prim === 5 || prim === 6)) ? ribMat : (sockMat && srcName === 'sock') ? sockMat : toonMat;
    info.prims.push({ prim, name: PRIM[prim], verts: P.count });
  }
  // 脸（在描边之前改几何，描边共享几何）
  const hm = meshes.find(m => m.geometry.attributes._region && m.name.includes('skin')) || meshes.find(m => m.geometry.attributes._region && Math.round(m.geometry.attributes._region.getX(0)) === 0 && m.geometry.attributes.position.count > 20000) || meshes[8];
  if (hm && head) {
    info.faceFix = faceFix(hm, head, { hx: 0.026, y0: -0.036, y1: 0.045, f: 0.012, iters: 60 });
    info.face = addFace(head, headLocalProxy(hm, head));
  }
  // r4：明暗专用平滑法线 toonN（只在默认两阶模式；原 normal 不变，描边/其它不受影响）
  const tN0 = performance.now();
  if (STYLE2 && !RIM && TSM > 0) for (const m of meshes) {
    const g = m.geometry, N = g.attributes.normal, keep = new Float32Array(N.count * 3);
    for (let i = 0; i < N.count; i++) { keep[3 * i] = N.getX(i); keep[3 * i + 1] = N.getY(i); keep[3 * i + 2] = N.getZ(i); }
    smoothNormals(g, 12 + TSM);
    const tn = new Float32Array(N.count * 3); for (let i = 0; i < N.count; i++) { tn[3 * i] = N.getX(i); tn[3 * i + 1] = N.getY(i); tn[3 * i + 2] = N.getZ(i); N.setXYZ(i, keep[3 * i], keep[3 * i + 1], keep[3 * i + 2]); }
    N.needsUpdate = true; g.setAttribute('toonN', new THREE.BufferAttribute(tn, 3));
  }
  info.toonN = { iters: STYLE2 && !RIM ? TSM : 0, ms: +(performance.now() - tN0).toFixed(0) };
  // 描边：每个蒙皮网格挂一个反向外壳
  const olMat = STYLE2
    ? new THREE.ShaderMaterial({ name: 'toon-outline-r2', uniforms: { ...ol2Uniforms(), uShade: { value: OF.shade.map(c => new THREE.Color(c)) }, uInk: { value: new THREE.Color(OL2.ink) } }, vertexShader: outline2VS, fragmentShader: outline2FS, side: THREE.BackSide })
    : new THREE.ShaderMaterial({ name: 'toon3r2-outline', uniforms: { uColor: { value: new THREE.Color(LINE) } }, vertexShader: outlineVS, fragmentShader: outlineFS, side: THREE.BackSide });
  if (STYLE2) for (const m of meshes) {   // 每顶点粗细系数：手 / 头 / 鞋按骨骼权重插值
    const g = m.geometry, J = g.attributes.skinIndex, Wt = g.attributes.skinWeight, RA = g.attributes._region, n = J.count, w = new Float32Array(n), names = m.skeleton.bones.map(b => b.name);
    const NBEND = names.filter(nm => /^leftWristBend\d+$/.test(nm)).length + 1;
    for (let i = 0; i < n; i++) {
      let hand = 0, hd = 0; for (let k = 0; k < 4; k++) { const nm = names[J.getComponent(i, k)], x = Wt.getComponent(i, k); let wb; if (/Hand$/.test(nm)) hand += x; else if ((wb = /WristBend(\d+)$/.exec(nm))) hand += x * (+wb[1]) / NBEND; else if (nm === 'head') hd += x; }   // r6：腕弯辅助骨 k 按 k/NB 折算回原手权重 → 描边粗细与 r5 逐顶点相同
      const shoe = RA ? Math.round(RA.getX(i)) === 3 : false;
      w[i] = Math.min(shoe ? OL2.shoe : 1, 1 + (OL2.hand - 1) * Math.min(1, hand * 1.2), 1 + (OL2.head - 1) * Math.min(1, hd * 1.2));
    }
    g.setAttribute('olW', new THREE.BufferAttribute(w, 1));
  }
  for (const m of meshes) {
    const ol = new THREE.SkinnedMesh(m.geometry, olMat); ol.bind(m.skeleton, m.bindMatrix);
    ol.userData.__outline = true; ol.frustumCulled = false; ol.renderOrder = -1; ol.raycast = () => { };
    m.add(ol);
  }
  info.outlines = meshes.length;
  // 测试用：脸部特写（head 骨骼前方取景）
  info.faceSnap = (dx = 0, w = 500, h = 500, hideUi) => {
    root.updateMatrixWorld(true);
    const hp = head.getWorldPosition(new THREE.Vector3()), q = head.getWorldQuaternion(new THREE.Quaternion());
    const tgt = new THREE.Vector3(0, 0.07, 0.03).applyQuaternion(q).add(hp);
    const dir = new THREE.Vector3(dx, 0.05, 1).applyQuaternion(q).normalize(), up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const cam = new THREE.PerspectiveCamera(12, w / h, 0.05, 50); cam.up.copy(up); cam.position.copy(tgt).addScaledVector(dir, 1.6); cam.lookAt(tgt); cam.updateMatrixWorld();
    const ow = renderer.domElement.width, oh = renderer.domElement.height, pr = renderer.getPixelRatio();
    renderer.setPixelRatio(1); renderer.setSize(w, h, false); if (hideUi) hideUi(true); renderer.render(scene, cam);
    const u = renderer.domElement.toDataURL('image/png'); if (hideUi) hideUi(false); renderer.setPixelRatio(pr); renderer.setSize(ow / pr, oh / pr, false); return u;
  };
  if (HAIR !== 'none' && head) info.hairReady = loadHair(head, info, OF);
  return info;
}

/* ---------- 发型（刚性挂 head 骨骼 = 100% 权重绑头骨） ---------- */
const hairVS = /* glsl */`
varying vec3 vN;
varying vec3 vV;
varying vec3 vL;
varying vec3 vNL;
void main() {
  vN = normalize(normalMatrix * normal);
  vL = position; vNL = normal;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const hairFS = /* glsl */`
uniform vec3 uBase;
uniform vec3 uShade;
uniform vec3 uHi;
uniform vec3 uLight;
uniform float uRib;
varying vec3 vN;
varying vec3 vV;
varying vec3 vL;
varying vec3 vNL;
void main() {
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vV), l = normalize(uLight);
  float nl = dot(n, l);
  float aB = max(fwidth(nl), 1e-4);
  float b = smoothstep(0.10 - aB, 0.10 + aB, nl);           // 两阶明暗（与身体同阈值）
  vec3 lit = mix(uShade, uBase, b);
  if (uRib > 0.0) {                                           // 毛线帽竖向罗纹：细的暗条
    float a = atan(vL.x, vL.z) * uRib / 6.2831853;
    float fr = abs(fract(a) - 0.5); float aw = max(fwidth(a), 1e-4);
    lit *= 1.0 - 0.10 * smoothstep(0.36 - aw, 0.36 + aw, fr);
  } else {                                                    // 头发高光（硬边小色块）
    // 天使环：头部局部法线的仰角落在一条窄带里（随头转），只在受光面；被发片几何打碎成一段段
    float ny = normalize(vNL).y; float aS = max(fwidth(ny), 1e-4);
    float ring = smoothstep(0.50 - aS, 0.50 + aS, ny) * (1.0 - smoothstep(0.66 - aS, 0.66 + aS, ny));
    float face = smoothstep(0.25, 0.35, nl);
    lit = mix(lit, uHi, ring * face * 0.6);
  }
  #ifndef NORIM
  float fr2 = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.6); float aR = max(fwidth(fr2), 1e-4);
  lit += mix(uBase, vec3(1.0), 0.5) * smoothstep(0.62 - aR, 0.62 + aR, fr2) * 0.25 * b;   // 硬边缘光（弱于身体）
  #endif
  gl_FragColor = vec4(lit, 1.0);
  #include <colorspace_fragment>
}`;
const HAIR_LINE_W = 0.0035;
const hairOl2VS = /* glsl */`
attribute vec3 _oln;
${ol2Pars}
void main() { gl_Position = ol2Clip(modelViewMatrix * vec4(position, 1.0), normalize(normalMatrix * _oln), ${OL2.hair.toFixed(3)}); }`;
const hairOlVS = /* glsl */`
attribute vec3 _oln;
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normalize(_oln) * ${HAIR_LINE_W.toFixed(4)}, 1.0); }`;
async function loadHair(head, info, OF) {
  const gltf = await new GLTFLoader().loadAsync('./model/hair-v3r5.glb');
  const hc = HAIRC[QS.get('hairc')] || HAIRC.black;
  const capC = /^[0-9a-f]{6}$/i.test(QS.get('cap') || '') ? ['#' + QS.get('cap'), '#' + new THREE.Color('#' + QS.get('cap')).multiplyScalar(0.55).getHexString()] : OF.cap;
  const light = new THREE.Vector3(-0.45, 0.75, 0.55);
  const mk = (base, shade, hi, rib) => new THREE.ShaderMaterial({ name: 'toon-hair', ...(STYLE2 && !RIM ? { defines: { NORIM: '' } } : {}), uniforms: { uBase: { value: new THREE.Color(base) }, uShade: { value: new THREE.Color(shade) }, uHi: { value: new THREE.Color(hi) }, uLight: { value: light }, uRib: { value: rib } }, vertexShader: hairVS, fragmentShader: hairFS });
  const mats = { hair: mk(hc[0], hc[1], hc[2], 0), beanie: mk(capC[0], capC[1], capC[0], 46) };
  const olMat = STYLE2
    ? new THREE.ShaderMaterial({ name: 'toon-hair-outline-r2', uniforms: { ...ol2Uniforms(), uColor: { value: new THREE.Color(OL2.hairInk) } }, vertexShader: hairOl2VS, fragmentShader: outlineFS, side: THREE.BackSide })
    : new THREE.ShaderMaterial({ name: 'toon-hair-outline', uniforms: { uColor: { value: new THREE.Color(LINE) } }, vertexShader: hairOlVS, fragmentShader: outlineFS, side: THREE.BackSide });
  const grp = new THREE.Group(); grp.name = 'hair-' + HAIR; grp.userData.__hair = true;
  const out = { style: HAIR, meshes: [] };
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    const style = (o.parent && o.parent.name.startsWith('hair_') ? o.parent.name : o.name).replace(/^hair_/, '').replace(/_\d+$/, '');
    if (style !== HAIR) return;
    const region = (o.material.userData && o.material.userData.region) || o.material.name;
    const m = new THREE.Mesh(o.geometry, mats[region] || mats.hair); m.name = o.name; m.userData.region = region; m.frustumCulled = false; m.raycast = () => { };
    const ol = new THREE.Mesh(o.geometry, olMat); ol.userData.__outline = true; ol.frustumCulled = false; ol.renderOrder = -1; ol.raycast = () => { };
    m.add(ol); grp.add(m);
    out.meshes.push({ name: o.name, region, verts: o.geometry.attributes.position.count, tris: o.geometry.index.count / 3 });
  });
  head.add(grp);   // 几何已是 head 局部坐标（静止时 head 无旋转），随头骨刚性运动
  info.hairInfo = out;
  return out;
}
