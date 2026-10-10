// Spec helper (B-tier grip): hand target for a power grip round a fixed bar, using the fist baked by P.bakeGrip (#23).
// gripPose(side, bar, axis, palm) -> {wrist, finger, normal} for a hand {mode:'free', frame:'world'} (add a {type:'gripHand', side} prop).
//   bar  : world point on the bar axis where the fist centre goes
//   axis : bar direction; its sign picks the side the thumb closes from (rest hanging hand: +Z = thumb forward)
//   palm : world direction from the bar toward the palm (e.g. up for a hand on top of a parallette, [-1,0,0] lateral)
// The engine sets the hand bone's world quaternion to E.handQ(finger, normal) (palmFrame vectors are bone-local), wrist = bone origin.
// G = baked handle centre c / axis a / palmar direction pal in the hand bone's local frame (tools/grip/handframe-probe.js).
export const G = {"right": {"c": [-0.095838, -0.02992, -0.001002], "a": [-0.132415, -0.166409, 0.977126], "pal": [0.296246, -0.947391, -0.121199]}, "left": {"c": [0.095838, -0.02992, -0.001002], "a": [0.132415, -0.166409, 0.977126], "pal": [-0.296246, -0.94739, -0.121199]}};
const PF = { left: [[0.98253144, 0.05483374, 0.17783482], [0.06068526, -0.99777448, -0.02762938]],
  right: [[-0.98253144, 0.05483374, 0.17783482], [-0.06068526, -0.99777448, -0.02762938]] };
const sub = (a, b) => a.map((x, i) => x - b[i]), dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), sc = (a, k) => a.map(x => x * k);
const nrm = a => sc(a, 1 / Math.hypot(...a)), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// orthonormal basis (columns) from a primary axis and a secondary direction
const basis = (a, p) => { a = nrm(a); p = nrm(sub(p, sc(a, dot(p, a)))); return [a, p, cross(a, p)]; };
const apply = (Bw, Bl, v) => { const k = Bl.map(e => dot(e, v)); return [0, 1, 2].map(i => Bw.reduce((s, e, j) => s + e[i] * k[j], 0)); };
const r4 = v => v.map(x => +x.toFixed(4));
export function gripPose(side, bar, axis, palm) {
  const g = G[side], Bw = basis(axis, sc(palm, -1)), Bl = basis(g.a, g.pal);
  return { wrist: r4(sub(bar, apply(Bw, Bl, g.c))), finger: r4(apply(Bw, Bl, PF[side][0])), normal: r4(apply(Bw, Bl, PF[side][1])) };
}
// prop held in a gripping hand (attach: '<side>Hand'): {offset, rot} that put the prop's own handle axis (propAxis, local; the
// dumbbell's handle runs along X) through the baked fist, centred. Spread into the prop spec: {type:'dumbbell', attach:'rightHand', ...gripAttach('right')}
export function gripAttach(side, propAxis = [1, 0, 0]) {
  const g = G[side], u = nrm(propAxis), a = nrm(g.a), ax = cross(u, a), sn = Math.hypot(...ax), cs = dot(u, a);
  const deg = Math.atan2(sn, cs) * 180 / Math.PI;
  return { offset: r4(g.c), rot: sn < 1e-9 ? [] : [[r4(nrm(ax)), +deg.toFixed(3)]] };
}
