# Step 4: write training-human-v3.glb (+ JSON sidecar). Bones carry identity rest rotations (world-aligned frames),
# so the runtime mapping works directly with world rotations.
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, json, struct, trimesh, base64, hashlib, sys
import pygltflib as G
sys.path.insert(0, _os.path.dirname(__file__))
from muscles import GROUPS, DEEP
OUTG = sys.argv[1]; OUTJ = sys.argv[2]
SCALE = float(sys.argv[3]) if len(sys.argv) > 3 else 0.97   # baked uniform scale (1 = MakeHuman default male ~1.74 m)
D = np.load(WORK + '/out/rest.npz'); L = np.load(WORK + '/out/labels.npz')
X, T, W, J4, W4 = D['X'] * SCALE, D['T'], D['W'], D['J4'], D['W4']; names = [str(n) for n in D['names']]
OUTN = lambda n: n.replace('.', '_')  # three.js strips '.' from node names; use _L/_R
parent = D['parent']; H = D['H'] * SCALE; TL = D['TL'] * SCALE; parent = D['parent']; H = D['H'] * SCALE; TL = D['TL'] * SCALE
isHead = D['isHead']; NB = int((~isHead).sum()); NV = len(X)
bi = {n: i for i, n in enumerate(names)}
SUP = np.r_[L['SUP'], np.zeros(NV - NB, int)].astype(np.float32); DP = np.r_[L['DP'], np.zeros(NV - NB, int)].astype(np.float32)
mesh = trimesh.Trimesh(X, T, process=False); NRM = mesh.vertex_normals.astype(np.float32)
# ---------- garment fields (metres, > 0 inside) ----------
sumw = lambda pre: sum(W[:, i] for i, n in enumerate(names) if any(n.startswith(p) for p in pre))
wa = sumw(['upperarm', 'lowerarm', 'wrist', 'metacarpal', 'finger']); wl = sumw(['upperleg', 'lowerleg', 'foot', 'toe'])
sm = lambda e0, e1, v: np.clip((v - e0) / (e1 - e0), 0, 1) ** 2 * (3 - 2 * np.clip((v - e0) / (e1 - e0), 0, 1))
hipY = H[bi['upperleg01.L']][1] / SCALE; neckY = H[bi['neck01']][1] / SCALE
def seg_t(side, a, b):
    A = H[bi[a + side]] / SCALE; B = H[bi[b + side]] / SCALE; d = B - A; return ((X / SCALE - A) @ d) / (d @ d), np.linalg.norm(d)
x, y, z = (X / SCALE).T
tL, lua = seg_t('.L', 'upperarm01', 'lowerarm01'); tR, _ = seg_t('.R', 'upperarm01', 'lowerarm01'); tA = np.where(x > 0, tL, tR)
hL, lth = seg_t('.L', 'upperleg01', 'lowerleg01'); hR, _ = seg_t('.R', 'upperleg01', 'lowerleg01'); tH = np.where(x > 0, hL, hR)
f_hem = y - (hipY + 0.045)
zf = np.clip((z - 0.0) / 0.09, 0, 1)
f_neck = (neckY - 0.01 - 0.045 * zf ** 1.5) - y
f_sleeve = (0.56 - tA) * lua
waw = sm(0.15, 0.85, wa)
f_tee = np.minimum(f_neck, f_hem * (1 - waw) + f_sleeve * waw)
f_tee = np.where(wl > 0.6, -0.05, f_tee)
f_waist = (hipY + 0.10) - y
f_leg = y - 0.128   # legacy look: dark training bottoms down to the shoe collar
wlw = sm(0.1, 0.8, wl)
f_sh = np.minimum(f_waist, 0.3 * (1 - wlw) + f_leg * wlw)
f_sh = np.where(waw > 0.5, -0.05, f_sh)
f_shoe = 0.118 - y
GAR = np.stack([f_tee, f_sh, f_shoe, np.zeros(NV)], 1).astype(np.float32)
GAR[isHead] = [-0.05, -0.05, -0.05, 1]   # w = 1: mannequin head shell
# DQS region weight: hinge joints only (elbow, knee, wrist) - dual quaternion there, linear blend elsewhere (shoulder/hip DQS bulges)
PAIRS = [('upperarm02', 'lowerarm01'), ('upperleg02', 'lowerleg01'), ('lowerarm02', 'wrist'), ('lowerleg02', 'foot')]
dq = np.zeros(NV)
for a, b in PAIRS:
    for sd in ('.L', '.R'):
        wa_, wb_ = W[:, bi[a + sd]], W[:, bi[b + sd]]; dq = np.maximum(dq, np.clip(np.minimum(wa_, wb_) * 4, 0, 1))
