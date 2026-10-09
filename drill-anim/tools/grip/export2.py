import numpy as np, json, sys
src = open('thumb.py').read().split('best = None')[0]
src = src.replace("cj = json.load(open('close.json'))", "cj = json.load(open(sys.argv[1]))")
exec(src)
xt = cj['thumb']['x']
ids = np.unique(np.concatenate([moving, tid]))
def deform(Qin):
    global Q
    Qs = Q; Q = Qin
    out = Qin[ids].copy()
    fm = np.isin(ids, moving); out[fm] = curl(angF, ids[fm])
    tpos = {v: i for i, v in enumerate(tid)}; th = thumbCurl(xt)
    ti = np.array([tpos[v] for v in ids if v in tpos]); tm = np.isin(ids, tid)
    out[tm] += th[ti] - Qin[ids[tm]]
    Q = Qs; return out
base = deform(Q); eps = 1e-4; J = np.zeros((len(ids), 3, 3))
for a in range(3):
    Qp = Q.copy(); Qp[ids, a] += eps; J[:, :, a] = (deform(Qp) - base) / eps
dW = (base - Q[ids]) @ H; JW = np.einsum('ij,njk,kl->nil', H.T, J, H)
m = np.linalg.norm(dW, axis=1) > 1e-6
vid = np.array(d['V'])[:, 0].astype(int)
out = dict(side='right', idx=vid[ids][m].tolist(), d=np.round(dW[m], 6).tolist(), J=np.round(JW[m].reshape(-1, 9), 5).tolist(), frame=H.tolist(),
           handle=dict(centre=(WR + C @ H).round(6).tolist(), axis=(dC @ H).round(6).tolist(), r=RR))
json.dump(out, open(sys.argv[2], 'w')); print('verts', int(m.sum()), out['handle'])
