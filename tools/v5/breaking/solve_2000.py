#!/usr/bin/env python3
"""Breaking 2000 (two-thousand) r1: stacked-hands handstand spin, built procedurally on the coach-v3r3 rig.
Rig facts (probe of coach-v3r3-wristfix.glb): T-pose rest, every bone's rest world rotation = identity, faces +Z, left = +X.
So a bone's world rotation is a pure aim of its rest vectors; local q = inv(W_parent) * W_bone.
Output = Pose Studio anim json (same format as anim/flare-arm8legs-v3r3.json): fps 120, one revolution = COUNT frames.
Usage: python3 solve_2000.py <rest.json> <out.json> [--count 96] [--straddle 38] [--spin ccw]"""
import json, sys, math, argparse
import numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('rest'); ap.add_argument('out')
ap.add_argument('--count', type=int, default=96); ap.add_argument('--straddle', type=float, default=38)
ap.add_argument('--neck', type=float, default=22); ap.add_argument('--head', type=float, default=28)
ap.add_argument('--spin', default='ccw'); ap.add_argument('--shz', type=float, default=0.06); ap.add_argument('--lean', type=float, default=4)
A = ap.parse_args()
R = json.load(open(A.rest))['out']
LP = {k: np.array(v['lp']) for k, v in R.items()}
PAR = {'spineLower':'pelvis','spineUpper':'spineLower','torso':'spineUpper','neck':'torso','head':'neck','leftScapula':'torso','leftUpperArm':'leftScapula','leftForearm':'leftUpperArm','leftHand':'leftForearm','rightScapula':'torso','rightUpperArm':'rightScapula','rightForearm':'rightUpperArm','rightHand':'rightForearm','leftThigh':'pelvis','leftShin':'leftThigh','leftFoot':'leftShin','rightThigh':'pelvis','rightShin':'rightThigh','rightFoot':'rightShin'}
ORDER = ['pelvis'] + list(PAR)
JOINTS = ['pelvis','spineLower','spineUpper','torso','neck','head','leftScapula','leftUpperArm','leftForearm','leftHand','rightScapula','rightUpperArm','rightForearm','rightHand','leftThigh','leftShin','leftFoot','rightThigh','rightShin','rightFoot']
n = lambda v: v / np.linalg.norm(v)
def rx(a): c, s = math.cos(a), math.sin(a); return np.array([[1,0,0],[0,c,-s],[0,s,c]])
def ry(a): c, s = math.cos(a), math.sin(a); return np.array([[c,0,s],[0,1,0],[-s,0,c]])
def rz(a): c, s = math.cos(a), math.sin(a); return np.array([[c,-s,0],[s,c,0],[0,0,1]])
def aim(a, s, A_, S_):
    a, A_ = n(a), n(A_); s = n(s - a * (s @ a)); S_ = n(S_ - A_ * (S_ @ A_))
    M0 = np.stack([a, s, np.cross(a, s)], 1); M1 = np.stack([A_, S_, np.cross(A_, S_)], 1); return M1 @ M0.T
def quat(M):
    t = np.trace(M)
    if t > 0: s = math.sqrt(t + 1) * 2; return [(M[2,1]-M[1,2])/s, (M[0,2]-M[2,0])/s, (M[1,0]-M[0,1])/s, s/4]
    i = int(np.argmax(np.diag(M)))
    if i == 0: s = math.sqrt(1+M[0,0]-M[1,1]-M[2,2])*2; return [s/4,(M[0,1]+M[1,0])/s,(M[0,2]+M[2,0])/s,(M[2,1]-M[1,2])/s]
    if i == 1: s = math.sqrt(1+M[1,1]-M[0,0]-M[2,2])*2; return [(M[0,1]+M[1,0])/s,s/4,(M[1,2]+M[2,1])/s,(M[0,2]-M[2,0])/s]
    s = math.sqrt(1+M[2,2]-M[0,0]-M[1,1])*2; return [(M[0,2]+M[2,0])/s,(M[1,2]+M[2,1])/s,s/4,(M[1,0]-M[0,1])/s]