Am = mesh.edges_unique
import scipy.sparse as sp
Ad = sp.coo_matrix((np.ones(len(Am) * 2), (np.r_[Am[:, 0], Am[:, 1]], np.r_[Am[:, 1], Am[:, 0]])), shape=(NV, NV)).tocsr(); dg = np.asarray(Ad.sum(1)).ravel() + 1
for _ in range(4): dq = np.maximum(dq, (Ad @ dq + dq) / dg)
DQW = np.clip(dq, 0, 1).astype(np.float32)
# ---------- buffers ----------
blobs = []; views = []; accs = []
def add(arr, target=None, comp=None, typ=None, mm=False, norm=False):
    b = arr.tobytes(); off = sum(len(x) for x in blobs); pad = (-off) % 4
    if pad: blobs.append(b'\0' * pad); off += pad
    blobs.append(b)
    views.append(G.BufferView(buffer=0, byteOffset=off, byteLength=len(b), target=target))
    a = G.Accessor(bufferView=len(views) - 1, componentType=comp, count=len(arr), type=typ, normalized=norm or None)
    if mm: a.min = arr.min(0).tolist(); a.max = arr.max(0).tolist()
    accs.append(a); return len(accs) - 1
iP = add(X.astype(np.float32), G.ARRAY_BUFFER, G.FLOAT, G.VEC3, mm=True)
iN = add(NRM, G.ARRAY_BUFFER, G.FLOAT, G.VEC3)
iJ = add(J4.astype(np.uint8), G.ARRAY_BUFFER, G.UNSIGNED_BYTE, G.VEC4)
iW = add(W4.astype(np.float32), G.ARRAY_BUFFER, G.FLOAT, G.VEC4)
iM = add(SUP, G.ARRAY_BUFFER, G.FLOAT, G.SCALAR)
iD = add(DP, G.ARRAY_BUFFER, G.FLOAT, G.SCALAR)
iG = add(GAR, G.ARRAY_BUFFER, G.FLOAT, G.VEC4)
iQ = add(DQW, G.ARRAY_BUFFER, G.FLOAT, G.SCALAR)
iI = add(T.astype(np.uint32).ravel(), G.ELEMENT_ARRAY_BUFFER, G.UNSIGNED_INT, G.SCALAR)
accs[iI].count = T.size
ibm = np.zeros((len(names), 4, 4), np.float32)
for i in range(len(names)):
    m = np.eye(4); m[:3, 3] = -H[i]; ibm[i] = m.T   # column-major
iB = add(ibm.reshape(len(names), 16), None, G.FLOAT, G.MAT4); accs[iB].count = len(names)
nodes = []
for i, n in enumerate(names):
    p = parent[i]; t = H[i] - (H[p] if p >= 0 else 0)
    nodes.append(G.Node(name=OUTN(n), translation=[float(v) for v in t], children=[]))
for i, p in enumerate(parent):
    if p >= 0: nodes[p].children.append(i)
nr = bi['root']
meshNode = len(nodes); nodes.append(G.Node(name='V3_Body', mesh=0, skin=0))
arm = len(nodes); nodes.append(G.Node(name='TrainingHumanV3', children=[nr, meshNode]))
prim = G.Primitive(attributes=G.Attributes(POSITION=iP, NORMAL=iN, JOINTS_0=iJ, WEIGHTS_0=iW), indices=iI, material=0)
prim.attributes._MUSCLE_ID = iM; prim.attributes._MUSCLE_DEEP = iD; prim.attributes._GARMENT = iG; prim.attributes._DQS_WEIGHT = iQ
gl = G.GLTF2(asset=G.Asset(version='2.0', generator='Pose-Hub tools/human-v3 (numpy, no Blender)', copyright='Body: MakeHuman/MPFB2 assets CC0 1.0. Muscle IDs derived from BodyParts3D, (c) The Database Center for Life Science, CC BY 4.0.'),
    scene=0, scenes=[G.Scene(nodes=[arm])], nodes=nodes,
    meshes=[G.Mesh(name='V3_Body', primitives=[prim])],
    materials=[G.Material(name='v3_mannequin_grey', pbrMetallicRoughness=G.PbrMetallicRoughness(baseColorFactor=[0.62, 0.63, 0.66, 1], metallicFactor=0, roughnessFactor=0.8))],
    skins=[G.Skin(name='v3_rig', joints=list(range(len(names))), inverseBindMatrices=iB, skeleton=nr)],
    accessors=accs, bufferViews=views, buffers=[G.Buffer(byteLength=sum(len(b) for b in blobs))])
