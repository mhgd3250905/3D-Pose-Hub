import sys, pickle, numpy as np
from rig import Rig
from cfg import FR, SPIN, GRIP
d = pickle.load(open(sys.argv[1], 'rb')); n_, d_ = d['ground']; W, P = Rig(d['R0']).fk(d['x'])
a, b = SPIN[0] - FR[0] + 2, SPIN[1] - FR[0] - 2; gh, ph = GRIP[0], GRIP[1]
pf = ph.replace('Hand', 'Forearm'); s = slice(a, b + 1)
ax = P[pf] - P[ph]; ax /= np.linalg.norm(ax, axis=1)[:, None]
off = P[gh] - P[ph]; along = (off * ax).sum(1); perp = np.linalg.norm(off - along[:, None] * ax, axis=1)
hip = 0.5 * (P['leftThigh'] + P['rightThigh']); sh = 0.5 * (P['leftUpperArm'] + P['rightUpperArm'])
body = hip - P[ph]; tilt = np.degrees(np.arccos(np.clip(body @ n_ / np.linalg.norm(body, axis=1), -1, 1)))
gap = np.linalg.norm(P['leftFoot'] - P['rightFoot'], axis=1); kg = np.linalg.norm(P['leftShin'] - P['rightShin'], axis=1)
def kneeang(sd):
    u = P[sd + 'Shin'] - P[sd + 'Thigh']; v = P[sd + 'Foot'] - P[sd + 'Shin']
    return np.degrees(np.arccos(np.clip((u * v).sum(1) / np.linalg.norm(u, axis=1) / np.linalg.norm(v, axis=1), -1, 1)))
leg = 0.5 * (P['leftFoot'] + P['rightFoot']) - hip; pike = np.degrees(np.arccos(np.clip((leg * (hip - sh)).sum(1) / np.linalg.norm(leg, axis=1) / np.linalg.norm(hip - sh, axis=1), -1, 1)))
hd = np.linalg.norm(P['leftHand'] - P['rightHand'], axis=1)
q = lambda v: '%.2f/%.2f/%.2f' % tuple(np.percentile(v[s], [10, 50, 90]))
print('grip along %s perp %s | handdist %s | body tilt %s | foot gap %s knee gap %s | knee bend L %s R %s | hip pike %s' % (q(along), q(perp), q(hd), q(tilt), q(gap), q(kg), q(kneeang('left')), q(kneeang('right')), q(pike)))
