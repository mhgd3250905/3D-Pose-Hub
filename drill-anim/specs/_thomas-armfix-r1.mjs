// New armfix-r2 authoring derivative. Frozen helper _thomas.mjs is preserved.
// Actual armfix hip pivots and leg lengths; authored world contacts are not scaled.
// Shared helpers for the Thomas (托马斯专项) bodyweight floor drills, specs/t-*.js. Not a drill itself (.mjs is never listed as a spec).
// Frame convention for every t-* spec: head up (+Y), body faces +Z, body left = +X. Hips frame = rest-pose coordinates carried by the pelvis.
export const R = { pelvis: [0, 0.9635251718590191, 0.008228798311505537], hip: { left: [0.081543, 0.9159351718590191, 0.003696798311505538], right: [-0.081543, 0.9159351718590191, 0.003696798311505538] } };
export const TH = 0.409739814, SH = 0.416772719;
const D2R = Math.PI / 180;
export const reach = deg => Math.sqrt(TH * TH + SH * SH - 2 * TH * SH * Math.cos(deg * D2R));
export const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const rotX = (v, deg) => { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; };
export const rotY = (v, deg) => { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; };
export const rotZ = (v, deg) => { const c = Math.cos(deg * D2R), s = Math.sin(deg * D2R); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
const rotAxis = (v, axis, deg) => { const a = norm(axis), c = Math.cos(deg * D2R), s = Math.sin(deg * D2R), k = dot(a, v), cr = cross(a, v); return v.map((x, i) => x * c + cr[i] * s + a[i] * k * (1 - c)); };
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = u => { u = Math.min(1, Math.max(0, u)); return u * u * u * (u * (u * 6 - 15) + 10); };
export const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
// piecewise curve [[t, v], ...] with cos easing, periodic over T (wraps to the first value)
export const curve = (keys, T, e = cosE) => t => {
  t = ((t % T) + T) % T;
  for (let i = 0; i < keys.length; i++) { const [ta, va] = keys[i], [tb, vb] = keys[i + 1] || [T, keys[0][1]]; if (t >= ta && t < tb) return va + (vb - va) * e((t - ta) / Math.max(tb - ta, 1e-6)); }
  return keys[0][1];
};
// world direction of a leg: elev = degrees above horizontal (forward = +Z), spread = degrees out to the leg's own side (sg = +1 left, -1 right)
export const dirW = (sg, elev, spread) => [sg * Math.sin(spread * D2R) * Math.cos(elev * D2R), Math.sin(elev * D2R), Math.cos(spread * D2R) * Math.cos(elev * D2R)];
// ankle (hips frame) + knee pole + foot rotation for a straight leg pointing along world dir dW while the hips are pitched by `pitch`
// (hips rot about +X, + = lean forward); pf = plantar flexion in degrees (toes point along the shin as pf grows)
export function leg(side, dW, pitch, pf = 30, knee = 178, kneeUp = null, rel = null, roll = 0, yaw = 0) {
  // rel: world offset hip -> ankle (overrides dW/knee; the knee angle follows from its length)
  // Undo the complete pelvis orientation: qP = Ry(yaw) Rz(roll) Rx(pitch).
  // Pitch-only conversion silently rotates an intended world leg with a rolled/yawed pelvis.
  const toLocal = v => rotX(rotZ(rotY(v, -yaw), -roll), -pitch);
  const d = norm(toLocal(rel || dW)), h = R.hip[side], L = rel ? Math.hypot(...rel) : reach(knee);
  const ankle = h.map((x, i) => x + L * d[i]);
  // knee cap direction: rest 'up' tilted with the hips, made perpendicular to the leg (straddle: knee caps face up)
  const up = norm(toLocal(kneeUp || [0, 1, 0])); const u = norm(up.map((x, i) => x - dot(up, d) * d[i]));
  const pole = h.map((x, i) => x + 0.5 * L * d[i] + 0.6 * u[i]);
  // foot: plantar flexion about X (rest), then the shortest arc from the rest leg line (-Y) to d; all conjugated by the hips pitch (rot is world, pre-multiplied)
  // shin direction (analytic two-bone with the pole): the foot follows the shin, not the hip->ankle chord
  const pn = norm(pole.map((x, i) => x - h[i]).map((x, i, A) => x - dot(A, d) * d[i]));
  const ap = (TH * TH - SH * SH + L * L) / (2 * L), hh = Math.sqrt(Math.max(0, TH * TH - ap * ap));
  const kneeP = h.map((x, i) => x + ap * d[i] + hh * pn[i]); const sd = norm(ankle.map((x, i) => x - kneeP[i]));
  const down = [0, -1, 0]; let ax = cross(down, sd); const s = Math.hypot(...ax); const ang = Math.atan2(s, dot(down, sd)) / D2R; ax = s > 1e-6 ? ax.map(x => x / s) : [1, 0, 0];
  // Align neutral toes to the authored knee plane before pointing the foot.
  const zSwing = rotAxis([0, 0, 1], ax, ang), zWant = norm(pn.map((x, i) => x - dot(pn, sd) * sd[i]));
  const twist = Math.atan2(dot(sd, cross(zSwing, zWant)), dot(zSwing, zWant)) / D2R;
  const rot = [[[0, 1, 0], -yaw], [[0, 0, 1], -roll], [[1, 0, 0], -pitch],
    [[1, 0, 0], pf], [ax, ang], [sd, twist], [[1, 0, 0], pitch], [[0, 0, 1], roll], [[0, 1, 0], yaw]];
  return { ankle, pole, rot };
}
// Scripted pose: every numeric leaf listed in `fields` (name -> path into the descriptor) follows fn(t)[name] exactly.
// Each field gets its own track (value - base, linear keys every `step` s) and a delta that is base + 1 at that path, so the
// engine's linear blend base + sum p*(d - base) reproduces fn(t) for any number of fields (no chord error between poses).
const setPath = (o, path, val) => { let c = o; for (let i = 0; i < path.length; i++) { const k = path[i], last = i === path.length - 1;
  if (last) { c[k] = val; break; } if (c[k] === undefined) { c[k] = typeof path[i + 1] === 'number' ? [] : {}; } c = c[k]; }
  return o; };
const fillArrays = o => { if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) o[i] = o[i] === undefined ? {} : fillArrays(o[i]); return o; }
  if (o && typeof o === 'object') { for (const k of Object.keys(o)) o[k] = fillArrays(o[k]); } return o; };
