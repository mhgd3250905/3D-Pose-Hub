# Step 2: per-vertex muscle IDs for the v3 body, projected from BodyParts3D muscle meshes.
# MH body is posed (LBS) into the BodyParts3D anatomical pose (arms down, palms forward) using bone landmarks, then each
# body vertex casts a ray inward along its normal; the first muscle surface hit gives the superficial ID, the first
# deep-set muscle further along gives the deep ID. Left side is labelled and mirrored to the right (MH mesh is symmetric).
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, json, trimesh, scipy.sparse as sp, re
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation as Rot
import bp3d
D = np.load(WORK + '/out/rest.npz')
X, T, W, names, parent, H = D['X'], D['T'], D['W'], list(D['names']), D['parent'], D['H']
isHead = D['isHead']; NB = int((~isHead).sum())
bi = {n: i for i, n in enumerate(names)}
# ---------------- groups ----------------
GROUPS = [  # id, key, zh, BodyParts3D name patterns (lowercase, side stripped), spec groups
 (1, 'neck', '胸锁乳突肌', [r'^sternocleidomastoid'], ['neck']),
 (2, 'trapUpper', '斜方肌上部', [r'descending part of .*trapezius', r'^levator scapulae'], ['traps']),
 (3, 'deltFront', '三角肌前束', [r'clavicular part of .*deltoid'], ['deltoids']),
 (4, 'deltSide', '三角肌中束', [r'acromial part of .*deltoid'], ['deltoids']),
 (5, 'deltRear', '三角肌后束', [r'spinal part of .*deltoid'], ['deltoids']),
 (6, 'pec', '胸大肌', [r'pectoralis major'], ['chest', 'pectorals']),
 (7, 'biceps', '肱二头肌 / 肱肌', [r'biceps brachii', r'^brachialis', r'^coracobrachialis'], ['biceps']),
 (8, 'triceps', '肱三头肌', [r'triceps brachii', r'^anconeus'], ['triceps']),
 (9, 'forearmFlex', '前臂屈肌群', [r'flexor carpi', r'^palmaris longus', r'flexor digitorum (superficialis|profundus)', r'flexor pollicis longus', r'pronator'], ['forearms']),
 (10, 'forearmExt', '前臂伸肌群', [r'extensor carpi', r'^extensor digitorum$', r'extensor digiti minimi', r'extensor indicis', r'extensor pollicis', r'abductor pollicis longus', r'^supinator', r'^brachioradialis'], ['forearms']),
 (11, 'serratus', '前锯肌', [r'^serratus anterior'], ['serratus']),
 (12, 'abs', '腹直肌（几何补位）', [], ['abs']),
 (13, 'oblique', '腹外斜肌', [r'^external oblique'], ['obliques']),
 (14, 'infraspinatus', '冈下肌 / 小圆肌', [r'^infraspinatus', r'^teres minor'], ['rotator-cuff']),
 (15, 'scapular', '斜方肌中下部 / 菱形肌', [r'(transverse|ascending) part of .*trapezius', r'^rhomboid'], ['scapular', 'traps']),
 (16, 'lats', '背阔肌（几何补位）', [], ['lats']),
 (17, 'erectors', '竖脊肌', [r'iliocostalis', r'longissimus (thoracis|cervicis)', r'^spinalis', r'semispinalis thoracis'], ['erectors']),
 (18, 'gluteMed', '臀中肌 / 臀小肌', [r'gluteus (medius|minimus)'], ['hip-abductors', 'glutes']),
 (19, 'glutes', '臀大肌', [r'gluteus maximus'], ['glute-max', 'glutes']),
 (20, 'hipFlexor', '髂腰肌', [r'^iliacus', r'^psoas major'], ['hip-flexors']),
 (21, 'tfl', '阔筋膜张肌', [r'tensor fasciae latae'], ['hip-flexors', 'hip-abductors']),
 (22, 'sartorius', '缝匠肌', [r'^sartorius'], ['hip-flexors']),
 (23, 'quadRect', '股直肌', [r'rectus femoris'], ['quadriceps', 'hip-flexors']),
 (24, 'quadLat', '股外侧肌', [r'vastus lateralis'], ['quadriceps']),
 (25, 'quadMed', '股内侧肌 / 股中间肌', [r'vastus (medialis|intermedius)'], ['quadriceps']),
 (26, 'adductors', '内收肌群', [r'adductor (longus|brevis|magnus|minimus)$', r'^gracilis', r'^pectineus'], ['adductors']),
 (27, 'hamLat', '股二头肌', [r'biceps femoris'], ['hamstrings']),
 (28, 'hamMed', '半腱肌 / 半膜肌', [r'^semitendinosus', r'^semimembranosus'], ['hamstrings']),
 (29, 'tibialis', '胫骨前肌 / 趾长伸肌', [r'^tibialis anterior', r'extensor (digitorum|hallucis) longus', r'fibularis tertius'], ['tibialis']),
 (30, 'fibularis', '腓骨长短肌', [r'fibularis (longus|brevis)'], []),
 (31, 'calfMed', '腓肠肌内侧头', [r'medial head of .*gastrocnemius'], ['calves']),
 (32, 'calfLat', '腓肠肌外侧头', [r'lateral head of .*gastrocnemius'], ['calves']),
 (33, 'soleus', '比目鱼肌', [r'^soleus', r'^plantaris'], ['calves']),
 (34, 'teresMajor', '大圆肌', [r'^teres major'], ['lats']),
 (35, 'supraspinatus', '冈上肌（深层）', [r'^supraspinatus'], ['rotator-cuff']),
 (36, 'subscapularis', '肩胛下肌（深层）', [r'^subscapularis'], ['rotator-cuff']),
 (37, 'hipRotators', '髋深层外旋肌', [r'^piriformis', r'gemellus', r'obturator (internus|externus)', r'^quadratus femoris'], ['hip-rotators']),
 (38, 'handIntrinsic', '手内在肌', [r'pollicis brevis', r'adductor pollicis', r'opponens', r'interossei', r'lumbricals', r'digiti minimi of .*hand'], []),
]
DEEP = {35, 36, 37, 20, 14}
def label_of(name):
    n = re.sub(r'^(left|right) ', '', name.lower())
    for gid, key, zh, pats, _ in GROUPS:
        for pt in pats:
            if re.search(pt, n): return gid
    return 0
