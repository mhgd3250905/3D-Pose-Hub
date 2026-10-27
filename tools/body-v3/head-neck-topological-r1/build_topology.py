"""Create a single-mesh head/neck weld with two material face groups.

The v3 reset dump and P2 paired-seam topology determine vertex correspondences.
No source file is changed and the output must be new.
"""
import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('rest', type=Path)
    ap.add_argument('paired_topology', type=Path)
    ap.add_argument('output', type=Path)
    args = ap.parse_args()
    rest = json.loads(args.rest.read_text(encoding='utf-8'))['meshes']
    paired = json.loads(args.paired_topology.read_text(encoding='utf-8'))
    neck, head = rest['Mesh001'], rest['Toon_Mannequin_Head_v5']
    positions = np.asarray(neck['P'], dtype=float).reshape(-1, 3)
    nf = np.asarray(paired['neckKeepIndex'], dtype=int).reshape(-1, 3)
    hf = np.asarray(head['index'], dtype=int).reshape(-1, 3)
    bridge = np.asarray(paired['bridgeIndex'], dtype=int).reshape(-1, 3)
    seam = np.asarray(paired['neckRing'], dtype=int)
    if len(positions) != paired['neckVertexCount'] or head['n'] != paired['headVertexCount']:
        raise ValueError('Input topology does not match the paired candidate')
    keys = np.round(positions / 1e-5).astype(np.int64)
    seam_keys = [tuple(keys[i]) for i in seam]
    if len(set(seam_keys)) != len(seam):
        raise ValueError('Neck seam keys are not unique')
    used = np.unique(nf)
    by_key = defaultdict(list)
    for i in used:
        by_key[tuple(keys[i])].append(int(i))
    if any(key not in by_key for key in seam_keys):
        raise ValueError('A seam vertex is not used by any retained neck face')
    neck_source = [by_key[key][0] for key in seam_keys]
    head_source = [paired['headVertexCount'] + i for i in range(len(seam))]
    seam_map = {key: i for i, key in enumerate(seam_keys)}
    neck_map = {}
    for vertex in used:
        key = tuple(keys[vertex])
        if key in seam_map:
            neck_map[int(vertex)] = seam_map[key]
        else:
            neck_map[int(vertex)] = len(neck_source)
            neck_source.append(int(vertex))
            head_source.append(-1)
    head_used = np.unique(hf)
    head_map = {}
    for vertex in head_used:
        head_map[int(vertex)] = len(head_source)
        head_source.append(int(vertex))
        neck_source.append(-1)
    neck_indices = [neck_map[int(i)] for i in nf.ravel()]
    head_indices = [head_map[int(i)] for i in hf.ravel()]
    head_ring = paired['headRing']
    head_indices += [int(i) if i < len(seam) else head_map[head_ring[int(i) - len(seam)]]
                     for i in bridge.ravel()]
    all_faces = np.asarray(neck_indices + head_indices, dtype=int).reshape(-1, 3)
    edges = Counter()
    directed = defaultdict(list)
    for face in all_faces:
        for a, b in ((face[0], face[1]), (face[1], face[2]), (face[2], face[0])):
            key = tuple(sorted((int(a), int(b))))
            edges[key] += 1
            directed[key].append((int(a), int(b)))
    seam_counts = [edges[tuple(sorted((i, (i + 1) % len(seam))))] for i in range(len(seam))]
    if any(count != 2 for count in seam_counts):
        raise ValueError('The stitched ring is not two-face manifold')
    for i in range(len(seam)):
        directions = directed[tuple(sorted((i, (i + 1) % len(seam))))]
        if directions[0] != directions[1][::-1]:
            raise ValueError('A stitched ring edge has inconsistent face winding')
    result = {'version': 1, 'status': 'candidate; runtime and GLB round-trip tests required',
              'restSha256': hashlib.sha256(args.rest.read_bytes()).hexdigest(),
              'pairedTopologySha256': hashlib.sha256(args.paired_topology.read_bytes()).hexdigest(),
              'neckSource': neck_source, 'headSource': head_source,
              'neckIndices': neck_indices, 'headIndices': head_indices,
              'seamCount': len(seam), 'seamEdgesWithTwoFaces': len(seam_counts),
              'seamEdgesWithOpposedWinding': len(seam_counts),
              'originalNeckVertexCount': paired['neckVertexCount'],
              'originalHeadVertexCount': paired['headVertexCount'] + len(seam)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('x', encoding='utf-8') as stream:
        json.dump(result, stream, separators=(',', ':'))
        stream.write('\n')
    print(json.dumps({'vertices': len(neck_source), 'neckFaces': len(neck_indices) // 3,
                      'headFaces': len(head_indices) // 3, 'weldEdges': len(seam_counts)}))


if __name__ == '__main__':
    main()
