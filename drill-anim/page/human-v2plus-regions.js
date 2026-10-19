// training-human-v2plus: BAKED muscle regions (opt-in: spec.v2plus.regions = 'baked'; DRAFT 2026-10-20).
// The whole body (base-mesh torso, tee collar band, v2 arm/leg skin, head, hands, shoes) is partitioned into named muscle regions
// (drill-anim/models/training-human-v2plus-regions.json: 40 base regions x L/R = 80 ids), drawn like an anatomy atlas: plain light
// grey, thin dark outlines on every region border, crisp per-region highlight.
// Technique:
//   1. Each base region is a designed shape (rounded polygon / box / ellipse / capsule) in a smooth chart of the REST surface
//      (torso cylinder (s, y), upper arm / forearm / thigh / shin (axial t, circumferential arc a), wrapped around the limb seam),
//      plus soft part gates (arm weight, groin / gluteal-fold line, knee, elbow, wrist, ankle, neck). Its value is a signed distance
//      (metres, < 0 inside). The partition is the argmin over all 80 ids (L/R by a midline gate), so every vertex has a region and
//      gaps between shapes are split half-way (Voronoi of shapes).
//   2. Bake per vertex: region ids are greedily coloured into 8 channels so that regions touching on the mesh (shared triangle /
//      vertex ring, welded across meshes) never share a channel. Each vertex stores, per channel, the min distance over that
//      channel's regions and which region it was (4 RGBA texels per vertex, read in the vertex shader by gl_VertexID).
//   3. Per pixel: linear interpolation of the 8 channel distances; region = best channel, border = where the best and second best
//      meet. g = f2 - f1 >= 0 and g / fwidth(g) is the pixel distance to the border -> constant ~1.5 px anti-aliased outline,
//      sub-triangle accurate (no staircase), identical on both sides of a weld; highlight = selected ids, blended at the border.
// Nothing changes unless a spec sets v2plus.regions:'baked' (lib/human-v2plus.mjs loads this file only then).
(function(){
const V2P = window.__v2p; if (!V2P) throw new Error('v2plus regions: load human-v2plus.js first');
const R = V2P.regions = { on: false, data: null, key: null };
const T = () => window.__toonT;
// ---------- charts (same as human-v2plus.js GLSL; rest pose, metres, p.x = |x|) ----------
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => a + (b - a) * k;
const zc = y => mix(mix(0.012, 0.026, ss(0.80, 0.90, y)), mix(0.052, 0.028, ss(1.16, 1.34, y)), ss(0.92, 1.06, y));
const nrm = v => { const l = Math.hypot(...v); return v.map(c => c / l); }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function limbChart(A, B, ref0, ref90, Rr) { const u = nrm(B.map((c, i) => c - A[i])); let e0 = nrm(ref0.map((c, i) => c - u[i] * dot(ref0, u))); let e1 = nrm(cross(u, e0)); if (dot(e1, ref90) < 0) e1 = e1.map(c => -c);
  return { P: 2 * Math.PI * Rr, f: p => { const d = [p[0] - A[0], p[1] - A[1], p[2] - A[2]]; const t = dot(d, u); const r = d.map((c, i) => c - u[i] * t); return [t, Rr * Math.atan2(dot(r, e1), dot(r, e0)), Math.hypot(...r)]; } }; }
const UA = limbChart([0.188, 1.370, -0.004], [0.234, 1.118, 0.011], [1, 0, 0], [0, 0, 1], 0.045);
const FA = limbChart([0.234, 1.118, 0.011], [0.253, 0.892, 0.030], [1, 0, 0], [0, 0, 1], 0.035);
const TH = limbChart([0.082, 0.852, 0.006], [0.082, 0.499, 0.007], [-1, 0, 0], [0, 0, 1], 0.075);
const SH = limbChart([0.082, 0.499, 0.007], [0.083, 0.090, -0.019], [1, 0, 0], [0, 0, 1], 0.045);
// ---------- 2D signed distances (x = circumferential / s, y = axial / height) ----------
function box(px, py, lx, ly, hx, hy, r) { const cx = (lx + hx) / 2, cy = (ly + hy) / 2, h0 = (hx - lx) / 2 - r, h1 = (hy - ly) / 2 - r; const qx = Math.abs(px - cx) - h0, qy = Math.abs(py - cy) - h1;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; }
function ell(px, py, cx, cy, rx, ry, rot = 0) { let dx = px - cx, dy = py - cy; if (rot) { const c = Math.cos(rot), s = Math.sin(rot); [dx, dy] = [c * dx + s * dy, -s * dx + c * dy]; } return (Math.hypot(dx / rx, dy / ry) - 1) * Math.min(rx, ry); }
function poly(px, py, V, r) { let d = Infinity, s = 1; for (let i = 0, j = V.length - 1; i < V.length; j = i, i++) { const ex = V[j][0] - V[i][0], ey = V[j][1] - V[i][1], wx = px - V[i][0], wy = py - V[i][1];
    const h = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey))); d = Math.min(d, (wx - ex * h) ** 2 + (wy - ey * h) ** 2);
    const c1 = py >= V[i][1], c2 = py < V[j][1], c3 = ex * wy > ey * wx; if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s; }
  return s * Math.sqrt(d) - r; }