X, Y, Z = np.eye(3)
# ---- targets (world, spin angle 0). C = palm centre of the bottom (right, spinning) hand = origin on the floor.
BODY = rz(math.pi) @ rx(math.radians(A.lean))     # inverted, chest faces +Z, slight lean so hips sit over the hands
RW_T = np.array([0.0, 0.045, -0.05])               # right wrist: palm flat, fingers +Z, heel under the wrist
LW_T = np.array([-0.035, 0.085, -0.035])           # left wrist: left palm laid on the back of the right hand
R_FING = Z; L_FING = n(np.array([0.75, 0, 0.66]))  # left fingers cross over toward the right side
def solve(pelvis_pos):
    W, P = {}, {}
    W['pelvis'] = BODY; P['pelvis'] = pelvis_pos
    def fk(b):
        p = PAR[b]; P[b] = P[p] + W[p] @ LP[b]
    for b in ['spineLower','spineUpper','torso']: W[b] = BODY; fk(b)
    fk('neck'); W['neck'] = BODY @ rx(-math.radians(A.neck))
    fk('head'); W['head'] = W['neck'] @ rx(-math.radians(A.head))
    for sd in ['left','right']:
        fk(sd+'Scapula'); W[sd+'Scapula'] = BODY
        fk(sd+'UpperArm')
        sh = P[sd+'UpperArm']; wt = RW_T if sd == 'right' else LW_T; fing = R_FING if sd == 'right' else L_FING
        l1 = np.linalg.norm(LP[sd+'Forearm']); l2 = np.linalg.norm(LP[sd+'Hand'])
        d = wt - sh; dl = np.linalg.norm(d); dn = d / dl
        crease = BODY @ Z
        if dl >= l1 + l2 - 1e-6: e_dir = dn          # straight arm
        else:                                          # two-bone IK, elbow bends backwards/outwards (pole = -crease)
            ca = (l1*l1 + dl*dl - l2*l2) / (2*l1*dl); ang = math.acos(max(-1, min(1, ca)))
            pole = n(-crease - dn * (-crease @ dn)); e_dir = dn * math.cos(ang) + pole * math.sin(ang)
        W[sd+'UpperArm'] = aim(LP[sd+'Forearm'], Z, e_dir, crease); fk(sd+'Forearm')
        W[sd+'Forearm'] = aim(LP[sd+'Hand'], -Y, wt - P[sd+'Forearm'], fing); fk(sd+'Hand')
        hx = X if sd == 'left' else -X
        W[sd+'Hand'] = aim(hx, -Y, fing, -Y)
        a = math.radians(A.straddle) * (1 if sd == 'right' else -1)
        L = np.array([math.sin(a), math.cos(a), 0.0])            # straddle in the frontal plane, legs up
        fk(sd+'Thigh'); W[sd+'Thigh'] = aim(LP[sd+'Shin'], Z, L, BODY @ Z)
        fk(sd+'Shin'); W[sd+'Shin'] = W[sd+'Thigh']
        fk(sd+'Foot'); W[sd+'Foot'] = aim(Z, Y, L, BODY @ Z)  # pointed toes
    return W, P
pp = np.array([0.0, 0.9, 0.0])
LR = np.linalg.norm(LP['rightForearm']) + np.linalg.norm(LP['rightHand'])
for it in range(60):   # straight right (spinning) arm: shoulder exactly one arm length above-ish the wrist target, hips over hands
    W, P = solve(pp); sh = P['rightUpperArm']; h = np.linalg.norm((sh - RW_T)[[0, 2]])
    dy = math.sqrt(max(LR*LR - h*h, 0)) - (sh[1] - RW_T[1]) - 1e-4
    ctr = (P['leftUpperArm'] + P['rightUpperArm']) / 2
    pp = pp + np.array([-ctr[0] * 0.5, dy, -(ctr[2] - A.shz) * 0.5])
    if abs(dy) < 1e-6 and abs(ctr[0]) < 1e-5 and abs(ctr[2] - A.shz) < 1e-5: break
W, P = solve(pp)
print('pelvis', pp.round(4), 'rightHand', P['rightHand'].round(4), 'leftHand', P['leftHand'].round(4), 'head', P['head'].round(3), 'pelvisW', P['pelvis'].round(3), 'sh', ((P['leftUpperArm']+P['rightUpperArm'])/2).round(3),
      'feet', P['leftFoot'].round(3), P['rightFoot'].round(3), file=sys.stderr)
loc = {}
for b in JOINTS:
    Wp = np.eye(3) if b == 'pelvis' else W[PAR[b]]; loc[b] = Wp.T @ W[b]
sgn = 1 if A.spin == 'ccw' else -1
frames = []
for k in range(A.count):
    th = sgn * 2 * math.pi * k / A.count; Ry = ry(th)
    q = {b: [round(x, 6) for x in quat(loc[b])] for b in JOINTS}; q['pelvis'] = [round(x, 6) for x in quat(Ry @ loc['pelvis'])]
    frames.append({'p': [round(x, 5) for x in (Ry @ pp)], 'q': q})
anim = {'cams': {'v0': {'p': [-2.6, 2.1, 4.6], 't': [0.0, 0.92, 0.0], 'f': 30}},
        'id': 'breaking-2000', 'name': '2000（双手叠撑倒立旋转）r1', 'model': 'v3', 'fps': 120, 'count': A.count,
        'source': 'tools/v5/breaking/solve_2000.py（程序化：倒立、双手叠放同一点、直臂、双腿 V 字分开绷脚尖，绕撑地手竖直轴匀速转一圈）',
        'note': f'shz {A.shz} straddle {A.straddle}° neck {A.neck}° head {A.head}° lean {A.lean}° spin {A.spin}；右手在下（轴手），左手掌叠在右手背上',
        'phases': [{'n': '倒立叠手旋转', 'f': 0}], 'frames': frames}
json.dump(anim, open(A.out, 'w'), ensure_ascii=False)
