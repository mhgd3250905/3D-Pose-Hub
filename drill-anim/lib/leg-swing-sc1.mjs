// Pose fix r4 (2026-11-05): rotate a free (frame 'hips') leg target about the live hip joint, in the hips frame, by `deg`
// around +X (positive = legs down/forward for a seated V/L-sit). Ankle, knee pole and the foot orientation turn together,
// so knee angle, foot-to-shin angle and spread stay the source's. Used where the calibrated leg targets of the old model put
// the new (thicker) thighs into the belly at a closed hip angle. Handles calibrated templates whose ankle/poleLow scalars carry
// absolute tracks (value = base + track, delta = base + 1): every frame is rotated and base/track/delta rewritten.
export function swingLegs(spec, id, deg, hip) {
  const s = structuredClone(spec); s.id = id;
  const r = deg * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), tr = s.timeline.tracks;
  for (const side of ['left', 'right']) {
    const f = s.pose.base.feet[side], h = hip[side];
    for (const key of ['ankle', 'poleLow']) {
      const ky = `feet.${side}.${key}.1`, kz = `feet.${side}.${key}.2`, b = f[key];
      const ty = tr[ky], tz = tr[kz];
      const at = (T, i) => (T ? T[i][1] : 0);
      const n = ty?.length ?? tz?.length ?? 0;
      const rot = (y, z) => { const yy = y - h[1], zz = z - h[2]; return [h[1] + yy * c - zz * sn, h[2] + yy * sn + zz * c]; };
      const [by, bz] = rot(b[1], b[2]);
      if (n) {
        if (!ty || !tz || ty.length !== tz.length || ty.some((q, i) => q[0] !== tz[i][0])) throw Error('swingLegs: y/z tracks not paired ' + side + key);
        const rows = ty.map((q, i) => rot(b[1] + at(ty, i), b[2] + at(tz, i)));
        ty.forEach((q, i) => { q[1] = +(rows[i][0] - by).toFixed(6); });
        tz.forEach((q, i) => { q[1] = +(rows[i][1] - bz).toFixed(6); });
        s.pose.deltas[ky].feet[side][key][1] = by + 1; s.pose.deltas[kz].feet[side][key][2] = bz + 1;
      }
      f[key] = [b[0], +by.toFixed(6), +bz.toFixed(6)];
    }
    f.rot = [...f.rot, [[1, 0, 0], deg]];
  }
  return s;
}

