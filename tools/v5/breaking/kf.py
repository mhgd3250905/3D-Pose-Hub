"""Keyframe + IK engine for breaking moves on the coach-v3r3 rig (V5).
Rig facts (probe of coach-v3r3-wristfix.glb): T-pose rest, every bone's rest world rotation = identity, faces +Z, model-left = +X.
A key = pelvis position/orientation, spine/neck/head rotations, wrist/ankle targets with elbow/knee poles and hand/foot orientation,
plus a yaw angle `th` about the vertical axis through the origin (the spin axis). Frames interpolate keys (Catmull-Rom; channels whose
neighbouring keys are equal are held exactly so planted hands/feet do not slide) and re-solve IK every frame."""
import json, math
import numpy as np
n = lambda v: v / np.linalg.norm(v)
X, Y, Z = np.eye(3)
def rx(a): c, s = math.cos(a), math.sin(a); return np.array([[1,0,0],[0,c,-s],[0,s,c]])
def ry(a): c, s = math.cos(a), math.sin(a); return np.array([[c,0,s],[0,1,0],[-s,0,c]])
def rz(a): c, s = math.cos(a), math.sin(a); return np.array([[c,-s,0],[s,c,0],[0,0,1]])
def D(*a): return [math.radians(x) for x in a]
def eul(yaw=0, pitch=0, roll=0, order='zxy'):
    """degrees; R = rz(roll) @ rx(pitch) @ ry(yaw) by default (roll = cartwheel/inversion about the facing axis)."""
    R = {'x': rx(math.radians(pitch)), 'y': ry(math.radians(yaw)), 'z': rz(math.radians(roll))}
    M = np.eye(3)
    for c in order: M = M @ R[c]
    return M
def aim(a, s, A_, S_):
    a, A_ = n(a), n(A_); s = n(s - a * (s @ a)); S2 = S_ - A_ * (S_ @ A_)
    if np.linalg.norm(S2) < 1e-6: S2 = np.cross(A_, X) if abs(A_ @ X) < .9 else np.cross(A_, Z)
    S_ = n(S2); M0 = np.stack([a, s, np.cross(a, s)], 1); M1 = np.stack([A_, S_, np.cross(A_, S_)], 1); return M1 @ M0.T
def m2q(M):
    t = np.trace(M)
    if t > 0: s = math.sqrt(t + 1) * 2; q = [(M[2,1]-M[1,2])/s, (M[0,2]-M[2,0])/s, (M[1,0]-M[0,1])/s, s/4]
    else:
        i = int(np.argmax(np.diag(M)))
        if i == 0: s = math.sqrt(1+M[0,0]-M[1,1]-M[2,2])*2; q = [s/4,(M[0,1]+M[1,0])/s,(M[0,2]+M[2,0])/s,(M[2,1]-M[1,2])/s]
        elif i == 1: s = math.sqrt(1+M[1,1]-M[0,0]-M[2,2])*2; q = [(M[0,1]+M[1,0])/s,s/4,(M[1,2]+M[2,1])/s,(M[0,2]-M[2,0])/s]
        else: s = math.sqrt(1+M[2,2]-M[0,0]-M[1,1])*2; q = [(M[0,2]+M[2,0])/s,(M[1,2]+M[2,1])/s,s/4,(M[1,0]-M[0,1])/s]
    return np.array(q)
