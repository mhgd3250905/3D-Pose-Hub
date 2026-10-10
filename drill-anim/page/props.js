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
  // flat bench (B-tier): padded top (s.length 1.1, s.width 0.29, top surface at s.height 0.44), two splayed steel feet; long axis X at yaw 0
  bench(th, s) { const t = T(); const g = new t.Group(); const L = s.length || 1.1, W = s.width || 0.29, H = s.height || 0.44, pt = 0.06;
    const pad = new t.Mesh(new t.BoxGeometry(L, pt, W), toonMat(th, { base: s.padColour || '#26282d', rimK: 0.6 })); pad.position.y = H - pt / 2; g.add(pad);
    const steel = toonMat(th, { base: '#4a4e57', rimK: 0.8 });
    const rail = new t.Mesh(new t.BoxGeometry(L * 0.86, 0.04, 0.05), steel); rail.position.y = H - pt - 0.02; g.add(rail);
    for (const e of [-1, 1]) { const x = e * L * 0.36;
      const post = new t.Mesh(new t.BoxGeometry(0.05, H - pt - 0.04, 0.05), steel); post.position.set(x, (H - pt - 0.04) / 2 + 0.02, 0); g.add(post);
      const foot = new t.Mesh(new t.BoxGeometry(0.06, 0.04, W + 0.12), steel); foot.position.set(x, 0.02, 0); g.add(foot); }
    return g; },
  swissBall(th, s) { const t = T(); const g = new t.Group(); const r = s.r || 0.325; const m = new t.Mesh(new t.SphereGeometry(r, 48, 32), toonMat(th)); m.position.y = r; g.add(m); return g; },
  sliders(th, s) { const t = T(); const g = new t.Group(); const m = new t.Mesh(new t.CylinderGeometry(s.r || 0.09, s.r || 0.09, 0.008, 32), toonMat(th, { base: s.colour || th.edge })); m.position.y = 0.004; g.add(m); return g; },
  // band anchor post (B-tier band drills): heavy round post on a square base plate, standing at s.at (floor); s.height (0.7 m),
  // s.r (0.035), s.tieY = height of the band knot ring (bands are separate `band` props from a world point at the post to the body).
  bandPost(th, s) { const t = T(); const g = new t.Group(); const H = s.height || 0.7, r = s.r || 0.035;
    const post = new t.Mesh(new t.CylinderGeometry(r, r, H, 28), toonMat(th)); post.position.y = H / 2; g.add(post);
    const cap = new t.Mesh(new t.CylinderGeometry(r * 1.15, r * 1.15, 0.02, 28), toonMat(th, { base: th.edge })); cap.position.y = H - 0.01; g.add(cap);
    const plate = new t.Mesh(new t.BoxGeometry(0.26, 0.022, 0.26), toonMat(th)); plate.position.y = 0.011; g.add(plate);
    const knot = new t.Mesh(new t.TorusGeometry(r + 0.007, 0.008, 8, 28), toonMat(th, { base: s.colour || '#7a4a32', rimK: 0.5 })); knot.rotation.x = Math.PI / 2; knot.position.y = s.tieY ?? 0.3; g.add(knot);
    return g; },
  // flat wall panel (hand support): s.at = centre of the face on the floor line, s.normal yaw via s.yaw (face toward +Z at yaw 0)
  wall(th, s) { const t = T(); const g = new t.Group(); const [W, H, D] = s.size || [1.4, 2.2, 0.12];
    const m = new t.Mesh(new t.BoxGeometry(W, H, D), toonMat(th, { base: s.base || '#2a2c31', rimK: 0.35 })); m.position.set(0, H / 2, -D / 2); g.add(m); return g; },
  // placeholder for machines (cable stack, landmine, GHD, reverse hyper, abductor, leg extension): a labelled box until modelled
  machine(th, s) { const t = T(); const g = new t.Group(); const [w, h, d] = s.size || [0.8, 1.6, 0.8]; const m = new t.Mesh(new t.BoxGeometry(w, h, d), toonMat(th)); m.position.y = h / 2; g.add(m); g.userData.machine = s.kind || 'unknown'; return g; },
};
P.types = Object.keys(B);
P.add = function(theme, s) { const t = T(), v = flareInspector.viewer; const th = theme.props; const o = B[s.type](th, s); o.name = 'prop_' + s.type; o.userData.spec = s; o.frustumCulled = false; o.traverse(c => { c.frustumCulled = false; });
  v.scene.add(o); P.list.push(o); P.place(o); return o; };
