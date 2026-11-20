"""Vectorised v3 rig FK + parameterisation used by the Air Flare r2 fitter.
Scene coords: x = image right, y = up, z = toward the camera (camera at origin looking -z).
Camera projection: u = cx + f*x/(-z), v = cy - f*y/(-z)."""
import json, math
import numpy as np

REST = '/workspace/work/b2000-rest.json'
LP = {k: np.array(v['lp'], float) for k, v in json.load(open(REST))['out'].items()}
PAR = {'spineLower': 'pelvis', 'spineUpper': 'spineLower', 'torso': 'spineUpper', 'neck': 'torso', 'head': 'neck',
       'leftScapula': 'torso', 'leftUpperArm': 'leftScapula', 'leftForearm': 'leftUpperArm', 'leftHand': 'leftForearm',
       'rightScapula': 'torso', 'rightUpperArm': 'rightScapula', 'rightForearm': 'rightUpperArm', 'rightHand': 'rightForearm',
       'leftThigh': 'pelvis', 'leftShin': 'leftThigh', 'leftFoot': 'leftShin', 'rightThigh': 'pelvis', 'rightShin': 'rightThigh', 'rightFoot': 'rightShin'}
JOINTS = ['pelvis', 'spineLower', 'spineUpper', 'torso', 'neck', 'head', 'leftScapula', 'leftUpperArm', 'leftForearm', 'leftHand',
          'rightScapula', 'rightUpperArm', 'rightForearm', 'rightHand', 'leftThigh', 'leftShin', 'leftFoot', 'rightThigh', 'rightShin', 'rightFoot']
# parameter blocks (3 each): 0 root t, 1 pelvis (global, R0@exp), 2 spine rotvec (each of 3 bones, direct), 3 neck/head rotvec (each of 2, direct)
# then R0@exp(d) local blocks:
LOCB = ['leftUpperArm', 'leftForearm', 'rightUpperArm', 'rightForearm', 'leftThigh', 'leftShin', 'leftFoot', 'rightThigh', 'rightShin', 'rightFoot']
NP = 3 * (4 + len(LOCB))
# r3: the shared spine rotvec is spread over the three spine joints with these shares (sum 3): less at the lumbar joints,
# more at the thoracic joint, so the lower back stays nearly rigid (r2 = 1,1,1)
SPW = (0.5, 0.9, 1.6)
F_PX = 2202.91; CX, CY = 960.0, 540.0
L_UA = np.linalg.norm(LP['leftForearm']); L_FA = np.linalg.norm(LP['leftHand'])
L_TH = np.linalg.norm(LP['leftShin']); L_SH = np.linalg.norm(LP['leftFoot'])


def rodr(v):
    """(...,3) rotvec -> (...,3,3)"""
    th = np.linalg.norm(v, axis=-1)[..., None, None]
    k = v / np.maximum(th[..., 0], 1e-12)
    Kx = np.zeros(v.shape[:-1] + (3, 3))
    Kx[..., 0, 1] = -k[..., 2]; Kx[..., 0, 2] = k[..., 1]; Kx[..., 1, 0] = k[..., 2]
    Kx[..., 1, 2] = -k[..., 0]; Kx[..., 2, 0] = -k[..., 1]; Kx[..., 2, 1] = k[..., 0]
    I = np.broadcast_to(np.eye(3), Kx.shape)
    return I + np.sin(th) * Kx + (1 - np.cos(th)) * (Kx @ Kx)


def logm(R):
    from scipy.spatial.transform import Rotation as Rot
    sh = R.shape[:-2]; return Rot.from_matrix(R.reshape(-1, 3, 3)).as_rotvec().reshape(sh + (3,))


class Rig:
    def __init__(self, R0):
        """R0: dict bone -> (N,3,3) base rotations (pelvis global; LOCB local). spine/neck base rotvecs in R0['spine'],R0['nh'] (N,3)."""
        self.R0 = R0

    def fk(self, x):
        """x: (N,NP). returns W dict (N,3,3), P dict (N,3)"""
        N = x.shape[0]; R0 = self.R0; W = {}; P = {}
        W['pelvis'] = R0['pelvis'] @ rodr(x[:, 3:6]); P['pelvis'] = x[:, 0:3]
        vs = R0['spine'] + x[:, 6:9]; Rn = rodr(R0['nh'] + x[:, 9:12])
        loc = {'spineLower': rodr(vs * SPW[0]), 'spineUpper': rodr(vs * SPW[1]), 'torso': rodr(vs * SPW[2]), 'neck': Rn, 'head': Rn}
        for k, b in enumerate(LOCB): loc[b] = R0[b] @ rodr(x[:, 12 + 3 * k:15 + 3 * k])
        for b in JOINTS[1:]:
            p = PAR[b]; P[b] = P[p] + W[p] @ LP[b]
            W[b] = W[p] @ loc[b] if b in loc else (W[p] if 'Scapula' in b or 'Hand' in b else W[p])
        self.loc = loc
        return W, P


def kp_points(W, P, g=None):
    """rig points for COCO-WholeBody body ids -> (N,K,3) in order KP_IDS"""
    g = np.zeros(8) if g is None else g
    hd = lambda o: P['head'] + W['head'] @ (np.array(o) + np.array([0, g[6], g[7]]))
    hp = lambda sg: W['pelvis'] @ np.array([sg * (0.02 + g[0]), 0.02 + g[1], g[2]])
    sh = lambda sg: W['torso'] @ np.array([sg * g[3], g[4], g[5]])
    ft = lambda s, o: P[s + 'Foot'] + W[s + 'Foot'] @ np.array(o)
    pts = {0: hd([0, 0.07, 0.11]), 3: hd([0.075, 0.07, 0.0]), 4: hd([-0.075, 0.07, 0.0]),
           5: P['leftUpperArm'] + sh(1), 6: P['rightUpperArm'] + sh(-1), 7: P['leftForearm'], 8: P['rightForearm'], 9: P['leftHand'], 10: P['rightHand'],
           11: P['leftThigh'] + hp(1), 12: P['rightThigh'] + hp(-1),
           13: P['leftShin'], 14: P['rightShin'], 15: P['leftFoot'], 16: P['rightFoot'],
           17: ft('left', [0.02, -0.065, 0.16]), 19: ft('left', [0, -0.07, -0.055]), 20: ft('right', [-0.02, -0.065, 0.16]), 22: ft('right', [0, -0.07, -0.055])}
    return np.stack([pts[k] for k in KP_IDS], 1)


KP_IDS = [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 22]
SWAP_KP = {3: 4, 4: 3, 5: 6, 6: 5, 7: 8, 8: 7, 9: 10, 10: 9, 11: 12, 12: 11, 13: 14, 14: 13, 15: 16, 16: 15, 17: 20, 20: 17, 19: 22, 22: 19}


def proj(X):
    z = -X[..., 2]; return np.stack([CX + F_PX * X[..., 0] / z, CY - F_PX * X[..., 1] / z], -1)
