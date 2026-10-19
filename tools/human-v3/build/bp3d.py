# BodyParts3D 4.0 (CC BY 4.0, (c) The Database Center for Life Science) as already converted in this repo:
# runtime/public/anatomy/{manifest.json,muscles.bin.gz,bones.bin.gz}: metres, +Y up, +Z anterior, anatomical left +X.
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, json, gzip
AN = REPO + '/runtime/public/anatomy'
_man = None; _chunks = {}
def man():
    global _man
    if _man is None: _man = json.load(open(AN + '/manifest.json'))
    return _man
def chunk(i):
    if i not in _chunks: _chunks[i] = gzip.open(AN + '/' + man()['chunks'][i]['gzip'].split('/')[-1]).read()
    return _chunks[i]
def part_mesh(p):
    b = chunk(p['chunk'])
    P = np.frombuffer(b, np.float32, p['vertexCount'] * 3, p['positions']).reshape(-1, 3).astype(float)
    I = np.frombuffer(b, np.uint32, p['indexCount'], p['indices']).reshape(-1, 3).astype(np.int64)
    return P, I
def parts(pred):
    return [p for p in man()['parts'] if pred(p)]
