import pickle, sys, numpy as np
from rig import Rig
from load import FR
d = pickle.load(open(sys.argv[1], 'rb')); W, P = Rig(d['R0']).fk(d['x']); n_, d_ = d['ground']
h = lambda p: p @ n_ - d_
zc = np.array([0, 0, 1.0]); zc = zc - n_ * (zc @ n_); zc /= np.linalg.norm(zc); xw = np.cross(n_, zc)
hip = 0.5 * (P['leftThigh'] + P['rightThigh']); sp = P['neck'] - hip
tilt = np.degrees(np.arcsin((sp @ n_) / np.linalg.norm(sp, axis=1)))
chest = np.einsum('nij,j->ni', W['torso'], [0, 0, 1.0]) @ n_
ha = P['leftThigh'] - P['rightThigh']; head = np.degrees(np.unwrap(np.arctan2(ha @ zc, ha @ xw)))
hd = h(P['head'] + np.einsum('nij,j->ni', W['head'], [0, 0.1, 0]))
step = int(sys.argv[2]) if len(sys.argv) > 2 else 1
for i in range(0, len(FR), step):
    print(FR[i], 'tilt %+4.0f chestUp %+.2f hipYaw %+5.0f headH %.2f elbL %.2f elbR %.2f hipH %.2f wL %.2f wR %.2f' % (tilt[i], chest[i], head[i], hd[i], h(P['leftForearm'][i]), h(P['rightForearm'][i]), h(hip[i]), h(P['leftHand'][i]), h(P['rightHand'][i])))
