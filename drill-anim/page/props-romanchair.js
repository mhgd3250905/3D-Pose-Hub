// drill-anim prop: romanChair (45-degree hyperextension bench / Roman chair, C tier: erectors-C).
// Loaded after props.js (boot.mjs loads every page/props-*.js); registers its type through __props.add without touching props.js.
// The bench is built from three contact points the spec computes from the body (all world, the bench is symmetric about x = 0):
//   pad:    centre of the hip-pad line (two round pads side by side, axis X), padR radius, padW width of each pad, padGap centre gap
//   roller: centre of the ankle-roller axle (two foam rollers behind the lower calves, axis X), rollerR, rollerW
//   plate:  centre of the foot-plate top surface; the plate is perpendicular to the incline direction u
//   angle:  incline of the body line in degrees (u = (0, sin, cos): the head end rises toward +Z), default 45
// Structure: main square beam along u under the body (on the +f side, f = body front), from the rear floor up to the pad bracket,
// a support post from the beam to the floor (nothing in front of the pads, where the torso swings down), a floor rail along Z with cross feet, pad brackets, side arms carrying the roller axle,
// and a plate bracket. QA primitives: the pads and rollers as capsules, the foot plate as a box.
(function(){
const P = window.__props; if (!P) return;
const T = () => window.__toonT;
const add0 = P.add;
const MY = {
  romanChair(th, s) { const t = T(); const g = new t.Group(); const V = a => new t.Vector3(...a);
    const a = (s.angle ?? 45) * Math.PI / 180, u = new t.Vector3(0, Math.sin(a), Math.cos(a)), f = new t.Vector3(0, -Math.cos(a), Math.sin(a)), X = new t.Vector3(1, 0, 0);
    const pad = V(s.pad), rol = V(s.roller), pl = V(s.plate);
    const padR = s.padR ?? 0.065, padW = s.padW ?? 0.17, padGap = s.padGap ?? 0.19, rR = s.rollerR ?? 0.045, rW = s.rollerW ?? 0.14, bw = 0.06;
    const frame = P.mat(th, { rimK: 0.9 }), dark = P.mat(th, { base: '#202228', rimK: 0.5 }), foam = P.mat(th, { base: s.padColour || '#3b3e46', rimK: 0.8 }), steel = P.mat(th, { base: '#8a8f99', rimK: 1.0 });
    const qa = [];
    const tube = (A, B, r, m = frame, seg = 16) => { const d = B.clone().sub(A); const o = new t.Mesh(new t.CylinderGeometry(r, r, d.length(), seg), m); o.position.copy(A).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new t.Vector3(0, 1, 0), d.normalize()); g.add(o); return o; };
    const box = (A, B, w, m = frame, side = X) => { const d = B.clone().sub(A), L = d.length(); const o = new t.Mesh(new t.BoxGeometry(w, L, w), m); o.position.copy(A).addScaledVector(d, 0.5);
      const y = d.normalize(), x0 = side.clone().addScaledVector(y, -side.dot(y)).normalize(); o.quaternion.setFromRotationMatrix(new t.Matrix4().makeBasis(x0, y, new t.Vector3().crossVectors(x0, y))); g.add(o); return o; };
    const roundPad = (C, R, W, m) => { const o = new t.Mesh(new t.CylinderGeometry(R, R, W, 32), m); o.position.copy(C); o.rotation.z = Math.PI / 2; g.add(o);
      for (const e of [-1, 1]) { const c = new t.Mesh(new t.CylinderGeometry(R * 0.92, R * 0.92, 0.008, 32), dark); c.position.copy(C).addScaledVector(X, e * (W / 2 + 0.004)); c.rotation.z = Math.PI / 2; g.add(c); } };
    // main beam: parallel to u, through a point below the pads (+f side)
    const b0 = pad.clone().addScaledVector(f, padR + 0.09);                 // beam point under the pad
    const kTop = -0.02, top = b0.clone().addScaledVector(u, kTop);
    const kBot = -(b0.y - 0.03) / u.y, bot = b0.clone().addScaledVector(u, kBot);   // where the beam meets the floor (rear)
    box(bot, top, bw);
    // support post from the beam (2/3 of the way up) straight down to the floor, floor rail along Z with cross feet (the space in
    // front of / below the pads stays open for the torso)
    const pm = bot.clone().lerp(top, 0.62), fp = V([0, 0.03, pm.z]); box(pm, fp, bw * 0.9, frame, X);
    box(V([0, 0.03, bot.z - 0.05]), V([0, 0.03, fp.z + 0.05]), bw * 0.85, frame, new t.Vector3(0, 1, 0));
    for (const z of [bot.z, fp.z]) { box(V([-0.3, 0.025, z]), V([0.3, 0.025, z]), 0.05, frame, new t.Vector3(0, 1, 0)); for (const e of [-1, 1]) { const c = new t.Mesh(new t.BoxGeometry(0.06, 0.014, 0.07), dark); c.position.set(e * 0.3, 0.007, z); g.add(c); } }
    // pads: bracket from the beam to the pad axle, two round pads
    tube(b0, pad, 0.016, steel); tube(pad.clone().addScaledVector(X, -(padGap / 2 + padW / 2)), pad.clone().addScaledVector(X, padGap / 2 + padW / 2), 0.014, steel);
    for (const e of [-1, 1]) { const C = pad.clone().addScaledVector(X, e * padGap / 2); roundPad(C, padR, padW, foam);
      qa.push({ a: C.clone().addScaledVector(X, -padW / 2).toArray(), b: C.clone().addScaledVector(X, padW / 2).toArray(), r: padR }); }
    // rollers: axle across, side arms from the axle ends (|x| = XA) along +f to the beam level, cross tube at the beam
    const XA = 0.25; const rb = rol.clone().addScaledVector(f, f.dot(b0.clone().sub(rol)));        // roller arm foot on the beam plane
    tube(rol.clone().addScaledVector(X, -XA), rol.clone().addScaledVector(X, XA), 0.014, steel);
    for (const e of [-1, 1]) { const C = rol.clone().addScaledVector(X, e * (0.115)); roundPad(C, rR, rW, foam);
      qa.push({ a: C.clone().addScaledVector(X, -rW / 2).toArray(), b: C.clone().addScaledVector(X, rW / 2).toArray(), r: rR });
      box(rol.clone().addScaledVector(X, e * XA), rb.clone().addScaledVector(X, e * XA), 0.04); }
    box(rb.clone().addScaledVector(X, -XA - 0.02), rb.clone().addScaledVector(X, XA + 0.02), 0.045, frame, u);
    // foot plate: perpendicular to u, top surface at `plate`, long side along f (toes), bracket down to the beam
    const pT = 0.018, pL = s.plateL ?? 0.3, pWd = s.plateW ?? 0.36; const pc = pl.clone().addScaledVector(u, -pT / 2);
    const plate = new t.Mesh(new t.BoxGeometry(pWd, pT, pL), dark); plate.position.copy(pc); plate.quaternion.setFromRotationMatrix(new t.Matrix4().makeBasis(X, u, f)); g.add(plate);
    qa.push({ c: pc.toArray(), ax: [X.toArray(), u.toArray(), f.toArray()], h: [pWd / 2, pT / 2, pL / 2] });
    const pb = pc.clone().addScaledVector(f, pL / 2 - 0.03); tube(pb, pb.clone().addScaledVector(f, f.dot(b0.clone().sub(pb))), 0.018);
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
