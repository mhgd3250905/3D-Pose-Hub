"""Anatomical arm solver: picks the elbow pole per frame so the humerus rotation and the forearm pronation stay inside
human ranges (no candy-wrapper forearms, no elbows flipped backwards).
Conventions (same as kf.Rig.limb): upper-arm local Z = elbow crease; forearm local -Y = palm.
Humerus twist 0 = the T-pose frame (crease forward) carried to the arm direction by the minimal swing, in the torso frame.
Pronation 0 = palm normal perpendicular to the crease (thumb-forward 'handshake' forearm)."""
import math
import numpy as np
from kf import axang, n, X, Y, Z

TW_LIM, PR_LIM = 80.0, 80.0          # hard-ish limits used by the cost (degrees)
TW_SOFT, PR_SOFT = 55.0, 60.0         # comfortable band
BETAS = np.radians(np.arange(-180, 180, 5.0))


def swing(a, b):
    ax = np.cross(a, b); s = np.linalg.norm(ax)
    if s < 1e-6: return np.eye(3) if a @ b > 0 else axang(np.cross(a, Y) if abs(a @ Y) < 0.9 else np.cross(a, Z), math.pi)
    return axang(ax, math.atan2(s, a @ b))


def humerus_twist(T, sg, e, crease):
    el = T.T @ e; cl = T.T @ crease
    c0 = swing(sg * X, el) @ Z; c0 = n(c0 - el * (c0 @ el)); ci = n(cl - el * (cl @ el))
    return math.degrees(math.atan2(np.cross(c0, ci) @ el, c0 @ ci))


def pronation(W1, W2, e, f):
    ax = np.cross(e, f); s = np.linalg.norm(ax)
    R = np.eye(3) if s < 1e-6 else axang(ax, math.atan2(s, e @ f))
    r0 = R @ (W1 @ -Y); r = W2 @ -Y; r0 = n(r0 - f * (r0 @ f)); r = n(r - f * (r @ f))
    return math.degrees(math.atan2(np.cross(r0, r) @ f, r0 @ r))


def segpt(a, b, p):
    ab = b - a; u = max(0.0, min(1.0, ((p - a) @ ab) / max(1e-9, ab @ ab))); return np.linalg.norm(a + ab * u - p)


def clear(a, b, p, r):
    d = segpt(a, b, p); return ((r - d) / 0.01) ** 2 * 3 if d < r else 0.0


def seg_clear(a, b, c, d, r):
    m = min(segpt(a, b, c), segpt(a, b, d), segpt(c, d, a), segpt(c, d, b)); return ((r - m) / 0.01) ** 2 * 3 if m < r else 0.0


def over(v, soft, hard):
    a = abs(v); return (max(0.0, a - soft) / 10.0) ** 2 + (max(0.0, a - hard) / 2.0) ** 2


