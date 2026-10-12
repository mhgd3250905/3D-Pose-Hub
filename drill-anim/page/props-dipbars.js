// drill-anim prop: dipBars (parallel dip bars, C tier: triceps-C dips, lats-C scapular depression, abs-C support leg raise).
// Loaded after props.js (boot.mjs loads every page/props-*.js); registers its type through __props.add without touching props.js,
// and replaces the old geometry stub of the same name.
// spec: {type:'dipBars', at:[x,0,z], yaw, height:1.15 (bar centre), gap:0.50 (centre-to-centre in X), length:0.80, r:0.02}
// Each side is an inverted U: a grip bar along Z, bent down at both ends (bend radius 0.07) into an upright to the floor, and a floor
// foot along X under each upright. A low cross tube joins the two sides at the back (-Z) end.
// QA primitives (o.userData.qaPrims, local frame): the grip bars as capsules {a,b,r}, for hand-vs-prop clearance checks.
(function(){
const P = window.__props; if (!P) return;
const T = () => window.__toonT;
const add0 = P.add;
const MY = {
  dipBars(th, s) { const t = T(); const g = new t.Group(); const H = s.height ?? 1.15, gap = s.gap ?? 0.50, L = s.length ?? 0.80, r = s.r ?? 0.02, R = 0.07, rp = r * 1.15;
    const mat = P.mat(th, { rimK: 0.9 }), dark = P.mat(th, { base: th.edge || '#2a2c31', rimK: 0.5 });
    const tube = (a, b, rr, m = mat) => { const A = new t.Vector3(...a), Bv = new t.Vector3(...b); const o = new t.Mesh(new t.CylinderGeometry(rr, rr, A.distanceTo(Bv), 24), m);
      o.position.copy(A).lerp(Bv, 0.5); o.quaternion.setFromUnitVectors(new t.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()); g.add(o); };
    const qa = [];
    for (const sg of [-1, 1]) { const x = sg * gap / 2;
      tube([x, H, -L / 2 + R], [x, H, L / 2 - R], r); qa.push({ a: [x, H, -L / 2 + R], b: [x, H, L / 2 - R], r });
      for (const e of [-1, 1]) { // quarter bend from the bar into the upright: torus arc in the YZ plane, centre (x, H-R, e*(L/2-R))
        const bend = new t.Mesh(new t.TorusGeometry(R, (r + rp) / 2, 14, 16, Math.PI / 2), mat); bend.position.set(x, H - R, e * (L / 2 - R));
        bend.rotation.y = e > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(bend);
        tube([x, H - R, e * L / 2], [x, 0.03, e * L / 2], rp);
        tube([x - 0.11, 0.015, e * L / 2], [x + 0.11, 0.015, e * L / 2], 0.015, dark);
        for (const q of [-1, 1]) { const c = new t.Mesh(new t.SphereGeometry(0.015, 12, 8), dark); c.position.set(x + q * 0.11, 0.015, e * L / 2); g.add(c); } } }
    tube([-gap / 2, 0.16, -L / 2], [gap / 2, 0.16, -L / 2], rp * 0.9);
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
