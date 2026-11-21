import sys, numpy as np
from cfg import FR, SPIN, FACING
from load import kp2d
K, C, _, _, FL = kp2d()
a, b = SPIN[0] - FR[0] - 4, SPIN[1] - FR[0] + 2
for i in range(a, b + 1):
    nz = K[i, 0]; em = 0.5 * (K[i, 3] + K[i, 4]); sm = 0.5 * (K[i, 5] + K[i, 6])
    print(FR[i], 'nose-ear %+5.0f nose-sh %+5.0f conf n %.1f e %.1f/%.1f fl %.1f %s' % (nz[0] - em[0], nz[0] - sm[0], C[i, 0], C[i, 3], C[i, 4], FL[i, 0], FACING.get(FR[i], '')))
