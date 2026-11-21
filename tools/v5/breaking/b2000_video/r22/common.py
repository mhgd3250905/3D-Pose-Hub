import json, pickle, sys, numpy as np
sys.path.insert(0, '/workspace/work/b2000/r21/fit')
from fkj import fk, J, LP, PAR, Q
from scipy.spatial.transform import Rotation as Rot
KP_IDS = [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 22, 133, 134]
G = pickle.load(open('/workspace/work/b2000/r21/wA/C3.pkl', 'rb'))['g']
XF = np.load('/workspace/work/b2000/r21/wA/dump_C3_xf.npz'); BM, OO = XF['B'], XF['o']
FPSA = 30000 / 1001
def kp_world(W, P, g=G):
    hd = lambda o: P['head'] + W['head'] @ (np.array(o) + np.array([0, g[6], g[7]]))
    hp = lambda sg: W['pelvis'] @ np.array([sg * (0.02 + g[0]), 0.02 + g[1], g[2]])
    sh = lambda sg: W['torso'] @ np.array([sg * g[3], g[4], g[5]])
    ft = lambda s, o: P[s + 'Foot'] + W[s + 'Foot'] @ np.array(o)
    pts = {0: hd([0, 0.07, 0.11]), 3: hd([0.075, 0.07, 0.0]), 4: hd([-0.075, 0.07, 0.0]),
           5: P['leftUpperArm'] + sh(1), 6: P['rightUpperArm'] + sh(-1), 7: P['leftForearm'], 8: P['rightForearm'], 9: P['leftHand'], 10: P['rightHand'],
           11: P['leftThigh'] + hp(1), 12: P['rightThigh'] + hp(-1), 13: P['leftShin'], 14: P['rightShin'], 15: P['leftFoot'], 16: P['rightFoot'],
           133: P['leftHand'] + W['leftForearm'] @ (LP['leftHand'] / np.linalg.norm(LP['leftHand'])) * 0.06,
           134: P['rightHand'] + W['rightForearm'] @ (LP['rightHand'] / np.linalg.norm(LP['rightHand'])) * 0.06,
           17: ft('left', [0.02, -0.065, 0.16]), 19: ft('left', [0, -0.07, -0.055]), 20: ft('right', [-0.02, -0.065, 0.16]), 22: ft('right', [0, -0.07, -0.055])}
    return np.stack([pts[k] for k in KP_IDS])
def projA(Xw, F=1237.42, CX=302.0, CY=540.0):
    Xs = Xw @ BM + OO   # scene = B^T p_w + o  (row vectors)
    z = -Xs[..., 2]; return np.stack([CX + F * Xs[..., 0] / z, CY - F * Xs[..., 1] / z], -1)
def projC(Xc, F, CX, CY):
    z = -Xc[..., 2]; return np.stack([CX + F * Xc[..., 0] / z, CY - F * Xc[..., 1] / z], -1)
