#!/usr/bin/env python3
"""Quantify the 2000 entry from HMR2/GVHMR trajectories (clip01, clip02 = upload5) and from r9/r10 dumps, by ROLE
(first planted hand / free hand / support foot), so the mirrored side does not matter. Y-up metres."""
import sys, json, math, numpy as np
J = ['pelvis','left_hip','right_hip','spine1','left_knee','right_knee','spine2','left_ankle','right_ankle','spine3','left_foot','right_foot','neck','left_collar','right_collar','head','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hand','right_hand']
def load_ref(c):
    Z = np.load(f'/workspace/work/b2000/ref/traj/{c}/skeleton_motion.npz'); X = Z['joints_3d']; g = lambda n: X[:, J.index(n)]
    return dict(fps=30.0, pelvis=g('pelvis'), neck=g('neck'), head=g('head'), hip={s: g(s+'_hip') for s in 'LR' for s in [s]} if False else
                {'L': g('left_hip'), 'R': g('right_hip')}, ank={'L': g('left_ankle'), 'R': g('right_ankle')},
                sh={'L': g('left_shoulder'), 'R': g('right_shoulder')}, wr={'L': g('left_wrist'), 'R': g('right_wrist')})
def load_sim(f):
    Z = np.load(f); g = lambda n: Z['P_' + n]
    return dict(wt=0.10, fps=float(Z['fps']), pelvis=g('pelvis'), neck=g('neck'), head=g('head'), hip={'L': g('leftThigh'), 'R': g('rightThigh')},
                ank={'L': g('leftFoot'), 'R': g('rightFoot')}, sh={'L': g('leftUpperArm'), 'R': g('rightUpperArm')}, wr={'L': g('leftHand'), 'R': g('rightHand')})
