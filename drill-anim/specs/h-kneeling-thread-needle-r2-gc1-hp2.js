// h-kneeling-thread-needle-r2-gc1-hp2 (pose-fix r10, 2026-11-05): h-kneeling-thread-needle-r2-gc1-hp1 (GC spec + defined thumb-up supination path for
// the threading hand) with the threading arc raised 0.06 -> 0.10 m. hp1 alone put the thumb-up hand's little-finger edge 6.9 mm into the floor at
// ~2.1 s / ~5.9 s (wrist path unchanged, hand now vertical there); the arc only lifts the wrist during the blend (sin(pi*w), 0 at plant and at the
// hold), so the planted hand, the threaded hold (3-5 s), the right elbow clearance and the rest of the GC fix are unchanged.
import base from './h-kneeling-thread-needle-r2-gc1-hp1.js';
const s = structuredClone(base);
s.id = 'h-kneeling-thread-needle-r2-gc1-hp2';
s.pose.base.hands.right.arc = 0.10;
export default s;
