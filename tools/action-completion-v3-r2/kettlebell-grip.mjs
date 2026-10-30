// Opt-in preview prop; frozen model and historical kettlebell geometry stay intact.
// Install after the native grasp-32mm preset, before adding source props.
// Optional CC0 mesh models (s.model), passed into the page as plain arrays.
export const KETTLEBELL_MODELS = {'thebasemesh-kettlebell-01': 'drill-anim/assets/props/kettlebell-thebasemesh-01.json'};
export async function installKettlebellGrip(page, {models = [], pose = 'grasp-32mm'} = {}) {
  const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
  const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..');
  const meshes = Object.fromEntries(models.filter(id => !['straight-grip-kettlebell-r1', 'goblet-horns-kettlebell-r1'].includes(id)).map(id => {
    if (!KETTLEBELL_MODELS[id]) throw Error('Unknown kettlebell model: ' + id);
    const d = JSON.parse(fs.readFileSync(path.join(root, KETTLEBELL_MODELS[id]), 'utf8'));
    return [id, {positions: d.positions, indices: d.indices, source: d.source, license: d.license}];
  }));
  return page.evaluate(`(${installKettlebellGripInPage.toString()})(${JSON.stringify(meshes)}, ${JSON.stringify({pose})})`);
}

export function installKettlebellGripInPage(meshes = {}, {pose = 'grasp-32mm'} = {}) {
  const P = window.__props, T = window.__toonT, v = flareInspector.viewer;
  // 'webxr-dumbbell-fist': the frozen, user-accepted webxr-dumbbell-wrist-r1 fist (its dumbbell hidden). Shaft centre/axis
  // in hand-bone local space are the same constants fixed-bar-grip-r1 uses (G in fixed-bar-grip-r1.mjs).
  const FROZEN = {left:{c:[0.076111,-0.043131,0.000018], a:[0.330218,0.01962,0.943701]}, right:{c:[-0.076111,-0.043131,0.000018], a:[-0.330218,0.01962,0.943701]}};
  const frozen = pose === 'webxr-dumbbell-fist';
  if (!['grasp-32mm', 'webxr-dumbbell-fist'].includes(pose) || !P || !T || window.__completionKettlebellGrip ||
      (frozen ? !window.__webxrWristJoin : window.__fixedGrasp?.pose !== pose))
    throw Error('Kettlebell grip requires a fresh installed ' + (frozen ? 'webxr dumbbell wrist fist' : 'native grasp-32mm preset'));
  const nrm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
  const fit = frozen ? {radius:.016, finiteHandle:{lengthM:.165}, center:FROZEN.left.c, axis:nrm(FROZEN.left.a), sourceId:'webxr-dumbbell-wrist-r1'} : window.__fixedGrasp.fit;
  // Axial span of the closed fist around the shaft, measured on the actual frozen hand mesh in hand-bone space.
  const frozenBounds = (side, center, axis) => {
    const bone = v.coach.getObjectByName(side + 'Hand'); let mesh = null;
    v.scene.traverse(o => { if (!mesh && o.isMesh && /^WebXR_(Fixed|Clipped)_Hand_/.test(o.name) && o.name.includes(side)) mesh = o; });
    if (!mesh || !bone) return [-.0825, .0825];
    v.scene.updateMatrixWorld(true);
    const inv = bone.matrixWorld.clone().invert(), pos = mesh.geometry.attributes.position, p = new T.Vector3();
    const C = new T.Vector3(...center), X = new T.Vector3(...axis), t = [];
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv).sub(C);
      const along = p.dot(X); if (p.addScaledVector(X, -along).length() < .045) t.push(along);
    }
    if (t.length < 20) return [-.0825, .0825];
    t.sort((a, b) => a - b); return [t[Math.floor(t.length * .01)], t[Math.ceil(t.length * .99) - 1]];
  };
  if (fit.radius !== .016 || fit.finiteHandle?.lengthM !== .165 ||
      [fit.center, fit.axis].some(a => !Array.isArray(a) || a.length !== 3 || a.some(x => !Number.isFinite(x))) ||
      Math.abs(Math.hypot(...fit.axis) - 1) > 1e-6)
    throw Error('Unsupported kettlebell grasp dimensions');
  const priorAdd = P.add, priorPlace = P.place;
  const validate = s => {
    if (s.fixedKettlebellGrasp !== pose || s.type !== 'kettlebell' ||
        !(['leftHand', 'rightHand'].includes(s.attach) || (s.attach === 'bothHands' && frozen && s.model === 'goblet-horns-kettlebell-r1')) ||
        ['offset', 'rot', 'follow', 'at', 'yaw', 'flat', 'fixedGrasp'].some(k => s[k] !== undefined) ||
        (s.model !== undefined && !['straight-grip-kettlebell-r1', 'goblet-horns-kettlebell-r1'].includes(s.model) && !meshes[s.model]) ||
        (s.model === 'goblet-horns-kettlebell-r1') !== (s.attach === 'bothHands') ||
        !Number.isFinite(s.r ?? .095) || (s.r ?? .095) < .06 || (s.r ?? .095) > .12)
      throw Error('Unsupported explicit kettlebell grasp prop');
  };
  P.add = function(theme, s) {
    if (s.fixedKettlebellGrasp === undefined) return priorAdd.call(this, theme, s);
    validate(s);
    if (s.attach === 'bothHands') return addGoblet(theme, s);
    if (!v.coach.getObjectByName(s.attach)) throw Error('Kettlebell hand bone missing');
    const right = s.attach === 'rightHand', sign = right ? -1 : 1;
    const mirror = a => a.map((x, i) => i === 0 ? sign * x : x);
    const side = right ? 'right' : 'left';
    const center = frozen ? FROZEN[side].c : mirror(fit.center);
    const axis = new T.Vector3(...(frozen ? FROZEN[side].a : mirror(fit.axis))).normalize();
    const bounds = frozen ? frozenBounds(side, center, axis.toArray()) : (fit.finiteHandle?.measuredOriginalBoundsM ?? [-.0825, .0825]);
    // Anatomical distal direction, projected off the fitted grip axis. No world-up
    // branch can flip the bell during the swing or rotate the handle inside the fist.
    const distal = new T.Vector3(sign * .98253144, .05483374, .17783482);
    distal.addScaledVector(axis, -distal.dot(axis)).normalize();
    const up = distal.clone().negate(), normal = axis.clone().cross(up).normalize();
    const localRotation = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(axis, up, normal));
    const o = new T.Group(), radius = s.r ?? .095, half = .165 / 2;
    const drop = radius + .065, mat = P.mat(theme.props, {base:s.colour || theme.props.base});
    const tube = (name, a, b, r) => {
      const A = new T.Vector3(...a), B = new T.Vector3(...b);
      const m = new T.Mesh(new T.CylinderGeometry(r, r, A.distanceTo(B), 20), mat);
      m.name = name; m.position.copy(A).lerp(B, .5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.sub(A).normalize());
      o.add(m);
    };
    if (s.model === 'straight-grip-kettlebell-r1') {
      // Grip section is an exact straight 32 mm cylinder (what grasp-32mm closes on), 165 mm long on the fitted axis (the fist's full fitted handle length, so ring and little fingers clear the corners).
      // Corners and legs are a constant 32 mm tube into a lathed bell whose profile is taken from the CC0 TheBaseMesh
      // kettlebell-01 (x1.3: 195 mm bell, ~16 kg class). Bell top 50 mm below the bar surface leaves room for the fingers.
      // The fitted fist is asymmetric on its axis (measuredOriginalBoundsM, e.g. -99..+37 mm): centre the bar on the hand's own
      // span plus a 12 mm clearance each side, so neither the index nor the little-finger side reaches a corner.
      const [lo, hi] = bounds, mid = (lo + hi) / 2, n0 = o.children.length;
      const R = .016, A = Math.max(.0825, (hi - lo) / 2 + .012), top = -(R + .05), k = 1.3;
      const prof = [[0,.044],[.01,.053],[.02,.0625],[.03,.0695],[.045,.073],[.06,.0752],[.08,.074],[.095,.070],[.11,.062],[.122,.048],[.132,.03],[.138,0]];
      const h = .138 * k, pts = prof.map(([y, r]) => new T.Vector2(Math.max(r * k, 1e-4), top - h + y * k));
      pts.unshift(new T.Vector2(1e-4, top - h));
      const bell = new T.Mesh(new T.LatheGeometry(pts, 40), mat); bell.name = 'fixed-kettlebell-bell'; o.add(bell);
      tube('fixed-kettlebell-handle', [-A, 0, 0], [A, 0, 0], R);
      for (const sx of [-1, 1]) {
        const c = new T.CatmullRomCurve3([[A, 0], [A + .016, -.008], [A + .024, -.035], [A + .0125, -.07], [A - .0125, -.115]].map(([x, y]) => new T.Vector3(sx * x, y, 0)));
        const leg = new T.Mesh(new T.TubeGeometry(c, 24, R, 16, false), mat); leg.name = 'fixed-kettlebell-horn'; o.add(leg);
        const cap = new T.Mesh(new T.SphereGeometry(R, 16, 12), mat); cap.position.set(sx * A, 0, 0); o.add(cap);
      }
      for (const c of o.children.slice(n0)) c.position.x += mid;
    } else if (s.model) {
      // CC0 mesh: handle-bar centre at the origin, handle along +X, bell toward -Y, handle diameter 32 mm.
      const d = meshes[s.model], g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(d.positions, 3)); g.setIndex(d.indices); g.computeVertexNormals();
      const m = new T.Mesh(g, mat); m.name = 'fixed-kettlebell-model'; o.add(m);
    } else {
      tube('fixed-kettlebell-handle', [-half, 0, 0], [half, 0, 0], .016);
      for (const sign of [-1, 1])
        tube('fixed-kettlebell-connector', [sign * half, 0, 0], [sign * radius * .62, -drop + radius * .65, 0], .014);
      const bell = new T.Mesh(new T.SphereGeometry(radius, 24, 16), mat);
      bell.name = 'fixed-kettlebell-bell'; bell.position.y = -drop; o.add(bell);
    }
    o.name = 'prop_kettlebell'; o.userData.spec = s;
    o.userData.completionKettlebellGrip = {center, localRotation, fistAxialBoundsM:bounds,
      handleLengthM:.165, handleRadiusM:.016, bellRadiusM:radius, bellDropM:drop};
    o.traverse(c => { c.frustumCulled = false; });
    v.scene.add(o); P.list.push(o); P.place(o); return o;
  };
  // Goblet hold: both frozen fists each close on one straight vertical 32 mm horn. The bell frame is rebuilt every frame from
  // the two fists' world shaft centres (x: right->left) and their mean shaft axis (y, thumbs), so both stay on their horns.
  const fistWorld = side => {
    const b = v.coach.getObjectByName(side + 'Hand'); b.updateWorldMatrix(true, false);
    return {c:new T.Vector3(...FROZEN[side].c).applyMatrix4(b.matrixWorld), a:new T.Vector3(...FROZEN[side].a).transformDirection(b.matrixWorld)};
  };
  const addGoblet = (theme, s) => {
    if (!v.coach.getObjectByName('leftHand') || !v.coach.getObjectByName('rightHand')) throw Error('Kettlebell hand bone missing');
    const mat = P.mat(theme.props, {base:s.colour || theme.props.base}), o = new T.Group(), R = .016, HW = .075, k = 1.2;
    const [lo, hi] = frozenBounds('left', FROZEN.left.c, nrm(FROZEN.left.a)), yl = lo - .012, yh = hi + .012;
    const tube = (name, pts) => { const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p))), 24, R, 16, false), mat); m.name = name; o.add(m); };
    for (const sx of [-1, 1]) {
      const h = new T.Mesh(new T.CylinderGeometry(R, R, yh - yl, 20), mat); h.name = 'fixed-kettlebell-horn-grip'; h.position.set(sx * HW, (yl + yh) / 2, 0); o.add(h);
      tube('fixed-kettlebell-horn-top', [[sx * HW, yh, 0], [sx * HW, yh + .018, 0], [sx * (HW - .018), yh + .036, 0], [sx * (HW - .04), yh + .04, 0], [0, yh + .04, 0]]);
      tube('fixed-kettlebell-horn-root', [[sx * HW, yl, 0], [sx * HW, yl - .015, 0], [sx * (HW - .012), yl - .035, 0], [sx * (HW - .03), yl - .055, 0]]);
    }
    const prof = [[0,.044],[.01,.053],[.02,.0625],[.03,.0695],[.045,.073],[.06,.0752],[.08,.074],[.095,.070],[.11,.062],[.122,.048],[.132,.03],[.138,0]];
    const top = yl - .04, hgt = .138 * k, pts = prof.map(([y, r]) => new T.Vector2(Math.max(r * k, 1e-4), top - hgt + y * k)); pts.unshift(new T.Vector2(1e-4, top - hgt));
    const bell = new T.Mesh(new T.LatheGeometry(pts, 40), mat); bell.name = 'fixed-kettlebell-bell'; o.add(bell);
    o.name = 'prop_kettlebell'; o.userData.spec = s;
    o.userData.completionKettlebellGrip = {goblet:true, hornHalfWidthM:HW, hornGripM:[yl, yh], fistAxialBoundsM:[lo, hi], bellWidthM:.0752 * 2 * k};
    o.traverse(c => { c.frustumCulled = false; });
    v.scene.add(o); P.list.push(o); P.place(o); return o;
  };
  P.place = function(o) {
    const grip = o.userData.completionKettlebellGrip;
    if (!grip) return priorPlace.call(this, o);
    if (grip.goblet) {
      const L = fistWorld('left'), Rr = fistWorld('right'), x = L.c.clone().sub(Rr.c).normalize();
      const y = L.a.clone().add(Rr.a); y.addScaledVector(x, -y.dot(x)).normalize(); const z = x.clone().cross(y);
      o.position.copy(L.c).lerp(Rr.c, .5); o.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z));
      grip.lastFistGapM = L.c.distanceTo(Rr.c); o.updateMatrixWorld(true); return;
    }
    const b = v.coach.getObjectByName(o.userData.spec.attach);
    b.updateWorldMatrix(true, false);
    const q = b.getWorldQuaternion(new T.Quaternion());
    o.position.copy(new T.Vector3(...grip.center).applyQuaternion(q).add(b.getWorldPosition(new T.Vector3())));
    o.quaternion.copy(q).multiply(grip.localRotation); o.updateMatrixWorld(true);
  };
  return window.__completionKettlebellGrip = {adapter:'kettlebell-grip-r1', pose,
    handleLengthM:.165, handleDiameterM:.032, source:fit.sourceId,
    reviewed:false, releaseEligible:false};
}