def q2m(q):
    x, y, z, w = q / np.linalg.norm(q)
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
PAR = {'spineLower':'pelvis','spineUpper':'spineLower','torso':'spineUpper','neck':'torso','head':'neck','leftScapula':'torso','leftUpperArm':'leftScapula','leftForearm':'leftUpperArm','leftHand':'leftForearm','rightScapula':'torso','rightUpperArm':'rightScapula','rightForearm':'rightUpperArm','rightHand':'rightForearm','leftThigh':'pelvis','leftShin':'leftThigh','leftFoot':'leftShin','rightThigh':'pelvis','rightShin':'rightThigh','rightFoot':'rightShin'}
JOINTS = ['pelvis','spineLower','spineUpper','torso','neck','head','leftScapula','leftUpperArm','leftForearm','leftHand','rightScapula','rightUpperArm','rightForearm','rightHand','leftThigh','leftShin','leftFoot','rightThigh','rightShin','rightFoot']
WRIST_SWING = [False]   # r8 sets True (see Rig.limb)
class Rig:
    def __init__(self, rest_json):
        R = json.load(open(rest_json))['out']; self.LP = {k: np.array(v['lp']) for k, v in R.items()}
        L = self.LP; self.l_ua = np.linalg.norm(L['leftForearm']); self.l_fa = np.linalg.norm(L['leftHand'])
        self.l_th = np.linalg.norm(L['leftShin']); self.l_sh = np.linalg.norm(L['leftFoot'])
    def solve(self, k):
        """k: dict of numpy params (see Key). returns world rotations W, positions P."""
        LP = self.LP; W, P = {}, {}
        W['pelvis'] = k['pelvisR']; P['pelvis'] = k['pelvis']
        def fk(b): p = PAR[b]; P[b] = P[p] + W[p] @ LP[b]
        sp = k['spine']   # rotation vector (pelvis frame), split over 3 bones
        ang = np.linalg.norm(sp); Rs = np.eye(3) if ang < 1e-9 else axang(sp / ang, ang / 3)
        prev = 'pelvis'
        for b in ['spineLower', 'spineUpper', 'torso']: fk(b); W[b] = W[prev] @ Rs; prev = b
        fk('neck'); W['neck'] = W['torso'] @ rv(k['neck']); fk('head'); W['head'] = W['neck'] @ rv(k['head'])
        for sd in ('left', 'right'):
            sg = 1 if sd == 'left' else -1
            fk(sd+'Scapula'); W[sd+'Scapula'] = W['torso'] @ rz(sg * k[sd+'Shrug']); fk(sd+'UpperArm')
            W[sd+'UpperArm'], W[sd+'Forearm'] = self.limb(P[sd+'UpperArm'], k[sd+'Wrist'], k[sd+'Elbow'], LP[sd+'Forearm'], LP[sd+'Hand'], self.l_ua, self.l_fa, arm=True, fing=k[sd+'Fing'], palm=k[sd+'Palm'])
            fk(sd+'Forearm'); fk(sd+'Hand')
            W[sd+'Hand'] = aim(sg * X, -Y, k[sd+'Fing'], k[sd+'Palm']) if k[sd+'Fing'] is not None else W[sd+'Forearm']
            fk(sd+'Thigh')
            W[sd+'Thigh'], W[sd+'Shin'] = self.limb(P[sd+'Thigh'], k[sd+'Ankle'], k[sd+'Knee'], LP[sd+'Shin'], LP[sd+'Foot'], self.l_th, self.l_sh, arm=False)
            fk(sd+'Shin'); fk(sd+'Foot')
            W[sd+'Foot'] = aim(Z, -Y, k[sd+'Toe'], k[sd+'Sole'])
        return W, P
    def limb(self, root, target, pole, lp1, lp2, l1, l2, arm, fing=None, palm=None):
        d = target - root; dl = np.linalg.norm(d); dn = d / dl; pole = n(pole)
        pp = pole - dn * (pole @ dn); pp = n(pp) if np.linalg.norm(pp) > 1e-6 else n(np.cross(dn, X))
        if dl >= l1 + l2 - 1e-6: e = dn; mid = root + dn * l1
        else:
            ca = (l1*l1 + dl*dl - l2*l2) / (2*l1*dl); a = math.acos(max(-1, min(1, ca))); e = dn * math.cos(a) + pp * math.sin(a); mid = root + e * l1
        f = n(target - mid)
        crease = f - e * (f @ e)   # inside of the bend (toward the forearm/shin); straight -> opposite the pole
        crease = n(crease) if np.linalg.norm(crease) > 1e-4 else -pp
        if arm:   # elbow crease is rest +Z ; knee front is rest +Z and points AWAY from the bend
            W1 = aim(lp1, Z, e, crease)
            if fing is not None and WRIST_SWING[0]:
                # r8: the wrist bends (flexion/extension + deviation) but does not twist: the forearm's palm side is the hand's
                # palm carried back by the minimal swing from the finger axis to the forearm axis (continuous, no flip when the
                # forearm passes over the vertical of a flat hand)
                fn = n(fing); ax_ = np.cross(fn, f); sa = np.linalg.norm(ax_)
                Rs_ = axang(ax_, math.atan2(sa, fn @ f)) if sa > 1e-6 else np.eye(3); s = Rs_ @ palm; s = s - f * (s @ f)
                if np.linalg.norm(s) < 1e-6: s = W1 @ (-Y)
            elif fing is not None:
                s = palm - f * (palm @ f); w = max(0.0, 1 - np.linalg.norm(s) / 0.5); s = s - (fing - f * (fing @ f)) * w   # dorsiflexed hand: fingers point to the back (+Y) of the forearm
            else: s = W1 @ (-Y)
            W2 = aim(lp2, -Y, f, s)
        else:
            W1 = aim(lp1, Z, e, -crease); W2 = aim(lp2, Z, f, -crease)
        return W1, W2