# ---------------- BodyParts3D: left-side muscles + landmarks ----------------
mus = bp3d.parts(lambda p: p['tissue'] != 'bone' and p['system'] == 'muscular' and p['side'] in ('left', 'midline'))
Ps, Is, Ls = [], [], []; off = 0; used = {}
for p in mus:
    P, I = bp3d.part_mesh(p); lab = label_of(p['name'])
    if re.search(r'platysma', p['name'].lower()): continue  # thin sheet over the neck: would hide the SCM
    Ps.append(P); Is.append(I + off); Ls.append(np.full(len(I), lab)); off += len(P)
    if lab: used.setdefault(lab, []).append(p['name'])
MP = np.vstack(Ps); MI = np.vstack(Is); ML = np.concatenate(Ls)
# bones as blockers (rays stop at bone)
bns = bp3d.parts(lambda p: p['tissue'] == 'bone' and p['side'] in ('left', 'midline'))
Bp, Bi = [], []; o2 = 0
for p in bns:
    P, I = bp3d.part_mesh(p); Bp.append(P); Bi.append(I + o2); o2 += len(P)
BP, BI = np.vstack(Bp), np.vstack(Bi)
allP = np.vstack([MP, BP]); allI = np.vstack([MI, BI + len(MP)]); allL = np.concatenate([ML, np.full(len(BI), -1)])
scene = trimesh.Trimesh(allP, allI, process=False)
print('BP3D left muscles', len(mus), 'tris', len(MI), 'bone tris', len(BI))
def bone(name):
    p = bp3d.parts(lambda q: q['name'] == name)[0]; return bp3d.part_mesh(p)[0]
def end(P, top, frac=0.06):
    y = P[:, 1]; lo, hi = y.min(), y.max(); s = (y > hi - frac * (hi - lo)) if top else (y < lo + frac * (hi - lo)); return P[s].mean(0)
hum, rad, uln, fem, tib, fib = [bone('Left ' + n) for n in ['humerus', 'radius', 'ulna', 'femur', 'tibia', 'fibula']]
fh = fem[(fem[:, 1] > fem[:, 1].max() - 0.06)]; fh = fh[fh[:, 0] < np.median(fh[:, 0])]
LM = {'shoulder': end(hum, True, 0.07), 'elbow': end(hum, False, 0.05), 'wrist': (end(rad, False, 0.05) + end(uln, False, 0.05)) / 2,
      'hip': fh.mean(0), 'knee': end(fem, False, 0.05), 'ankle': (end(tib, False, 0.04) + end(fib, False, 0.04)) / 2}
thumbBP = end(rad, False, 0.05) - end(uln, False, 0.05)
print({k: v.round(3) for k, v in LM.items()})
# ---------------- pose MH into the BP3D pose ----------------
def rotvec(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); v = np.cross(a, b); s = np.linalg.norm(v); c = a @ b
    if s < 1e-9: return np.eye(3)
    return Rot.from_rotvec(v / s * np.arctan2(s, c)).as_matrix()