P.place = function(o) { const t = T(), v = flareInspector.viewer, s = o.userData.spec;
  // follow: centre on the mean of several points ({bone, offset} or world [x,y,z]) + s.offset (world), level (yaw + rot only);
  // fixX/fixY/fixZ pin that world coordinate (e.g. a foam roller between the forearms and a wall)
  if (s.follow) { const c = new t.Vector3(); for (const p of s.follow) c.add(P.pt(p)); c.multiplyScalar(1 / s.follow.length).add(new t.Vector3(...(s.offset || [0, 0, 0])));
    if (s.fixX != null) c.x = s.fixX; if (s.fixY != null) c.y = s.fixY; if (s.fixZ != null) c.z = s.fixZ; o.position.copy(c);
    const rq = (s.rot || []).reduce((q, [ax, d]) => q.premultiply(new t.Quaternion().setFromAxisAngle(new t.Vector3(...ax).normalize(), d * Math.PI / 180)), new t.Quaternion());
    o.quaternion.setFromAxisAngle(new t.Vector3(0, 1, 0), (s.yaw || 0) * Math.PI / 180).multiply(rq); o.updateMatrixWorld(true); return; }
  if (o.userData.band) { const a = P.pt(s.from), b = P.pt(s.to); const mid = a.clone().lerp(b, 0.5); mid.y -= s.sag || 0; const c = new t.QuadraticBezierCurve3(a, mid, b); o.geometry.dispose(); o.geometry = new t.TubeGeometry(c, 24, s.r || 0.008, 8); return; }
  const rot = (s.rot || []).reduce((q, [ax, d]) => q.premultiply(new t.Quaternion().setFromAxisAngle(new t.Vector3(...ax).normalize(), d * Math.PI / 180)), new t.Quaternion());
  if (!s.attach || s.attach === 'world') { o.position.set(...(s.at || [0, 0, 0])); o.quaternion.copy(new t.Quaternion().setFromAxisAngle(new t.Vector3(0, 1, 0), (s.yaw || 0) * Math.PI / 180)).multiply(rot); }
  else { const bone = v.coach.getObjectByName(s.attach); const bp = bone.getWorldPosition(new t.Vector3()), bq = bone.getWorldQuaternion(new t.Quaternion());
    o.position.copy(new t.Vector3(...(s.offset || [0, 0, 0])).applyQuaternion(bq).add(bp)); o.quaternion.copy(bq).multiply(rot);
    // flat: follow the bone point in x/z only, stay on the floor (y = s.floorY) and level (yaw only), e.g. sliders under a moving foot
    if (s.flat) { o.position.y = s.floorY ?? 0; o.quaternion.setFromAxisAngle(new t.Vector3(0, 1, 0), (s.yaw || 0) * Math.PI / 180).multiply(rot); } }
  o.updateMatrixWorld(true); };
P.pt = function(p) { const t = T(), v = flareInspector.viewer; if (Array.isArray(p)) return new t.Vector3(...p); const b = v.coach.getObjectByName(p.bone); return new t.Vector3(...(p.offset || [0, 0, 0])).applyQuaternion(b.getWorldQuaternion(new t.Quaternion())).add(b.getWorldPosition(new t.Vector3())); };
P.update = function() { for (const o of P.list) P.place(o); };
})();
