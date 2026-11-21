import sys, numpy as np
sys.path.insert(0, '.')
from contacts import WIN
def stats(path, tag):
    Z = np.load(path); fps = float(Z['fps']); P = lambda j: Z['P_' + j]; W = lambda j: Z['W_' + j]; N = P('pelvis').shape[0]
    hd = P('head') + np.einsum('nij,j->ni', W('head'), [0, 0.10, 0]); head_low = (hd[:, 1] - 0.105).min()
    elb = min(P('leftForearm')[:, 1].min(), P('rightForearm')[:, 1].min()) - 0.048
    sh = 0.5 * (P('leftUpperArm') + P('rightUpperArm'))[:, 1].min()
    # planted hand drift inside the labelled windows (inner frames)
    sl = []
    for b in ('leftHand', 'rightHand'):
        for a, c in WIN[b]:
            i0 = int(round((a - 10118 + 1) / 30 * fps)); i1 = int(round((c - 10118 - 1) / 30 * fps))
            if i1 <= i0 or i1 >= N: continue
            q = P(b)[i0:i1 + 1][:, [0, 2]]; sl.append(np.max(np.linalg.norm(q - q[0], axis=1)))
    hip = 0.5 * (P('leftThigh') + P('rightThigh'))
    i0 = int(round((10160 - 10118) / 30 * fps)); i1 = int(round((10257 - 10118) / 30 * fps)); hh = hip[i0:i1, :][:, [0, 2]]
    rng = np.ptp(hh, axis=0)
    tilts = []
    for f in (10181, 10210, 10241):
        i = int(round((f - 10118) / 30 * fps)); s = P('neck')[i] - hip[i]; tilts.append(np.degrees(np.arcsin(s[1] / np.linalg.norm(s))))
    cu = []
    for f in (10179, 10209, 10239):
        i = int(round((f - 10118) / 30 * fps)); cu.append((W('torso')[i] @ np.array([0, 0, 1.0]))[1])
    print(f'{tag}: head-bottom min {head_low:+.3f} m | elbow-capsule min {elb:+.3f} m | shoulder min {sh:.2f} m | planted-hand drift max {max(sl):.3f} m (median {np.median(sl):.3f}) | hip travel during flare x {rng[0]:.2f} z {rng[1]:.2f} m | spine tilt at spread {", ".join("%.0f" % t for t in tilts)} deg | chest-up at peaks {", ".join("%+.2f" % c for c in cu)}')
stats(sys.argv[1], 'r1'); stats(sys.argv[2], 'r2')