def axscale(d, k): d = d / np.linalg.norm(d); return np.eye(3) + (k - 1) * np.outer(d, d)
nb = len(names); A = [np.eye(3) for _ in range(nb)]
J = {'shoulder': H[bi['upperarm01.L']], 'elbow': H[bi['lowerarm01.L']], 'wrist': H[bi['wrist.L']], 'hip': H[bi['upperleg01.L']], 'knee': H[bi['lowerleg01.L']], 'ankle': H[bi['foot.L']]}
def desc(n):
    out = [n]; ch = [i for i in range(nb) if parent[i] == bi[n]]
    for c in ch: out += desc(names[c])
    return out
# global: translate so hip midpoints match, scale torso height so shoulder height matches
hipMH = J['hip'] * [0, 1, 1]; hipBP = LM['hip'] * [0, 1, 1]
sy = (LM['shoulder'][1] - LM['hip'][1]) / (J['shoulder'][1] - J['hip'][1])
print('torso y-scale', sy)
for side, sg in (('L', 1), ('R', -1)):
    m = np.array([sg, 1, 1])
    S, E_, Wr = J['shoulder'] * m, J['elbow'] * m, J['wrist'] * m
    bS, bE, bW = LM['shoulder'] * m, LM['elbow'] * m, LM['wrist'] * m
    Hh, Kn, An = J['hip'] * m, J['knee'] * m, J['ankle'] * m
    bH, bK, bA = LM['hip'] * m, LM['knee'] * m, LM['ankle'] * m
    Rua = rotvec(E_ - S, bE - bS); kua = np.linalg.norm(bE - bS) / np.linalg.norm(E_ - S)
    Aua = Rua @ axscale(E_ - S, kua)
    fa0 = Aua @ (Wr - E_); Rfa = rotvec(fa0, bW - bE) @ Rua; kfa = np.linalg.norm(bW - bE) / np.linalg.norm(Wr - E_)
    Afa = Rfa @ axscale(Wr - E_, kfa)
    # forearm twist so the thumb side matches the radius side
    th0 = Rfa @ ((H[bi['finger1-1.' + side]] - H[bi['finger5-1.' + side]]))
    ax = (bW - bE) / np.linalg.norm(bW - bE); tb = thumbBP * m
    a0 = th0 - ax * (th0 @ ax); a1 = tb - ax * (tb @ ax)
    ang = np.arctan2(np.cross(a0, a1) @ ax, a0 @ a1)
    tw = lambda f: Rot.from_rotvec(ax * ang * f).as_matrix()
    for n in desc('upperarm01.' + side): A[bi[n]] = Aua
    for n in desc('lowerarm01.' + side): A[bi[n]] = tw(1.0) @ Rfa
    A[bi['lowerarm01.' + side]] = tw(0.25) @ Afa; A[bi['lowerarm02.' + side]] = tw(0.75) @ Afa
    Rth = rotvec(Kn - Hh, bK - bH); kth = np.linalg.norm(bK - bH) / np.linalg.norm(Kn - Hh)
    for n in desc('upperleg01.' + side): A[bi[n]] = Rth
    A[bi['upperleg01.' + side]] = A[bi['upperleg02.' + side]] = Rth @ axscale(Kn - Hh, kth)
    sh0 = Rth @ (An - Kn); Rsh = rotvec(sh0, bA - bK) @ Rth; ksh = np.linalg.norm(bA - bK) / np.linalg.norm(An - Kn)
    for n in desc('lowerleg01.' + side): A[bi[n]] = Rsh
    A[bi['lowerleg01.' + side]] = A[bi['lowerleg02.' + side]] = Rsh @ axscale(An - Kn, ksh)
    print(side, 'ua', round(kua, 3), 'fa', round(kfa, 3), 'thigh', round(kth, 3), 'shin', round(ksh, 3), 'forearm twist deg', round(np.degrees(ang), 1))
# torso: vertical scale about the hip line for everything above the legs (root, spine, neck, head, arms carried)
Ty = np.diag([1, sy, 1])
legs = set(desc('upperleg01.L') + desc('upperleg01.R'))
for i, n in enumerate(names):
    if n not in legs: A[i] = A[i] @ Ty if n in ('root', 'pelvis.L', 'pelvis.R') or n.startswith('spine') or n.startswith('neck') or n == 'head' or n.startswith('clav') or n.startswith('shoulder') else A[i]
# FK heads: h'_c = h'_p + A_p (h_c - h_p); root anchored so the hip midpoint matches
Hn = np.zeros_like(H)
for i in range(nb):
    p = parent[i]
    if p < 0: Hn[i] = H[i]
    else: Hn[i] = Hn[p] + A[p] @ (H[i] - H[p])
