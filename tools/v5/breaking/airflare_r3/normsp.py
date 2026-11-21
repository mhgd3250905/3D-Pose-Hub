import sys, pickle, numpy as np
from rig import rodr, logm
d = pickle.load(open(sys.argv[1], 'rb'))
for key, sl, k in (('spine', slice(6, 9), 3), ('nh', slice(9, 12), 2)):
    rv = d['R0'][key] + d['x'][:, sl]; big = np.nonzero(np.linalg.norm(rv, axis=1) > 0.6)[0]
    print(key, 'large', big + 10118, np.linalg.norm(rv, axis=1)[big].round(2))
    tot = logm(rodr(rv * k)); d['R0'][key] = tot / k; d['x'][:, sl] = 0
pickle.dump(d, open(sys.argv[2], 'wb'))
