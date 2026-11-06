// Foot-follow track injection (foot-angle r3, 2026-11-06). Pure data, no browser.
// applyFootFollow(previous, id, data) returns a new spec in which each listed side's FREE foot `rot` is replaced by three
// fixed-axis rotations [[X, a(t)], [Y, b(t)], [Z, c(t)]] (engine rotList premultiplies: q = Rz(c) Ry(b) Rx(a), then the
// frame carry as before) whose angles are per-frame 'linear' tracks. The angles are baked offline by
// tools/foot-angle-r3/foot-follow.mjs from the solved shin of `previous` (foot follows the shin + a keyed
// plantar/dorsi-flexion, toe-in/out and inversion offset; frames where the original foot rests on the floor keep the
// original orientation, with a smooth blend in between). Ankle targets, poles, mode/frame, every other limb, timing and
// camera stay as in `previous`; only deltas that wrote into feet.<side>.rot are dropped (they are baked into the tracks).
// data = { sides: { right: { t: [...], a: [...], b: [...], c: [...] } } }  (degrees, unwrapped)
export function applyFootFollow(previous, id, data) {
  const s = structuredClone(previous);
  s.id = id;
  s.timeline = { ...s.timeline, tracks: { ...s.timeline.tracks } };
  s.pose = { ...s.pose, base: structuredClone(s.pose.base), deltas: structuredClone(s.pose.deltas || {}) };
  for (const [side, d] of Object.entries(data.sides)) {
    const F = s.pose.base.feet[side];
    if (F.mode !== 'free') throw Error(`foot-follow: ${side} foot must be mode 'free'`);
    F.rot = [[[1, 0, 0], 0], [[0, 1, 0], 0], [[0, 0, 1], 0]];
    for (const del of Object.values(s.pose.deltas)) if (del?.feet?.[side] && 'rot' in del.feet[side]) delete del.feet[side].rot;
    const tag = 'fa1' + side[0].toUpperCase();
    ['a', 'b', 'c'].forEach((k, i) => {
      const key = tag + i;
      if (s.timeline.tracks[key] || s.pose.deltas[key]) throw Error('foot-follow: track name taken ' + key);
      s.timeline.tracks[key] = d.t.map((t, j) => [t, d[k][j], 'linear']);
      const rot = []; for (let j = 0; j < i; j++) rot.push({}); rot.push([{}, 1]);
      s.pose.deltas[key] = { feet: { [side]: { rot } } };
    });
  }
  return s;
}
