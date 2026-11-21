"""Air Flare r2 fitter: v3 rig fitted to drift-corrected 2D keypoints (+ limits, temporal, ground contacts)."""
import math, numpy as np
from scipy.optimize import least_squares
from scipy.sparse import lil_matrix
from scipy.spatial.transform import Rotation as Rot
from rig import Rig, kp_points, KP_IDS, proj, NP, LP, rodr, LOCB

D2R = math.pi / 180


def twist(R, a):
    q = Rot.from_matrix(R.reshape(-1, 3, 3)).as_quat(); a = a / np.linalg.norm(a)
    t = 2 * np.arctan2(q[:, :3] @ a, q[:, 3]); return (t + math.pi) % (2 * math.pi) - math.pi


def hinge(v, lim):   # >0 when v exceeds lim
    return np.maximum(0.0, v - lim)


class Fitter:
    def __init__(self, R0, obs, wobs, cfg):
        self.rig = Rig(R0); self.obs = obs; self.wobs = wobs; self.cfg = cfg; self.N = obs.shape[0]

    def limits(self, W, P, loc):
        r = []
        for sd, sg in (('left', 1), ('right', -1)):
            a = LP[sd + 'Hand'] / np.linalg.norm(LP[sd + 'Hand']); d = loc[sd + 'Forearm'] @ a
            r.append((d[:, 1] - a[1]) * 6)                                   # elbow off hinge plane
            flex = np.arctan2(d[:, 2], sg * d[:, 0]); r.append(hinge(-flex, 3 * D2R) * 8)   # hyperextension
            r.append(hinge(flex, 150 * D2R) * 4)
            tw = twist(loc[sd + 'Forearm'], a); r.append(hinge(np.abs(tw), 80 * D2R) * 4)
            a = LP[sd + 'Foot'] / np.linalg.norm(LP[sd + 'Foot']); d = loc[sd + 'Shin'] @ a
            r.append((d[:, 0] - a[0]) * 6)
            flex = np.arctan2(-(d[:, 2] - a[2]), -d[:, 1]); r.append(hinge(-flex, 3 * D2R) * 8)
            tw = twist(loc[sd + 'Shin'], a); r.append(hinge(np.abs(tw), 25 * D2R) * 4)
            tl = np.einsum('nji,nj->ni', W['pelvis'], P[sd + 'Shin'] - P[sd + 'Thigh']); tl /= np.linalg.norm(tl, axis=1)[:, None]
            fl = np.arctan2(tl[:, 2], -tl[:, 1]); ab = np.arcsin(np.clip(sg * tl[:, 0], -1, 1))
            HL = self.cfg.get('hip', {'ext': 30, 'flex': 145, 'abd': 78, 'w': 4})
            r.append(hinge(-fl, HL['ext'] * D2R) * 6); r.append(hinge(fl, HL['flex'] * D2R) * HL['w']); r.append(hinge(ab, HL['abd'] * D2R) * HL['w']); r.append(hinge(-ab, 30 * D2R) * 3)
            if 'swing' in HL:   # total thigh swing away from hanging straight down (flexion is ill-defined at large abduction)
                r.append(hinge(np.arccos(np.clip(-tl[:, 1], -1, 1)), HL['swing'] * D2R) * HL['w'])
            # ankle: foot vs shin
            tw = twist(loc[sd + 'Foot'], np.array([0, 1.0, 0])); r.append(hinge(np.abs(tw), 35 * D2R) * 3)
            fz = loc[sd + 'Foot'] @ np.array([0, 0, 1.0]); pf = np.arctan2(-fz[:, 1], fz[:, 2])   # + = plantarflex
            r.append(hinge(pf, 60 * D2R) * 3); r.append(hinge(-pf, 25 * D2R) * 3)
            # humerus twist (about the upper-arm bone axis, relative to rest)
            au = LP[sd + 'Forearm'] / np.linalg.norm(LP[sd + 'Forearm'])
            tw = twist(loc[sd + 'UpperArm'], au); r.append(hinge(np.abs(tw), 85 * D2R) * 3)
        L = self.cfg.get('r3')
        vs = self.rig.R0['spine'] + self.x[:, 6:9]; nh = np.linalg.norm(self.rig.R0['nh'] + self.x[:, 9:12], axis=1)
        if not L:
            r.append(hinge(np.linalg.norm(vs, axis=1), 21 * D2R) * 8); r.append(hinge(nh, 26 * D2R) * 8)
        else:
            # r3: whole-trunk (pelvis -> chest, 3 joints) limits per anatomical axis in the pelvis frame: x = flexion(+)/extension(-),
            # z = side bend, y = twist; total bend capped; weighted pull toward a neutral back (the 2D fit must not bend the spine to hit points)
            t3 = 3 * vs; w_ = L.get('w', 14)
            r.append(hinge(t3[:, 0], L['flex'] * D2R) * w_); r.append(hinge(-t3[:, 0], L['ext'] * D2R) * w_ * 1.5)
            r.append(hinge(np.abs(t3[:, 2]), L['lat'] * D2R) * w_); r.append(hinge(np.abs(t3[:, 1]), L['tw'] * D2R) * w_)
            r.append(hinge(np.linalg.norm(t3, axis=1), L['tot'] * D2R) * w_)
            r.append(t3[:, 0] * L.get('reg', 0.6) * (t3[:, 0] < 0) + t3[:, 0] * L.get('reg', 0.6) * 0.5 * (t3[:, 0] >= 0)); r.append(t3[:, 2] * L.get('reg', 0.6) * 0.6)
            r.append(hinge(2 * nh, L['neck'] * D2R) * w_)
        return np.stack(r, 1)

    def resid(self, xf):
        N = self.N; NG = self.cfg.get('ng', 0); g = xf[N * NP:] if NG else self.cfg.get('g'); x = xf[:N * NP].reshape(N, NP); self.x = x; self.g = g
        W, P = self.rig.fk(x); loc = self.rig.loc
        K = kp_points(W, P, g); uv = proj(K)
        out = [((uv - self.obs) * self.wobs[..., None] / self.cfg.get('sig', 8.0)).reshape(N, -1)]
        out.append(self.limits(W, P, loc))
        out.append(x[:, 3:] * self.cfg.get('reg', 0.05))
        if self.cfg.get('temporal'):
            T = self.cfg['temporal']
            pts = np.concatenate([K, np.stack([P['pelvis'], P['torso'], P['leftForearm'], P['rightForearm']], 1)], 1)
            acc = np.zeros_like(pts); acc[1:-1] = pts[2:] - 2 * pts[1:-1] + pts[:-2]
            out.append(acc.reshape(N, -1) / T['acc'])
            if 'anchor' in T:
                hip = 0.5 * (P['leftThigh'] + P['rightThigh'])
                out.append(((pts - hip[:, None]) - T['anchor']).reshape(N, -1) / T.get('asig', 0.15))
            # rotational smoothness of the local blocks (twist is invisible to 2D)
            rv = np.zeros((N, 3 * len(LOCB)))
            for k, b in enumerate(LOCB):
                Rl = loc[b]; rel = np.einsum('nji,njk->nik', Rl[:-1], Rl[1:]); v = Rot.from_matrix(rel).as_rotvec()
                acc_r = np.zeros((N, 3)); acc_r[1:-1] = v[1:] - v[:-1]; rv[:, 3 * k:3 * k + 3] = acc_r
            out.append(rv / T['racc'])
            if self.cfg.get('r3'):
                for sl, k in ((slice(6, 9), 'spine'), (slice(9, 12), 'nh')):
                    v = self.rig.R0[k] + x[:, sl]; a_ = np.zeros_like(v); a_[1:-1] = v[2:] - 2 * v[1:-1] + v[:-2]
                    out.append(a_ * 3 / self.cfg['r3'].get('sacc', 0.04))
            if 'ground' in T:
                n_, d_ = T['ground']; h = lambda p: p @ n_ - d_
                fr = []
                for nm, p in (('head', P['head'] + W['head'] @ np.array([0, 0.10, 0])),):
                    fr.append(hinge(-(h(p) - 0.16), 0) * 30)
                for b in ('pelvis', 'torso', 'neck', 'leftForearm', 'rightForearm', 'leftShin', 'rightShin'):
                    fr.append(hinge(-(h(P[b]) - 0.08), 0) * 30)
                for b in ('leftHand', 'rightHand'):
                    fr.append(hinge(-(h(P[b]) - 0.04), 0) * 30)
                for b in ('leftFoot', 'rightFoot'):
                    fr.append(hinge(-(h(P[b]) - 0.07), 0) * 30)
                out.append(np.stack(fr, 1))
                # contacts: wrist/ankle on its lock point
                for fi in T.get('chestup', []):
                    cu = W['torso'][fi] @ np.array([0, 0, 1.0]) @ n_
                    z = np.zeros((N, 1)); z[fi, 0] = hinge(0.55 - cu, 0) * 20; out.append(z)
                cw = T['contact']   # dict joint -> (N,) weight (window weights; 0 outside)
                for b, wgt in cw.items():
                    hb = h(P[b]) - T['hoff'][b]; out.append((hb * wgt / 0.01)[:, None])
                    v = np.zeros((N, 3)); v[1:] = P[b][1:] - P[b][:-1]; wv = np.minimum(wgt, np.concatenate([[0], wgt[:-1]]))
                    out.append(v * wv[:, None] / 0.005)
        R = np.concatenate([o.reshape(N, -1) for o in out], 1)
        self.nres = R.shape[1]
        R = R.reshape(-1)
        if NG: R = np.concatenate([R, g * 3.0])
        return R

    def sparsity(self, x0, span):
        N = self.N; NG = self.cfg.get('ng', 0); self.resid(x0.reshape(-1)); m = self.nres
        S = lil_matrix((N * m + NG, N * NP + NG), dtype=int)
        if NG: S[:, N * NP:] = 1
        for i in range(N):
            for j in range(max(0, i - span), min(N, i + span + 1)):
                S[i * m:(i + 1) * m, j * NP:(j + 1) * NP] = 1
        return S.tocsr()

    def solve(self, x0, iters=40, span=0):
        S = self.sparsity(x0, span)
        r = least_squares(self.resid, np.asarray(x0).reshape(-1), jac_sparsity=S, method='trf', tr_solver='lsmr', loss='soft_l1',
                          f_scale=3.0, max_nfev=iters, x_scale='jac', verbose=0)
        NG = self.cfg.get('ng', 0)
        return (r.x[:self.N * NP].reshape(self.N, NP), r.x[self.N * NP:]) if NG else r.x.reshape(self.N, NP), r
