"""stage A0 (per-frame from GVHMR) + A1 (with 8 marker offsets g)."""
import pickle, sys, numpy as np
from stageA import run, R0, x0, obs, w, N, FR
x, e = run(R0, x0, 'A0', iters=60)
x, e = run(R0, x, 'A1', iters=40, g=np.zeros(8))
g = run.g
pickle.dump({'R0': R0, 'x': x, 'g': g, 'e': e}, open(sys.argv[1], 'wb'))
for i in range(0, N, 4): print(FR[i], 'med %.0f max %.0f' % (np.median(e[i]), e[i].max()))
