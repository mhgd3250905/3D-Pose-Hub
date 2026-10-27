"""Extract P2 head/neck primitives and their joint hierarchy into a new GLB.

The extractor copies referenced buffer views byte-for-byte; it does not alter
geometry, inverse bind matrices or joint transforms. It intentionally supports
only the simple, texture-free probe shape and rejects unsupported inputs.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import struct


def read_glb(path):
    raw = path.read_bytes()
    magic, version, length = struct.unpack_from('<III', raw)
    if magic != 0x46546C67 or version != 2 or length != len(raw):
        raise ValueError('Invalid GLB header')
    chunks, pos = {}, 12
    while pos < len(raw):
        size, kind = struct.unpack_from('<II', raw, pos)
        chunks[kind] = raw[pos + 8:pos + 8 + size]
        pos += 8 + size
    if 0x4E4F534A not in chunks or 0x004E4942 not in chunks:
        raise ValueError('Expected JSON and BIN chunks')
    return json.loads(chunks[0x4E4F534A]), chunks[0x004E4942]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('source', type=Path)
    ap.add_argument('output', type=Path)
    ap.add_argument('report', type=Path)
    args = ap.parse_args()
    if not args.source.is_file() or args.output.exists() or args.report.exists():
        raise SystemExit('Input missing or output already exists')
    doc, binary = read_glb(args.source)
    if doc.get('animations') or len(doc.get('buffers', [])) != 1 or doc['buffers'][0].get('uri'):
        raise ValueError('Unsupported animation or external/multiple buffer')
    nodes = doc['nodes']
    found = [i for i, n in enumerate(nodes) if n.get('name') == 'V3_Head_Neck_Topological_R1' and 'mesh' in n and 'skin' in n]
    if len(found) != 1:
        raise ValueError('Expected exactly one P2 mesh node')
    target = found[0]
    mesh = copy.deepcopy(doc['meshes'][nodes[target]['mesh']])
    skin = copy.deepcopy(doc['skins'][nodes[target]['skin']])
    if len(mesh['primitives']) != 2 or len(skin['joints']) != 52:
        raise ValueError('Expected two materials and 52-joint skin')
    if any(p.get('targets') or p.get('extensions') for p in mesh['primitives']):
        raise ValueError('Unsupported primitive targets or extensions')
    material_ids = sorted({p['material'] for p in mesh['primitives']})
    materials = [copy.deepcopy(doc['materials'][i]) for i in material_ids]
    if any('texture' in json.dumps(m).lower() for m in materials):
        raise ValueError('Textured glTF materials need explicit dependency handling')
    material_map = {old: new for new, old in enumerate(material_ids)}
    for primitive in mesh['primitives']:
        primitive['material'] = material_map[primitive['material']]
    parents = {}
    for parent, node in enumerate(nodes):
        for child in node.get('children', []):
            if child in parents:
                raise ValueError('Node has multiple parents')
            parents[child] = parent
    selected = set(skin['joints']) | {target}
    for node in list(selected):
        while node in parents:
            node = parents[node]
            selected.add(node)
    order = sorted(selected)
    mapping = {old: new for new, old in enumerate(order)}
    result_nodes = []
    for old in order:
        item = copy.deepcopy(nodes[old])
        item.pop('camera', None)
        if old != target:
            item.pop('mesh', None); item.pop('skin', None); item.pop('weights', None)
        else:
            item['mesh'], item['skin'] = 0, 0
        children = [mapping[c] for c in item.get('children', []) if c in selected]
        if children: item['children'] = children
        else: item.pop('children', None)
        result_nodes.append(item)
    skin['joints'] = [mapping[i] for i in skin['joints']]
    if 'skeleton' in skin: skin['skeleton'] = mapping[skin['skeleton']]
    accessor_ids = set()
    for primitive in mesh['primitives']:
        accessor_ids.update(primitive['attributes'].values())
        accessor_ids.add(primitive['indices'])
    if 'inverseBindMatrices' in skin: accessor_ids.add(skin['inverseBindMatrices'])
    accessor_ids = sorted(accessor_ids)
    accessor_map = {old: new for new, old in enumerate(accessor_ids)}
    accessors = [copy.deepcopy(doc['accessors'][i]) for i in accessor_ids]
    if any('sparse' in a or 'bufferView' not in a for a in accessors):
        raise ValueError('Unsupported sparse or implicit accessor')
    view_ids = sorted({a['bufferView'] for a in accessors})
    view_map = {old: new for new, old in enumerate(view_ids)}
    views, output_bin = [], bytearray()
    for old in view_ids:
        view = copy.deepcopy(doc['bufferViews'][old])
        if view['buffer'] != 0 or view.get('extensions'):
            raise ValueError('Unsupported buffer view extension')
        while len(output_bin) % 4: output_bin.append(0)
        start, size = view.get('byteOffset', 0), view['byteLength']
        view['byteOffset'] = len(output_bin); view['buffer'] = 0
        output_bin.extend(binary[start:start + size]); views.append(view)
    for accessor in accessors: accessor['bufferView'] = view_map[accessor['bufferView']]
    for primitive in mesh['primitives']:
        primitive['attributes'] = {k: accessor_map[v] for k, v in primitive['attributes'].items()}
        primitive['indices'] = accessor_map[primitive['indices']]
    if 'inverseBindMatrices' in skin: skin['inverseBindMatrices'] = accessor_map[skin['inverseBindMatrices']]
    root_nodes = [mapping[i] for i in order if i not in parents or parents[i] not in selected]
    output = {'asset': copy.deepcopy(doc['asset']), 'scene': 0, 'scenes': [{'nodes': root_nodes}],
              'nodes': result_nodes, 'meshes': [mesh], 'skins': [skin], 'materials': materials,
              'accessors': accessors, 'bufferViews': views, 'buffers': [{'byteLength': len(output_bin)}]}
    for field in ('extensionsUsed', 'extensionsRequired'):
        if field in doc: output[field] = copy.deepcopy(doc[field])
    json_bytes = json.dumps(output, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    json_bytes += b' ' * (-len(json_bytes) % 4)
    output_bin.extend(b'\0' * (-len(output_bin) % 4))
    total = 12 + 8 + len(json_bytes) + 8 + len(output_bin)
    result = struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(json_bytes), 0x4E4F534A) + json_bytes
    result += struct.pack('<II', len(output_bin), 0x004E4942) + output_bin
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream: stream.write(result)
    report = {'sourceSha256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
              'fragmentSha256': hashlib.sha256(result).hexdigest(), 'bytes': len(result),
              'nodes': len(result_nodes), 'bones': len(skin['joints']), 'primitives': len(mesh['primitives']),
              'materials': len(materials), 'bufferViews': len(views),
              'limitations': 'Material primitive boundaries remain split; restore seam on load. Runtime toon requires the separate asset.'}
    with args.report.open('x', encoding='utf-8') as stream: json.dump(report, stream, indent=2); stream.write('\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
