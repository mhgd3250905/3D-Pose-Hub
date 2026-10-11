// drill-anim prop: ghd (glute-ham developer, C tier: hamstrings-C GHD Nordic eccentric).
// Loaded after props.js (boot.mjs loads every page/props-*.js); registers its type through __props.add without touching props.js.
// The machine runs along Z (front = +Z, where the body lowers), symmetric about x = 0. Built from three contact points:
//   pad:    axis centre of the round knee/thigh pad (a half-round hump, axis X), padR radius, padW width
//   roller: axle centre of the heel rollers (two foam rollers, axis X) that hook over the heels / lower calves, rollerR, rollerW
//   plate:  centre of the foot-plate face; the plate stands vertical with its face toward +Z (the soles press back on it)
// Structure: floor rails along Z with cross feet, a centre post under the pad, a rear post carrying the plate and the roller axle,
// a long spine tube joining them under the shins. QA primitives: pad (capsule along X), rollers (capsules), plate (box).
(function(){
const P = window.__props; if (!P) return;
const T = () => window.__toonT;
const add0 = P.add;
const MY = {
  ghd(th, s) { const t = T(); const g = new t.Group(); const V = a => new t.Vector3(...a);
    const pad = V(s.pad), rol = V(s.roller), pl = V(s.plate); const padR = s.padR ?? 0.14, padW = s.padW ?? 0.40, rR = s.rollerR ?? 0.045, rW = s.rollerW ?? 0.13;
    const frame = P.mat(th, { rimK: 0.9 }), dark = P.mat(th, { base: '#202228', rimK: 0.5 }), foam = P.mat(th, { base: s.padColour || '#3b3e46', rimK: 0.8 }), steel = P.mat(th, { base: '#8a8f99', rimK: 1.0 });
    const qa = [], X = new t.Vector3(1, 0, 0), Y = new t.Vector3(0, 1, 0), Z = new t.Vector3(0, 0, 1);
    const box = (A, B, w, m = frame, side = X) => { A = V(A); B = V(B); const d = B.clone().sub(A), L = d.length(); const o = new t.Mesh(new t.BoxGeometry(w, L, w), m); o.position.copy(A).addScaledVector(d, 0.5);
      const y = d.normalize(), x0 = side.clone().addScaledVector(y, -side.dot(y)).normalize(); o.quaternion.setFromRotationMatrix(new t.Matrix4().makeBasis(x0, y, new t.Vector3().crossVectors(x0, y))); g.add(o); return o; };
    const cyl = (C, R, W, m) => { const o = new t.Mesh(new t.CylinderGeometry(R, R, W, 36), m); o.position.copy(C); o.rotation.z = Math.PI / 2; g.add(o);
      for (const e of [-1, 1]) { const c = new t.Mesh(new t.CylinderGeometry(R * 0.92, R * 0.92, 0.008, 36), dark); c.position.copy(C).addScaledVector(X, e * (W / 2 + 0.004)); c.rotation.z = Math.PI / 2; g.add(c); } return o; };
    // round pad: upper half-cylinder hump on a flat base
    const hump = new t.Mesh(new t.CylinderGeometry(padR, padR, padW, 40, 1, false, 0, Math.PI), foam); hump.position.copy(pad);
    // CylinderGeometry theta 0..pi covers local x >= 0; rotation.z = 90 deg maps local X -> world +Y (hump up), local Y (axis) -> world -X
    hump.rotation.set(0, 0, Math.PI / 2); g.add(hump);
    const base = new t.Mesh(new t.BoxGeometry(padW, 0.03, 2 * padR), dark); base.position.copy(pad).add(new t.Vector3(0, -0.015, 0)); g.add(base);
    for (const e of [-1, 1]) { const c = new t.Mesh(new t.CircleGeometry(padR, 40, 0, Math.PI), dark); c.position.copy(pad).addScaledVector(X, e * padW / 2); c.rotation.y = e * Math.PI / 2; g.add(c); }
    qa.push({ a: pad.clone().addScaledVector(X, -padW / 2).toArray(), b: pad.clone().addScaledVector(X, padW / 2).toArray(), r: padR });
    // rollers over the heels
    tube(rol.clone().addScaledVector(X, -0.21), rol.clone().addScaledVector(X, 0.21), 0.013, steel);
    for (const e of [-1, 1]) { const C = rol.clone().addScaledVector(X, e * 0.105); cyl(C, rR, rW, foam); qa.push({ a: C.clone().addScaledVector(X, -rW / 2).toArray(), b: C.clone().addScaledVector(X, rW / 2).toArray(), r: rR }); }
    // foot plate (vertical, face toward +Z)
    const pT = 0.018, pH = s.plateH ?? 0.26, pW = s.plateW ?? 0.36; const pc = pl.clone().addScaledVector(Z, -pT / 2);
    const plate = new t.Mesh(new t.BoxGeometry(pW, pH, pT), dark); plate.position.copy(pc); g.add(plate);
    qa.push({ c: pc.toArray(), ax: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], h: [pW / 2, pH / 2, pT / 2] });
    // frame: rear post behind the plate up to the roller axle (side plates at |x| = 0.21), pad post, spine, floor rails
    const zr = pc.z - 0.05, ys = Math.min(pad.y - padR - 0.06, pc.y - pH / 2 - 0.04);
    box([0, 0.03, zr], [0, rol.y + 0.03, zr], 0.06); for (const e of [-1, 1]) box([e * 0.21, rol.y, rol.z], [e * 0.21, rol.y, zr], 0.035, frame, Y);
    box([-0.23, rol.y, zr], [0.23, rol.y, zr], 0.04, frame, Y);
    box([0, ys, zr], [0, ys, pad.z + 0.05], 0.06, frame, Y); box([0, 0.03, pad.z], [0, pad.y - 0.03, pad.z], 0.06);
    box([0, 0.025, zr - 0.08], [0, 0.025, pad.z + 0.25], 0.05, frame, Y);
    for (const z of [zr - 0.05, pad.z + 0.22]) { box([-0.32, 0.025, z], [0.32, 0.025, z], 0.05, frame, Y); for (const e of [-1, 1]) { const c = new t.Mesh(new t.BoxGeometry(0.06, 0.014, 0.07), dark); c.position.set(e * 0.32, 0.007, z); g.add(c); } }
    function tube(A, B, r, m) { const d = B.clone().sub(A); const o = new t.Mesh(new t.CylinderGeometry(r, r, d.length(), 14), m); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(Y, d.normalize()); g.add(o); }
    g.userData.qaPrims = qa; return g; },
};
P.add = function(theme, s) { if (!MY[s.type]) return add0(theme, s);
  const v = flareInspector.viewer; const o = MY[s.type](theme.props, s); o.name = 'prop_' + s.type; o.userData.spec = s; o.frustumCulled = false; o.traverse(c => { c.frustumCulled = false; });
  v.scene.add(o); P.list.push(o); P.place(o); return o; };
// world-space QA primitives of every placed prop that declares them (capsules {a,b,r}; tori {c,n,R,r}; boxes {c,ax:[x,y,z axes],h:[half sizes]})
P.qaPrims = function() { const t = T(); const out = [];
  for (const o of P.list) for (const q of o.userData.qaPrims || []) { o.updateMatrixWorld(true); const m = o.matrixWorld; const nq = new t.Quaternion(); o.getWorldQuaternion(nq);
    const W = a => new t.Vector3(...a).applyMatrix4(m).toArray(), Wd = a => new t.Vector3(...a).applyQuaternion(nq).toArray();
    if (q.a) out.push({ a: W(q.a), b: W(q.b), r: q.r, kind: o.userData.spec.type });
    else if (q.ax) out.push({ c: W(q.c), ax: q.ax.map(Wd), h: q.h, kind: o.userData.spec.type });
    else out.push({ c: W(q.c), n: Wd(q.n), R: q.R, r: q.r, kind: o.userData.spec.type }); }
  return out; };
P.types = [...new Set([...(P.types || []), ...Object.keys(MY)])];
})();
