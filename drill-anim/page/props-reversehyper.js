// drill-anim prop: reverseHyper (reverse hyperextension machine, C tier: glute-max-C).
// Loaded after props.js (boot.mjs loads every page/props-*.js); registers its type through __props.add without touching props.js.
// The body lies prone on a level pad (head toward +Z), hips just past the pad's rear (-Z) end, legs swing below/behind it.
// spec: {type:'reverseHyper', top: pad top height, rear: z of the pad's rear end, len: pad length (toward +Z), w: pad width,
//        handles: {x, y, z0, z1, r}  (two grip bars along Z at x = +-x, height y, from z0 to z1),
//        pivot: [0, y, z] (pendulum axle, axis X), lever: length, ankles: ['leftAnkle','rightAnkle'] (bones the strap cuff follows)}
// Moving parts (updated every frame from the bones): an ankle cuff around both lower shins, the pendulum lever swinging about the
// pivot toward the cuff with a weight horn + plate at its end, and a strap from the lever end to the cuff.
// QA primitives: pad (box), handles (capsules), pivot axle (capsule); moving parts are listed under userData.qaMoving.
(function(){
const P = window.__props; if (!P) return;
const T = () => window.__toonT;
const add0 = P.add, place0 = P.place;
function setTube(t, m, a, b) { const d = b.clone().sub(a); const L = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, Math.max(L, 1e-6), 1); m.quaternion.setFromUnitVectors(new t.Vector3(0, 1, 0), d.normalize()); }
const MY = {
  reverseHyper(th, s) { const t = T(); const g = new t.Group(); const V = a => new t.Vector3(...a);
    const top = s.top, rear = s.rear, len = s.len ?? 0.62, w = s.w ?? 0.36, pt = 0.09;
    const frame = P.mat(th, { rimK: 0.9 }), dark = P.mat(th, { base: '#202228', rimK: 0.5 }), foam = P.mat(th, { base: s.padColour || '#3b3e46', rimK: 0.8 }), steel = P.mat(th, { base: '#8a8f99', rimK: 1.0 });
    const qa = [];
    const box = (c, sz, m = frame) => { const o = new t.Mesh(new t.BoxGeometry(...sz), m); o.position.set(...c); g.add(o); return o; };
    const tube = (a, b, r, m = frame, seg = 16) => { const o = new t.Mesh(new t.CylinderGeometry(r, r, 1, seg), m); setTube(t, o, V(a), V(b)); g.add(o); return o; };
    // pad: upholstered slab with rounded rear edge, frame plate under it
    const zc = rear + len / 2; box([0, top - pt / 2, zc], [w, pt, len - 0.04], foam);
    const edge = new t.Mesh(new t.CylinderGeometry(pt / 2, pt / 2, w, 24), foam); edge.rotation.z = Math.PI / 2; edge.position.set(0, top - pt / 2, rear + 0.02); g.add(edge);
    const edgeF = edge.clone(); edgeF.position.z = rear + len - 0.02; g.add(edgeF);
    qa.push({ c: [0, top - pt / 2, zc], ax: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], h: [w / 2, pt / 2, len / 2] });
    box([0, top - pt - 0.02, zc], [w * 0.5, 0.04, len * 0.9]);
    // legs: front A-frame (two posts at the front end) and rear posts wide at the sides (the legs swing between them), floor rails
    const yb = top - pt - 0.04, zf = rear + len - 0.08, zr = rear + 0.1, XS = 0.3;
    for (const e of [-1, 1]) { tube([e * 0.12, yb, zf], [e * XS, 0.03, zf + 0.12], 0.025); tube([e * 0.12, yb, zr], [e * XS, 0.03, zr - 0.05], 0.025);
      box([e * XS, 0.02, (zf + zr) / 2 + 0.035], [0.05, 0.04, zf - zr + 0.33]); }
    box([0, 0.02, zf + 0.12], [2 * XS + 0.06, 0.04, 0.05]);
    // handles: grip bars along Z either side of the pad front, on short posts from the pad frame
    const H = s.handles; if (H) for (const e of [-1, 1]) { const x = e * H.x;
      tube([x, H.y, H.z0], [x, H.y, H.z1], H.r ?? 0.016, P.mat(th, { base: '#24262b', rimK: 0.6 })); qa.push({ a: [x, H.y, H.z0], b: [x, H.y, H.z1], r: H.r ?? 0.016 });
      tube([x, H.y, H.z0], [e * 0.1, yb + 0.01, H.z0 - 0.06], 0.014, steel); }
    // pendulum axle (between two hangers from the pad frame), lever, weight horn, cuff, strap (moving parts updated in place())
    const Q = V(s.pivot); for (const e of [-1, 1]) tube([e * 0.14, Q.y, Q.z], [e * 0.12, yb, Q.z], 0.02);
    tube([-0.15, Q.y, Q.z], [0.15, Q.y, Q.z], 0.016, steel); qa.push({ a: [-0.15, Q.y, Q.z], b: [0.15, Q.y, Q.z], r: 0.016 });
    const lever = new t.Mesh(new t.CylinderGeometry(0.018, 0.018, 1, 14), frame), horn = new t.Mesh(new t.CylinderGeometry(0.012, 0.012, 1, 10), steel);
    const plate = new t.Mesh(new t.CylinderGeometry(0.11, 0.11, 0.03, 32), dark), strap = new t.Mesh(new t.BoxGeometry(0.03, 1, 0.004), P.mat(th, { base: th.edge || '#2a2c31', rimK: 0.4 }));
    const cuff = new t.Mesh(new t.CylinderGeometry(1, 1, 0.06, 28, 1, true), P.mat(th, { base: th.edge || '#2a2c31', rimK: 0.6 })); cuff.material.side = 2;
    for (const o of [lever, horn, plate, strap, cuff]) g.add(o);
    g.userData.mv = { Q, lever, horn, plate, strap, cuff, L: s.lever ?? 0.22 };
    g.userData.qaPrims = qa; return g; },
};
P.add = function(theme, s) { if (!MY[s.type]) return add0(theme, s);
  const v = flareInspector.viewer; const o = MY[s.type](theme.props, s); o.name = 'prop_' + s.type; o.userData.spec = s; o.frustumCulled = false; o.traverse(c => { c.frustumCulled = false; });
  v.scene.add(o); P.list.push(o); P.place(o); return o; };