class ArmFix:
    def __init__(self, rig, fps=120):
        self.dt = 1.0 / fps; self.s = fps / 60.0; self.rig = rig; self.prev = {'left': None, 'right': None}; self.prevf = {'left': None, 'right': None}; self.prevp = {'left': None, 'right': None}; self.prevtw = {'left': None, 'right': None}

    def reset(self): self.prev = {'left': None, 'right': None}

    def best_fing(self, sd, S, t, pole, palm, T, sg):
        rig = self.rig; bestf = None
        for a_ in np.radians(np.arange(0, 360, 5.0)):
          for tl_ in (0.0,):   # tl_: heel lifts onto the finger pads (wrist can't extend past ~90)
            fg = np.array([math.cos(a_), 0.0, math.sin(a_)]); pm = palm
            if tl_:
                sx = np.cross(fg, Y); Rt = axang(sx, math.radians(-tl_)); fg = Rt @ fg; pm = Rt @ palm
            W1, W2 = rig.limb(S, t, pole, rig.LP[sd + 'Forearm'], rig.LP[sd + 'Hand'], rig.l_ua, rig.l_fa, True, fg, pm)
            e = W1 @ n(rig.LP[sd + 'Forearm']); f = W2 @ n(rig.LP[sd + 'Hand'])
            pr_ = pronation(W1, W2, e, f); wr = math.degrees(math.acos(max(-1, min(1, f @ fg))))
            if getattr(self, 'prcont', False):   # r8: comfortable wrist first (<= ~88), pronation anywhere in the easy band
                c_ = (pr_ / 40.0) ** 2 + 3 * over(wr, 70, 88) + over(abs(pr_), 65, 82) + (1e4 if wr > 95 else 0.0)
            else: c_ = (pr_ / 25.0) ** 2 + 0.5 * (tl_ / 12.0) ** 2 + over(wr, 80, 92) + over(abs(pr_), 70, 85) + (1e4 if wr > 95 else 0.0)
            if self.prevp[sd] is not None:
                dp_ = abs(((pr_ - self.prevp[sd]) + 180) % 360 - 180); c_ += (self.s * dp_ / 10.0) ** 2 + (1e4 if dp_ > 1000.0 * self.dt else 0.0)
            if self.prevf[sd] is not None:
                da = math.degrees(math.acos(max(-1, min(1, fg @ self.prevf[sd])))); c_ += (self.s * da / 8.0) ** 2
                if da > 1500.0 * self.dt + 1: c_ += 1e4
            aw = getattr(self, 'away', {}).get(sd)
            if aw is not None:   # real 2000: palm flat, fingers pointing out, away from the body
                ga = math.degrees(math.acos(max(-1, min(1, fg @ aw)))); c_ += (max(0.0, ga - 50.0) / 15.0) ** 2
            if getattr(self, 'dbg', False) and sd == 'right': self.dbgl.append((round(math.degrees(a_)), round(wr), round(pr_), round(c_, 1), round(math.degrees(math.acos(max(-1, min(1, fg @ aw)))) if aw is not None else -1)))
            if bestf is None or c_ < bestf[0]: bestf = (c_, fg, pr_, pm)
        return bestf

    def apply(self, k, W, P, fixed=None, planted_y=0.12, contact=None):
        """mutates k (Elbow pole, and Fing/Palm of airborne hands); returns diagnostics."""
        rig = self.rig; T = W['torso']; diag = {}; other = None
        HC = P['head'] + W['head'] @ Y * 0.10
        import os as _os
        if _os.environ.get('OUTF'):
            self.away = {}
            for _sd, _sg in (('left', 1), ('right', -1)):
                if _os.environ.get('OUTF') == '2':   # r8: 'out' = away from the shoulder line centre, plus the torso's own outward side
                    _m = 0.5 * (P['leftUpperArm'] + P['rightUpperArm']); _a = (k[_sd + 'Wrist'] - _m) / 0.20 + T @ (_sg * X)
                else: _a = k[_sd + 'Wrist'] - P['pelvis']
                _a = np.array([_a[0], 0.0, _a[2]])
                self.away[_sd] = _a / np.linalg.norm(_a) if np.linalg.norm(_a) > 0.05 else None
                if _os.environ.get('OUTF') == '2' and k[_sd + 'Wrist'][1] > 0.08: self.away[_sd] = None   # top hand of the stack grips the wrist: no floor rule
        for sd, sg in (('left', 1), ('right', -1)):
            S = P[sd + 'UpperArm']; t = k[sd + 'Wrist']
            ply = planted_y[sd] if isinstance(planted_y, dict) else planted_y
            Lr = rig.l_ua + rig.l_fa; dd = np.linalg.norm(t - S)
            if t[1] >= ply and dd > 0.93 * Lr:   # airborne arm: soft reach, so it never snaps from bent to locked straight
                t = S + (t - S) / dd * (0.93 * Lr + 0.05 * Lr * math.tanh((dd - 0.93 * Lr) / (0.05 * Lr))); k[sd + 'Wrist'] = t
            d = n(t - S); dl = T.T @ d
            c0 = swing(sg * X, dl) @ Z; c0 = n(c0 - dl * (c0 @ dl))
            fing, palm = k[sd + 'Fing'], k[sd + 'Palm']
            on_floor = t[1] < ply and fing is not None
            planted = on_floor and (fixed is None or fixed.get(sd, True))   # hand orientation locked to the floor
            # key's own choice, as a twist angle
            W1k, W2k = rig.limb(S, t, k[sd + 'Elbow'], rig.LP[sd + 'Forearm'], rig.LP[sd + 'Hand'], rig.l_ua, rig.l_fa, True, fing, palm)
            ek = W1k @ n(rig.LP[sd + 'Forearm']); bkey = math.radians(humerus_twist(T, sg, ek, W1k @ Z))
            best = None
            tk = math.degrees(bkey)
            cand = BETAS if planted else BETAS[::2]
            for b in cand:
                pole = T @ (axang(dl, b) @ -c0)
                W1, W2 = rig.limb(S, t, pole, rig.LP[sd + 'Forearm'], rig.LP[sd + 'Hand'], rig.l_ua, rig.l_fa, True, fing, palm)
                e = W1 @ n(rig.LP[sd + 'Forearm']); f = W2 @ n(rig.LP[sd + 'Hand'])
                tw = humerus_twist(T, sg, e, W1 @ Z); pr = pronation(W1, W2, e, f)
                bfc = 0.0
                if on_floor and not planted:
                    _bf = self.best_fing(sd, S, t, pole, palm, T, sg); pr = _bf[2]; bfc = _bf[0]
                c = over(tw, TW_SOFT, TW_LIM) + (over(pr, PR_SOFT, PR_LIM) if on_floor else 0.0)
                if on_floor and self.prevp[sd] is not None and getattr(self, 'prcont', False): c += (self.s * abs(((pr - self.prevp[sd]) + 180) % 360 - 180) / 10.0) ** 2
                c += 0.2 * (math.degrees(math.atan2(math.sin(b - bkey), math.cos(b - bkey))) / 20.0) ** 2
                # keep the arm out of the head and away from the other forearm
                mid = S + e * rig.l_ua; hnd = mid + f * rig.l_fa
                c += clear(S, mid, HC, 0.105 + 0.048) + clear(mid, hnd, HC, 0.105 + 0.040)
                if other is not None: c += seg_clear(mid, hnd, other[0], other[1], 0.075)
                if self.prev[sd] is not None:   # continuity of the elbow in space (not of the angle, whose reference moves with the torso)
                    pe, pc = self.prev[sd]
                    ang_e = math.degrees(math.acos(max(-1, min(1, e @ pe)))); ang_c = math.degrees(math.acos(max(-1, min(1, (W1 @ Z) @ pc))))
                    c += (self.s * ang_e / 4.0) ** 2 + 0.3 * (self.s * ang_c / 8.0) ** 2
                    lim = 700.0 * self.dt   # the humerus never spins faster than ~700 deg/s about its own axis
                    if ang_c > lim + ang_e: c += 1e4 + ang_c
                    if self.prevtw[sd] is not None and abs(((tw - self.prevtw[sd]) + 180) % 360 - 180) > 900.0 * self.dt: c += 1e4
                if best is None or c < best[0]: best = (c, b, pole, tw, pr, W1, W2, e, f)
            c, b, pole, tw, pr, W1, W2, e, f = best
            # refine around the grid point
            self.prev[sd] = (e, W1 @ Z); k[sd + 'Elbow'] = pole
            if on_floor and self.prevf[sd] is None and fing is not None:
                fh = np.array([fing[0], 0.0, fing[2]]); self.prevf[sd] = n(fh) if np.linalg.norm(fh) > 1e-3 else None
            if on_floor and not planted:
                bf = self.best_fing(sd, S, t, pole, palm, T, sg); k[sd + 'Fing'] = bf[1]; k[sd + 'Palm'] = bf[3]; self.prevf[sd] = bf[1]; pr = bf[2]
            elif not planted and fing is not None:
                # airborne hand: turn the hand about the forearm axis into the comfortable band, continuing from last frame
                wlim = 50.0 if t[1] > 0.30 else 50.0 + 35.0 * (0.30 - t[1]) / 0.18   # airborne wrist relaxes; near the floor it may pre-extend to ~85
                if True:
                    wr = math.degrees(math.acos(max(-1, min(1, f @ n(fing)))))
                    if wr > wlim:
                        ax = np.cross(n(fing), f)
                        if np.linalg.norm(ax) > 1e-6: Rw = axang(ax, math.radians(wr - wlim)); fing = Rw @ fing; palm = Rw @ palm
                def meas(fg_, pm_):
                    W1_, W2_ = rig.limb(S, t, pole, rig.LP[sd + 'Forearm'], rig.LP[sd + 'Hand'], rig.l_ua, rig.l_fa, True, fg_, pm_)
                    e_ = W1_ @ n(rig.LP[sd + 'Forearm']); f_ = W2_ @ n(rig.LP[sd + 'Hand']); return pronation(W1_, W2_, e_, f_), f_
                cph = bool(contact and contact.get(sd))
                bf = None
                if cph and t[1] < 0.75:   # aim at the pronation the hand will need once planted (evaluate at the floor point below)
                    tl = np.array([t[0], 0.04, t[2]]); dl_ = np.linalg.norm(tl - S)
                    if dl_ > 0.98 * Lr: tl = S + (tl - S) / dl_ * 0.98 * Lr
                    lh = getattr(self, 'land', {}).get(sd)
                    if lh is not None:   # r8: the hand will be planted with a known finger direction: pre-turn the forearm to that
                        W1_, W2_ = rig.limb(S, tl, pole, rig.LP[sd + 'Forearm'], rig.LP[sd + 'Hand'], rig.l_ua, rig.l_fa, True, lh, -Y)
                        e_ = W1_ @ n(rig.LP[sd + 'Forearm']); f_ = W2_ @ n(rig.LP[sd + 'Hand']); bf = (0.0, lh, pronation(W1_, W2_, e_, f_), -Y)
                    else:
                        sv = self.prevp[sd]; self.prevp[sd] = None; bf = self.best_fing(sd, S, tl, pole, -Y, T, sg); self.prevp[sd] = sv
                if cph and t[1] < 0.25:   # hand about to land (or just lifted): ease into the floor hand (palm down, comfortable fingers)
                    u = min(1.0, (0.25 - t[1]) / 0.13); u = u * u * (3 - 2 * u)
                    fing = n((1 - u) * n(fing) + u * bf[1]); palm = n((1 - u) * n(palm) + u * -Y); self.prevf[sd] = bf[1]
                pr, f = meas(fing, palm)
                pp_ = self.prevp[sd] if self.prevp[sd] is not None else max(-45.0, min(45.0, pr))
                # pronation is a physical angle (no wrap-around): pre-turn toward the landing hand's value, else stay in +-45
                _pl = getattr(self, 'prland', 80.0)
                des = max(-_pl, min(_pl, bf[2])) if bf is not None else max(-45.0, min(45.0, pr))
                st = getattr(self, 'prspeed', 600.0) * self.dt; tgt = pp_ + max(-st, min(st, des - pp_))
                for _ in range(4):
                    err = ((tgt - pr + 180) % 360) - 180
                    if abs(err) < 1.0: break
                    Rf = axang(f, math.radians(err)); fing = Rf @ fing; palm = Rf @ palm; pr, f = meas(fing, palm)
                k[sd + 'Fing'] = fing; k[sd + 'Palm'] = palm
                tgt = pr
            if not on_floor and t[1] >= 0.25: self.prevf[sd] = None
            self.prevp[sd] = pr; self.prevtw[sd] = tw
            mid = S + e * rig.l_ua; other = (mid, mid + f * rig.l_fa)
            diag[sd] = (round(tw), round(pr), planted, round(math.degrees(b)), round(c, 1))
        return diag
