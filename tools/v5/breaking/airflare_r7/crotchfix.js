/* Air Flare r7 裆部/臀部「绷平」校正（仅 b2000 预览；?cf=0 关闭）
 * 问题：张腿时 LBS 把两腿之间的裆部与臀缝中线往里拉，视频机位看到 U 形凹口。
 * 做法：每帧（scene.onBeforeRender，骨骼世界矩阵已更新）在 CPU 上对 pants 网格裆部/臀部区域做 LBS，再加两种位移：
 *  A 臀部横截面（rows）：以髋轴为心按矢状角 φ 分 2° 行，每行横跨 |x|<A 的截面相对两端（x=±A）连弦的凹陷，
 *    不允许比静止时更深 → 多出来的部分沿弦外法线抬平（布料绷住两侧臀峰）；
 *  B 两腿之间（strip）：按两大腿角平分线 D / 连线 U 建坐标，2 cm 切片内低于 u=±a 两侧轮廓弦的列整体沿 D 抬到弦。
 *  两者取幅度大者，焊接邻域平滑、限幅、条带边界渐隐，换算回绑定空间写入 position（描边共享几何同步）。
 * 强度随两大腿夹角 θ 渐入：θ≤th0 为 0（站姿/并腿/小角度完全不动），θ≥th1 满强度。 */