const getPath = (o, path) => path.reduce((c, k) => c[k], o);
export function scripted(base, fn, T, step = 1 / 30) {
  const f0 = fn(0), tracks = {}, deltas = {};
  // fn(t) returns { path-string: value }, path-string like 'pelvis.1' or 'feet.left.rot.2.1' (numeric parts index arrays)
  const P = k => k.split('.').map(x => /^\d+$/.test(x) ? +x : x);
  for (const k of Object.keys(f0)) setPath(base, P(k), f0[k]);
  for (const k of Object.keys(f0)) { tracks[k] = []; const d = {}; setPath(d, P(k), getPath(base, P(k)) + 1); deltas[k] = fillArrays(d); }
  const n = Math.round(T / step);
  for (let i = 0; i < n; i++) { const t = +(i * step).toFixed(5), v = fn(t); for (const k of Object.keys(f0)) tracks[k].push([t, +(v[k] - f0[k]).toFixed(6), 'linear']); }
  return { tracks, deltas };
}
// flatten a leg() result into scripted fields
export function legFields(side, L) {
  const o = {}; L.ankle.forEach((v, i) => { o[`feet.${side}.ankle.${i}`] = v; }); L.pole.forEach((v, i) => { o[`feet.${side}.poleLow.${i}`] = v; });
  L.rot.forEach((r, j) => { r[0].forEach((v, i) => { o[`feet.${side}.rot.${j}.0.${i}`] = v; }); o[`feet.${side}.rot.${j}.1`] = r[1]; });
  return o;
}