function seg(px, py, ax, ay, bx, by, r) { const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay; const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay))); return Math.hypot(pax - bax * h, pay - bay * h) - r; }
// limb shapes see the chart wrapped around the seam (a, a +- circumference)
const wrap = (L, a, fn) => Math.min(fn(a), fn(a + L.P), fn(a - L.P));
const pos = x => Math.max(0, x);
// ---------- base region shapes: fn(c) -> signed distance (m), c = per-vertex charts + gates ----------
const S = {
  // torso front (q = [s, y]; s = 0 front midline .. 0.408 back midline)
  'pec': c => poly(c.s, c.y, [[0.012, 1.200], [0.070, 1.180], [0.128, 1.215], [0.150, 1.290], [0.142, 1.335], [0.012, 1.345]], 0.012) + c.gT,
  'rectus-upper': c => box(c.s, c.y, 0.0, 1.110, 0.086, 1.190, 0.012) + c.gT,
  'rectus-mid': c => box(c.s, c.y, 0.0, 1.040, 0.086, 1.110, 0.006) + c.gT,
  'rectus-lower': c => box(c.s, c.y, 0.0, 0.870, 0.086, 1.040, 0.018) + c.gT,
  'oblique': c => poly(c.s, c.y, [[0.112, 0.900], [0.228, 0.925], [0.232, 1.040], [0.175, 1.120], [0.112, 1.165]], 0.012) + c.gT,
  'serratus': c => poly(c.s, c.y, [[0.150, 1.165], [0.200, 1.175], [0.200, 1.255], [0.158, 1.240]], 0.010) + c.gT,
  'hip-flexor': c => ell(c.s, c.y, 0.108, 0.845, 0.027, 0.070, 0.62) + c.gT,
  'neck': c => box(c.s, c.y, 0.0, 1.380, 0.075, 1.470, 0.014) + c.gT,
  // torso back (b = 0.408 - s: 0 spine .. lateral)
  'trap-upper': c => poly(c.b, c.y, [[0.0, 1.360], [0.095, 1.355], [0.175, 1.390], [0.150, 1.420], [0.040, 1.450], [0.0, 1.455]], 0.010) + c.gT,
  'trap-mid': c => poly(c.b, c.y, [[0.0, 1.085], [0.050, 1.180], [0.105, 1.300], [0.090, 1.350], [0.0, 1.360]], 0.012) + c.gT,
  'rhomboid': c => poly(c.b, c.y, [[0.040, 1.215], [0.072, 1.235], [0.084, 1.305], [0.046, 1.315]], 0.008) + c.gT + 0.004,
  'infraspinatus': c => ell(c.b, c.y, 0.135, 1.272, 0.040, 0.036) + c.gT,
  'teres-major': c => ell(c.b, c.y, 0.160, 1.212, 0.034, 0.016, -0.5) + c.gT,
  'lat': c => poly(c.b, c.y, [[0.030, 0.975], [0.110, 1.010], [0.190, 1.140], [0.205, 1.235], [0.150, 1.200], [0.070, 1.150], [0.030, 1.110]], 0.016) + c.gT,
  'erector': c => box(c.b, c.y, 0.0, 0.860, 0.048, 1.150, 0.016) + c.gT,
  'glute-max': c => box(c.b, c.y, 0.0, 0.705, 0.128, 0.895, 0.045) + c.gT,
  'glute-med': c => ell(c.b, c.y, 0.190, 0.905, 0.060, 0.050) + c.gT,
  // deltoid cap in the upper-arm chart, split by angle (front / lateral / back); not gated by arm weight (the shoulder cap is torso-weighted)
  'delt-front': c => Math.max(c.delt, 0.035 - c.ua[1]),
  'delt-side': c => Math.max(c.delt, Math.abs(c.ua[1]) - 0.035),
  'delt-rear': c => Math.max(c.delt, c.ua[1] + 0.035),
  // upper arm (a: 0 lateral, + front, - back, medial seam)
  'biceps': c => wrap(UA, c.ua[1], a => box(a, c.ua[0], 0.032, 0.105, 0.125, 0.240, 0.016)) + c.gA + c.gU,
  'triceps': c => wrap(UA, c.ua[1], a => box(a, c.ua[0], -0.125, 0.095, -0.030, 0.240, 0.016)) + c.gA + c.gU,
  'brachialis': c => wrap(UA, c.ua[1], a => box(a, c.ua[0], -0.022, 0.160, 0.026, 0.240, 0.010)) + c.gA + c.gU,
  // forearm (a: 0 lateral, + front, - back)
  'forearm-flexor': c => wrap(FA, c.fa[1], a => box(a, c.fa[0], 0.006, 0.010, 0.104, 0.215, 0.012)) + c.gA + c.gF,
  'forearm-extensor': c => wrap(FA, c.fa[1], a => box(a, c.fa[0], -0.104, 0.010, 0.000, 0.215, 0.012)) + c.gA + c.gF,
  'hand': c => Math.max(0.226 - c.fa[0], c.fa[0] - 0.46) + 4 * c.gA,
  // thigh (a: 0 medial, + front, - back, lateral seam)
  'rectus-femoris': c => wrap(TH, c.th[1], a => poly(a, c.th[0], [[0.088, 0.075], [0.138, 0.075], [0.142, 0.200], [0.124, 0.300], [0.094, 0.300], [0.082, 0.200]], 0.012)) + c.gL,
  'vastus-lat': c => wrap(TH, c.th[1], a => poly(a, c.th[0], [[0.150, 0.110], [0.236, 0.100], [0.250, 0.290], [0.160, 0.330], [0.145, 0.220]], 0.012)) + c.gL,
  'vastus-med': c => wrap(TH, c.th[1], a => poly(a, c.th[0], [[0.034, 0.205], [0.076, 0.195], [0.086, 0.300], [0.060, 0.338], [0.032, 0.305]], 0.012)) + c.gL,
  'sartorius': c => wrap(TH, c.th[1], a => seg(a, c.th[0], 0.150, 0.040, 0.030, 0.290, 0.006)) + c.gL,
  'adductor': c => wrap(TH, c.th[1], a => poly(a, c.th[0], [[-0.040, 0.075], [0.050, 0.075], [0.030, 0.190], [-0.010, 0.245]], 0.012)) + c.gL,
  'hamstring-med': c => wrap(TH, c.th[1], a => box(a, c.th[0], -0.122, 0.125, -0.050, 0.315, 0.014)) + c.gL,
  'hamstring-lat': c => wrap(TH, c.th[1], a => box(a, c.th[0], -0.205, 0.115, -0.130, 0.315, 0.014)) + c.gL,
  // shin (a: 0 lateral, + front, - back, medial seam)
  'tibialis': c => wrap(SH, c.sh[1], a => box(a, c.sh[0], 0.012, 0.050, 0.060, 0.300, 0.012)) + c.gS,
  'peroneal': c => wrap(SH, c.sh[1], a => box(a, c.sh[0], -0.026, 0.070, 0.002, 0.280, 0.010)) + c.gS,
  'gastro-lat': c => wrap(SH, c.sh[1], a => ell(a, c.sh[0], -0.054, 0.120, 0.024, 0.085)) + c.gS,
  'gastro-med': c => wrap(SH, c.sh[1], a => ell(a, c.sh[0], -0.106, 0.130, 0.028, 0.095)) + c.gS,
  'soleus': c => wrap(SH, c.sh[1], a => box(a, c.sh[0], -0.135, 0.230, -0.030, 0.330, 0.020)) + c.gS,
  'foot': c => 0.398 - c.sh[0] + c.gB,
  'head': c => 1.488 - c.y + c.gB,
};
// per-vertex charts + part gates (x mirrored to |x|; arm = skin weight on arm/hand bones)
function charts(x, y, z, arm) { const p = [Math.abs(x), y, z]; const s = 0.13 * Math.atan2(p[0], z - zc(y));
  const ua = UA.f(p), fa = FA.f(p), th = TH.f(p), sh = SH.f(p);
  // groin crease (front) .. gluteal fold (back), continuous around the thigh
  const tTop = 0.075 + 0.075 * ss(0.3, -0.5, Math.sin(th[1] / 0.075));
  const gArm = pos(arm - 0.45) * 0.5, gNotArm = pos(0.55 - arm) * 0.5;
  const c = { s, b: 0.408 - s, y, ua, fa, th, sh, gB: gArm };
  c.gT = gArm + 2 * pos(th[0] - tTop) * (y < 0.95 ? 1 : 0);                    // torso: not on the arm, not below the groin / gluteal fold
  c.gA = gNotArm;                                                                 // arm: arm-weighted skin only
  c.gU = 2 * pos(ua[0] - 0.262) + 2 * pos(ua[2] - 0.075);                         // upper arm stops at the elbow
  c.gF = 2 * pos(-fa[0] - 0.005);                                                  // forearm starts at the elbow
  c.gL = gArm + 2 * pos(tTop - th[0]) + 2 * pos(th[0] - 0.372);                   // thigh: groin / fold .. knee
  c.gS = gArm + 2 * pos(-sh[0] + 0.005) + 2 * pos(sh[0] - 0.40);                  // shin: knee .. ankle
  c.delt = Math.max(Math.max(poly(ua[1], ua[0], [[-0.105, -0.030], [-0.080, 0.085], [0.0, 0.150], [0.080, 0.085], [0.105, -0.030], [0.0, -0.060]], 0.012), ua[2] - 0.090), 0.115 - p[0]);
  return c; }
