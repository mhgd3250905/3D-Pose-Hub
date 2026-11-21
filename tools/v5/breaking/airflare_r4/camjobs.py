"""close-up cameras from bone frames. usage: camjobs.py anim.json out.json f:kind ...  kinds: crotch (front-below), crotchb (back-below), side"""
import sys, json, numpy as np, os
sys.path.insert(0, os.path.dirname(__file__)); from model import Model, load_frames
m = Model(os.environ.get('RAW', '/workspace/work/airflare/r4/coach-v3r3-raw.glb')); _, fr = load_frames(sys.argv[1]); jobs = []
D = float(os.environ.get('DIST', 1.0))
for spec in sys.argv[3:]:
    f, kind = spec.split(':'); f = int(f); Wm = m.world(fr[f]); Wp = Wm[m.jn.index('pelvis')][:3, :3]
    hip = 0.5 * (Wm[m.jn.index('leftThigh')][:3, 3] + Wm[m.jn.index('rightThigh')][:3, 3]); t = hip + Wp @ np.array([0, -0.10, 0.0])
    d = Wp @ {'crotch': np.array([0, -0.35, 1.0]), 'crotchb': np.array([0, -0.35, -1.0]), 'side': np.array([1.0, -0.2, 0.0]), 'below': np.array([0, -1.0, 0.15])}[kind]
    d /= np.linalg.norm(d); p = t + d * D
    jobs.append({'f': f, 'p': [round(float(v), 4) for v in p], 't': [round(float(v), 4) for v in t], 'fov': 40, 'name': '%04d-%s' % (f, kind)})
json.dump(jobs, open(sys.argv[2], 'w')); print(len(jobs))
