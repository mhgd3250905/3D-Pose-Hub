#!/usr/bin/env python3
"""Exact left/right mirror of a breaking move (r10). The coach rig is mirror-symmetric (every right bone's rest offset = left's
with x negated, all rest world rotations = identity), so reflecting the whole performance across the sagittal plane (world x -> -x)
and swapping left/right bones gives the same move done on the other side: every joint angle, wrist extension, forearm pronation,
contact and clearance is identical with the sides swapped, and the spin direction reverses.
  positions: p -> M p, M = diag(-1, 1, 1);  rotations (world or local): R -> M R M  (quaternion [x, y, z, w] -> [x, -y, -z, w])
Usage: mirror.py anim.json out.json   |   mirror.py dump.npz out.npz   (also importable: mirror_anim(dict), mirror_npz(dict))"""
import sys, json
import numpy as np
M = np.diag([-1.0, 1.0, 1.0])
def sw(b): return 'right' + b[4:] if b.startswith('left') else 'left' + b[5:] if b.startswith('right') else b
def mq(q): return [q[0], -q[1], -q[2], q[3]]
def mirror_frame(fr):
    return {'p': [-fr['p'][0], fr['p'][1], fr['p'][2]], 'q': {sw(b): mq(fr['q'][b]) for b in fr['q']}}
def mirror_anim(a):
    a = dict(a); a['frames'] = [mirror_frame(f) for f in a['frames']]
    a['cams'] = {k: dict(v, p=[-v['p'][0]] + v['p'][1:], t=[-v['t'][0]] + v['t'][1:]) for k, v in a.get('cams', {}).items()}
    return a
def mirror_npz(Z):
    d = {}
    for k in Z:
        if k.startswith('P_'): d['P_' + sw(k[2:])] = Z[k] * np.array([-1.0, 1, 1])
        elif k.startswith('W_'): d['W_' + sw(k[2:])] = np.einsum('ij,njk,kl->nil', M, Z[k], M)
        else: d[k] = Z[k]
    return d
if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    if src.endswith('.npz'): np.savez_compressed(dst, **mirror_npz(dict(np.load(src))))
    else: json.dump(mirror_anim(json.load(open(src))), open(dst, 'w'), ensure_ascii=False)
