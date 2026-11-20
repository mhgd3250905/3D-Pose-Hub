"""crotch / low-back close-up cameras from an export dump. usage: camjobs.py dump.npz out.json f1:kind f2:kind ..."""
import sys, json, numpy as np
Z = np.load(sys.argv[1]); jobs = []
for spec in sys.argv[3:]:
    f, kind = spec.split(':'); f = int(f); Wp = Z['W_pelvis'][f]; hip = 0.5 * (Z['P_leftThigh'][f] + Z['P_rightThigh'][f])
    if kind == 'crotch':    # look between the legs from the front-below of the pelvis
        d = Wp @ np.array([0, -0.35, 1.0]); t = hip + Wp @ np.array([0, -0.10, 0.0]); dist = float(__import__("os").environ.get("DIST", 1.1))
    elif kind == 'crotchb':  # from behind-below
        d = Wp @ np.array([0, -0.35, -1.0]); t = hip + Wp @ np.array([0, -0.10, 0.0]); dist = float(__import__("os").environ.get("DIST", 1.1))
    elif kind == 'back':     # side view of the trunk (pelvis x axis)
        d = Wp @ np.array([1.0, 0.0, -0.25]); t = 0.5 * (hip + Z['P_neck'][f]); dist = 1.5
    else:                    # chest-side view of the trunk
        d = Wp @ np.array([0.3, 0.0, 1.0]); t = 0.5 * (hip + Z['P_neck'][f]); dist = 1.6
    d = d / np.linalg.norm(d); p = t + d * dist
    if p[1] < 0.05: p[1] = 0.05
    jobs.append({'f': f, 'p': [round(float(v), 4) for v in p], 't': [round(float(v), 4) for v in t], 'fov': 40, 'name': '%04d-%s' % (f, kind)})
json.dump(jobs, open(sys.argv[2], 'w')); print(jobs)
