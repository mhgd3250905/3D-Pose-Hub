"""apply the two-view deltas (d.npz) to r21c at 120 fps + contact cleanup -> out.json"""
import json, sys, numpy as np
from scipy.interpolate import CubicSpline
from common import *
SRC, DN, OUT = sys.argv[1:4]
d = json.load(open(SRC)); F = d['frames']; Z = np.load(DN); x, KJ = Z['x'], Z['KJ']; BONES = list(Z['BONES'])
F0 = json.loads(json.dumps(F))
SPW = (0.5, 0.9, 1.6); rodr = lambda v: Rot.from_rotvec(v).as_matrix(); nrm = lambda v: v / np.linalg.norm(v)
cs = CubicSpline(KJ, x[:, :-6], axis=0)
q6 = lambda M: [round(float(v), 6) for v in Rot.from_matrix(M).as_quat()]
for i in range(KJ[0], KJ[-1] + 1):
    v = cs(i); fr = F[i]
    fr['p'] = [round(float(a), 5) for a in np.array(fr['p']) + v[0:3]]
    fr['q']['pelvis'] = q6(rodr(v[3:6]) @ Q(fr['q']['pelvis']))
    for s, b in enumerate(('spineLower', 'spineUpper', 'torso')): fr['q'][b] = q6(Q(fr['q'][b]) @ rodr(v[6:9] * SPW[s] / 3))
    for m, b in enumerate(BONES): fr['q'][b] = q6(Q(fr['q'][b]) @ rodr(v[9 + 3 * m:12 + 3 * m]))
# ---- contact cleanup ----
def swing(a, b):
    a = nrm(a); b = nrm(b); ax = np.cross(a, b); s = np.linalg.norm(ax)
    return np.eye(3) if s < 1e-9 else rodr(ax / s * np.arctan2(s, a @ b))
def two_bone(i, rb, mb, eb, T):
    W, P = fk(F[i]); l1 = np.linalg.norm(P[mb] - P[rb]); l2 = np.linalg.norm(P[eb] - P[mb])
    S, E = P[rb], P[mb]; dv = T - S; dl = min(np.linalg.norm(dv), (l1 + l2) * 0.9995); dn = nrm(dv)
    pole = E - S - dn * ((E - S) @ dn); pole = nrm(pole) if np.linalg.norm(pole) > 1e-6 else nrm(np.cross(dn, [1, 0, 0]))
    a_ = np.arccos(np.clip((l1 * l1 + dl * dl - l2 * l2) / (2 * l1 * dl), -1, 1)); E2 = S + (dn * np.cos(a_) + pole * np.sin(a_)) * l1; H2 = S + dn * dl
    R1 = swing(E - S, E2 - S); W1 = R1 @ W[rb]; F[i]['q'][rb] = q6(W[PAR[rb]].T @ W1)
    W, P = fk(F[i]); R2 = swing(P[eb] - P[mb], H2 - P[mb]); F[i]['q'][mb] = q6(W[PAR[mb]].T @ (R2 @ W[mb]))
def lockset(name, cond):
    idx = [i for i in range(KJ[0], KJ[-1] + 1) if cond(i)]; return idx
sm = lambda u: u * u * (3 - 2 * u)
for sd in ('left', 'right'):
    lk = [fk(F0[i])[1][sd + 'Foot'][1] < 0.0855 for i in range(len(F))]
    js = list(range(KJ[0], KJ[-1] + 1)); R_ = {j: fk(F[j])[1][sd + 'Foot'] for j in js}; off = {}
    runs = []; i = KJ[0]
    while i <= KJ[-1]:
        if not lk[i]: i += 1; continue
        a0 = i
        while a0 > 0 and lk[a0 - 1]: a0 -= 1
        b0 = i
        while b0 + 1 < len(F) and lk[b0 + 1]: b0 += 1
        inw = list(range(max(a0, KJ[0]), min(b0, KJ[-1]) + 1)); T = np.mean([R_[j] for j in inw], 0); T[1] = 0.085
        for j in inw:   # runs crossing a window edge keep r21's spot at the edge
            u = 1.0
            if a0 < KJ[0]: u = min(u, np.clip((j - KJ[0]) / 24, 0, 1))
            if b0 > KJ[-1]: u = min(u, np.clip((KJ[-1] - j) / 24, 0, 1))
            T0 = fk(F0[j])[1][sd + 'Foot']; off[j] = T0 + sm(u) * (T - T0) - R_[j]
        runs.append((inw[0], inw[-1])); print(sd, 'foot run', a0, b0, 'r21', np.round(fk(F0[inw[len(inw) // 2]])[1][sd + 'Foot'], 3), '-> r22', np.round(T, 3))
        i = b0 + 1
    # offsets between runs: smooth hand-over from one run's edge offset to the next (0 at the window edges)
    for j in js:
        if j in off: continue
        prv = max([r for r in runs if r[1] < j], default=None, key=lambda r: r[1]); nxt = min([r for r in runs if r[0] > j], default=None, key=lambda r: r[0])
        oa, ta = (off[prv[1]], prv[1]) if prv else (np.zeros(3), KJ[0] - 1)
        ob, tb = (off[nxt[0]], nxt[0]) if nxt else (np.zeros(3), KJ[-1] + 1)
        if tb - ta <= 60: u = sm((j - ta) / (tb - ta)); off[j] = oa * (1 - u) + ob * u
        else: off[j] = oa * (1 - sm(min(1.0, (j - ta) / 30))) + ob * (1 - sm(min(1.0, (tb - j) / 30)))   # airborne: back to the fitted path
    D = {j: R_[j] + off[j] for j in js}
    # anti-skate: an unlocked foot that travels near the floor steps up (same rule as the r21 export)
    v = {j: np.linalg.norm((D[min(j + 1, js[-1])] - D[max(j - 1, js[0])])[[0, 2]]) * 60 for j in js}
    vs = {j: np.mean([v[k] for k in range(max(js[0], j - 4), min(js[-1], j + 4) + 1)]) for j in js}
    for j in js:
        if j in [k for r in runs for k in range(r[0], r[1] + 1)]: continue
        dr = min([abs(j - e) for r in runs for e in r] + [99]); lift = min(0.07, 0.03 * max(0.0, vs[j] - 0.4)) * sm(min(1.0, dr / 14)); y = D[j][1]
        if lift > 1e-3 and y < 0.17: D[j] = D[j] + np.array([0, lift * min(1.0, (0.17 - y) / 0.08), 0])
        if dr <= 30:   # next to a planted spot: height grows with the distance travelled from it (arc instead of a floor skate)
            e = min([(abs(j - r[0]), r[0]) for r in runs] + [(abs(j - r[1]), r[1]) for r in runs])[1]
            c_ = sm(max(0.0, 1 - dr / 30)); D[j][1] += c_ * max(0.0, 0.085 + 0.6 * np.linalg.norm((D[j] - D[e])[[0, 2]]) - D[j][1])
    for j in js: two_bone(j, sd + 'Thigh', sd + 'Shin', sd + 'Foot', D[j])
for sd, li in (('left', 0), ('right', 1)):
    for i in range(KJ[0], KJ[-1] + 1):
        if F[i]['lock'][li]:
            T = fk(F0[i])[1][sd + 'Hand']
            for it in range(2): two_bone(i, sd + 'UpperArm', sd + 'Forearm', sd + 'Hand', T)
json.dump(d, open(OUT, 'w'), ensure_ascii=False)
