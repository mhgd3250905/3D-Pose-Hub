"""r3 metric table from an export dump (120 fps world) + its _xf + the fit pkl (for g).  usage: m3.py dump.npz fit.pkl tag [check.txt]"""
import sys, math, pickle, numpy as np
from contacts import WIN
from rig import kp_points, proj
from stageA import obs, w as wobs
Zp, pk, tag = sys.argv[1], sys.argv[2], sys.argv[3]
Z = np.load(Zp); xf = np.load(Zp.replace('.npz', '_xf.npz')); B, o = xf['B'], xf['o']; fps = float(Z['fps'])
P = lambda j: Z['P_' + j]; W = lambda j: Z['W_' + j]; N = P('pelvis').shape[0]
d = pickle.load(open(pk, 'rb'))
# 2D reprojection of the exported animation at the 30 fps source frames
Ps = {k[2:]: Z[k][::4][:156] @ B + o for k in Z.files if k.startswith('P_')}
Ws = {k[2:]: np.einsum('ji,njk->nik', B, Z[k][::4][:156]) for k in Z.files if k.startswith('W_')}
e = np.linalg.norm(proj(kp_points(Ws, Ps, d['g'])) - obs, axis=2); good = wobs > 0.3
e2d = np.median(e[good]); efit = np.median(d['e'][good])
hd = P('head') + np.einsum('nij,j->ni', W('head'), [0, 0.10, 0]); head_low = (hd[:, 1] - 0.105).min()
elb = min(P('leftForearm')[:, 1].min(), P('rightForearm')[:, 1].min()) - 0.048
sl = []
for b in ('leftHand', 'rightHand'):
    for a, c in WIN[b]:
        i0 = int(round((a - 10118 + 1) / 30 * fps)); i1 = int(round((c - 10118 - 1) / 30 * fps))
        if i1 <= i0 or i1 >= N: continue
        q = P(b)[i0:i1 + 1][:, [0, 2]]; sl.append(np.max(np.linalg.norm(q - q[0], axis=1)))
hip = 0.5 * (P('leftThigh') + P('rightThigh')); tilts = []
for f in (10181, 10210, 10241):
    i = int(round((f - 10118) / 30 * fps)); s = P('neck')[i] - hip[i]; tilts.append(np.degrees(np.arcsin(s[1] / np.linalg.norm(s))))
def ang(u, v): return np.degrees(np.arccos(np.clip((u * v).sum(1) / np.linalg.norm(u, axis=1) / np.linalg.norm(v, axis=1), -1, 1)))
Y = np.array([0, 1.0, 0]); X3 = np.array([1.0, 0, 0])
sp = ang(np.einsum('nij,j->ni', W('pelvis'), Y), np.einsum('nij,j->ni', W('torso'), Y))
lum = ang(np.einsum('nij,j->ni', W('pelvis'), Y), np.einsum('nij,j->ni', W('spineUpper'), Y))   # pelvis -> spineUpper (lumbar 2 joints)
# lumbar flexion(+)/extension(-) & lateral in the pelvis frame
lu = np.einsum('nji,nj->ni', W('pelvis'), np.einsum('nij,j->ni', W('spineUpper'), Y))
lflex = np.degrees(np.arctan2(lu[:, 2], lu[:, 1])); llat = np.degrees(np.arctan2(lu[:, 0], lu[:, 1]))
nk = ang(np.einsum('nij,j->ni', W('torso'), Y), np.einsum('nij,j->ni', W('head'), Y))
ab = {}; fl = {}; ex = {}; wr = {}
for s, sg in (('left', 1), ('right', -1)):
    th = P(s + 'Shin') - P(s + 'Thigh'); tl = np.einsum('nji,nj->ni', W('pelvis'), th); tl /= np.linalg.norm(tl, axis=1)[:, None]
    fl[s] = np.degrees(np.arctan2(tl[:, 2], -tl[:, 1])); ab[s] = np.degrees(np.arcsin(np.clip(sg * tl[:, 0], -1, 1)))
    fa = P(s + 'Hand') - P(s + 'Forearm'); fing = np.einsum('nij,j->ni', W(s + 'Hand'), sg * X3); wr[s] = ang(fa, fing)
spread = ang(P('leftShin') - P('leftThigh'), P('rightShin') - P('rightThigh'))
ng = '?'
if len(sys.argv) > 4:
    ng = open(sys.argv[4]).readline().split(':')[1].split()[0]
row = dict(tag=tag, e2d_export=round(e2d, 1), e2d_fit=round(efit, 1), head_low=round(head_low, 3), elbow_low=round(elb, 3), hand_slide=round(max(sl), 3),
           tilt='/'.join('%.0f' % abs(t) for t in tilts), spine_max=round(sp.max(), 1), lumbar_max=round(lum.max(), 1), lumbar_ext_max=round(-lflex.min(), 1),
           lumbar_flex_max=round(lflex.max(), 1), lumbar_lat_max=round(np.abs(llat).max(), 1), neck_max=round(nk.max(), 1),
           hip_abd_max=round(max(ab['left'].max(), ab['right'].max()), 1), hip_flex_max=round(max(fl['left'].max(), fl['right'].max()), 1),
           hip_ext_max=round(-min(fl['left'].min(), fl['right'].min()), 1), leg_spread_max=round(spread.max(), 1),
           wrist_max=round(max(wr['left'].max(), wr['right'].max()), 1), check_groups=ng)
print(row)
if '--frames' in sys.argv:
    for nm, v in (('abdL', ab['left']), ('abdR', ab['right']), ('flexL', fl['left']), ('flexR', fl['right']), ('extL', -fl['left']), ('extR', -fl['right']), ('spread', spread), ('spine', sp), ('lumbar', lum), ('lumExt', -lflex), ('neck', nk)):
        i = int(np.argmax(v)); print(nm, 'max %.1f at frame %d (%.2fs)' % (v[i], i, i / fps))
import json; open(Zp.replace('.npz', '_m3.json'), 'w').write(json.dumps(row))
