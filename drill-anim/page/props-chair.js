// drill-anim prop: chair (home drills: chair hip thrust, feet-on-chair glute bridge). Loaded after props.js by lib/boot.mjs.
// spec: {type:'chair', at:[x,0,z], yaw:deg, height:0.45 (seat top), width:0.44, depth:0.42, back:0.42 (backrest above the seat)}
// Local frame: seat centred on at (x,z); the FRONT edge of the seat faces local +Z, the backrest stands at local -Z; yaw about +Y.
// Simple four-legged dining chair: padded seat slab, four square legs, two back posts and a backrest panel.
// QA primitives (o.userData.qaPrims, local frame): the seat slab as a box {c, ax, h}.
(function(){
const P = window.__props; if (!P) return;
const T = () => window.__toonT;
const add0 = P.add;
const MY = {
  chair(th, s) { const t = T(); const g = new t.Group(); const H = s.height ?? 0.45, W = s.width ?? 0.44, D = s.depth ?? 0.42, BK = s.back ?? 0.42, st = 0.045, lg = 0.034;
    // back < 0.01 = stool/backless: no backrest panel and rear legs end under the seat like the front ones. (A zero-height panel at y=H
    // put its -Y face coplanar with the seat top -> z-fighting, and that face's rim term (N.V<0 -> fr=1) flashed orange along the edge.)
    const hasBack = BK >= 0.01;
    const wood = P.mat(th, { base: s.colour || '#3a3d44', rimK: 0.7 }), pad = P.mat(th, { base: s.padColour || '#2c2f36', rimK: 0.6 });
    const seat = new t.Mesh(new t.BoxGeometry(W, st, D), pad); seat.position.y = H - st / 2; g.add(seat);
    const apron = new t.Mesh(new t.BoxGeometry(W - 0.03, 0.06, D - 0.03), wood); apron.position.y = H - st - 0.03; g.add(apron);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * (W / 2 - lg / 2 - 0.01), z = sz * (D / 2 - lg / 2 - 0.01);
      const hgt = sz < 0 && hasBack ? H + BK : H - st; const leg = new t.Mesh(new t.BoxGeometry(lg, hgt, lg), wood); leg.position.set(x, hgt / 2, z); g.add(leg); }
    const rail = new t.Mesh(new t.BoxGeometry(W - 0.04, 0.02, 0.02), wood); rail.position.set(0, 0.16, D / 2 - lg / 2 - 0.01); g.add(rail);
    const rail2 = rail.clone(); rail2.position.z = -(D / 2 - lg / 2 - 0.01); g.add(rail2);
    if (hasBack) { const back = new t.Mesh(new t.BoxGeometry(W - 0.02, BK * 0.42, 0.022), pad); back.position.set(0, H + BK * 0.72, -(D / 2 - lg / 2 - 0.01)); g.add(back); }
    g.userData.qaPrims = [{ c: [0, H - st / 2, 0], ax: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], h: [W / 2, st / 2, D / 2] }];
    return g; },
};
P.add = function(theme, s) { if (!MY[s.type]) return add0(theme, s);
  const v = flareInspector.viewer; const o = MY[s.type](theme.props, s); o.name = 'prop_' + s.type; o.userData.spec = s; o.frustumCulled = false; o.traverse(c => { c.frustumCulled = false; });
  v.scene.add(o); P.list.push(o); P.place(o); return o; };
P.types = [...new Set([...(P.types || []), ...Object.keys(MY)])];
})();