P.place = function(o) { const s = o.userData.spec; if (!s || s.type !== 'reverseHyper') return place0(o);
  const t = T(), v = flareInspector.viewer; o.position.set(0, 0, 0); o.quaternion.identity(); o.updateMatrixWorld(true);
  const M = o.userData.mv; if (!M) return; const bones = (s.ankles || ['leftAnkle', 'rightAnkle']);
  // cuff centre: midpoint of the two lower-leg bones' ends, slightly above the ankle joints (on the lower shins)
  const J = bones.map(n => { const b = v.coach.getObjectByName(n.replace('Ankle', 'Foot')) || v.coach.getObjectByName(n); return b.getWorldPosition(new t.Vector3()); });
  const K = bones.map(n => { const b = v.coach.getObjectByName(n.replace('Ankle', 'Shin')) || v.coach.getObjectByName(n.replace('Ankle', 'Leg')); return b ? b.getWorldPosition(new t.Vector3()) : null; });
  const A = J[0].clone().add(J[1]).multiplyScalar(0.5), Kc = K[0] && K[1] ? K[0].clone().add(K[1]).multiplyScalar(0.5) : A.clone().add(new t.Vector3(0, 0.4, 0));
  const up = Kc.clone().sub(A).normalize(); const cc = A.clone().addScaledVector(up, s.cuffUp ?? 0.075);
  const half = J[0].distanceTo(J[1]) / 2 + (s.cuffR ?? 0.052);
  M.cuff.position.copy(cc); M.cuff.quaternion.setFromUnitVectors(new t.Vector3(0, 1, 0), up); M.cuff.scale.set(half, 1, s.cuffDepth ?? 0.058);
  // the cuff is an ellipse: wide across the two shins (x), cuffDepth front-back
  const dir = cc.clone().sub(M.Q); const dl = dir.length(); dir.normalize(); const E = M.Q.clone().addScaledVector(dir, M.L);
  setTube(t, M.lever, M.Q, E); const side = new t.Vector3(1, 0, 0); setTube(t, M.horn, E.clone().addScaledVector(side, -0.12), E.clone().addScaledVector(side, 0.12));
  M.plate.position.copy(E).addScaledVector(side, 0.09); M.plate.quaternion.setFromUnitVectors(new t.Vector3(0, 1, 0), side);
  const sb = cc.clone().addScaledVector(dir, -0.0); setTube(t, M.strap, E, sb); M.strap.scale.x = 1;
  o.userData.qaMoving = [{ a: M.Q.toArray(), b: E.toArray(), r: 0.018 }];
  o.updateMatrixWorld(true); };
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