// ---------- bake ----------
const MID = 2.0; // midline gate slope: id side L (+x) pays MID * max(0, -x), R pays MID * max(0, x)
function restData(o) { // reset-pose world positions + arm weight (same as human-v2plus.js restTextures)
  const t = T(), g = o.geometry, n = g.attributes.position.count, q = new t.Vector3(), out = new Float32Array(n * 4); const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = o.skeleton.bones;
  for (let i = 0; i < n; i++) { o.getVertexPosition(i, q); q.applyMatrix4(o.matrixWorld); let arm = 0;
    for (let k = 0; k < 4; k++) { const nm = bones[si.getComponent(i, k)]?.name || ''; if (/UpperArm|Forearm|Hand|^v2p_/.test(nm)) arm += sw.getComponent(i, k); }
    out.set([q.x, q.y, q.z, arm], i * 4); }
  return out; }
function bake(meshes, table) {
  const NB = table.base.length, NR = NB * 2, fns = table.base.map(k => { if (!S[k]) throw new Error('v2plus regions: no shape for ' + k); return S[k]; });
  const per = meshes.map(o => { const rd = restData(o), n = rd.length / 4, F = new Float32Array(n * NR), lab = new Int16Array(n);
    for (let i = 0; i < n; i++) { const x = rd[i * 4], c = charts(x, rd[i * 4 + 1], rd[i * 4 + 2], rd[i * 4 + 3]); const gL = MID * pos(-x), gR = MID * pos(x); let best = 1e9, bi = 0;
      for (let b = 0; b < NB; b++) { const v = fns[b](c); const l = v + gL, r = v + gR; F[i * NR + 2 * b] = l; F[i * NR + 2 * b + 1] = r; if (l < best) { best = l; bi = 2 * b; } if (r < best) { best = r; bi = 2 * b + 1; } }
      lab[i] = bi; }
    return { o, rd, n, F, lab }; });
  // adjacency: every pair of labels within one vertex ring (triangle fan), welded across meshes by rest position (0.5 mm)
  const adj = Array.from({ length: NR }, () => new Set()), ring = new Map(), key = (rd, i) => Math.round(rd[i * 4] * 2000) + ',' + Math.round(rd[i * 4 + 1] * 2000) + ',' + Math.round(rd[i * 4 + 2] * 2000);
  for (const P of per) { const g = P.o.geometry, idx = g.index ? g.index.array : null, nf = idx ? idx.length / 3 : P.n / 3;
    for (let f = 0; f < nf; f++) { const v = [0, 1, 2].map(k => idx ? idx[f * 3 + k] : f * 3 + k), L = v.map(i => P.lab[i]);
      for (const i of v) { const kk = key(P.rd, i); let s = ring.get(kk); if (!s) ring.set(kk, s = new Set()); L.forEach(l => s.add(l)); } } }
  for (const s of ring.values()) { const a = [...s]; for (const x of a) for (const y of a) if (x !== y) adj[x].add(y); }
  // 2-hop safety: regions that both touch a third small region also get different channels where possible
  const order = [...Array(NR).keys()].sort((a, b) => adj[b].size - adj[a].size), ch = new Int8Array(NR).fill(-1), NC = 8;
  for (const r of order) { const used = new Set([...adj[r]].map(x => ch[x])); const used2 = new Set(); for (const x of adj[r]) for (const y of adj[x]) if (y !== r) used2.add(ch[y]);
    let c = -1; for (let k = 0; k < NC; k++) if (!used.has(k) && !used2.has(k)) { c = k; break; } if (c < 0) for (let k = 0; k < NC; k++) if (!used.has(k)) { c = k; break; }
    if (c < 0) throw new Error('v2plus regions: 8 channels not enough for region ' + r); ch[r] = c; }
  // per-vertex texture: texel 0/1 = channel distances 0-3 / 4-7, texel 2/3 = region id per channel (-1 = none)
  const t = T(), out = new Map(); let usedIds = new Set();
  for (const P of per) { const H = Math.ceil(P.n * 4 / 1024), buf = new Float32Array(1024 * H * 4);
    for (let i = 0; i < P.n; i++) { const f = new Array(NC).fill(9), id = new Array(NC).fill(-1);
      for (let r = 0; r < NR; r++) { const v = P.F[i * NR + r], c = ch[r]; if (v < f[c]) { f[c] = v; id[c] = r; } }
      buf.set(f.slice(0, 4), i * 16); buf.set(f.slice(4, 8), i * 16 + 4); buf.set(id.slice(0, 4), i * 16 + 8); buf.set(id.slice(4, 8), i * 16 + 12); usedIds.add(P.lab[i]); }
    const tex = new t.DataTexture(buf, 1024, H, t.RGBAFormat, t.FloatType); tex.magFilter = tex.minFilter = t.NearestFilter; tex.needsUpdate = true; out.set(P.o, { tex, lab: P.lab, rd: P.rd }); }
  return { tex: out, channels: Array.from(ch), maxDeg: Math.max(...adj.map(s => s.size)), present: usedIds.size, verts: per.reduce((a, P) => a + P.n, 0) }; }
