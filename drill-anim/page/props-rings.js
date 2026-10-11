// drill-anim prop: rings (gymnastic rings on straps, C tier: serratus-C ring push-up plus, scapular-C ring support hold).
// Loaded after props.js (boot.mjs loads every page/props-*.js); registers its type through __props.add without touching props.js,
// and replaces the old geometry stub of the same name. The rings are world-fixed: each ring is placed by the point the hand grips.
// spec: {type:'rings', r:0.014 (ring tube radius), flat:0.08 (half length of the flat grip section), corner:0.035, side:0.03, strapW:0.038,
//        rings:[{grip:[x,y,z] (centre of the gripped section, on the ring's centre line), axis:[x,y,z] (grip direction = ring tangent
//                at the grip), up:[x,y,z] (grip -> ring top, made perpendicular to axis), anchor:[x,y,z] (strap top)}, ...]}
// Each ring: a D-ring tube through the grip point (flat grip section, rounded corners, round top), a short strap loop over the ring top
// with a buckle, then a flat strap from the buckle to the anchor. QA primitives: the ring outline as capsule segments + the strap.
(function(){
const P = window.__props; if (!P) return;
const T = () => window.__toonT;
const add0 = P.add;
const MY = {
  rings(th, s) { const t = T(); const g = new t.Group(); const r = s.r ?? 0.014, W = s.strapW ?? 0.038, th2 = 0.004;
    const wood = P.mat(th, { base: s.ringColour || '#4a4d55', rimK: 1.0 }), strapM = P.mat(th, { base: th.edge || '#2a2c31', rimK: 0.4 }), steel = P.mat(th, { base: '#8a8f99', rimK: 1.0 });
    const qa = [];
    // ring outline in its plane (x along the grip axis, y toward the top): flat grip section |x| <= a at y = 0, bottom corners of
    // radius rc, straight sides, round top of radius a + rc (a D-ring: the flat section is wide enough for the relaxed hand, which
    // cannot wrap a curved tube)
    const a = s.flat ?? 0.08, rc = s.corner ?? 0.035, Rt = a + rc, hs = s.side ?? 0.03;
    const outline = []; const N1 = 10, N2 = 28;
    for (let i = 0; i <= N1; i++) { const q = -Math.PI / 2 + Math.PI / 2 * i / N1; outline.push([a + rc * Math.cos(q), rc + rc * Math.sin(q)]); }       // right bottom corner
    for (let i = 1; i <= N2; i++) { const q = Math.PI * i / N2; outline.push([Rt * Math.cos(q), rc + hs + Rt * Math.sin(q)]); }                // top arc (right -> left)
    for (let i = 0; i <= N1; i++) { const q = Math.PI + Math.PI / 2 * i / N1; outline.push([-a + rc * Math.cos(q), rc + rc * Math.sin(q)]); }  // left bottom corner
    const topY = rc + hs + Rt;
    for (const k of s.rings || []) { const G = new t.Vector3(...k.grip), ax = new t.Vector3(...k.axis).normalize();
      const up = new t.Vector3(...k.up); up.addScaledVector(ax, -up.dot(ax)).normalize(); const n = new t.Vector3().crossVectors(ax, up).normalize();   // ring plane normal
      const W3 = ([x, y]) => G.clone().addScaledVector(ax, x).addScaledVector(up, y);
      const pts = outline.map(W3); const path = new t.CurvePath(); const all = [...pts, pts[0]];
      for (let i = 0; i + 1 < all.length; i++) path.add(new t.LineCurve3(all[i], all[i + 1]));
      const ring = new t.Mesh(new t.TubeGeometry(path, 160, r, 14, true), wood); g.add(ring);
      for (let i = 0; i + 1 < all.length; i++) qa.push({ a: all[i].toArray(), b: all[i + 1].toArray(), r });
      const top = W3([0, topY]);
      // strap: loop over the ring top, buckle above it, flat strap to the anchor
      const A = new t.Vector3(...k.anchor), bk = top.clone().addScaledVector(up, 0.06);
      const loop = new t.Mesh(new t.TorusGeometry(r + th2, th2 * 0.9, 6, 20, Math.PI), strapM); loop.position.copy(top);
      loop.quaternion.setFromRotationMatrix(new t.Matrix4().makeBasis(n.clone().negate(), up, ax)); loop.scale.set(1, 1, W / (2 * th2 * 0.9)); g.add(loop);
      const flat = (a0, b0, w) => { const d = b0.clone().sub(a0), L = d.length(); const m = new t.Mesh(new t.BoxGeometry(w, L, th2), strapM); m.position.copy(a0).addScaledVector(d, 0.5);
        const y = d.normalize(), x0 = ax.clone().addScaledVector(y, -ax.dot(y)).normalize(), z0 = new t.Vector3().crossVectors(x0, y); m.quaternion.setFromRotationMatrix(new t.Matrix4().makeBasis(x0, y, z0)); g.add(m); };
      for (const e of [-1, 1]) flat(top.clone().addScaledVector(n, e * (r + th2)), bk, W);
      const buckle = new t.Mesh(new t.BoxGeometry(W * 1.25, 0.03, 0.012), steel); buckle.position.copy(bk);
      { const y = A.clone().sub(bk).normalize(), x0 = ax.clone().addScaledVector(y, -ax.dot(y)).normalize(); buckle.quaternion.setFromRotationMatrix(new t.Matrix4().makeBasis(x0, y, new t.Vector3().crossVectors(x0, y))); }
      g.add(buckle); flat(bk, A, W); qa.push({ a: bk.toArray(), b: A.toArray(), r: 0.006 }); }
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
