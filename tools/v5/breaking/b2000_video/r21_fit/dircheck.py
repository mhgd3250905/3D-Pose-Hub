"""rotation-direction check in the spin: depth-map L-R near/far difference vs the fitted model's."""
import sys, pickle, numpy as np
from PIL import Image
from rig import Rig
from cfg import FR, N, SPIN, P as PR, MIRROR
from load import kp2d
K, C, _, _, _ = kp2d()
d = pickle.load(open(sys.argv[1], 'rb')); W, P = Rig(d['R0']).fk(d['x'])
a, b = SPIN[0] - FR[0], SPIN[1] - FR[0]
pairs = [(5, 6, 'leftUpperArm', 'rightUpperArm'), (11, 12, 'leftThigh', 'rightThigh'), (7, 8, 'leftForearm', 'rightForearm'), (13, 14, 'leftShin', 'rightShin')]
SD = []; SM = []
for i in range(a, b + 1):
    dp = np.array(Image.open(PR + f'depth/{FR[i]:05d}.png')).astype(float)
    if MIRROR: dp = dp[:, ::-1]
    def smp(j):
        x, y = K[i, j]; x, y = int(round(x)), int(round(y)); win = dp[max(0, y - 4):y + 5, max(0, x - 4):x + 5]; return np.median(win)
    sd = sum(smp(l) - smp(r) for l, r, _, _ in pairs[:2]); sm = sum(P[bl][i, 2] - P[br][i, 2] for _, _, bl, br in pairs[:2])
    SD.append(sd); SM.append(sm)
SD = np.array(SD); SM = np.array(SM)
for k in range(len(SD)): print(FR[a + k], 'depthLR %+7.0f modelLR %+.2f %s' % (SD[k], SM[k], '' if np.sign(SD[k]) == np.sign(SM[k]) else 'X'))
wt = np.abs(SM) > 0.1
print('agree (|model|>0.1):', np.mean(np.sign(SD[wt]) == np.sign(SM[wt])), 'n', wt.sum(), 'corr', np.corrcoef(SD, SM)[0, 1])
