"""r4 crotch fix for coach-v3r3: harmonic smoothing of crotch weights + two half-rotation helper bones
(leftThighHalf/rightThighHalf, child of pelvis at the hip pivot, driven at runtime = slerp(I, q_thigh, 0.5)).
usage: helper.py raw_in.glb raw_out.glb [R] [json-kw for crotch.fix]"""
import sys, os, json, numpy as np; sys.path.insert(0, os.path.dirname(__file__))
from model import Model; from crotch import fix, dense_w, to4
def build(src, dst, R=0.18, kw=None, half=True):
    m = Model(src); g = m.g; j = g.j
    Wn, inn, W0 = fix(m, R=R, mid_pelvis=0, mid_w=0, **(kw or {}))
    jn = list(m.jn); ip, isl, iL, iR = jn.index('pelvis'), jn.index('spineLower'), jn.index('leftThigh'), jn.index('rightThigh')
    if half:
        # --- glb: add helper nodes + joints + IBMs
        n0 = len(j['nodes'])
        for side in ('left', 'right'):
            th = next(n for n in j['nodes'] if n.get('name') == side + 'Thigh')
            j['nodes'].append({'name': side + 'ThighHalf', 'translation': list(th['translation'])})
        # keep mesh node last-agnostic: just append joints
        sk = j['skins'][0]; sk['joints'] += [n0, n0 + 1]; j['scenes'][j.get('scene', 0)]['nodes'] += [n0, n0 + 1]  # root nodes like the other (flat) bones
        ibm = m.ibm; new = np.concatenate([ibm, ibm[[iL, iR]]]).transpose(0, 2, 1).astype(np.float32).tobytes()
        pad = (4 - len(g.bin) % 4) % 4; g.bin += b'\0' * pad; off = len(g.bin); g.bin += new
        j['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': len(new)}); j['buffers'][0]['byteLength'] = len(g.bin)
        a = j['accessors'][sk['inverseBindMatrices']]; a['bufferView'] = len(j['bufferViews']) - 1; a['byteOffset'] = 0; a['count'] = len(sk['joints'])
        hL, hR = len(jn), len(jn) + 1
        W = np.zeros((len(Wn), len(jn) + 2)); W[:, :len(jn)] = Wn
        for v in np.where(inn)[0]:
            p = Wn[v, ip] + Wn[v, isl]; tL, tR = Wn[v, iL], Wn[v, iR]; T = tL + tR
            if T <= 1e-6 or p <= 1e-6: continue
            mass = p + T; fr = T / mass; spr = Wn[v, isl] / p
            pel = 0.0; row = W[v]
            for t, ih, it in ((tL, hL, iL), (tR, hR, iR)):
                mx = t / T * mass
                if fr < 0.5: pel += mx * (1 - 2 * fr); row[ih] = mx * 2 * fr; row[it] = 0
                else: row[ih] = mx * 2 * (1 - fr); row[it] = mx * (2 * fr - 1)
            row[ip] = pel * (1 - spr); row[isl] = pel * spr
        Wn = W
    p = m.prims[2]; J, q = to4(Wn); p['J'][inn] = J[inn]; p['W'][inn] = q[inn]  # only the crotch region is rewritten
    g.save(dst); return Wn, inn
if __name__ == '__main__':
    R = float(sys.argv[3]) if len(sys.argv) > 3 else 0.18; kw = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
    W, inn = build(sys.argv[1], sys.argv[2], R, kw, half=os.environ.get('HALF', '1') == '1'); print('region verts', int(inn.sum()), 'joints', W.shape[1])
