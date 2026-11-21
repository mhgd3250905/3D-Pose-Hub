"""Load uncompressed coach glb into numpy; skin a pose (Pose Studio frame dict)."""
import json, struct, numpy as np
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
class GLB:
    def __init__(s, f):
        b = open(f, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; s.j = json.loads(b[20:20 + jl])
        bo = 20 + jl; bl = struct.unpack('<I', b[bo:bo + 4])[0]; s.bin = bytearray(b[bo + 8:bo + 8 + bl])
    def view(s, ai):
        a = s.j['accessors'][ai]; bv = s.j['bufferViews'][a['bufferView']]; dt = np.dtype(CT[a['componentType']]); n = NC[a['type']]
        st = bv.get('byteStride', dt.itemsize * n); off = bv['byteOffset'] + a.get('byteOffset', 0)
        arr = np.ndarray((a['count'], n), dtype=dt, buffer=s.bin, offset=off, strides=(st, dt.itemsize))
        return arr  # writable view into s.bin
    def save(s, f):
        js = json.dumps(s.j).encode(); js += b' ' * ((4 - len(js) % 4) % 4); bin_ = bytes(s.bin); bin_ += b'\0' * ((4 - len(bin_) % 4) % 4)
        out = struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(bin_)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bin_
        open(f, 'wb').write(out)
def deq(a, acc):
    if not acc.get('normalized'): return a.astype(np.float64)
    m = {np.int16: 32767., np.uint16: 65535., np.uint8: 255., np.int8: 127.}[a.dtype.type]; return np.maximum(a / m, -1.0)
def qmat(q):
    x, y, z, w = q; return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
class Model:
    def __init__(s, f):
        s.g = g = GLB(f); j = g.j; s.names = [n.get('name') for n in j['nodes']]
        skin = j['skins'][0]; s.joints = skin['joints']; s.jn = [s.names[i] for i in s.joints]
        s.ibm = g.view(skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1).astype(np.float64)
        s.parent = {}
        for i, n in enumerate(j['nodes']):
            for c in n.get('children', []): s.parent[c] = i
        s.prims = []
        for pi, p in enumerate(j['meshes'][0]['primitives']):
            A = p['attributes']; acc = lambda k: j['accessors'][A[k]]
            P = deq(g.view(A['POSITION']), acc('POSITION')); N = deq(g.view(A['NORMAL']), acc('NORMAL'))
            J = g.view(A['JOINTS_0']); W = g.view(A['WEIGHTS_0']); I = g.view(p['indices']).ravel().astype(np.int64).reshape(-1, 3)
            s.prims.append(dict(P=P, N=N, J=J, W=W, I=I, mat=j['materials'][p['material']]['name'] if 'material' in p else None, Wacc=A['WEIGHTS_0']))
    PARENT = dict(spineLower='pelvis', spineUpper='spineLower', torso='spineUpper', neck='torso', head='neck',
        leftScapula='torso', leftUpperArm='leftScapula', leftForearm='leftUpperArm', leftHand='leftForearm',
        rightScapula='torso', rightUpperArm='rightScapula', rightForearm='rightUpperArm', rightHand='rightForearm',
        leftThigh='pelvis', leftShin='leftThigh', leftPatella='leftShin', leftFoot='leftShin',
        rightThigh='pelvis', rightShin='rightThigh', rightPatella='rightShin', rightFoot='rightShin',
        leftThighHalf='pelvis', rightThighHalf='pelvis')
    def world(s, fr):
        """Pose Studio: flat glb bones re-parented with attach (rest rotations identity); local q from frame; pelvis pos = frame p.
        helper bones *ThighHalf get slerp(I, q_thigh, 0.5)."""
        j = s.g.j; M = {}; T = {n.get('name'): np.array(n.get('translation', [0, 0, 0]), float) for n in j['nodes']}
        def q_of(nm):
            if fr is None: return None
            if nm.endswith('ThighHalf'):
                q = np.array(fr['q'].get(nm[:-4], [0, 0, 0, 1]), float); q /= np.linalg.norm(q)
                if q[3] < 0: q = -q
                h = q + np.array([0, 0, 0, 1.0]); return h / np.linalg.norm(h)
            return fr['q'].get(nm)
        def get(nm):
            if nm in M: return M[nm]
            par = s.PARENT.get(nm); L = np.eye(4); q = q_of(nm)
            if q is not None: q = np.array(q, float); L[:3, :3] = qmat(q / np.linalg.norm(q))
            if par is None:
                L[:3, 3] = fr['p'] if (fr is not None and nm == 'pelvis') else T[nm]; M[nm] = L
            else:
                L[:3, 3] = T[nm] - T[par]; M[nm] = get(par) @ L
            return M[nm]
        return [get(n) for n in s.jn]
    def skin(s, fr, pi, W=None):
        Wm = s.world(fr); S = np.stack([Wm[k] @ s.ibm[k] for k in range(len(Wm))])
        p = s.prims[pi]; W = (p['W'] / 255.0) if W is None else W; J = p['J'].astype(int)
        Ph = np.c_[p['P'], np.ones(len(p['P']))]
        out = np.zeros((len(Ph), 3))
        if W.shape[1] > 4:
            for k in np.where(W.max(0) > 0)[0]: out += W[:, k:k+1] * (Ph @ S[k].T)[:, :3]
            return out
        for k in range(4):
            out += W[:, k:k+1] * np.einsum('nij,nj->ni', S[J[:, k]], Ph)[:, :3]
        return out
def load_frames(f):
    d = json.load(open(f)); fr = d['frames']
    for x in fr:
        if isinstance(x['q'], str): import ast; x['q'] = ast.literal_eval(x['q'])
    return d, fr
