"""diag: per-frame heading (chest dir on ground plane), body inversion, foot gap, err; + overlay sheet for given frames.
usage: diag.py fit.pkl out.jpg f1,f2,..."""
import sys, pickle, numpy as np
from rig import Rig, kp_points, proj
from cfg import FR, N, FACING, SPIN, GRIP
from stageA import obs, w, M
import viz
d = pickle.load(open(sys.argv[1], 'rb')); n_, d_ = d['ground']; W, P = Rig(d['R0']).fk(d['x'])
e = np.linalg.norm(proj(kp_points(W, P, d['g'])) - obs, axis=2)
zc = np.array([0, 0, 1.0]); zc = zc - n_ * (zc @ n_); zc /= np.linalg.norm(zc); xw = np.cross(n_, zc)
fz = W['torso'] @ np.array([0, 0, 1.0]); hdg = np.degrees(np.arctan2(fz @ xw, fz @ zc))
up = (W['pelvis'] @ np.array([0, 1.0, 0])) @ n_
gap = np.linalg.norm(P['leftFoot'] - P['rightFoot'], axis=1)
ph = GRIP[1]; hh = P[ph] @ n_ - d_
for i in range(N):
    f = FR[i]; tag = ' F%+d' % FACING[f] if f in FACING else ''
    if i % 2 == 0 or tag: print(f, 'hdg %5.0f up %+.2f gap %.2f pivH %.2f err %.0f%s' % (hdg[i], up[i], gap[i], hh[i], np.median(e[i]), tag))
if len(sys.argv) > 2:
    fr = [int(v) for v in sys.argv[3].split(',')]
    Kr = obs  # reference pixels; viz maps back with M
    viz.draw(fr, P, W, (n_, d_), sys.argv[2], M=M)
