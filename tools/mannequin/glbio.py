"""Minimal GLB read/write for the fitness reference body (positions, normals, indices)."""
import json, struct
import numpy as np

CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def read_glb(path):
    d = open(path, 'rb').read()
    jl = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + jl])
    bo = 20 + jl
    bl = struct.unpack('<I', d[bo:bo + 4])[0]
    binc = d[bo + 8:bo + 8 + bl]

    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        n = a['count'] * NC[a['type']]
        arr = np.frombuffer(binc, dtype=CT[a['componentType']], count=n, offset=off)
        return arr.reshape(a['count'], NC[a['type']]) if NC[a['type']] > 1 else arr.copy()

    meshes = []
    for node in j['nodes']:
        prim = j['meshes'][node['mesh']]['primitives'][0]
        meshes.append({'name': node['name'], 'extras': node.get('extras', {}),
                       'position': acc(prim['attributes']['POSITION']).astype(np.float64),
                       'normal': acc(prim['attributes']['NORMAL']).astype(np.float64),
                       'indices': acc(prim['indices']).astype(np.int64).reshape(-1, 3),
                       'material': j['materials'][prim['material']]})
    return j, meshes


def write_glb(path, meshes, scene_name='Mannequin', asset_extras=None):
    """meshes: [{name, extras, position (n,3), normal (n,3), indices (m,3), material}]"""
    blob = bytearray(); views = []; accs = []; jm = []; nodes = []; mats = []

    def add(arr, target, ctype, typ, minmax=False):
        nonlocal blob
        while len(blob) % 4: blob += b'\0'
        raw = arr.tobytes(); views.append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(raw), 'target': target})
        blob += raw
        a = {'bufferView': len(views) - 1, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
        if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
        accs.append(a); return len(accs) - 1

    for m in meshes:
        p = m['position'].astype(np.float32); n = m['normal'].astype(np.float32)
        idx = m['indices'].reshape(-1)
        big = p.shape[0] > 65535
        ia = add(idx.astype(np.uint32 if big else np.uint16), 34963, 5125 if big else 5123, 'SCALAR')
        pa = add(p, 34962, 5126, 'VEC3', True); na = add(n, 34962, 5126, 'VEC3')
        mats.append(m['material'])
        jm.append({'name': m['name'], 'primitives': [{'attributes': {'POSITION': pa, 'NORMAL': na}, 'indices': ia, 'material': len(mats) - 1}]})
        nodes.append({'name': m['name'], 'mesh': len(jm) - 1, 'extras': m.get('extras', {})})
    while len(blob) % 4: blob += b'\0'
    j = {'asset': {'version': '2.0', 'generator': 'tools/mannequin/build_mannequin.py', **({'extras': asset_extras} if asset_extras else {})},
         'scene': 0, 'scenes': [{'name': scene_name, 'nodes': list(range(len(nodes)))}], 'nodes': nodes, 'meshes': jm,
         'materials': mats, 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + bytes(blob)
    open(path, 'wb').write(out)
    return len(out)


def weld(position, indices, tol=1e-6):
    """Merge vertices at the same position (UV seams). Returns (pos, idx, remap)."""
    key = np.round(position / tol).astype(np.int64)
    _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.reshape(-1)
    return position[first], inv[indices], inv
