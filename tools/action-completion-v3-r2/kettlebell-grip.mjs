// Opt-in preview prop; frozen model and historical kettlebell geometry stay intact.
// Install after the native grasp-32mm preset, before adding source props.
// Optional CC0 mesh models (s.model), passed into the page as plain arrays.
export const KETTLEBELL_MODELS = {'thebasemesh-kettlebell-01': 'drill-anim/assets/props/kettlebell-thebasemesh-01.json'};
export async function installKettlebellGrip(page, {models = []} = {}) {
  const fs = await import('node:fs'), path = await import('node:path'), url = await import('node:url');
  const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..');
  const meshes = Object.fromEntries(models.filter(id => id !== 'straight-grip-kettlebell-r1').map(id => {
    if (!KETTLEBELL_MODELS[id]) throw Error('Unknown kettlebell model: ' + id);
    const d = JSON.parse(fs.readFileSync(path.join(root, KETTLEBELL_MODELS[id]), 'utf8'));
    return [id, {positions: d.positions, indices: d.indices, source: d.source, license: d.license}];
  }));
  return page.evaluate(installKettlebellGripInPage, meshes);
}

export function installKettlebellGripInPage(meshes = {}) {
  const P = window.__props, T = window.__toonT, v = flareInspector.viewer;
  const installed = window.__fixedGrasp, pose = 'grasp-32mm';
  if (!P || !T || installed?.pose !== pose || window.__completionKettlebellGrip)
    throw Error('Kettlebell grip requires a fresh installed native grasp-32mm preset');
  const fit = installed.fit;
  if (fit.radius !== .016 || fit.finiteHandle?.lengthM !== .165 ||
      [fit.center, fit.axis].some(a => !Array.isArray(a) || a.length !== 3 || a.some(x => !Number.isFinite(x))) ||
      Math.abs(Math.hypot(...fit.axis) - 1) > 1e-6)
    throw Error('Unsupported kettlebell grasp dimensions');
  const priorAdd = P.add, priorPlace = P.place;
  const validate = s => {
    if (s.fixedKettlebellGrasp !== pose || s.type !== 'kettlebell' ||
        !['leftHand', 'rightHand'].includes(s.attach) ||
        ['offset', 'rot', 'follow', 'at', 'yaw', 'flat', 'fixedGrasp'].some(k => s[k] !== undefined) ||
        (s.model !== undefined && s.model !== 'straight-grip-kettlebell-r1' && !meshes[s.model]) ||
        !Number.isFinite(s.r ?? .095) || (s.r ?? .095) < .06 || (s.r ?? .095) > .12)
      throw Error('Unsupported explicit kettlebell grasp prop');
  };
  P.add = function(theme, s) {
    if (s.fixedKettlebellGrasp === undefined) return priorAdd.call(this, theme, s);
    validate(s);
    if (!v.coach.getObjectByName(s.attach)) throw Error('Kettlebell hand bone missing');
    const right = s.attach === 'rightHand', sign = right ? -1 : 1;
    const mirror = a => a.map((x, i) => i === 0 ? sign * x : x);
    const axis = new T.Vector3(...mirror(fit.axis)).normalize();
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
      // Grip section is an exact straight 32 mm cylinder (what grasp-32mm closes on), 120 mm long on the fitted axis.
      // Corners and legs are a constant 32 mm tube into a lathed bell whose profile is taken from the CC0 TheBaseMesh
      // kettlebell-01 (x1.2: 180 mm bell, ~12 kg class). Bell top 50 mm below the bar surface leaves room for the fingers.
      const R = .016, A = .06, top = -(R + .05), k = 1.2;
      const prof = [[0,.044],[.01,.053],[.02,.0625],[.03,.0695],[.045,.073],[.06,.0752],[.08,.074],[.095,.070],[.11,.062],[.122,.048],[.132,.03],[.138,0]];
      const h = .138 * k, pts = prof.map(([y, r]) => new T.Vector2(Math.max(r * k, 1e-4), top - h + y * k));
      pts.unshift(new T.Vector2(1e-4, top - h));
      const bell = new T.Mesh(new T.LatheGeometry(pts, 40), mat); bell.name = 'fixed-kettlebell-bell'; o.add(bell);
      tube('fixed-kettlebell-handle', [-A, 0, 0], [A, 0, 0], R);
      for (const sx of [-1, 1]) {
        const c = new T.CatmullRomCurve3([[A, 0], [A + .016, -.006], [.084, -.03], [.08, -.06], [.066, -.1]].map(([x, y]) => new T.Vector3(sx * x, y, 0)));
        const leg = new T.Mesh(new T.TubeGeometry(c, 24, R, 16, false), mat); leg.name = 'fixed-kettlebell-horn'; o.add(leg);
        const cap = new T.Mesh(new T.SphereGeometry(R, 16, 12), mat); cap.position.set(sx * A, 0, 0); o.add(cap);
      }
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
    o.userData.completionKettlebellGrip = {center:mirror(fit.center), localRotation,
      handleLengthM:.165, handleRadiusM:.016, bellRadiusM:radius, bellDropM:drop};
    o.traverse(c => { c.frustumCulled = false; });
    v.scene.add(o); P.list.push(o); P.place(o); return o;
  };
  P.place = function(o) {
    const grip = o.userData.completionKettlebellGrip;
    if (!grip) return priorPlace.call(this, o);
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