// ---------- shader ----------
const VS = 'uniform sampler2D uV2pR;varying vec4 vR0;varying vec4 vR1;varying vec4 vR2;varying vec4 vR3;\n';
const VB = '\n { int b4=gl_VertexID*4; vR0=texelFetch(uV2pR,ivec2(b4%1024,b4/1024),0); vR1=texelFetch(uV2pR,ivec2((b4+1)%1024,(b4+1)/1024),0); vR2=texelFetch(uV2pR,ivec2((b4+2)%1024,(b4+2)/1024),0); vR3=texelFetch(uV2pR,ivec2((b4+3)%1024,(b4+3)/1024),0); }';
const FS = `
uniform float uV2pRon; uniform float uV2pRm; uniform float uV2pRSel[80]; uniform vec3 uV2pRGrey; uniform vec3 uV2pRShade; uniform vec3 uV2pRLine; uniform float uV2pRLw;
varying vec4 vR0; varying vec4 vR1; varying vec4 vR2; varying vec4 vR3;
float v2rAct=0.0; float v2rLine=0.0; float v2rG=0.0; float v2rGp=1.0; int v2rId1=-1; int v2rId2=-1;
void v2rEval(){ float f[8]; float d[8]; f[0]=vR0.x; f[1]=vR0.y; f[2]=vR0.z; f[3]=vR0.w; f[4]=vR1.x; f[5]=vR1.y; f[6]=vR1.z; f[7]=vR1.w;
  d[0]=vR2.x; d[1]=vR2.y; d[2]=vR2.z; d[3]=vR2.w; d[4]=vR3.x; d[5]=vR3.y; d[6]=vR3.z; d[7]=vR3.w;
  int c1=0; for(int i=1;i<8;i++) if(f[i]<f[c1]) c1=i; int c2=c1==0?1:0; for(int i=0;i<8;i++) if(i!=c1&&f[i]<f[c2]) c2=i;
  v2rG=f[c2]-f[c1]; v2rGp=v2rG/max(fwidth(v2rG),1e-7); v2rId1=int(floor(d[c1]+0.5)); v2rId2=int(floor(d[c2]+0.5));
  v2rLine=1.0-smoothstep(uV2pRLw-0.5,uV2pRLw+0.5,v2rGp); v2rAct=1.0; }
float v2rSel(int i){ return (i<0||i>79)?0.0:uV2pRSel[i]; }
float v2rMask(out float core){ float s1=v2rSel(v2rId1), s2=v2rSel(v2rId2); float k=smoothstep(0.0,1.0,v2rGp); core=s1*clamp(v2rG/0.03,0.0,1.0); return mix(0.5*(s1+s2),s1,k); }
`;
function patch(o, tex) { const mat = o.material, ob = mat.onBeforeCompile;
  mat.onBeforeCompile = function(sh, r) { ob.call(this, sh, r); Object.assign(sh.uniforms, R.uni); sh.uniforms.uV2pR = { value: tex }; sh.uniforms.uV2pRm = { value: 1 };
    sh.vertexShader = VS + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + VB);
    let fs = sh.fragmentShader; const need = ['vec3 alb=vec3(0.0)', 'alb*=1.0-cav; shc*=1.0-cav;', '(uV2pOn>0.5?v2pMask(c2):hlMask(c2))', 'lit=mix(lit,cyl,d*0.94);'];
    need.push('if(uV2pOut>0.5){');
    for (const s of need) if (fs.indexOf(s) < 0) throw new Error('v2plus regions: shader has no ' + s);
    fs = fs.replace('vec3 alb=vec3(0.0)', 'if(uV2pRon>0.5&&uV2pRm>0.5&&uV2pOn>0.5) v2rEval();\n vec3 alb=vec3(0.0)')
      .replace('alb*=1.0-cav; shc*=1.0-cav;', 'alb*=1.0-cav; shc*=1.0-cav; if(v2rAct>0.5){ alb=uV2pRGrey*(1.0-cav); shc=uV2pRShade*(1.0-cav); W4=vec4(1.0,0.0,0.0,0.0); rimc=uRimC[0]; fin=vec4(0.0); v2cuff=0.0; }')
      .replace('(uV2pOn>0.5?v2pMask(c2):hlMask(c2))', '(v2rAct>0.5?v2rMask(c2):(uV2pOn>0.5?v2pMask(c2):hlMask(c2)))')
      .replace('if(uV2pOut>0.5){', 'if(uV2pOut>0.5&&v2rAct<0.5){')   // atlas look: no inside-of-sleeve shade override
      .replace('lit=mix(lit,cyl,d*0.94);', 'lit=mix(lit,cyl,d*0.94); if(v2rAct>0.5) lit=mix(lit,uV2pRLine,v2rLine*0.85);');
    sh.fragmentShader = FS + fs; };
  const k0 = mat.customProgramCacheKey; mat.customProgramCacheKey = () => k0.call(mat) + '|v2pr'; mat.needsUpdate = true; }
