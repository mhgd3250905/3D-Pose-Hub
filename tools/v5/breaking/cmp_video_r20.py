#!/usr/bin/env python3
"""cmp.jpg: top = source video frames, bottom = r20 v3 skeleton projected through the estimated source camera
(r20 is a left/right mirror of the video, so it is un-mirrored for drawing: mirrored body seen in a mirrored camera =
the same picture; colours: blue = r20 LEFT side, red = r20 RIGHT side)."""
import sys, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.spatial.transform import Rotation as Rot
sys.path.insert(0, '/workspace/work/pose-hub/tools/v5/breaking')
from kf import ry
REF = '/workspace/work/b2000/ref/traj/clip01'
npz = sys.argv[1]; out = sys.argv[2]
FR = [int(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '0,30,46,62,78,102,131,156').split(',')]
Zp = np.load(REF + '/pose_parameters.npz'); J = np.load(REF + '/skeleton_motion.npz')['joints_3d']
Rw = Rot.from_rotvec(Zp['world_global_orient']).as_matrix(); Rc = Rot.from_rotvec(Zp['camera_global_orient']).as_matrix()
Ccw = Rc[0] @ Rw[0].T; K = Zp['intrinsics_fullimg_px'][0]
fw = Ccw.T @ np.array([0, 0, 1.0]); a0 = math.atan2(fw[0], fw[2]); AS = ry(math.pi - a0)
# camera centre in world: pelvis_cam = Ccw @ (pelvis_w - Cw)  -> Cw from camera_transl of the pelvis (avg over frames)
# SMPL: cam joints = Rc-posed body + camera_transl ; world joints = Rw-posed body + world_transl. pelvis offsets equal up to rotation
pc = Zp['camera_transl'] + (J[:, 0] - Zp['world_transl']) @ Ccw.T * 0  # approx: pelvis rest offset ignored below
# estimate Cw by least squares from 2D-consistent relation pelvis_cam ~ Ccw (pelvis_w - Cw)
pw = J[:, 0]; off0 = (J[0, 0] - Zp['world_transl'][0])
pcam = Zp['camera_transl'] + (Ccw @ off0)
Cw = (pw - pcam @ Ccw).mean(0)
Z = np.load(npz); fps = float(Z['fps'])
BON = [('pelvis', 'spineLower'), ('spineLower', 'spineUpper'), ('spineUpper', 'torso'), ('torso', 'neck'), ('neck', 'head'),
       ('torso', 'leftUpperArm'), ('leftUpperArm', 'leftForearm'), ('leftForearm', 'leftHand'),
       ('torso', 'rightUpperArm'), ('rightUpperArm', 'rightForearm'), ('rightForearm', 'rightHand'),
       ('pelvis', 'leftThigh'), ('leftThigh', 'leftShin'), ('leftShin', 'leftFoot'),
       ('pelvis', 'rightThigh'), ('rightThigh', 'rightShin'), ('rightShin', 'rightFoot')]
def proj(ps):
    w = (ps * np.array([-1, 1, 1])) @ AS          # un-mirror, scene -> world (AS^T)
    c = (w - Cw) @ Ccw.T; uv = c[:, :2] / c[:, 2:3] * K[0, 0] + K[:2, 2]; return uv
import csv
KP = {}
for r in csv.DictReader(open(REF + '/keypoints_2d.csv')): KP[(int(r['frame']), r['joint_name'])] = (float(r['raw_x_px']), float(r['raw_y_px']), float(r['raw_score']))
PAIR = {'left_shoulder': 16, 'right_shoulder': 17, 'left_hip': 1, 'right_hip': 2, 'left_ankle': 7, 'right_ankle': 8, 'left_wrist': 20, 'right_wrist': 21}
U = []; V = []
for f in range(0, len(J)):
    for nm, j in PAIR.items():
        x, y, sc = KP[(f, nm)]
        if sc < 0.6: continue
        c = (J[f, j] - Cw) @ Ccw.T; uv = c[:2] / c[2] * K[0, 0] + K[:2, 2]; U.append(uv); V.append((x, y))
U = np.array(U); V = np.array(V); Am = np.zeros((2 * len(U), 3)); Am[0::2, 0] = U[:, 0]; Am[0::2, 1] = 1; Am[1::2, 0] = U[:, 1]; Am[1::2, 2] = 1
sol = np.linalg.lstsq(Am, V.reshape(-1), rcond=None)[0]; print('2D fit scale/offset', sol.round(2), 'rms', np.sqrt(np.mean((Am @ sol - V.reshape(-1)) ** 2)).round(1))
_proj0 = proj
def proj(ps):
    uv = _proj0(ps); return np.stack([uv[:, 0] * sol[0] + sol[1], uv[:, 1] * sol[0] + sol[2]], 1)
CS = 300; S = CS / 1080
img = Image.new('RGB', (CS * len(FR), CS * 2 + 22), 'white'); d = ImageDraw.Draw(img)
for k, f in enumerate(FR):
    v = Image.open(f'/workspace/work/b2000/r20/vf/f{f + 1:03d}.jpg').resize((CS, CS)); img.paste(v, (k * CS, 0))
    i = int(round(f / 30 * fps)); x0 = k * CS; y0 = CS
    d.rectangle([x0, y0, x0 + CS - 1, y0 + CS - 1], fill=(245, 245, 245))
    fl = proj(np.array([[x, 0, z] for x in (-3, 3) for z in (-3, 3)]))
    P = {b[2:]: Z[b][i] for b in Z.files if b.startswith('P_')}
    hd = P['head'] + Z['W_head'][i] @ np.array([0, 0.1, 0])
    # floor line through the hands/feet
    gl = proj(np.array([[-2.0, 0, P['pelvis'][2]], [2.0, 0, P['pelvis'][2]]])) * S
    d.line([(x0 + gl[0][0], y0 + gl[0][1]), (x0 + gl[1][0], y0 + gl[1][1])], fill=(170, 170, 170), width=1)
    for a, b in BON:
        uv = proj(np.array([P[a], P[b]])) * S
        col = (40, 90, 230) if 'left' in b else (220, 60, 40) if 'right' in b else (30, 30, 30)
        d.line([(x0 + uv[0][0], y0 + uv[0][1]), (x0 + uv[1][0], y0 + uv[1][1])], fill=col, width=3)
    h = proj(hd[None])[0] * S; d.ellipse([x0 + h[0] - 9, y0 + h[1] - 9, x0 + h[0] + 9, y0 + h[1] + 9], outline=(30, 30, 30), width=2)
    for sd, col in (('left', (40, 90, 230)), ('right', (220, 60, 40))):
        q = proj(P[sd + 'Hand'][None])[0] * S; d.ellipse([x0 + q[0] - 4, y0 + q[1] - 4, x0 + q[0] + 4, y0 + q[1] + 4], fill=col)
    d.text((x0 + 4, 2 * CS + 4), f'f{f} {f / 30:.2f}s', fill=(0, 0, 0))
    d.line([(x0, 0), (x0, 2 * CS)], fill=(255, 255, 255), width=2)
img.save(out, quality=90); print('saved', out)