def ang(a, b): return np.degrees(np.arccos(np.clip((a * b).sum(-1) / np.linalg.norm(a, axis=-1) / np.linalg.norm(b, axis=-1), -1, 1)))
def hz(v): return np.linalg.norm(v[..., [0, 2]], axis=-1)
def metrics(d, tmax):
    fps = d['fps']; N = min(len(d['pelvis']), int(tmax * fps)); o = {}
    legL = np.mean([np.linalg.norm(d['hip'][s][0] - d['ank'][s][0]) for s in 'LR'])
    armL = np.mean([np.linalg.norm(d['sh'][s][0] - d['wr'][s][0]) for s in 'LR'])
    wmin = {s: d['wr'][s][:N, 1].min() for s in 'LR'}; amin = min(d['ank'][s][:N, 1].min() for s in 'LR')
    WT = d.get('wt', 0.20)   # wrist-joint height that counts as a planted hand (HMR2 wrists sit ~0.12-0.19 m up when the palm is flat; sim 0.045)
    pl = {s: next((i for i in range(N) if d['wr'][s][i, 1] < WT), N) for s in 'LR'}
    A = min(pl, key=pl.get); B = 'R' if A == 'L' else 'L'; f1, f2 = pl[A], pl[B]
    # support foot = the foot that stays down longest after the plant
    up = {s: next((i for i in range(max(0, f1 - int(0.5 * fps)), N) if d['ank'][s][i, 1] > 0.22), N) for s in 'LR'}   # ankle clearly off the floor
    S = max(up, key=up.get); K = 'R' if S == 'L' else 'L'; flo = up[S]
    t = lambda i: i / fps
    o['first hand / free hand'] = f"{'左' if A == 'L' else '右'} / {'左' if B == 'L' else '右'}"
    o['first-hand plant t (s)'] = f'{t(f1):.2f}'
    o['kick leg leaves floor t (s), rel. plant'] = f'{t(up[K]):.2f} ({t(up[K]) - t(f1):+.2f})'
    o['support foot push-off t (s), rel. plant'] = f'{t(flo):.2f} ({t(flo) - t(f1):+.2f})'
    o['second hand lands t (s), rel. plant'] = f'{t(f2):.2f} ({t(f2) - t(f1):+.2f})'
    o['stance width at start / leg length'] = f"{hz(d['ank']['L'][0] - d['ank']['R'][0]) / legL:.2f}"
    # hips forward over the hand: horizontal pelvis-hand distance (/leg length) at plant-0.2s, plant, push-off
    hp = lambda i: hz(d['pelvis'][i] - d['wr'][A][f1]) / legL
    o['pelvis-hand horiz dist /leg: plant-0.2s, plant, push-off'] = f'{hp(max(0, f1 - int(0.2 * fps))):.2f}, {hp(f1):.2f}, {hp(min(flo, N - 1)):.2f}'
    # pelvis travel toward the hand between start and push-off (/leg) and when its horizontal speed peaks
    v = hz(np.diff(d['pelvis'][:N], axis=0)) * fps; ip = int(np.argmax(v[:max(flo, 2)]))
    o['pelvis horiz travel start->push-off /leg; peak speed t'] = f"{hz(d['pelvis'][min(flo, N - 1)] - d['pelvis'][0]) / legL:.2f}; {v[ip] / legL:.2f} leg/s @{t(ip):.2f}s"
    sp = ang(d['ank']['L'][:N] - d['hip']['L'][:N], d['ank']['R'][:N] - d['hip']['R'][:N])
    o['leg opening at plant (°)'] = f'{sp[f1]:.0f}'
    w = sp[f1:f2 + 1]; o['max leg opening plant->2nd hand (°) @t'] = f'{w.max():.0f} @{t(f1 + int(np.argmax(w))):.2f}'
    sv = d['neck'][:N] - d['pelvis'][:N]; inv = ang(sv, np.array([0, 1.0, 0])); r = np.abs(np.diff(inv)) * fps
    a90 = next((i for i in range(N) if inv[i] > 90), N); a150 = next((i for i in range(N) if inv[i] > 150), N)
    o['trunk tilt 90° / 150° reached t (s)'] = f'{t(a90):.2f} / {t(a150):.2f}'
    ws = slice(max(0, f1 - int(0.3 * fps)), min(N - 1, f2 + 1))
    o['trunk flip rate max plant±(°/s)'] = f'{r[ws].max():.0f}'
    hd = np.degrees(np.unwrap(np.arctan2(*(d['sh']['L'][:N] - d['sh']['R'][:N])[:, [2, 0]].T)))
    tw = np.abs(np.diff(hd)) * fps
    o['shoulder-line heading turn plant-0.3s->2nd hand (°), max rate'] = f'{abs(hd[min(N-1, f2)] - hd[ws.start]):.0f}, {tw[ws].max():.0f}°/s'
    o['hand spacing at 2nd plant /arm (m)'] = f"{hz(d['wr']['L'][f2] - d['wr']['R'][f2]) / armL:.2f} ({hz(d['wr']['L'][f2] - d['wr']['R'][f2]):.2f} m)"
    fh = (d['wr'][B][:N, 1] - d['sh'][B][:N, 1]) / armL
    o['free hand (wrist-shoulder) height /arm: start, plant-0.2s, plant, max before plant'] = f'{fh[0]:+.2f}, {fh[max(0, f1 - int(0.2 * fps))]:+.2f}, {fh[f1]:+.2f}, {fh[:f1 + 1].max():+.2f}'
    # free arm relative to the trunk: angle of the free arm from the trunk's 'down' direction projected... use elevation vs spine
    sv_ = sv / np.linalg.norm(sv, axis=1)[:, None]; fa = d['wr'][B][:N] - d['sh'][B][:N]; fa = fa / np.linalg.norm(fa, axis=1)[:, None]
    abd = np.degrees(np.arccos(np.clip((fa * -sv_).sum(1), -1, 1)))   # 0 = arm along the body toward the feet, 90 = out sideways/forward, 180 = overhead
    o['free arm angle from trunk-down (°): plant-0.2s, plant (90=side,180=overhead)'] = f'{abd[max(0, f1 - int(0.2 * fps))]:.0f}, {abd[f1]:.0f}'
    return o
R = {'clip01 (另一条, 30fps)': metrics(load_ref('clip01'), 3.4), 'clip02 = upload5 (30fps)': metrics(load_ref('clip02'), 1.6),
     'r9 (镜像后同侧)': metrics(load_sim('/workspace/work/b2000/r10/r9m.npz'), 1.6), 'r10': metrics(load_sim(sys.argv[1] if len(sys.argv) > 1 else '/workspace/work/b2000/r10/r10.npz'), 1.6)}
ks = list(R); print('| 指标 | ' + ' | '.join(ks) + ' |'); print('|---|' + '---|' * len(ks))
for k in R[ks[0]]: print('| ' + k + ' | ' + ' | '.join(R[c][k] for c in ks) + ' |')