R.uni = { uV2pRon: { value: 0 }, uV2pRSel: { value: new Array(80).fill(0) }, uV2pRGrey: { value: null }, uV2pRShade: { value: null }, uV2pRLine: { value: null }, uV2pRLw: { value: 1.0 } };
function meshes() { const v = flareInspector.viewer, out = []; v.coach.traverse(o => { if (o.isSkinnedMesh && o.material && /^toon-drill1-v2p($|\|)/.test(o.material.customProgramCacheKey?.() || '')) out.push(o); }); return out; }
// load(table): call after __v2p.load (and __v2p.loadTorso when used). Bakes lazily per outfit/torso state on first enable.
V2P.loadRegions = function(table) { if (R.data) return { already: true }; const t = T();
  R.data = table; R.uni.uV2pRGrey.value = new t.Color(0.835, 0.850, 0.880); R.uni.uV2pRShade.value = new t.Color(0.640, 0.660, 0.705); R.uni.uV2pRLine.value = new t.Color(0.30, 0.32, 0.37);
  const dummy = new t.DataTexture(new Float32Array(4 * 1024).fill(9), 1024, 1, t.RGBAFormat, t.FloatType); dummy.needsUpdate = true; R.dummy = dummy;
  R.patched = new Map(); for (const o of meshes()) { const holder = { value: dummy }; R.patched.set(o, holder); patchHolder(o, holder); }
  const E = window.__drill, sel0 = E.selectModelProfile;
  E.selectModelProfile = function(spec) { sel0.call(this, spec); V2P.setRegions(spec.modelProfile === 'training-human-v2plus' && spec.v2plus?.regions === 'baked'); };
  const hl0 = window.__setHighlight; window.__setHighlight = h => { const n = hl0(h); if (R.on) R.setHighlight(h); return n; };
  return { meshes: R.patched.size, regions: table.count }; };
