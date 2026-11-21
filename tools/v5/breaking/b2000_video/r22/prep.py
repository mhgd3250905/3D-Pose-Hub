"""dump 2D obs (mirrored to left-hand-first) for clip A or B -> obs_<clip>.npz"""
import os, sys, numpy as np
sys.path.insert(0, '/workspace/work/b2000/r21/fit')
import cfg
cfg.MIRROR = True   # A is mirrored already in r21; B mirrored here (image flip + L/R swap) so its first plant hand is LEFT
import load
K, C, SIDE, Q, FL = load.kp2d()
fw = np.array([0.75 if s[1] == 'uncertain' else 1.0 for s in SIDE])
np.savez('obs_%s.npz' % cfg.CLIP, K=K, C=C, FL=FL, fw=fw, FR=np.array(cfg.FR), F=cfg.F_PX, CX=cfg.CX, CY=cfg.CY, IW=cfg.IW)
print(cfg.CLIP, K.shape)