def axang(ax, a):
    ax = n(ax); K = np.array([[0,-ax[2],ax[1]],[ax[2],0,-ax[0]],[-ax[1],ax[0],0]]); return np.eye(3) + math.sin(a)*K + (1-math.cos(a))*K@K
def rv(v):
    v = np.array(v, float); a = np.linalg.norm(v); return np.eye(3) if a < 1e-9 else axang(v / a, a)
VEC = ['pelvis','spine','neck','head','leftWrist','rightWrist','leftElbow','rightElbow','leftAnkle','rightAnkle','leftKnee','rightKnee','leftToe','rightToe','leftSole','rightSole','leftFing','rightFing','leftPalm','rightPalm']
CONTACT = ['leftWrist','rightWrist','leftAnkle','rightAnkle']
SCAL = ['th','leftShrug','rightShrug','leftLegLen','rightLegLen']
def cr(p0, p1, p2, p3, t):
    t2, t3 = t*t, t*t*t
    return 0.5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3)
def interp(keys, t):
    """keys: list of (time, dict). Catmull-Rom per channel; a channel equal on both ends of a segment is held exactly."""
    ts = [k[0] for k in keys]
    i = max(0, min(len(keys) - 2, int(np.searchsorted(ts, t, side='right')) - 1))
    t0, t1 = ts[i], ts[i+1]; u = 0 if t1 == t0 else min(1, max(0, (t - t0) / (t1 - t0)))
    g = lambda j: keys[max(0, min(len(keys)-1, j))][1]
    out = {}
    for ch in VEC + SCAL + ['pelvisQ']:
        v = [g(i-1)[ch], g(i)[ch], g(i+1)[ch], g(i+2)[ch]]
        if v[1] is None or v[2] is None: out[ch] = v[1] if u < 0.5 else v[2]; continue
        v = [np.array(x if x is not None else (v[1] if j < 2 else v[2]), float) for j, x in enumerate(v)]
        if ch == 'pelvisQ':
            for j in (0, 2, 3):
                if v[j] @ v[1 if j == 0 else j-1] < 0: v[j] = -v[j]
        if np.allclose(v[1], v[2], atol=1e-9): out[ch] = v[1]; continue
        # a contact that is held on the next/previous segment arrives/leaves with zero velocity (no sliding into a plant)
        # straight-line ease into the plant / out of the hold, so contacts land and lift without sliding or dipping
        if ch in CONTACT and i + 2 < len(keys) and np.allclose(v[2], v[3], atol=1e-9): out[ch] = v[1] + (v[2] - v[1]) * (1 - (1 - u) ** 3); continue
        if ch in CONTACT and i > 0 and np.allclose(v[0], v[1], atol=1e-9): out[ch] = v[1] + (v[2] - v[1]) * u ** 3; continue
        out[ch] = cr(*v, u)
    out['pelvisR'] = q2m(out['pelvisQ'])
    return out
