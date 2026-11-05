// Self-collision fix r1 (pose-fix r1, 2026-11-05): add a measured, additive offset to a spec's hand targets.
// withPalmOffsets(spec, id, {left:[[t,dx,dy,dz],...], right:[...]}) returns a copy of the spec with extra 'linear'
// tracks scL0..2 / scR0..2 and pose deltas that add (dx,dy,dz) to hands.<side>.palmAt (or .wrist when the hand is placed by its wrist) (in that hand's own frame).
// Engine blend = base + sum p_k (delta_k - base); the delta leaf is base+1, so each track adds exactly its value.
// Nothing else in the spec changes (finger / normal / poles / legs / timing / camera). Tables come from
// tools/pose-fix-r1/hand-push.mjs (real solved surfaces of the armfix-r2 body, not the v2 ss-geo leg()).
/** palmAt when the hand is placed by its palm, else wrist (frame:'world' wrist-placed specs). */
export const handTargetKey = H => Array.isArray(H?.palmAt) ? 'palmAt' : Array.isArray(H?.wrist) ? 'wrist' : null;
export function withPalmOffsets(spec, id, table) {
  const s = structuredClone(spec), D = s.timeline.duration;
  s.id = id; s.timeline = { ...s.timeline, tracks: { ...s.timeline.tracks } }; s.pose = { ...s.pose, deltas: { ...s.pose.deltas } };
  for (const [side, rows] of Object.entries(table || {})) {
    if (!rows?.length) continue;
    const H = s.pose.base.hands?.[side], tk = handTargetKey(H), b = H?.[tk]; if (!Array.isArray(b) || b.length !== 3) throw Error('palm-offset-sc1: no palmAt/wrist for ' + side);
    for (let k = 0; k < 3; k++) {
      const key = 'sc' + (side === 'left' ? 'L' : 'R') + k;
      if (s.timeline.tracks[key]) throw Error('palm-offset-sc1: track exists ' + key);
      const keys = rows.map(r => [+r[0].toFixed(4), +r[1 + k].toFixed(4), 'linear']);
      if (keys[0][0] > 0) keys.unshift([0, keys[keys.length - 1][1], 'linear']);
      keys.push([D, keys[0][1], 'linear']);
      s.timeline.tracks[key] = keys;
      const leaf = []; for (let j = 0; j < k; j++) leaf.push({}); leaf.push(b[k] + 1);
      s.pose.deltas[key] = { hands: { [side]: { [tk]: leaf } } };
    }
  }
  return s;
}
