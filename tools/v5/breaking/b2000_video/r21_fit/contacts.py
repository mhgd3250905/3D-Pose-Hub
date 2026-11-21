import numpy as np
from cfg import FR, N, WIN
F0 = FR[0]
def mask(b):
    m = np.zeros(N, bool)
    for a, c in WIN[b]: m[a - F0:c - F0 + 1] = True
    return m
def segs(b): return [(a - F0, c - F0) for a, c in WIN[b]]
