import json, csv, numpy as np
from cfg import P, FR, N, MIRROR, IW, PERM, GV_BAD
def kp2d():
    K = np.zeros((N, 135, 2)); C = np.zeros((N, 135)); Q = []; SIDE = []; FL = np.ones((N, 135))
    for i, f in enumerate(FR):
        a = json.load(open(P + f'kp2d/{f:05d}.json')); SIDE.append((a['side_assignment'], a['side_review']))
        for k in a['keypoints']:
            j = k['id']; x, y = k['x'], k['y']
            if x is None: continue
            K[i, j] = (x, y); C[i, j] = k['confidence']
            if k['quality'] in ('flagged_estimate', 'unresolved_derived_palm'): FL[i, j] = 0.6
            if 'visual_stacked_hands_axis_side_unreliable' in k['flags'] or 'visual_crossed_leg_misplaced_in_overlay' in k['flags']: FL[i, j] = 0.3
        Q.append(a)
    if MIRROR:
        K[..., 0] = np.where(C > 0, IW - K[..., 0], 0); K = K[:, PERM]; C = C[:, PERM]; FL = FL[:, PERM]
    return K, C, SIDE, Q, FL
def drift():
    M = {}
    for r in csv.DictReader(open(P + 'labels/background_tracking.csv')):
        f = int(r['frame']); M[f] = np.array([[float(r['frame_to_ref_00']), float(r['frame_to_ref_01']), float(r['frame_to_ref_02'])], [float(r['frame_to_ref_10']), float(r['frame_to_ref_11']), float(r['frame_to_ref_12'])]])
    A = np.array([M[f] for f in FR])
    if MIRROR:   # conjugate by the flip u -> W - u
        Fm = np.array([[-1, 0, IW], [0, 1, 0], [0, 0, 1.0]]); A3 = np.concatenate([A, np.tile([[0, 0, 1.0]], (N, 1, 1))], 1)
        A = (Fm @ A3 @ Fm)[:, :2]
    return A
def kp3d():
    C = np.zeros((N, 24, 3)); W = np.zeros((N, 24, 3)); D = []
    for i, f in enumerate(FR):
        g = GV_BAD.get(f, f)
        a = json.load(open(P + f'kp3d/{g:05d}.json')); C[i] = a['camera_xyz_model_m']; W[i] = a['world_xyz_model_m']; D.append(a)
    return C, W, D
