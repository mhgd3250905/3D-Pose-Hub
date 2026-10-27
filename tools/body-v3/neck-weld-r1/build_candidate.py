"""Build experimental head-to-neck topology from a v3 reset-pose dump.

The resulting file is a candidate for visual and posed testing, not an
acceptance result. It cuts the old hidden upper-neck skin and bridges its
remaining boundary to the original mannequin head. Input geometry and model
files are never changed; an existing output is never overwritten.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'tools/human-v2plus/torso-base'))
from meshops import boundary_loops_F, orient_like, zipper
from scipy.spatial.distance import cdist


def unpack(mesh):
    points = np.asarray(mesh['P'], dtype=float).reshape(-1, 3)
    faces = np.asarray(mesh['index'], dtype=int).reshape(-1, 3)
    return points, faces


def welded(points, faces):
    _, first, inverse = np.unique(np.round(points / 1e-5).astype(np.int64),
                                  axis=0, return_index=True, return_inverse=True)
    faces = inverse[faces]
    faces = faces[(faces[:, 0] != faces[:, 1]) & (faces[:, 0] != faces[:, 2]) & (faces[:, 1] != faces[:, 2])]
    return points[first], faces, first


def monotone_bridge(a, b):
    """Connect two closed loops while penalising inward-facing triangles.

    Dynamic programming retains the input loop order and finds the least-cost
    path between them, unlike a local shortest-edge choice. Winding is checked
    from the initial reference bridge; the final bridge is outward-facing.
    """
    n, m = len(a), len(b)
    start_a, start_b = np.unravel_index(np.argmin(cdist(a, b)), (n, m))
    initial = zipper(a, b)
    vertices = np.vstack([a, b])
    xyz = vertices[initial]
    normals = np.cross(xyz[:, 1] - xyz[:, 0], xyz[:, 2] - xyz[:, 0])
    radial = xyz.mean(axis=1)
    radial[:, 1] = 0
    radial[:, 2] -= .006
    winding = 1 if np.median(np.einsum('ij,ij->i', normals, radial)) >= 0 else -1
    dp = np.full((n + 1, m + 1), np.inf)
    back = np.zeros((n + 1, m + 1), dtype=np.uint8)
    dp[0, 0] = 0

    def cost(p, q, r):
        center = (p + q + r) / 3
        center[1] = 0
        center[2] -= .006
        outward = winding * np.cross(q - p, r - p).dot(center)
        return (0 if outward > 0 else 10000) + np.linalg.norm(p - r) * 1000

    for i in range(n + 1):
        for j in range(m + 1):
            if not (i or j):
                continue
            ia, jb = (start_a + i) % n, (start_b + j) % m
            if i:
                previous_a = (start_a + i - 1) % n
                dp[i, j] = dp[i - 1, j] + cost(a[previous_a], a[ia], b[jb])
                back[i, j] = 1
            if j:
                previous_b = (start_b + j - 1) % m
                candidate = dp[i, j - 1] + cost(a[ia], b[jb], b[previous_b])
                if candidate < dp[i, j]:
                    dp[i, j], back[i, j] = candidate, 2
    i, j = n, m
    result = []
    while i or j:
        if back[i, j] == 1:
            result.append(((start_a + i - 1) % n, (start_a + i) % n, n + (start_b + j) % m))
            i -= 1
        else:
            result.append(((start_a + i) % n, n + (start_b + j) % m, n + (start_b + j - 1) % m))
            j -= 1
    triangles = np.asarray(result, dtype=int)
    return triangles if winding > 0 else triangles[:, [0, 2, 1]]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('rest', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--cut', type=float, default=1.470, help='neck cut height in rest world metres')
    parser.add_argument('--transition', type=float, default=.025, help='head skinning transition in metres')
    args = parser.parse_args()
    data = json.loads(args.rest.read_text(encoding='utf-8'))
    neck = data['meshes']['Mesh001']
    head = data['meshes']['Toon_Mannequin_Head_v5']
    np_, nf = unpack(neck)
    hp, hf = unpack(head)
    keep = (np_[nf, 1] < args.cut).all(axis=1)
    cropped = nf[keep]
    welded_neck, welded_faces, first = welded(np_, cropped)
    loops = boundary_loops_F(welded_faces)
    loops = [loop for loop in loops if len(loop) >= 3]
    if len(loops) != 2:
        raise ValueError(f'Expected exactly neck cut and neck bottom loops, got {[len(x) for x in loops]}')
    loop = max(loops, key=lambda l: welded_neck[l, 1].mean())
    nr = first[np.asarray(loop)]
    if not (100 <= len(nr) <= 600 and np.ptp(np_[nr, 1]) < .012):
        raise ValueError('Unexpected neck-cut boundary; inspect this pose before building')
    wh, wfaces, hfirst = welded(hp, hf)
    hloops = boundary_loops_F(wfaces)
    if len(hloops) != 1:
        raise ValueError(f'Expected one head boundary, got {[len(x) for x in hloops]}')
    hr = hfirst[np.asarray(hloops[0])]
    if not (100 <= len(hr) <= 600 and abs(float(hp[hr, 1].mean()) - args.cut) < .03):
        raise ValueError('Unexpected head opening; inspect this pose before building')
    if not orient_like(np_[nr], hp[hr]):
        hr = hr[::-1]
    triangles = monotone_bridge(np_[nr], hp[hr])
    vertices = np.vstack([np_[nr], hp[hr]])
    normals = np.cross(vertices[triangles[:, 1]] - vertices[triangles[:, 0]],
                       vertices[triangles[:, 2]] - vertices[triangles[:, 0]])
    centers = vertices[triangles].mean(axis=1)
    radial = centers.copy()
    radial[:, 1] = 0
    radial[:, 2] -= .006
    outward = np.einsum('ij,ij->i', normals, radial)
    inward = int((outward <= 0).sum())
    if inward:
        raise ValueError(f'Bridge has {inward} inward or degenerate faces; inspect topology before use')
    # zipper returns one triangle per ring segment; retain the rings' original
    # indices so the renderer can exactly copy position and skinning attributes.
    result = {'version': 1, 'status': 'experimental, not visually or dynamically accepted',
              'sourceDumpSha256': hashlib.sha256(args.rest.read_bytes()).hexdigest(),
              'cutY': args.cut, 'transitionM': args.transition,
              'neckVertexCount': len(np_), 'headVertexCount': len(hp),
              'neckOriginalIndexCount': len(nf) * 3, 'headOriginalIndexCount': len(hf) * 3,
              'neckKeepIndex': cropped.ravel().tolist(), 'neckRing': nr.tolist(),
              'headRing': hr.tolist(), 'bridgeIndex': triangles.ravel().tolist(),
              'bridgeRestInwardFaces': inward}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('x', encoding='utf-8') as stream:
        json.dump(result, stream, separators=(',', ':'))
        stream.write('\n')
    print(json.dumps({'neckRing': len(nr), 'headRing': len(hr), 'bridgeFaces': len(triangles),
                      'neckRemovedFaces': int((~keep).sum()), 'bridgeRestInwardFaces': inward,
                      'output': str(args.output)}))


if __name__ == '__main__':
    main()
