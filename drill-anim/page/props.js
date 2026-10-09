// drill-anim props: simple toon primitives in the body's rim style.
// spec.props = [{type:'mat', at:[x,y,z], yaw:deg, size:[L,W,H]}, {type:'dumbbell', attach:'rightHand', offset:[..], rot:[[axis,deg]..]}, ...]
// attach: 'world' (default) or a bone name ('rightHand','leftHand','leftFoot',...) -> follows that bone every frame.
// STATUS: mat = finished; everything else = stub geometry (built, not yet validated against a drill); machine = placeholder API.
(function(){
const P = window.__props = { list: [] };
const T = () => window.__toonT;
function toonMat(th, opt = {}) {
  const t = T(); const base = new t.Color(opt.base || th.base), shade = base.clone().multiplyScalar(th.shadeK ?? 0.52);
  const rim = Array.isArray(th.rim) ? new t.Color().setRGB(...th.rim) : new t.Color(th.rim);
  const mat = new t.MeshToonMaterial({}); mat.toneMapped = false;
  mat.onBeforeCompile = sh => { sh.uniforms.uGlow = window.__glowU; sh.uniforms.uRim = window.__rimU; sh.uniforms.pBase = { value: base }; sh.uniforms.pShade = { value: shade }; sh.uniforms.pRim = { value: rim };
    sh.uniforms.pRimK = { value: opt.rimK ?? 1 };
    sh.fragmentShader = 'uniform float uGlow;uniform float uRim;uniform vec3 pBase;uniform vec3 pShade;uniform vec3 pRim;uniform float pRimK;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 Nn=normalize(normal);vec3 Vv=normalize(vViewPosition);vec3 Ld=normalize(vec3(-0.45,0.75,0.55));float nl=dot(Nn,Ld);
      float b=smoothstep(-0.05,0.08,nl)*0.5+smoothstep(0.45,0.6,nl)*0.5;vec3 lit=mix(pShade,pBase,b);
      float fr=pow(1.0-clamp(dot(Nn,Vv),0.0,1.0),2.6);lit+=pRim*smoothstep(0.55,0.9,fr)*uRim*pRimK;
      if(uGlow>0.5) discard; // props stay out of the glow pass, whose alpha is the body-only silhouette used for the ember outline
      outgoingLight = lit;
      #include <opaque_fragment>`); };
  mat.customProgramCacheKey = () => 'toon-prop1'; return mat;
}
P.mat = toonMat;
const B = {
  // yoga mat: rounded slab, top face at at.y (default 0 = the floor plane the body rests on); edge band slightly lighter
  mat(th, s) { const t = T(); const [L, W, H] = s.size || [1.83, 0.61, 0.006]; const g = new t.Group();
    const top = new t.Mesh(new t.BoxGeometry(L, H, W, 1, 1, 1), toonMat(th, { rimK: 0.0 })); top.position.y = -H / 2; g.add(top);
    const edge = new t.Mesh(new t.BoxGeometry(L + 0.004, H * 0.6, W + 0.004), toonMat(th, { base: th.edge || th.base, rimK: 0.15 })); edge.position.y = -H * 0.55; g.add(edge);
    return g; },
  // ---- stubs below: geometry only
  dumbbell(th, s) { const t = T(); const g = new t.Group(); const len = s.length || 0.30, r = s.plate || 0.055;
    const h = new t.Mesh(new t.CylinderGeometry(0.016, 0.016, len * 0.55, 16), toonMat(th)); h.rotation.z = Math.PI / 2; g.add(h);
    for (const sg of [-1, 1]) { const p = new t.Mesh(new t.CylinderGeometry(r, r, len * 0.2, 6), toonMat(th)); p.rotation.z = Math.PI / 2; p.position.x = sg * len * 0.37; g.add(p); } return g; },
  kettlebell(th, s) { const t = T(); const g = new t.Group(); const r = s.r || 0.09;
    const b = new t.Mesh(new t.SphereGeometry(r, 24, 16), toonMat(th)); g.add(b);
    const hd = new t.Mesh(new t.TorusGeometry(r * 0.62, 0.014, 10, 24, Math.PI), toonMat(th)); hd.position.y = r * 0.75; g.add(hd); return g; },
  band(th, s) { // tube between two points (world or bone-attached endpoints updated every frame via s.from/s.to)
    const t = T(); const m = new t.Mesh(new t.BufferGeometry(), toonMat(th, { base: s.colour || '#5a3a2a' })); m.userData.band = s; return m; },
  parallettes(th, s) { const t = T(); const g = new t.Group(); const L = s.length || 0.5, H = s.height || 0.2, gap = s.gap || 0.5;
    for (const sg of [-1, 1]) { const bar = new t.Mesh(new t.CylinderGeometry(0.018, 0.018, L, 16), toonMat(th)); bar.rotation.x = Math.PI / 2; bar.position.set(sg * gap / 2, H, 0); g.add(bar);
      for (const e of [-1, 1]) { const leg = new t.Mesh(new t.CylinderGeometry(0.016, 0.016, H, 12), toonMat(th)); leg.position.set(sg * gap / 2, H / 2, e * L * 0.42); g.add(leg); } } return g; },
  pullupBar(th, s) { const t = T(); const g = new t.Group(); const W = s.width || 1.0, H = s.height || 2.2;
    const bar = new t.Mesh(new t.CylinderGeometry(0.016, 0.016, W, 16), toonMat(th)); bar.rotation.z = Math.PI / 2; bar.position.y = H; g.add(bar);
    for (const sg of [-1, 1]) { const post = new t.Mesh(new t.BoxGeometry(0.05, H, 0.05), toonMat(th)); post.position.set(sg * W / 2, H / 2, 0); g.add(post); } return g; },
  rings(th, s) { const t = T(); const g = new t.Group(); const H = s.height || 2.4, gap = s.gap || 0.5, low = s.ringY || 1.0;
    for (const sg of [-1, 1]) { const ring = new t.Mesh(new t.TorusGeometry(0.09, 0.014, 10, 32), toonMat(th)); ring.position.set(sg * gap / 2, low, 0); g.add(ring);
      const strap = new t.Mesh(new t.BoxGeometry(0.035, H - low - 0.09, 0.004), toonMat(th, { base: th.edge })); strap.position.set(sg * gap / 2, (H + low + 0.09) / 2, 0); g.add(strap); } return g; },
  dipBars(th, s) { const t = T(); const g = new t.Group(); const L = s.length || 0.9, H = s.height || 1.2, gap = s.gap || 0.55;
    for (const sg of [-1, 1]) { const bar = new t.Mesh(new t.CylinderGeometry(0.022, 0.022, L, 16), toonMat(th)); bar.rotation.x = Math.PI / 2; bar.position.set(sg * gap / 2, H, 0); g.add(bar);
      for (const e of [-1, 1]) { const post = new t.Mesh(new t.CylinderGeometry(0.025, 0.025, H, 12), toonMat(th)); post.position.set(sg * gap / 2, H / 2, e * L * 0.45); g.add(post); } } return g; },
  foamRoller(th, s) { const t = T(); const m = new t.Mesh(new t.CylinderGeometry(s.r || 0.075, s.r || 0.075, s.length || 0.9, 32), toonMat(th)); m.rotation.z = Math.PI / 2; const g = new t.Group(); g.add(m); return g; },
  swissBall(th, s) { const t = T(); const g = new t.Group(); const r = s.r || 0.325; const m = new t.Mesh(new t.SphereGeometry(r, 48, 32), toonMat(th)); m.position.y = r; g.add(m); return g; },
  sliders(th, s) { const t = T(); const g = new t.Group(); const m = new t.Mesh(new t.CylinderGeometry(s.r || 0.09, s.r || 0.09, 0.008, 32), toonMat(th, { base: th.edge })); m.position.y = 0.004; g.add(m); return g; },
  // placeholder for machines (cable stack, landmine, GHD, reverse hyper, abductor, leg extension): a labelled box until modelled
  machine(th, s) { const t = T(); const g = new t.Group(); const [w, h, d] = s.size || [0.8, 1.6, 0.8]; const m = new t.Mesh(new t.BoxGeometry(w, h, d), toonMat(th)); m.position.y = h / 2; g.add(m); g.userData.machine = s.kind || 'unknown'; return g; },
};

// ======================= C-tier props (colleague 2): cable machine, D-handle + grip, ankle strap, landmine, machines =======================
// grip: bakes a power-grip hand shape (fingers + thumb wrapped round a cylinder) into the hand vertices, once, at rest pose.
// Data = assets/grip-<side>.json, generated offline (tools/grip/*.py): per-vertex rest-world deltas + jacobians (for normals) and the
// fitted handle cylinder (centre / axis / radius in rest world). Spec hands.<side>.relax must be 0 (the relax morph is not mixed in).
P.anchors = {};
P.gripData = {};
P.loadJSON = function(url) { const x = new XMLHttpRequest(); x.open('GET', url, false); x.send(); return JSON.parse(x.responseText); };
P.bakeGrip = function(side) {
  if (P.gripData[side]) return P.gripData[side];
  const t = T(), v = flareInspector.viewer, m = v.motion; m.reset(); v.coach.updateMatrixWorld(true);
  const G = P.loadJSON('/tools/drill-anim/assets/grip-' + side + '.json');
  const o = v.coach.getObjectByName('Coach_Body'), g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, sk = o.skeleton; sk.update();
  const pos = g.attributes.position, nor = g.attributes.normal;
  const BM = sk.bones.map((b, k) => new t.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[k]));
  const S = window.__relaxState;
  for (let j = 0; j < G.idx.length; j++) { const i = G.idx[j]; const M = new t.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w <= 0) continue; const e = BM[si.getComponent(i, k)].elements; for (let q = 0; q < 16; q++) M.elements[q] += w * e[q]; }
    const A = new t.Matrix4().multiplyMatrices(o.matrixWorld, new t.Matrix4().multiplyMatrices(o.bindMatrixInverse, M).multiply(o.bindMatrix));
    const lin = new t.Matrix3().setFromMatrix4(A), inv = lin.clone().invert();
    // absolute rest-world target (independent of whatever base shape / relax morph the hand currently has)
    if (G.T) { const q = new t.Vector3(...G.T[j]).applyMatrix4(A.clone().invert()); pos.setXYZ(i, q.x, q.y, q.z); }
    else { const dl = new t.Vector3(...G.d[j]).applyMatrix3(inv); pos.setXYZ(i, pos.getX(i) + dl.x, pos.getY(i) + dl.y, pos.getZ(i) + dl.z); }
    const J = new t.Matrix3().fromArray(G.J[j]).transpose(); const nw = new t.Vector3().fromBufferAttribute(nor, i).applyMatrix3(lin).applyMatrix3(J.invert().transpose()).normalize();
    const nl = nw.applyMatrix3(inv).normalize(); nor.setXYZ(i, nl.x, nl.y, nl.z);
    if (S) { S.P0[i * 3] = pos.getX(i); S.P0[i * 3 + 1] = pos.getY(i); S.P0[i * 3 + 2] = pos.getZ(i); S.N0[i * 3] = nl.x; S.N0[i * 3 + 1] = nl.y; S.N0[i * 3 + 2] = nl.z; } }
  if (S) S.ids[side] = S.ids[side].filter(i => !G.idx.includes(i));    // the relax morph never touches the gripping hand again
  pos.needsUpdate = true; nor.needsUpdate = true;
  // handle cylinder -> hand-bone local frame (rest)
  const bone = v.coach.getObjectByName(side + 'Hand'); const bp = bone.getWorldPosition(new t.Vector3()), bq = bone.getWorldQuaternion(new t.Quaternion()), bqi = bq.clone().invert();
  const H = G.handle; const c = new t.Vector3(...H.centre).sub(bp).applyQuaternion(bqi), a = new t.Vector3(...H.axis).normalize().applyQuaternion(bqi);
  const fr = G.frame; const pal = new t.Vector3(...fr[2]).applyQuaternion(bqi);   // palmar direction (rest world -> bone local)
  P.gripData[side] = { c, a, r: H.r, pal, n: G.idx.length }; E_reset(); return P.gripData[side];
};
function E_reset() { const v = flareInspector.viewer; v.motion.reset(); v.coach.updateMatrixWorld(true); if (window.__drill) window.__drill._mc = null; }
function tube(t, a, b, r, mat, seg = 12) { const m = new t.Mesh(new t.CylinderGeometry(r, r, 1, seg, 1), mat); m.userData.tube = true; setTube(t, m, a, b); return m; }
function setTube(t, m, a, b) { const d = b.clone().sub(a); const L = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, Math.max(L, 1e-6), 1);
  m.quaternion.setFromUnitVectors(new t.Vector3(0, 1, 0), d.normalize()); }