# arm/leg chains are rigid-below-scale only for their own segment: apply the torso scale to arm roots too
off = (LM['hip'] * [0, 1, 1]) - ((Hn[bi['upperleg01.L']] + Hn[bi['upperleg01.R']]) / 2 * [0, 1, 1])
off[0] = 0; Hn += off
for side, sg in (('L', 1), ('R', -1)):
    m = np.array([sg, 1, 1])
    da = LM['shoulder'] * m - Hn[bi['upperarm01.' + side]]; da[1] = 0
    for n in desc('upperarm01.' + side): Hn[bi[n]] += da * 0.8
    dl = LM['hip'] * m - Hn[bi['upperleg01.' + side]]; dl[1] = 0; dl[2] = 0
    for n in desc('upperleg01.' + side): Hn[bi[n]] += dl * 0.6
Xb = X[:NB]; Wb = W[:NB]
Y = np.zeros_like(Xb)
for i in range(nb):
    w = Wb[:, i]; s = w > 0
    if s.any(): Y[s] += w[s, None] * ((Xb[s] - H[i]) @ A[i].T + Hn[i])
np.save(WORK + '/out/posed_bp.npy', Y)
for k in ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle']:
    jn = {'shoulder': 'upperarm01.L', 'elbow': 'lowerarm01.L', 'wrist': 'wrist.L', 'hip': 'upperleg01.L', 'knee': 'lowerleg01.L', 'ankle': 'foot.L'}[k]
    print(k, 'posed MH', Hn[bi[jn]].round(3), 'BP3D', LM[k].round(3))

# ---------------- ray labelling ----------------
mesh = trimesh.Trimesh(Y, T[(T < NB).all(1)], process=False)
N = mesh.vertex_normals
sel = np.where(Y[:, 0] > -0.004)[0]
# thick-ray march with a KD-tree of muscle/bone surface samples (trimesh ray casting blows up memory on unbounded rays)
smp, fi = trimesh.sample.sample_surface(scene, 1500000, seed=1)
SP = np.vstack([allP, smp]); SL = np.concatenate([np.full(len(allP), -2), allL[fi]])
print('surface area', round(scene.area, 2), 'samples', len(smp))
kd = cKDTree(SP)
import time; t0 = time.time()
sup = np.zeros(len(sel), int); deep = np.zeros(len(sel), int)
steps = np.arange(-0.02, 0.13, 0.004)
thin_t = np.full(len(sel), -1.0); thin_v = np.zeros(len(sel), int); THIN = {22}
state = np.zeros(len(sel), int)   # 0 searching, 1 got superficial, 2 stopped
supd = np.zeros(len(sel))
for t in steps:
    late = (state == 0) & (thin_t >= 0) & (t - thin_t > 0.012)
    sup[late] = thin_v[late]; supd[late] = thin_t[late]; state[late] = 1
    act = np.where(state < 2)[0]
    if not len(act): break
    q = Y[sel[act]] - N[sel[act]] * t
    nb_ = kd.query_ball_point(q, 0.010)
    for k, lst in zip(act, nb_):
        if not lst: continue
        ls = SL[lst]; ls = ls[ls != -2]
        if not len(ls): continue
        if (ls > 0).sum() == 0 and (ls == -1).mean() > 0.5: state[k] = 2; continue
        ls = ls[ls > 0] if (ls > 0).any() else ls[ls >= 0]
        if not len(ls): continue
        if state[k] == 0:
            if t > 0.10: state[k] = 2; continue
            v = np.bincount(ls).argmax()
            if v in THIN and thin_t[k] < 0: thin_t[k] = t; thin_v[k] = v; continue   # thin strap: look 12 mm deeper first
            if thin_t[k] >= 0 and v in THIN: continue
            sup[k] = v; supd[k] = t; state[k] = 1
            if v in DEEP: deep[k] = v
        elif deep[k] == 0 and t - supd[k] < 0.06:
            d = [x for x in ls if x in DEEP]
            if d: deep[k] = np.bincount(d).argmax()
reason = np.where(state == 0, 0, np.where(sup > 0, 3, np.where(state == 2, 1, 2)))
print('reasons none/bone/other0/ok', np.bincount(reason, minlength=4))
print('march', round(time.time() - t0, 1), 's', 'labelled', (sup > 0).mean().round(3))
SUP = np.zeros(NB, int); DP = np.zeros(NB, int); SUP[sel] = sup; DP[sel] = deep
RS = np.zeros(NB, int); RS[sel] = reason + 1
np.savez(WORK + '/out/labels_raw.npz', SUP=SUP, DP=DP, sel=sel, RS=RS)
if __name__ == '__main__' and 0: pass
