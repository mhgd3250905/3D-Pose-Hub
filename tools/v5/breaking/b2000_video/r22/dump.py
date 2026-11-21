import json, sys, numpy as np
from fkj import fk, J
d = json.load(open(sys.argv[1])); D = {}
for fr in d['frames']:
    W, P = fk(fr)
    for b in J: D.setdefault('P_' + b, []).append(P[b]); D.setdefault('W_' + b, []).append(W[b])
np.savez_compressed(sys.argv[2], fps=np.array(120.0), **{k: np.array(v) for k, v in D.items()})