Object.assign(B, {
  // D-handle held in a power grip: straight grip tube (in the hand, fixed to the hand bone), D-loop that swivels about the grip axis
  // so its apex (carabiner) points toward the cable; spec: {type:'dHandle', side:'right', name:'h1', toward:'pulley1', len:0.13, depth:0.105, lean:0.5}
  dHandle(th, s) { const t = T(); const G = P.bakeGrip(s.side || 'right'); const g = new t.Group(); const len = s.len || 0.13, r = G.r;
    const grip = new t.Mesh(new t.CylinderGeometry(r, r, len, 28, 1), P.mat(th, { base: s.gripColour || '#24262b', rimK: 0.6 })); g.add(grip);
    for (const e of [-1, 1]) { const cap = new t.Mesh(new t.CylinderGeometry(r * 1.12, r * 1.12, 0.008, 28), P.mat(th, { base: th.edge, rimK: 0.8 })); cap.position.y = e * (len / 2 + 0.004); g.add(cap); }
    const loop = new t.Group(); g.add(loop); g.userData.loop = loop; g.userData.len = len;
    const steel = P.mat(th, { base: s.steel || '#8a8f99', rimK: 1.0 }); const depth = s.depth || 0.105, N = 18, rr = 0.0055;
    const pts = []; for (let i = 0; i <= N; i++) { const u = i / N, ang = Math.PI * u; pts.push(new t.Vector3(Math.sin(ang) * depth, Math.cos(ang) * (len / 2 + 0.008), 0)); }
    const curve = new t.CatmullRomCurve3(pts); loop.add(new t.Mesh(new t.TubeGeometry(curve, 40, rr, 10, false), steel));
    const ring = new t.Mesh(new t.TorusGeometry(0.014, 0.004, 8, 20), steel); ring.position.set(depth + 0.012, 0, 0); ring.rotation.y = Math.PI / 2; loop.add(ring);
    g.userData.apexLocal = new t.Vector3(depth + 0.024, 0, 0); g.userData.G = G; return g; },
  // cable column: base, upright with a rail, carriage + pulley at pulleyY, weight stack. Facing +Z at yaw 0 (pulley on the front face).
  // spec: {type:'cableStack', name:'pulley1', at:[x,0,z], yaw, height:2.1, pulleyY:1.3, pulleyOut:0.09}
  cableStack(th, s) { const t = T(); const g = new t.Group(); const H = s.height || 2.15, py = s.pulleyY ?? 1.3;
    const frame = P.mat(th, { rimK: 0.9 }), dark = P.mat(th, { base: '#202228', rimK: 0.5 }), steel = P.mat(th, { base: '#8a8f99', rimK: 1.0 });
    const base = new t.Mesh(new t.BoxGeometry(0.62, 0.05, 0.62), frame); base.position.y = 0.025; g.add(base);
    const up = new t.Mesh(new t.BoxGeometry(0.09, H, 0.09), frame); up.position.set(0, H / 2, 0); g.add(up);
    const top = new t.Mesh(new t.BoxGeometry(0.09, 0.07, 0.5), frame); top.position.set(0, H - 0.035, -0.205); g.add(top);
    const back = new t.Mesh(new t.BoxGeometry(0.09, H, 0.07), frame); back.position.set(0, H / 2, -0.42); g.add(back);
    for (const x of [-0.07, 0.07]) { const rod = new t.Mesh(new t.CylinderGeometry(0.008, 0.008, H - 0.12, 10), steel); rod.position.set(x, H / 2, -0.23); g.add(rod); }
    const stack = new t.Mesh(new t.BoxGeometry(0.2, 0.62, 0.14), dark); stack.position.set(0, 0.36, -0.23); g.add(stack);
    for (let i = 1; i < 12; i++) { const l = new t.Mesh(new t.BoxGeometry(0.205, 0.004, 0.145), frame); l.position.set(0, 0.05 + i * 0.052, -0.23); g.add(l); }
    const rail = new t.Mesh(new t.BoxGeometry(0.035, H - 0.2, 0.02), steel); rail.position.set(0, H / 2, 0.055); g.add(rail);
    const carr = new t.Mesh(new t.BoxGeometry(0.08, 0.16, 0.05), frame); carr.position.set(0, py + 0.05, 0.085); g.add(carr);
    const pin = new t.Mesh(new t.CylinderGeometry(0.012, 0.012, 0.05, 10), steel); pin.rotation.x = Math.PI / 2; pin.position.set(0.05, py + 0.09, 0.09); g.add(pin);
    const out = s.pulleyOut ?? 0.12; const wheel = new t.Group(); wheel.position.set(0, py, 0.085 + out); g.add(wheel); g.userData.wheel = wheel;
    const sheave = new t.Mesh(new t.CylinderGeometry(0.045, 0.045, 0.026, 28), dark); sheave.rotation.z = Math.PI / 2; wheel.add(sheave);
    const hub = new t.Mesh(new t.CylinderGeometry(0.014, 0.014, 0.034, 12), steel); hub.rotation.z = Math.PI / 2; wheel.add(hub);
    const yoke = new t.Mesh(new t.BoxGeometry(0.05, 0.03, out), frame); yoke.position.set(0, py, 0.085 + out / 2); g.add(yoke);
    g.userData.exit = new t.Vector3(0, py, 0.085 + out); return g; },
  // hip-abductor machine: seat + upright back pad + side handles + frame + stack (static, from the spec), and per side a knee pad
  // fitted at build time to the outside of the rest thigh above the knee (+gap) and fixed to that thigh bone, a footrest fitted under
  // the rest sole and fixed to the foot bone, and a lever (pivot under the seat -> under the pad -> down to the footrest).
  // spec: {type:'hipAbductor', seatY, seatZ:[z0,z1], back:{y,z,tilt,h}, handles:{x,y,z:[z0,z1]}, padUp:0.09, gap:0.003, pivotY}
  hipAbductor(th, s) { const t = T(), v = flareInspector.viewer; v.motion.reset(); v.coach.updateMatrixWorld(true);
    const g = new t.Group(), pad = P.mat(th, { base: '#2b2e35', rimK: 0.55 }), frame = P.mat(th, { rimK: 0.9 }), dark = P.mat(th, { base: '#202228', rimK: 0.5 });
    const box = (sz, c, m, rx = 0, par = g) => { const b = new t.Mesh(new t.BoxGeometry(...sz), m); b.position.set(...c); b.rotation.x = rx; par.add(b); return b; };
    const [z0, z1] = s.seatZ, sy = s.seatY; box([0.40, 0.07, z1 - z0], [0, sy - 0.035, (z0 + z1) / 2], pad); box([0.30, 0.03, z1 - z0 - 0.04], [0, sy - 0.085, (z0 + z1) / 2], frame);
    const B = s.back, a = (B.tilt || 0) * Math.PI / 180, H = B.h || 0.62, u = new t.Vector3(0, Math.cos(a), -Math.sin(a)), n = new t.Vector3(0, Math.sin(a), Math.cos(a));
    const bc = new t.Vector3(0, B.y, B.z).addScaledVector(u, H / 2 - 0.2).addScaledVector(n, -0.035); box([0.40, H, 0.07], bc.toArray(), pad, -a); box([0.06, H, 0.04], bc.clone().addScaledVector(n, -0.06).toArray(), frame, -a);
    const post = (x, z, h, w = 0.06) => box([w, h, w], [x, h / 2, z], frame);
    post(0, (z0 + z1) / 2 - 0.05, sy - 0.1, 0.08); box([0.6, 0.04, 0.9], [0, 0.02, (z0 + z1) / 2 - 0.15], frame); post(0, bc.z - 0.12, bc.y + 0.05);
    const stZ = Math.min(z0, B.z) - 0.32; box([0.34, 0.60, 0.16], [0.36, 0.32, stZ], dark); post(0.17, stZ, 1.35, 0.05); post(0.55, stZ, 1.35, 0.05); box([0.43, 0.05, 0.08], [0.36, 1.37, stZ], frame);
    const hd = s.handles; for (const sx of [-1, 1]) { g.add(tube(t, new t.Vector3(sx * hd.x, hd.y, hd.z[0]), new t.Vector3(sx * hd.x, hd.y, hd.z[1]), 0.016, pad, 20));
      g.add(tube(t, new t.Vector3(sx * hd.x, hd.y, hd.z[0]), new t.Vector3(sx * 0.17, sy - 0.08, hd.z[0]), 0.012, frame, 12)); }
    const p = new t.Vector3(), ms = []; v.coach.traverse(o => { if (o.isSkinnedMesh && o.visible) ms.push(o); });
    const sides = {};
    for (const side of ['left', 'right']) { const sg = side === 'left' ? 1 : -1, thigh = v.coach.getObjectByName(side + 'Thigh'), shin = v.coach.getObjectByName(side + 'Shin'), foot = v.coach.getObjectByName(side + 'Foot');
      const Hp = thigh.getWorldPosition(new t.Vector3()), K = shin.getWorldPosition(new t.Vector3()), ax = Hp.clone().sub(K).normalize(), c0 = K.clone().addScaledVector(ax, s.padUp ?? 0.09);
      let out = -1, soleY = 9, fx0 = 9, fx1 = -9, fz0 = 9, fz1 = -9;
      for (const o of ms) { const N = o.geometry.attributes.position.count; for (let i = 0; i < N; i++) { o.getVertexPosition(i, p); p.applyMatrix4(o.matrixWorld);
        if (Math.abs(p.clone().sub(c0).dot(ax)) < 0.075 && Math.abs(p.z - c0.z) < 0.09 && sg * p.x > 0 && sg * (p.x - c0.x) > out) out = sg * (p.x - c0.x);
        if (p.y < 0.13 && sg * p.x > 0) { if (p.y < soleY) soleY = p.y; fx0 = Math.min(fx0, p.x); fx1 = Math.max(fx1, p.x); fz0 = Math.min(fz0, p.z); fz1 = Math.max(fz1, p.z); } } }
      const gp = s.gap ?? 0.003, padC = c0.clone().add(new t.Vector3(sg * (out + gp + 0.025), 0, 0));
      const pg = new t.Group(); box([0.05, 0.16, 0.14], [0, 0, 0], pad, 0, pg); g.add(pg);
      const fg = new t.Group(); box([fx1 - fx0 + 0.03, 0.02, fz1 - fz0 + 0.04], [0, -0.01, 0], frame, 0, fg); g.add(fg);
      const footC = new t.Vector3((fx0 + fx1) / 2, soleY - gp, (fz0 + fz1) / 2);
      const tq = thigh.getWorldQuaternion(new t.Quaternion()).invert(), fq = foot.getWorldQuaternion(new t.Quaternion()).invert();
      const arms = [0, 1, 2].map(() => { const m = tube(t, new t.Vector3(), new t.Vector3(0, 1, 0), 0.018, frame, 12); g.add(m); return m; });
      sides[side] = { pg, fg, arms, po: thigh.worldToLocal(padC.clone()), pq: tq, fo: foot.worldToLocal(footC.clone()), fq, sg }; }
    g.userData = { sides }; E_reset(); return g; },
  // straight steel cable from a cableStack pulley exit to a handle anchor; spec: {type:'cable', from:'pulley1', to:'h1', r:0.0032}
  cable(th, s) { const t = T(); const m = tube(t, new t.Vector3(), new t.Vector3(0, 1, 0), s.r || 0.0032, P.mat(th, { base: s.colour || '#a3a8b2', rimK: 0.4 }), 10); m.userData.cable = true; return m; },
});

