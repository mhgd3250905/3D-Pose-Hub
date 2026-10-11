# mirror.py: derive assets/grip-left.json from assets/grip-right.json (the mannequin mesh is left/right symmetric to ~0.1 mm,
# but seam-duplicate counts differ a little between the hands, so the map is built from the left side: every left hand-region
# vertex takes the data of the right grip vertex nearest to its mirror image; co-located duplicates share one target).
# usage: python3 tools/grip/mirror.py rest.json
#   rest.json = {ids, P}: rest-world positions (motion.reset(), no bakeHands) of the hand-region vertices of Coach_Body, dumped with
#   tools/probe.mjs, e.g. code: for each vertex o.getVertexPosition(i,p).applyMatrix4(o.matrixWorld), keep |x|>0.08, 0.55<y<1.1.
import json, sys, numpy as np
from scipy.spatial import cKDTree
R = json.load(open(sys.argv[1])); ids = np.array(R['ids']); P = np.array(R['P'])
G = json.load(open('assets/grip-right.json')); S = np.diag([-1., 1., 1.])
pos = {int(i): k for k, i in enumerate(ids)}
Pr = P[[pos[i] for i in G['idx']]]                       # right grip vertices, rest world
d, j = cKDTree(Pr @ S).query(P)                        # every vertex -> nearest mirrored right grip vertex
take = (P[:, 0] > 0) & (d < 0.0005)
idx = ids[take].astype(int).tolist(); src = j[take]; worst = d[take].max()
mir = lambda v: (np.array(v) @ S).round(6).tolist()
J = [((S @ np.array(G['J'][k]).reshape(3, 3) @ S).reshape(9)).round(5).tolist() for k in src]
H = G['handle']
out = dict(side='left', idx=idx, d=mir([G['d'][k] for k in src]), J=J, frame=mir(G['frame']), T=mir([G['T'][k] for k in src]),
           handle=dict(centre=mir(H['centre']), axis=mir(H['axis']), r=H['r']))
json.dump(out, open('assets/grip-left.json', 'w'), separators=(',', ':'))
print('left verts', len(idx), '(right', len(G['idx']), ') worst match mm', round(worst * 1000, 3))