// one texture slot per mesh (swapped when the bake is redone for another outfit / torso state)
function patchHolder(o, holder) { const mat = o.material, ob = mat.onBeforeCompile; patch(o, null);
  const ob2 = mat.onBeforeCompile; mat.onBeforeCompile = function(sh, r) { ob2.call(this, sh, r); sh.uniforms.uV2pR = holder; sh.uniforms.uV2pRm = holder.m || (holder.m = { value: 0 }); }; mat.__v2prHook = mat.onBeforeCompile; }
V2P.setRegions = function(on) { R.on = on; R.uni.uV2pRon.value = on ? 1 : 0; if (!on) return null;
  const st = (V2P.outfitState ? JSON.stringify(V2P.outfitState) : '') + '|' + (V2P.torso?.on ? 'torso' : '');
  // training-collar swaps its own onBeforeCompile / cache key onto the neck mesh when the profile enables it: re-wrap those
  for (const [o, h] of R.patched) if (o.material.onBeforeCompile !== o.material.__v2prHook) patchHolder(o, h);
  if (R.key !== st) { const v = flareInspector.viewer; v.motion.reset(); v.coach.updateMatrixWorld(true); v.coach.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
    const list = [...R.patched.keys()].filter(o => o.visible && (o.geometry.drawRange.count > 0)); const b = bake(list, R.data); R.bakeInfo = b;
    for (const [o, h] of R.patched) { const e = b.tex.get(o); h.value = e ? e.tex : R.dummy; (h.m || (h.m = { value: 0 })).value = e ? 1 : 0; }
    R.key = st; }
  if (V2P.lastHL) R.setHighlight(V2P.lastHL);
  R.meshInfo = [...R.patched.keys()].map(o => o.material.uuid.slice(0, 4) + ':' + o.name + (o.visible ? '' : '(hidden)') + ':' + o.geometry.drawRange.count + (b_has(o) ? '*' : ''));
  return { meshes: R.meshInfo, channels: R.bakeInfo.channels, maxDeg: R.bakeInfo.maxDeg, present: R.bakeInfo.present, verts: R.bakeInfo.verts }; };
const b_has = o => !!R.bakeInfo?.tex.get(o);
R.setHighlight = function(h) { const sel = new Array(80).fill(0); let n = 0; const D = R.data;
  const side = h?.side === 'left' ? 'L' : h?.side === 'right' ? 'R' : null;
  for (const gid of (h?.lobes ? [] : h?.groups || [])) { const keys = D.groups[gid] || (D.base.includes(gid) ? [gid] : []);
    for (const k of keys) { const b = D.base.indexOf(k); for (const s of [0, 1]) { if (side && side !== (s ? 'R' : 'L')) continue; sel[2 * b + s] = 1; n++; } } }
  if (h?.regionIds) for (const id of h.regionIds) { sel[id] = 1; n++; }
  R.uni.uV2pRSel.value = sel; if (window.__mmUni?.uSelN && n) window.__mmUni.uSelN.value = 1; return n; };
})();