// Floor support / seated builder shared by the L-sit and straddle drills. cfg.fn(t) returns
//   { pitch, py (pelvis height target), pw (its weight), shift (shoulder depression, m), lean (chest waist bend start, deg),
//     legs: { left: { elev, spread, pf, knee, kneeUp? }, right: {...} }, hands?: { left: [x,z], right: [x,z] } }
export function floorDrill(cfg) {
  const T = cfg.T;
  const hand = (sg, h) => ({ mode: 'floor', at: [h[0], h[1]], finger: h[2] || [sg * 0.25, 1], poleUp: cfg.poleUp ? cfg.poleUp(sg) : [sg * 0.3, 1.0, -0.8] });
  const f0 = cfg.fn(0);
  const H = cfg.hands; // { left: [x, z, finger?], right: [...] }
  const fn = t => {
    const s = cfg.fn(t), o = {
      'hips.rot.0.1': s.pitch, 'hips.rot.1.1': s.roll || 0, 'hips.rot.2.1': s.yaw || 0,
      'chest.waist.0.1': s.waist || 0, 'chest.waist.1.1': s.waistYaw || 0,
      'constraints.2.value': s.py, 'constraints.2.weight': s.pw ?? 1,
      'shoulders.shift.1': -(s.shift || 0),
      'constraints.0.angle': s.elbow ?? cfg.elbow ?? 177.5, 'constraints.1.angle': s.elbowL ?? s.elbow ?? cfg.elbow ?? 177.5,
      'constraints.3.value': s.pz ?? 0, 'constraints.3.weight': s.pzw ?? 0,
    };
    if (s.px !== undefined) o['pelvis.0'] = s.px;
    if (s.rootZ !== undefined) o['pelvis.2'] = s.rootZ;
    if (s.legs) for (const side of ['left', 'right']) { const sg = side === 'left' ? 1 : -1, l = s.legs[side];
      Object.assign(o, legFields(side, leg(side, dirW(sg, l.elev, l.spread), s.pitch, l.pf ?? 30, l.knee ?? 178, l.kneeUp || null, l.rel || null, s.roll || 0, s.yaw || 0)));
      o[`feet.${side}.thighTwist`] = l.thighTwist || 0;
      o[`feet.${side}.kneeTwist`] = l.kneeTwist || 0;
    }
    if (s.hands) for (const side of ['left', 'right']) {
      const at = cfg.handsDesc?.[side]?.plant ? `hands.${side}.plant.at` : `hands.${side}.at`;
      o[`${at}.0`] = s.hands[side][0]; o[`${at}.1`] = s.hands[side][1];
    }
    if (cfg.extra) Object.assign(o, cfg.extra(t, s));
    return o;
  };
  const base = {
    pelvis: [0, 0.134, 0],
    hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0], [[0, 0, 1], 0], [[0, 1, 0], 0]] },
    chest: { waist: [[[1, 0, 0], 0], [[0, 1, 0], 0]] },
    shoulders: { shift: [0, 0, 0] },
    hands: cfg.handsDesc || { right: hand(-1, H.right), left: hand(1, H.left) },
    feet: cfg.feetDesc || { left: { mode: 'free', frame: 'hips' }, right: { mode: 'free', frame: 'hips' } },
    constraints: [
      { type: 'reach', limb: 'rightArm', angle: cfg.elbow ?? 177.5 }, { type: 'reach', limb: 'leftArm', angle: cfg.elbow ?? 177.5 },
      { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.134, weight: 1 },
      { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: 0, weight: 0 },
      ...(cfg.constraints || []),
    ],
    // The source chest/waist pose is authored from the reference, never invented
    // by arm reach. Only small pelvis translations reconcile contact and rig lengths.
    solve: cfg.solve || { vars: ['py', 'pz'], reg: { py: 0.3, pz: 0.05 }, iters: 60 },
  };
  const S = scripted(base, fn, T);
  for (const [k, f] of Object.entries(cfg.tags || {})) { S.tracks[k] = []; for (let i = 0; i < Math.round(T * 30); i++) { const t = +(i / 30).toFixed(5); S.tracks[k].push([t, +f(t).toFixed(5), 'linear']); } }
  return {
    id: cfg.id, name: cfg.name, nameEn: cfg.nameEn,
    timeline: { duration: T, tracks: S.tracks },
    pose: { base, deltas: S.deltas },
    // Preserve the original Snow skin roll unless an accepted drill explicitly opts in.
    alignBendPlanes: cfg.alignBendPlanes ?? false,
    solveShoulders: true,
    highlight: { ...cfg.highlight, skipBottom: true },
    camera: { fitTimeline: true, ...cfg.camera },
    frame: cfg.frame || { mode: 'fit', width: 900, height: 700, cx: 512, cy: 540 },
    stillAt: cfg.stillAt ?? cfg.camera.at,
    shadow: cfg.shadow || { joints: ['rightPalm', 'leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis'],
      blobs: [{ j: 'rightPalm', rx: 40, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 40, ry: 12, a: 0.7 }, { j: 'pelvis', rx: 80, ry: 20, a: 0.5 },
        { j: 'rightAnkle', rx: 36, ry: 10, a: 0.5, fade: [0.08, 0.25] }, { j: 'leftAnkle', rx: 36, ry: 10, a: 0.5, fade: [0.08, 0.25] }], bands: [] },
    props: cfg.props || [{ type: 'mat', at: [0, 0, 0.25], size: [1.83, 1.1, 0.006] }],
    keyFrames: cfg.keyFrames,
    qa: cfg.qa,
  };
}
export const qaStd = (extra = {}) => ({
  pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
  straight: [...(extra.straightArms || [{ j: 'elbow.right', min: 176, when: 'params.up>0.999' }, { j: 'elbow.left', min: 176, when: 'params.up>0.999' }]), ...(extra.straightLegs || [{ j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }])],
  allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', ...(extra.allow || [])],
  ...(extra.more || {}),
});
