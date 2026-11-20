"""GVHMR/SMPL-X camera-frame estimate -> v3 rig base rotations (scene coords)."""
import numpy as np
from load import kp3d, N
from rig import LP, rodr, logm, LOCB, NP

PA = [-1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19, 20, 21]
S = np.diag([1.0, -1, -1])


def swing(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); ax = np.cross(a, b); s = np.linalg.norm(ax)
    if s < 1e-9: return np.eye(3)
    return rodr(ax / s * np.arctan2(s, a @ b))


def gv_init():
    C3, W3, D = kp3d()
    G = np.zeros((N, 24, 3, 3))
    for i, d in enumerate(D):
        G[i, 0] = rodr(np.array(d['smpl_x']['camera_root_axis_angle_rad']))
        L = rodr(np.array(d['smpl_x']['body_axis_angle_rad']))
        for j in range(1, 22): G[i, j] = G[i, PA[j]] @ L[j - 1]
    G[:, 22] = G[:, 20]; G[:, 23] = G[:, 21]
    G = np.einsum('ij,nkjl->nkil', S, G); J = C3 @ S.T
    OFF = np.zeros((24, 3))
    for c in range(1, 24): OFF[c] = np.einsum('nji,nj->ni', G[:, PA[c]], J[:, c] - J[:, PA[c]]).mean(0)
    MAP = {'pelvis': (0, 3, 'spineLower'), 'torso': (9, 12, 'neck'), 'head': (15, None, None)}
    for sd, o in (('left', 0), ('right', 1)):
        MAP.update({sd + 'UpperArm': (16 + o, 18 + o, sd + 'Forearm'), sd + 'Forearm': (18 + o, 20 + o, sd + 'Hand'),
                    sd + 'Thigh': (1 + o, 4 + o, sd + 'Shin'), sd + 'Shin': (4 + o, 7 + o, sd + 'Foot'), sd + 'Foot': (7 + o, None, None)})
    Wv = {}
    for b, (j, c, vc) in MAP.items():
        Cb = swing(LP[vc], OFF[c]) if (c is not None and b != 'pelvis') else np.eye(3)
        Wv[b] = G[:, j] @ Cb
    leg_s = np.linalg.norm(OFF[4]) + np.linalg.norm(OFF[7]); leg_v = np.linalg.norm(LP['leftShin']) + np.linalg.norm(LP['leftFoot'])
    SC = leg_v / leg_s
    tr = lambda A: np.swapaxes(A, -1, -2)
    R0 = {'pelvis': Wv['pelvis']}
    R0['spine'] = logm(tr(Wv['pelvis']) @ Wv['torso']) / 3
    R0['nh'] = logm(tr(Wv['torso']) @ Wv['head']) / 2
    for sd in ('left', 'right'):
        R0[sd + 'UpperArm'] = tr(Wv['torso']) @ Wv[sd + 'UpperArm']
        R0[sd + 'Forearm'] = tr(Wv[sd + 'UpperArm']) @ Wv[sd + 'Forearm']
        R0[sd + 'Thigh'] = tr(Wv['pelvis']) @ Wv[sd + 'Thigh']
        R0[sd + 'Shin'] = tr(Wv[sd + 'Thigh']) @ Wv[sd + 'Shin']
        R0[sd + 'Foot'] = tr(Wv[sd + 'Shin']) @ Wv[sd + 'Foot']
    x0 = np.zeros((N, NP)); x0[:, 0:3] = J[:, 0] * SC
    return R0, x0, SC