P.types = Object.keys(B);
P.add = function(theme, s) { const t = T(), v = flareInspector.viewer; const th = theme.props; const o = B[s.type](th, s); o.name = 'prop_' + s.type; o.userData.spec = s; o.frustumCulled = false; o.traverse(c => { c.frustumCulled = false; });
  v.scene.add(o); P.list.push(o); P.place(o); return o; };
P.place = function(o) { const t = T(), v = flareInspector.viewer, s = o.userData.spec;
  if (o.userData.band) { const a = P.pt(s.from), b = P.pt(s.to); const mid = a.clone().lerp(b, 0.5); mid.y -= s.sag || 0; const c = new t.QuadraticBezierCurve3(a, mid, b); o.geometry.dispose(); o.geometry = new t.TubeGeometry(c, 24, s.r || 0.008, 8); return; }
  const rot = (s.rot || []).reduce((q, [ax, d]) => q.premultiply(new t.Quaternion().setFromAxisAngle(new t.Vector3(...ax).normalize(), d * Math.PI / 180)), new t.Quaternion());
  if (!s.attach || s.attach === 'world') { o.position.set(...(s.at || [0, 0, 0])); o.quaternion.copy(new t.Quaternion().setFromAxisAngle(new t.Vector3(0, 1, 0), (s.yaw || 0) * Math.PI / 180)).multiply(rot); }
  else { const bone = v.coach.getObjectByName(s.attach); const bp = bone.getWorldPosition(new t.Vector3()), bq = bone.getWorldQuaternion(new t.Quaternion());
    o.position.copy(new t.Vector3(...(s.offset || [0, 0, 0])).applyQuaternion(bq).add(bp)); o.quaternion.copy(bq).multiply(rot); }
  o.updateMatrixWorld(true); };
