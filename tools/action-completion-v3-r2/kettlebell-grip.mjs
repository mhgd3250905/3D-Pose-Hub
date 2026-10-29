// Opt-in preview prop; frozen model and historical kettlebell geometry stay intact.
// Install after the native grasp-32mm preset, before adding source props.
export async function installKettlebellGrip(page) {
  return page.evaluate(installKettlebellGripInPage);
}

export function installKettlebellGripInPage() {
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
    tube('fixed-kettlebell-handle', [-half, 0, 0], [half, 0, 0], .016);
    for (const sign of [-1, 1])
      tube('fixed-kettlebell-connector', [sign * half, 0, 0], [sign * radius * .62, -drop + radius * .65, 0], .014);
    const bell = new T.Mesh(new T.SphereGeometry(radius, 24, 16), mat);
    bell.name = 'fixed-kettlebell-bell'; bell.position.y = -drop; o.add(bell);
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
