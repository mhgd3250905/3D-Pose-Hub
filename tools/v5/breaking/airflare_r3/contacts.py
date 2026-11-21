import numpy as np
from load import FR, N
F0 = FR[0]
# labels.txt (inclusive, source frames)
WIN = {'rightHand': [(10135, 10165), (10183, 10196), (10212, 10226), (10243, 10257)],
       'leftHand': [(10160, 10178), (10193, 10207), (10222, 10238), (10254, 10266)],
       'rightFoot': [(10118, 10140), (10273, 10273)], 'leftFoot': [(10260, 10273)]}
# lift-off / touch-down boundary frames (uncertain) used for soft ramps
def mask(b):
    m = np.zeros(N, bool)
    for a, c in WIN[b]: m[a - F0:c - F0 + 1] = True
    return m
def segs(b): return [(a - F0, c - F0) for a, c in WIN[b]]
