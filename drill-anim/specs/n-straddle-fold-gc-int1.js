// n-straddle-fold-gc-int1 (integration r1, 2026-11-06): ground-contact fix (n-straddle-fold-gc1, palms +25.9 mm onto the block tops) +
// self-collision fix of n-straddle-fold-sc1 (PR #29: elbow pole [+-0.22, 0.9, -0.35] so the arms run straight down inside the legs
// instead of bowing into the inner thighs; straddle 50 -> 53 deg each side). Base is gc1 (baked); hand poles and the static foot
// placement (ankle / yaw, recomputed exactly as the source does with SP = 53) are replaced. Palms, blocks, trunk, timing, camera are gc1's.
import base from './n-straddle-fold-gc1.js';
const s = structuredClone(base);
s.id = 'n-straddle-fold-gc-int1';
const DEG = Math.PI / 180, SP = 53, LEGR = 0.751;
const r4 = v => v.map(x => +x.toFixed(4));
for (const [side, sg] of [['left', 1], ['right', -1]]) {
  s.pose.base.hands[side].pole = [sg * 0.22, 0.9, -0.35];
  const h = [sg * 0.0815, 0.086, 0.0], a = sg * SP * DEG;
  const f = s.pose.base.feet[side];
  f.ankle = r4([h[0] + LEGR * Math.sin(a), f.ankle[1], h[2] + LEGR * Math.cos(a)]);
  f.rot = [[[1, 0, 0], -78], [[0, 1, 0], sg * SP]];
}
export default s;
