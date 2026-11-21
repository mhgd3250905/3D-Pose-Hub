"""overlay sheet: per frame, video crop with model projection (bones) + 2D keypoints, and side/top views of the 3D model.
draw(frames, Pdict(N,3 per bone, scene coords), Wdict, ground (n,d), out, obs=None, M=None)"""
import numpy as np
from PIL import Image, ImageDraw
from rig import proj
from load import FR
from cfg import P as PR, MIRROR, IW, IH, F_PX
BON = [('pelvis', 'spineLower'), ('spineLower', 'spineUpper'), ('spineUpper', 'torso'), ('torso', 'neck'), ('neck', 'head'),
       ('leftScapula', 'leftUpperArm'), ('torso', 'leftScapula'), ('leftUpperArm', 'leftForearm'), ('leftForearm', 'leftHand'),
       ('torso', 'rightScapula'), ('rightScapula', 'rightUpperArm'), ('rightUpperArm', 'rightForearm'), ('rightForearm', 'rightHand'),
       ('pelvis', 'leftThigh'), ('leftThigh', 'leftShin'), ('leftShin', 'leftFoot'), ('pelvis', 'rightThigh'), ('rightThigh', 'rightShin'), ('rightShin', 'rightFoot')]
CL = {'left': (40, 110, 255), 'right': (255, 60, 40), 'c': (255, 230, 0)}
SKL = [(5, 7), (7, 9), (6, 8), (8, 10), (11, 13), (13, 15), (12, 14), (14, 16), (5, 6), (11, 12)]


def col(b): return CL['left'] if 'left' in b else CL['right'] if 'right' in b else CL['c']


def extras(P, W, i):
    hd = P['head'][i] + W['head'][i] @ np.array([0, 0.10, 0])
    out = {}
    for sd, sg in (('left', 1), ('right', -1)):
        out[sd + 'Fing'] = P[sd + 'Hand'][i] + W[sd + 'Hand'][i] @ np.array([sg * 0.17, 0, 0])
        out[sd + 'Toe'] = P[sd + 'Foot'][i] + W[sd + 'Foot'][i] @ np.array([0, -0.06, 0.16])
    return hd, out


def draw(frames, P, W, ground, out, Kref=None, M=None, title=''):
    n_, d_ = ground
    # world basis: y = n, z' = toward camera projected on ground, x = y cross z
    zc = np.array([0, 0, 1.0]); zc = zc - n_ * (zc @ n_); zc /= np.linalg.norm(zc); xw = np.cross(n_, zc)
    TW, TH = 400, 400; SV = 240; CS = min(IW, IH, 600)
    img = Image.new('RGB', (len(frames) * TW, TH + SV + 20), (255, 255, 255)); dr = ImageDraw.Draw(img)
    for k, f in enumerate(frames):
        i = f - FR[0]
        im = Image.open(PR + f'frames/{f:05d}.png').convert('RGB')
        if MIRROR: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        pts = {b: P[b][i] for b in P}; hd, ex = extras(P, W, i)
        allp = np.array(list(pts.values()) + [hd] + list(ex.values()))
        uv = proj(allp)
        if M is not None:   # model lives in reference-frame pixels -> back to this frame's raw pixels
            A = np.vstack([M[i], [0, 0, 1]]); Ai = np.linalg.inv(A); uv = (Ai[:2, :2] @ uv.T).T + Ai[:2, 2]
        cxy = uv.mean(0); x0 = int(np.clip(cxy[0] - CS / 2, 0, IW - CS)); y0 = int(np.clip(cxy[1] - CS / 2, 0, IH - CS))
        crop = im.crop((x0, y0, x0 + CS, y0 + CS)).resize((TW, TH)); s = TW / CS; d = ImageDraw.Draw(crop)
        U = {b: ((uv[j][0] - x0) * s, (uv[j][1] - y0) * s) for j, b in enumerate(list(pts.keys()) + ['hd'] + list(ex.keys()))}
        if Kref is not None:
            kr = Kref[i]
            for a, b in SKL:
                pa = ((kr[a][0] - x0) * s, (kr[a][1] - y0) * s); pb = ((kr[b][0] - x0) * s, (kr[b][1] - y0) * s)
                d.line([pa, pb], fill=(255, 255, 255), width=1)
        for a, b in BON: d.line([U[a], U[b]], fill=col(b), width=4)
        for sd in ('left', 'right'):
            d.line([U[sd + 'Hand'], U[sd + 'Fing']], fill=col(sd), width=3); d.line([U[sd + 'Foot'], U[sd + 'Toe']], fill=col(sd), width=3)
        r = 0.10 * F_PX / max(0.5, -P['head'][i][2]) * s; h = U['hd']; d.ellipse([h[0] - r, h[1] - r, h[0] + r, h[1] + r], outline=(255, 230, 0), width=2)
        img.paste(crop, (k * TW, 0))
        # side view (camera from its right: horizontal axis = -zc (depth away), vertical = n) and top view
        c0 = P['pelvis'][i]; sc = 80
        for v, ox in ((0, k * TW), (1, k * TW + TW // 2)):
            cx_, cy_ = ox + TW // 4, TH + SV // 2 + (40 if v == 0 else 0)
            def pp(p):
                q = p - c0
                if v == 0: return (cx_ + float(q @ -zc) * sc, cy_ - float(q @ n_) * sc)
                return (cx_ + float(q @ xw) * sc, cy_ + float(q @ zc) * sc)
            if v == 0:
                gy = cy_ - (float((c0 @ n_) - d_) * -1) * sc
                dr.line([(ox + 5, gy), (ox + TW // 2 - 5, gy)], fill=(120, 160, 120), width=2)
            for a, b in BON: dr.line([pp(pts[a]), pp(pts[b])], fill=col(b), width=3)
            for sd in ('left', 'right'):
                dr.line([pp(pts[sd + 'Hand']), pp(ex[sd + 'Fing'])], fill=col(sd), width=2)
            q = pp(hd); dr.ellipse([q[0] - 8, q[1] - 8, q[0] + 8, q[1] + 8], outline=(90, 90, 90), width=2)
            dr.text((ox + 4, TH + 4), 'side (cam right) | top (cam at bottom)' if v == 0 else '', fill=(0, 0, 0))
        dr.text((k * TW + 6, 4), f'{f} {title}', fill=(255, 255, 0))
    img.save(out, quality=85)