gl.set_binary_blob(b''.join(blobs)); gl.save_binary(OUTG)
# ---------- hand frames + finger curl axes (rest, world) ----------
hands = {}
for s in ('L', 'R'):
    wr = H[bi['wrist.' + s]]; mid = H[bi['finger3-1.' + s]]; f = mid - wr; f /= np.linalg.norm(f)
    curl = np.zeros(3)
    for k in (2, 3, 4, 5):
        b = H[bi[f'finger{k}-1.{s}']]; tip = TL[bi[f'finger{k}-3.{s}']]; v = tip - b; curl += v - f * (v @ f)
    across = H[bi['finger2-1.' + s]] - H[bi['finger5-1.' + s]]
    n = np.cross(f, across) if s == 'L' else np.cross(across, f)
    n -= f * (n @ f); n /= np.linalg.norm(n)
    if n @ curl < 0: n = -n         # palm normal = side the fingers curl to
    fingers = {}
    for k in range(1, 6):
        segs = [f'finger{k}-{j}.{s}' for j in (1, 2, 3)]
        chain = []
        prevd = None
        for sg in segs:
            d = TL[bi[sg]] - H[bi[sg]]; d /= np.linalg.norm(d)
            ax = np.cross(d, n); ax /= np.linalg.norm(ax)
            flex0 = 0.0 if prevd is None else float(np.degrees(np.arctan2(np.cross(prevd, d) @ ax, prevd @ d)))
            chain.append({'bone': OUTN(sg), 'axis': ax.round(5).tolist(), 'dir': d.round(5).tolist(), 'restFlexDeg': round(flex0, 2)}); prevd = d
        fingers[k] = chain
    hands[s] = {'fingerDir': f.round(5).tolist(), 'palmNormal': n.round(5).tolist(), 'fingers': fingers}
# hand pose library: absolute flex targets per joint (deg) for fingers 2-5 [MCP, PIP, DIP]; thumb [CMC, MCP, IP]; spread (deg, about palm normal)
POSES = {
  'open':       {'fingers': [0, 0, 0],   'thumb': [0, 0, 0],    'spread': 6, 'note': 'flat, fingers together-ish'},
  'relaxed':    {'fingers': [18, 28, 14], 'thumb': [8, 10, 8],  'spread': 2, 'note': 'neutral rest hand'},
  'palm-floor': {'fingers': [-6, 4, 2],  'thumb': [0, 0, 0],    'spread': 10, 'note': 'palm flat on the floor, fingers spread'},
  'grip-bar':   {'fingers': [70, 95, 55], 'thumb': [35, 40, 45], 'spread': 0, 'note': 'closed power grip round a ~3 cm bar'},
  'band-grip':  {'fingers': [55, 85, 45], 'thumb': [25, 30, 35], 'spread': 0, 'note': 'fist round a band handle / looped band'},
}
groups = [{'id': g[0], 'key': g[1], 'zh': g[2], 'specGroups': g[4], 'deep': g[0] in DEEP, 'bp3dPatterns': g[3],
           'vertices': int((SUP == g[0]).sum()), 'deepVertices': int((DP == g[0]).sum()),
           'source': 'geometric fill (not in BodyParts3D 4.0)' if not g[3] else 'BodyParts3D'} for g in GROUPS]
spec = {}
for g in groups:
    for sgp in g['specGroups']: spec.setdefault(sgp, []).append(g['id'])
side = {
 'version': '0.1.0-proto', 'id': 'training-human-v3', 'glb': 'runtime/public/coach/training-human-v3.glb',
 'glbSha256': hashlib.sha256(open(OUTG, 'rb').read()).hexdigest(),
 'units': 'metres, +Y up, +Z front, body left +X, soles on y=0', 'bakedScale': SCALE, 'statureM': round(float(X[:, 1].max()), 3),
 'counts': {'vertices': int(NV), 'triangles': int(len(T)), 'bones': len(names), 'bodyVertices': NB, 'headShellVertices': int(NV - NB)},
 'attributes': {'_MUSCLE_ID': 'superficial muscle id (float, 0 = none); three.js name _muscle_id',
                '_MUSCLE_DEEP': 'deep muscle id under the surface (rotator cuff, iliopsoas, deep hip rotators); 0 = none',
                '_DQS_WEIGHT': 'per-vertex dual-quaternion blend weight (1 at elbows/knees/wrists/ankles, 0 elsewhere)', '_GARMENT': 'signed fields in metres: x tee, y shorts, z shoe (>0 inside); w = 1 on the mannequin head shell'},
 'groups': groups, 'specGroupIds': spec,
 'bones': [{'name': OUTN(n), 'parent': OUTN(names[parent[i]]) if parent[i] >= 0 else None, 'head': H[i].round(5).tolist(), 'tail': TL[i].round(5).tolist()} for i, n in enumerate(names)],
 'hands': hands, 'handPoses': POSES,
 'muscleIdPerVertexB64': base64.b64encode(SUP.astype(np.uint8).tobytes()).decode(),
}
json.dump(side, open(OUTJ, 'w'), ensure_ascii=False, indent=1)
print('glb', OUTG, round(len(open(OUTG, 'rb').read()) / 1e6, 2), 'MB', 'palm L', hands['L']['palmNormal'], 'rest flex f3', [c['restFlexDeg'] for c in hands['L']['fingers'][3]])
