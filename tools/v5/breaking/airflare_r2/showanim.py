"""overlay of the exported 120 fps animation (world coords) on the source frames through the fitted camera"""
import sys, numpy as np
from stageA import K, M
from viz import draw
Z = np.load(sys.argv[1]); xf = np.load(sys.argv[1].replace('.npz', '_xf.npz')); B, o = xf['B'], xf['o']
fr = [int(x) for x in sys.argv[3].split(',')]
P = {}; W = {}
for k in Z.files:
    if k.startswith('P_'): P[k[2:]] = np.zeros((156, 3))
    if k.startswith('W_'): W[k[2:]] = np.zeros((156, 3, 3))
for k in P:
    v = Z['P_' + k][::4][:156]; P[k][:len(v)] = v @ B + o
    w = Z['W_' + k][::4][:156]; W[k][:len(w)] = np.einsum('ji,njk->nik', B, w)
n_ = B[1]; d_ = n_ @ o
draw(fr, P, W, (n_, d_), sys.argv[2], Kref=K, M=M, title=sys.argv[4] if len(sys.argv) > 4 else '')
