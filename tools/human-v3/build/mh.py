# MakeHuman/MPFB2 base mesh loader (CC0 assets) - no Blender needed.
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, gzip, json, os
SRC = WORK + '/src/mpfb'
def load_obj(path=SRC + '/base.obj'):
    V = []; F = []; G = []; cur = None; groups = {}
    for line in open(path):
        if line.startswith('v '): V.append([float(x) for x in line.split()[1:4]])
        elif line.startswith('g '): cur = line.split()[1]
        elif line.startswith('f '):
            idx = [int(t.split('/')[0]) - 1 for t in line.split()[1:]]
            F.append(idx); G.append(cur)
    return np.array(V), F, G
def load_target(name, n):
    d = np.zeros((n, 3))
    with gzip.open(SRC + '/' + name + '.target.gz', 'rt') as f:
        for line in f:
            p = line.split()
            if len(p) == 4 and not line.startswith('#'): d[int(p[0])] = [float(x) for x in p[1:]]
    return d
def build_base(muscle=0.3, weight_min=0.0):
    V, F, G = load_obj()
    n = len(V)
    for race in ['african', 'asian', 'caucasian']: V = V + load_target(race + '-male-young', n) / 3.0
    if muscle: V = V + muscle * load_target('universal-male-young-maxmuscle-averageweight', n)
    if weight_min: V = V + weight_min * load_target('universal-male-young-averagemuscle-minweight', n)
    return V, F, G
def cube_centers(V, F, G):
    c = {}
    for f, g in zip(F, G):
        if g and g.startswith('joint-'): c.setdefault(g, set()).update(f)
    return {k: V[sorted(v)].mean(0) for k, v in c.items()}
def to_blender(p): return np.array([p[0], -p[2], p[1]]) * 0.1
def to_obj(b): return np.array([b[0], b[2], -b[1]]) * 10
def rig_points(V, F, G, rig):
    cc = cube_centers(V, F, G)
    def pt(spec):
        s = spec['strategy']
        if s == 'CUBE': return cc[spec['cube_name']]
        if s == 'VERTEX': return V[spec['vertex_index']]
        if s == 'MEAN': return V[spec['vertex_indices']].mean(0)
        raise ValueError(s)
    return {k: (pt(b['head']), pt(b['tail'])) for k, b in rig.items()}
