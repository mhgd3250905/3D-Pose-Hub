import sys, os, numpy as np
os.environ.update(A0='384', A1='490', PINL='0', PINR='6', KNEE='384-439')
sys.argv = ['fit2v.py', '../r21/anim-2000-r21c.json', '/dev/null', '0']
exec(open('fit2v.py').read().split("r0 = res(x0.ravel())")[0])
Z = np.load('d4.npz'); x = Z['x']
def st(xx):
    e = []
    for k in range(NK):
        if not (440 <= KA[k] <= 472): continue
        v = xx[k]; W, P, loc = pose(k, v); X = kp_world(W, P); RB = rodr(v[-6:-3]); Xc = X @ RB.T + v[-3:]; ob, wb = OB[k]
        d = np.linalg.norm(projC(Xc, FB, CXB, CYB) - ob, axis=1); e += list(d[wb > 0.3])
    return np.median(e), np.percentile(e, 90)
# before = r21 pose with B rigid only re-optimised on the same final B placement
x0b = np.zeros_like(x); x0b[:, -6:] = x[:, -6:]
print('B 440-472 reproj: r21 pose %.1f/%.1f px -> r22 %.1f/%.1f px (median/p90)' % (*st(x0b), *st(x)))
from scipy.optimize import least_squares
def fitrig(k, v):
    W, P, _ = pose(k, v); X = kp_world(W, P); ob, wb = OB[k]
    f = lambda p: np.concatenate([((projC(X @ rodr(p[:3]).T + p[3:], FB, CXB, CYB) - ob) * np.sqrt(wb)[:, None]).ravel(), [np.degrees(np.arccos(np.clip(rodr(p[:3]) @ UP @ nB, -1, 1))) * 3, (nB @ p[3:] - dB) * 300]])
    return least_squares(f, v[-6:], loss='soft_l1', f_scale=20).x
x1 = x.copy(); x0c = np.zeros_like(x)
for k in range(NK):
    if 440 <= KA[k] <= 472:
        x0c[k, -6:] = fitrig(k, np.concatenate([np.zeros(NV - 6), x[k, -6:]])); x1[k, -6:] = fitrig(k, x[k])
print('fair (each pose with its own best B placement): r21 %.1f/%.1f -> r22 %.1f/%.1f px' % (*st(x0c), *st(x1)))
