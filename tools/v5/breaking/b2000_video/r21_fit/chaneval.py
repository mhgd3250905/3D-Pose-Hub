"""agreement of a fit with the depth ordinals and the mask (diagnostic for the README)."""
import sys, pickle, numpy as np
from rig import Rig, kp_points, proj
from stageA import CH, obs, w
from cfg import FR, SPIN
from channels import sample_dt
d = pickle.load(open(sys.argv[1], 'rb')); W, P = Rig(d['R0']).fk(d['x']); K = kp_points(W, P, d['g'])
DP = CH['DP']; nn = np.arange(len(K))[:, None]
dz = K[nn, DP[:, :, 0].astype(int), 2] - K[nn, DP[:, :, 1].astype(int), 2]
act = DP[:, :, 3] > 0; ok = (np.sign(dz) == DP[:, :, 2]) & act
sp = np.zeros(len(K), bool); sp[SPIN[0] - FR[0]:SPIN[1] - FR[0] + 1] = True
uv = proj(K); Mi = CH['Minv']; uvf = np.einsum('nij,nkj->nki', Mi[:, :, :2], uv) + Mi[:, None, :, 2]; dt = sample_dt(CH['DT'], uvf)
e = np.linalg.norm(uv - obs, axis=2)
print('%s depth-order agree: all %.0f%% (%d) spin %.0f%% other %.0f%% | weighted %.0f%% | mask outside: mean %.1f px, pts>10px %.1f%% | 2D med %.1f px' % (
    sys.argv[1].split('/')[-1], 100 * ok.sum() / act.sum(), act.sum(), 100 * ok[sp].sum() / max(1, act[sp].sum()), 100 * ok[~sp].sum() / max(1, act[~sp].sum()),
    100 * (DP[:, :, 3] * ok).sum() / DP[:, :, 3].sum(), dt.mean(), 100 * (dt > 10).mean(), np.median(e)))
