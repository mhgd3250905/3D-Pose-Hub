#!/usr/bin/env python3
"""Thomas supplement r2 (2026-11-19): leg table for t-frog-stand's lean phase (toes stay planted while the body leans onto the hands).
   python3 tools/thomas-sup/frog-legs.py <check-output.json> [--pf-sign 1] [--steps 11] [--t-arm 0.8] [--off 0.084]
Input: a check.mjs output of t-frog-stand sampled over the lean (0.6-2.0 s; e.g. --frames 18,20,...,60). The trunk/arm solve does not
depend on the legs (floorDrill legs are free), so the hip and the upper arm per lean weight u come from that run.
Per u (cosine lean curve 0.6 -> 2.0 s): knee centre = 84 mm out from the upper-arm axis at 80 % shoulder->elbow, rotated about the arm
until |hip-knee| = thigh length; ankle = on |ankle-knee| = shin and |ankle-toe tip| = the start frame's ankle->toe-tip distance (toe tip
fixed where it is at the start), closest to the previous ankle; foot plantar flexion follows the change of the shin/toe angle.
Prints the JS table for the spec (left side; the spec mirrors x for the right)."""
import json, math, sys
a = sys.argv[1:]; src = json.load(open(a[0]))
opt = lambda k, d: type(d)(a[a.index(k) + 1]) if k in a else d
PF_SIGN, STEPS, T_ARM, OFF = opt('--pf-sign', 1.0), opt('--steps', 11), opt('--t-arm', 0.8), opt('--off', 0.084)
TH, SH, PF0 = 0.409739814, 0.416772719, -28.0
sub = lambda p, q: [p[i] - q[i] for i in range(3)]; add = lambda p, q: [p[i] + q[i] for i in range(3)]; mul = lambda p, k: [x * k for x in p]
dot = lambda p, q: sum(p[i] * q[i] for i in range(3)); norm = lambda p: math.sqrt(dot(p, p)); unit = lambda p: mul(p, 1 / norm(p))
cross = lambda p, q: [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]]
angd = lambda p, q: math.degrees(math.acos(max(-1, min(1, dot(unit(p), unit(q))))))
uof = lambda t: (1 - math.cos(math.pi * min(1, max(0, (t - 0.6) / 1.4)))) / 2
S = sorted(src['samples'], key=lambda s: s['t'])
def at_u(u, key, sub_key):   # linear interpolation of a joint over the lean weight
    us = [uof(s['t']) for s in S]
    for i in range(len(S) - 1):
        if us[i] <= u <= us[i + 1] and us[i + 1] > us[i]:
            f = (u - us[i]) / (us[i + 1] - us[i]); A, B = S[i][key][sub_key], S[i + 1][key][sub_key]; return [A[k] + (B[k] - A[k]) * f for k in range(3)]
    return S[0 if u <= us[0] else -1][key][sub_key]
s0 = S[0]; TIP = s0['minP']['footL']; A0 = s0['J']['leftFoot']; LF = norm(sub(A0, TIP))
theta0 = angd(sub(A0, s0['J']['leftShin']), sub(TIP, A0))
def knee(H, Sh, E, prev_ang):
    ax = unit(sub(E, Sh)); C = add(Sh, mul(sub(E, Sh), T_ARM)); lat = unit(sub([1, 0, 0], mul(ax, dot([1, 0, 0], ax))))
    back = cross(ax, lat); back = mul(back, -1) if back[2] > 0 else back; back = unit(back)
    K = lambda g: add(C, mul(unit(add(mul(lat, math.cos(math.radians(g))), mul(back, math.sin(math.radians(g))))), OFF))
    best = min((abs(norm(sub(K(g / 2), H)) - TH) + 1e-4 * abs(g / 2 - prev_ang), g / 2) for g in range(-160, 161))
    return K(best[1]), best[1], abs(norm(sub(K(best[1]), H)) - TH)
def ankle(K, prev):   # intersection circle of sphere(K, SH) and sphere(TIP, LF), point closest to prev
    d = norm(sub(TIP, K)); n = unit(sub(TIP, K)); x = (d * d + SH * SH - LF * LF) / (2 * d); r = math.sqrt(max(0, SH * SH - x * x)); c = add(K, mul(n, x))
    v = sub(prev, c); v = sub(v, mul(n, dot(v, n))); v = unit(v) if norm(v) > 1e-9 else unit(cross(n, [1, 0, 0])); return add(c, mul(v, r)), r == 0
rows, prev_ang, prevA, worst = [], 0.0, A0, 0
for k in range(STEPS):
    u = k / (STEPS - 1); H, Sh, E = at_u(u, 'J', 'leftThigh'), at_u(u, 'J', 'leftUpperArm'), at_u(u, 'J', 'leftForearm')
    K, prev_ang, err = knee(H, Sh, E, prev_ang); A, deg_ = ankle(K, prevA); prevA = A; worst = max(worst, err)
    rel = sub(A, H); dH = unit(rel); kv = sub(K, H); ku = unit(sub(kv, mul(dH, dot(kv, dH))))
    pf = PF0 + PF_SIGN * (angd(sub(A, K), sub(TIP, A)) - theta0)
    rows.append({'u': round(u, 3), 'rel': [round(x, 4) for x in rel], 'kneeUp': [round(x, 3) for x in ku], 'pf': round(pf, 2), 'armAngle': round(prev_ang, 1), 'kneeErrMm': round(err * 1000, 1), 'degenerate': deg_})
print(json.dumps({'toeTip': [round(x, 4) for x in TIP], 'ankleToTip': round(LF, 4), 'theta0': round(theta0, 2), 'worstKneeErrMm': round(worst * 1000, 1), 'rows': rows}))