import * as THREE from 'three';
export function applyCrotchFix({ scene, mesh, opts = {} }) {
  const q = new URLSearchParams(location.search), num = (k, d) => (q.has(k) ? +q.get(k) : d);
  const P = { a: num('cfa', 0.10), A: num('cfA', 0.11), rmax: num('cfr', 0.06), inner: num('cfin', 0.2), k: num('cfk', 1), kA: num('cfkA', 0.8), kB: num('cfkB', 1), th0: num('cft0', 50), th1: num('cft1', 90),
    it: num('cfi', 70), cap: num('cfc', 0.07), dn: 0.10, up: 0.03, xs: 0.10, zs: 0.14, wb: 0.02, Y0: 0.90, Z0: 0.0, dphi: 2, phmax: num('cfp', -30), phf: num('cfpf', 40), mi: num('cfmi', 120), mu: num('cfmu', 0.04), ...opts };
  const g = mesh.geometry, pa = g.attributes.position, n = pa.count;
  const rest = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { rest[3 * i] = pa.getX(i); rest[3 * i + 1] = pa.getY(i); rest[3 * i + 2] = pa.getZ(i); }
  const fpos = new THREE.BufferAttribute(new Float32Array(rest), 3); fpos.setUsage(THREE.DynamicDrawUsage); g.setAttribute('position', fpos);
  const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, bonesArr = mesh.skeleton.bones;
  const iL = bonesArr.findIndex(b => b.name === 'leftThigh'), iR = bonesArr.findIndex(b => b.name === 'rightThigh');
  const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  // 静止姿势蒙皮后的网格空间坐标（量化 glb 的绑定空间不是米，反量化折进了 IBM）
  mesh.updateMatrixWorld(true); bonesArr.forEach(b => b.updateMatrixWorld(true));
  const W0 = new Float32Array(n * 3);
  { const B = bonesArr.map((b, j) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, mesh.skeleton.boneInverses[j])); const v = new THREE.Vector3(), t = new THREE.Vector3(), o = new THREE.Vector3();
    for (let i = 0; i < n; i++) { v.set(rest[3 * i], rest[3 * i + 1], rest[3 * i + 2]).applyMatrix4(mesh.bindMatrix); o.set(0, 0, 0);
      for (let c = 0; c < 4; c++) { const w = SW.getComponent(i, c); if (w > 0) o.addScaledVector(t.copy(v).applyMatrix4(B[SI.getComponent(i, c)]), w); }
      o.applyMatrix4(mesh.bindMatrixInverse); W0[3 * i] = o.x; W0[3 * i + 1] = o.y; W0[3 * i + 2] = o.z; } }
  // 裆线 Yl(z)：中线 |x|<6 mm 每 1 cm z 的最低 y
  const zb = [], yl = [];
  for (let zz = -0.16; zz <= 0.1601; zz += 0.01) { let mn = Infinity; for (let i = 0; i < n; i++) { const x = W0[3 * i], y = W0[3 * i + 1], z = W0[3 * i + 2]; if (Math.abs(x) < 0.006 && Math.abs(z - zz) < 0.006 && y < 1 && y > 0.6 && y < mn) mn = y; } zb.push(zz); yl.push(mn); }
  const okz = yl.map(v => isFinite(v));
  const Yl = z => { let lo = -1, hi = -1; for (let k = 0; k < zb.length; k++) { if (!okz[k]) continue; if (zb[k] <= z) lo = k; if (zb[k] >= z && hi < 0) hi = k; }
    if (lo < 0) return yl[hi]; if (hi < 0 || hi === lo) return yl[lo]; return yl[lo] + (yl[hi] - yl[lo]) * (z - zb[lo]) / (zb[hi] - zb[lo]); };
  // 臀部横截面行：矢状角 φ（0 = 正下，+ 前，− 后），行内中线半径 rmid
  const phiOf = i => { const dy = W0[3 * i + 1] - P.Y0, dz = W0[3 * i + 2] - P.Z0; return [Math.atan2(dz, -dy) * 180 / Math.PI, Math.hypot(dy, dz)]; };
  const rmid = new Map();
  for (let i = 0; i < n; i++) { if (Math.abs(W0[3 * i]) >= 0.008 || W0[3 * i + 1] >= 1) continue; const [ph, r] = phiOf(i), b = Math.round(ph / P.dphi); if (!rmid.has(b) || r < rmid.get(b)) rmid.set(b, r); }
  const list = [], inS = [], rowB = [], fadeS = [], rowF = [];
  for (let i = 0; i < n; i++) {
    const x = W0[3 * i], y = W0[3 * i + 1], z = W0[3 * i + 2]; let s = false, rb = null, f = 0;
    if (Math.abs(x) < P.xs && Math.abs(z) < P.zs) { const dy = y - Yl(z); if (dy < P.up && dy > -P.dn) { s = true; f = sm((P.up - dy) / 0.02) * sm((dy + P.dn) / 0.04) * sm((P.xs - Math.abs(x)) / 0.03) * sm((P.zs - Math.abs(z)) / 0.03); } }
    let rf = 0; if (Math.abs(x) < P.A + 0.012 && y < 1) { const [ph, r] = phiOf(i), b = Math.round(ph / P.dphi); if (ph > -110 && ph < P.phmax && rmid.has(b) && r < rmid.get(b) + P.rmax) { rb = b; rf = sm((P.phmax - ph) / P.phf) * sm((ph + 110) / 20) * sm((rmid.get(b) + P.rmax - r) / (0.5 * P.rmax)); } }
    if (s || rb !== null) { list.push(i); inS.push(s); rowB.push(rb); fadeS.push(f); rowF.push(rf); }
  }
  const S = Int32Array.from(list), m = S.length;
  const rows = new Map(); // b -> {L:[k], R:[k], In:[k]}
  for (let k = 0; k < m; k++) { const b = rowB[k]; if (b === null) continue; let o = rows.get(b); if (!o) rows.set(b, o = { L: [], R: [], In: [] }); const x = W0[3 * S[k]];
    if (Math.abs(x + P.A) < 0.012) o.L.push(k); if (Math.abs(x - P.A) < 0.012) o.R.push(k); if (Math.abs(x) < P.A) o.In.push(k); }
  for (const [b, o] of rows) if (!o.L.length || !o.R.length) rows.delete(b);
  // 焊接邻接
  const key = i => Math.round(W0[3 * i] * 1e5) + ',' + Math.round(W0[3 * i + 1] * 1e5) + ',' + Math.round(W0[3 * i + 2] * 1e5);
  const loc = new Map(); S.forEach((v, k) => loc.set(v, k));
  const wk = new Map(), wid = new Int32Array(m); let nw = 0;
  for (let k = 0; k < m; k++) { const kk = key(S[k]); if (!wk.has(kk)) wk.set(kk, nw++); wid[k] = wk.get(kk); }
  const nbs = Array.from({ length: nw }, () => new Set()), idx = g.index.array;
  for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) { const a = loc.get(idx[t + e]), b = loc.get(idx[t + (e + 1) % 3]); if (a === undefined || b === undefined) continue; const A = wid[a], B = wid[b]; if (A !== B) { nbs[A].add(B); nbs[B].add(A); } }
  const NB = nbs.map(s => Int32Array.from(s));
  const bm = Array.from({ length: bonesArr.length }, () => new THREE.Matrix4());
  const LP = new Float32Array(m * 3), Hh = new Float32Array(m), Uu = new Float32Array(m), Ww = new Float32Array(m);
  const dB = new Float32Array(nw), hN = new Float32Array(nw), cN = new Float32Array(nw), cnt2 = new Float32Array(nw), tN = new Float32Array(nw), tN2 = new Float32Array(nw), cntW = new Float32Array(nw), dv = new Float32Array(nw * 3), dv2 = new Float32Array(nw * 3), Ainv = new THREE.Matrix3();
  const v = new THREE.Vector3(), tmp = new THREE.Vector3(), Hv = new THREE.Vector3(), M = new THREE.Matrix4(), Me = M.elements, T = new THREE.Matrix4();
  const jl = new THREE.Vector3(), jr = new THREE.Vector3(), dl = new THREE.Vector3(), dr = new THREE.Vector3(), qq = new THREE.Quaternion();
  const D = new THREE.Vector3(), U = new THREE.Vector3(), Wv = new THREE.Vector3(), Hc = new THREE.Vector3(), inv = new THREE.Matrix4();
  const st = { verts: m, welded: nw, rows: rows.size, theta: 0, s: 0, maxLift: 0, moved: 0, frames: 0 };
  let dirty = false, lastS = -1; const sig = new Float64Array(bonesArr.length * 16);
  function update() { const t0 = performance.now(); try { update_(); } finally { st.ms = +(performance.now() - t0).toFixed(2); } }
  function update_() {
    const bL = bonesArr[iL], bR = bonesArr[iR];
    inv.copy(mesh.matrixWorld).invert(); bL.getWorldPosition(jl).applyMatrix4(inv); bR.getWorldPosition(jr).applyMatrix4(inv);
    dl.set(0, -1, 0).applyQuaternion(bL.getWorldQuaternion(qq)); dr.set(0, -1, 0).applyQuaternion(bR.getWorldQuaternion(qq));
    const th = Math.acos(Math.max(-1, Math.min(1, dl.dot(dr)))) * 180 / Math.PI, s = P.k * sm((th - P.th0) / (P.th1 - P.th0));
    st.theta = th; st.s = s; st.frames++;
    if (s <= 1e-4) { if (dirty) { fpos.array.set(rest); fpos.needsUpdate = true; dirty = false; } st.maxLift = 0; st.moved = 0; return; }
    D.copy(dl).add(dr).normalize(); U.copy(dl).sub(dr); U.addScaledVector(D, -U.dot(D)).normalize(); Wv.crossVectors(D, U); Hc.copy(jl).add(jr).multiplyScalar(0.5);
    for (let j = 0; j < bonesArr.length; j++) bm[j].multiplyMatrices(bonesArr[j].matrixWorld, mesh.skeleton.boneInverses[j]);
    { let same = dirty && st.s === s; for (let j = 0; j < bonesArr.length; j++) { const e = bm[j].elements; for (let t = 0; t < 16; t++) { if (same && sig[16 * j + t] !== e[t]) same = false; sig[16 * j + t] = e[t]; } } if (same && lastS === s) { st.cached = (st.cached || 0) + 1; return; } lastS = s; }
    for (let k = 0; k < m; k++) {
      const i = S[k]; v.set(rest[3 * i], rest[3 * i + 1], rest[3 * i + 2]).applyMatrix4(mesh.bindMatrix); tmp.set(0, 0, 0);
      for (let c = 0; c < 4; c++) { const w = SW.getComponent(i, c); if (w > 0) tmp.addScaledVector(Hv.copy(v).applyMatrix4(bm[SI.getComponent(i, c)]), w); }
      tmp.applyMatrix4(mesh.bindMatrixInverse); LP[3 * k] = tmp.x; LP[3 * k + 1] = tmp.y; LP[3 * k + 2] = tmp.z;
      const x = tmp.x - Hc.x, y = tmp.y - Hc.y, z = tmp.z - Hc.z; Hh[k] = x * D.x + y * D.y + z * D.z; Uu[k] = x * U.x + y * U.y + z * U.z; Ww[k] = x * Wv.x + y * Wv.y + z * Wv.z;
    }
    dv.fill(0); cntW.fill(0);
    // ---- B：两腿之间「膜」——沿 D 的高度场在条带内做调和（拉普拉斯）插值，两侧大腿内侧(|u|>a)与条带边缘为边界；只抬不压
    const vB = dB; vB.fill(0);
    if (P.kB > 0) {
      hN.fill(0); cN.fill(0); cnt2.fill(0);
      for (let k = 0; k < m; k++) { const A = wid[k]; hN[A] += Hh[k]; cnt2[A]++; if (inS[k]) { const c = fadeS[k] * sm((P.a - Math.abs(Uu[k])) / P.mu); if (c > cN[A]) cN[A] = c; } }
      for (let A = 0; A < nw; A++) { hN[A] /= cnt2[A]; tN[A] = hN[A]; }
      for (let it = 0; it < P.mi; it++) { for (let A = 0; A < nw; A++) { const c = cN[A]; if (c <= 0) { tN2[A] = hN[A]; continue; } const L = NB[A]; let sum = 0; for (let t = 0; t < L.length; t++) sum += tN[L[t]]; tN2[A] = (1 - c) * hN[A] + c * (L.length ? sum / L.length : tN[A]); } tN.set(tN2); }
      for (let A = 0; A < nw; A++) vB[A] = cN[A] > 0 ? P.kB * Math.max(0, tN[A] - hN[A]) : 0;
    }
    // ---- A：臀部横截面行（凹陷不得深于静止）
    if (P.kA > 0) for (const o of rows.values()) {
      const pl = [0, 0, 0], pr = [0, 0, 0], ql = [0, 0, 0], qr = [0, 0, 0];
      for (const k of o.L) for (let c = 0; c < 3; c++) { pl[c] += LP[3 * k + c] / o.L.length; ql[c] += W0[3 * S[k] + c] / o.L.length; }
      for (const k of o.R) for (let c = 0; c < 3; c++) { pr[c] += LP[3 * k + c] / o.R.length; qr[c] += W0[3 * S[k] + c] / o.R.length; }
      const nrm = (e, mid, h) => { const el = Math.hypot(...e); const E = e.map(x => x / el), d = [mid[0] - h[0], mid[1] - h[1], mid[2] - h[2]], dd = d[0] * E[0] + d[1] * E[1] + d[2] * E[2]; const N = d.map((x, c) => x - dd * E[c]), nl = Math.hypot(...N); return N.map(x => x / nl); };
      const N = nrm([pr[0] - pl[0], pr[1] - pl[1], pr[2] - pl[2]], [(pl[0] + pr[0]) / 2, (pl[1] + pr[1]) / 2, (pl[2] + pr[2]) / 2], [Hc.x, Hc.y, Hc.z]);
      const N0 = nrm([qr[0] - ql[0], qr[1] - ql[1], qr[2] - ql[2]], [(ql[0] + qr[0]) / 2, (ql[1] + qr[1]) / 2, (ql[2] + qr[2]) / 2], [0, P.Y0, P.Z0]);
      for (const k of o.In) {
        const i = S[k], x = W0[3 * i], f = (x + P.A) / (2 * P.A); let d = 0, d0 = 0;
        for (let c = 0; c < 3; c++) { d += (pl[c] + (pr[c] - pl[c]) * f - LP[3 * k + c]) * N[c]; d0 += (ql[c] + (qr[c] - ql[c]) * f - W0[3 * i + c]) * N0[c]; }
        const l = P.kA * rowF[k] * sm((P.A - Math.abs(x)) / (P.A * (1 - P.inner))) * Math.max(0, d - d0); if (l <= 0) continue;
        const A = wid[k], cur = Math.hypot(dv[3 * A], dv[3 * A + 1], dv[3 * A + 2]);
        if (l > cur) { dv[3 * A] = l * N[0]; dv[3 * A + 1] = l * N[1]; dv[3 * A + 2] = l * N[2]; }
      }
    }
    // 合成：B 只补 A 沿 D 未提供的部分
    for (let A = 0; A < nw; A++) { const b = vB[A]; if (b <= 0) continue; const ad = dv[3 * A] * D.x + dv[3 * A + 1] * D.y + dv[3 * A + 2] * D.z, e = Math.max(0, b - ad); dv[3 * A] += e * D.x; dv[3 * A + 1] += e * D.y; dv[3 * A + 2] += e * D.z; }
    // 平滑 + 限幅
    for (let it = 0; it < P.it; it++) { for (let A = 0; A < nw; A++) { const L = NB[A]; for (let c = 0; c < 3; c++) { let sum = 0; for (let t = 0; t < L.length; t++) sum += dv[3 * L[t] + c]; dv2[3 * A + c] = L.length ? 0.5 * dv[3 * A + c] + 0.5 * sum / L.length : dv[3 * A + c]; } } dv.set(dv2); }
    let mx = 0, mv = 0; const arr = fpos.array;
    for (let k = 0; k < m; k++) {
      const i = S[k], A = wid[k]; let lx = s * dv[3 * A], ly = s * dv[3 * A + 1], lz = s * dv[3 * A + 2]; let l = Math.hypot(lx, ly, lz);
      if (l > P.cap) { const r = P.cap / l; lx *= r; ly *= r; lz *= r; l = P.cap; } if (l > mx) mx = l;
      if (l < 1e-5) { arr[3 * i] = rest[3 * i]; arr[3 * i + 1] = rest[3 * i + 1]; arr[3 * i + 2] = rest[3 * i + 2]; continue; }
      mv++; M.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      for (let c = 0; c < 4; c++) { const w = SW.getComponent(i, c); if (w > 0) { const e = bm[SI.getComponent(i, c)].elements; for (let t = 0; t < 16; t++) Me[t] += w * e[t]; } }
      T.multiplyMatrices(mesh.bindMatrixInverse, M).multiply(mesh.bindMatrix); Ainv.setFromMatrix4(T).invert();
      tmp.set(lx, ly, lz).applyMatrix3(Ainv);
      arr[3 * i] = rest[3 * i] + tmp.x; arr[3 * i + 1] = rest[3 * i + 1] + tmp.y; arr[3 * i + 2] = rest[3 * i + 2] + tmp.z;
    }
    fpos.needsUpdate = true; dirty = true; st.maxLift = mx; st.moved = mv;
  }
  const prev = scene.onBeforeRender;
  scene.onBeforeRender = function (...args) { if (prev) prev.apply(this, args); try { update(); } catch (e) { st.err = String(e); } };
  return { stats: st, params: P, update };
}