P.pt = function(p) { const t = T(), v = flareInspector.viewer; if (Array.isArray(p)) return new t.Vector3(...p); const b = v.coach.getObjectByName(p.bone); return new t.Vector3(...(p.offset || [0, 0, 0])).applyQuaternion(b.getWorldQuaternion(new t.Quaternion())).add(b.getWorldPosition(new t.Vector3())); };
P.update = function() { for (const o of P.list) P.place(o); };
const place0 = P.place;
P.place = function(o) { const t = T(), v = flareInspector.viewer, s = o.userData.spec;
  if (s.type === 'dHandle') { const G = o.userData.G, bone = v.coach.getObjectByName((s.side || 'right') + 'Hand'); bone.updateMatrixWorld(true);
    const bp = bone.getWorldPosition(new t.Vector3()), bq = bone.getWorldQuaternion(new t.Quaternion());
    const a = G.a.clone().applyQuaternion(bq).normalize(), c = G.c.clone().applyQuaternion(bq).add(bp).addScaledVector(a, s.shift || 0); o.position.copy(c);   /* shift: slide the handle along its axis to centre it in the fist */ o.quaternion.setFromUnitVectors(new t.Vector3(0, 1, 0), a);
    o.updateMatrixWorld(true);
    // swivel: loop apex toward the cable (pulley), but never closer than `lean` to the palmar side
    const tgt = P.anchors[s.toward] ? P.anchors[s.toward].clone() : c.clone().add(new t.Vector3(0, 0, -1));
    const want = tgt.sub(c); want.addScaledVector(a, -want.dot(a)); want.normalize();
    const dors = G.pal.clone().applyQuaternion(bq).negate(); dors.addScaledVector(a, -dors.dot(a)).normalize();
    const dir = dors.clone().multiplyScalar(s.lean ?? 0.6).add(want.multiplyScalar(1 - (s.lean ?? 0.6))).normalize();
    const inv = o.quaternion.clone().invert(); const dl = dir.clone().applyQuaternion(inv); o.userData.loop.rotation.set(0, s.angle !== undefined ? -s.angle * Math.PI / 180 : -Math.atan2(dl.z, dl.x), 0);   // angle: fixed loop direction in the handle frame (deg), chosen clear of hand + wrist
    o.updateMatrixWorld(true); P.anchors[s.name || 'handle'] = o.userData.apexLocal.clone().applyMatrix4(o.userData.loop.matrixWorld); return; }
  if (s.type === 'hipAbductor') { for (const [side, S] of Object.entries(o.userData.sides)) { const th = v.coach.getObjectByName(side + 'Thigh'), ft = v.coach.getObjectByName(side + 'Foot'); th.updateMatrixWorld(true); ft.updateMatrixWorld(true);
      S.pg.position.copy(th.localToWorld(S.po.clone())); S.pg.quaternion.copy(th.getWorldQuaternion(new t.Quaternion())).multiply(S.pq);
      S.fg.position.copy(ft.localToWorld(S.fo.clone())); S.fg.quaternion.copy(ft.getWorldQuaternion(new t.Quaternion())).multiply(S.fq);
      const py = s.pivotY ?? s.seatY - 0.13, hip = th.getWorldPosition(new t.Vector3()), piv = new t.Vector3(S.sg * 0.05, py, hip.z);
      const under = new t.Vector3(S.pg.position.x + S.sg * 0.01, py, S.pg.position.z), low = new t.Vector3(under.x, S.fg.position.y - 0.01, under.z);
      setTube(t, S.arms[0], piv, under); setTube(t, S.arms[1], S.pg.position.clone().add(new t.Vector3(S.sg * 0.01, -0.06, 0)), low); setTube(t, S.arms[2], low, S.fg.position.clone().add(new t.Vector3(0, -0.01, 0))); }
    o.updateMatrixWorld(true); return; }
  if (s.type === 'cableStack') { place0(o); o.updateMatrixWorld(true); P.anchors[s.name || 'pulley'] = o.userData.exit.clone().applyMatrix4(o.matrixWorld);
    // the sheave turns to face the cable
    return; }
  if (s.type === 'cable') { const a = P.anchors[s.from], b = P.anchors[s.to]; if (a && b) setTube(t, o, a, b); o.updateMatrixWorld(true); return; }
  return place0(o); };
})();
