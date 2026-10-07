"""Derive the unclothed muscle-viewer body from the fitness reference.

Input : public/anatomy/fitness-reference.glb (body + shorts). Left unchanged:
        the movement inspector still uses the dressed reference.
Output: public/anatomy/mannequin-reference.glb (+ .json), muscle viewer only.

Only the pelvis changes; head, face, ears and every other sculpted detail keep
the original vertices and normals bit for bit.
 1. drop the shorts mesh and the unused UVs; weld UV-seam duplicates (their
    normals are identical, so this is lossless)
 2. groin / perineum: biharmonic fairing of a masked patch -> one smooth,
    continuous shop-mannequin surface without sex features; the patch and a
    3-ring rim are then relaxed (Taubin) and the apex between the thighs
    rounded, so no fold or slit remains (smoothing never leaves the pelvis)
 3. normals: recomputed only on the faired patch, feathered into the
    original normals over a few edge rings
Usage: python3 tools/mannequin/build_mannequin.py
"""
import sys, os, json, hashlib
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla
from glbio import read_glb, write_glb, weld
from meshops import vertex_normals, adjacency, umbrella, smooth, laplace, smoothstep

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'public/anatomy/fitness-reference.glb')
DST = os.path.join(ROOT, 'public/anatomy/mannequin-reference.glb')
SMOOTH_ITERS = 20                                   # Taubin passes on the patch + rim
APEX_C = np.array([0.0, 0.768, 0.0]); APEX_R = np.array([0.035, 0.03, 0.05])
APEX_W, APEX_ITERS = 0.8, 30                        # Laplacian rounding of the crotch apex


def biharmonic_fill(p, A, region):
    """Replace positions of `region` vertices by the biharmonic (thin-plate)
    interpolant of the surrounding fixed surface (uniform graph Laplacian)."""
    d = np.asarray(A.sum(1)).ravel()
    L = sp.diags(d) - A
    M = (L @ L).tocsr()
    R = np.where(region)[0]; F = np.where(~region)[0]
    lu = spla.splu(M[R][:, R].tocsc())
    rhs = -(M[R][:, F] @ p[F])
    q = p.copy(); q[R] = np.column_stack([lu.solve(rhs[:, k]) for k in range(3)])
    return q


def grow(A, mask, rings):
    m = mask.copy()
    for _ in range(rings): m = m | (A @ m.astype(float) > 0)
    return m


def groin_mask(p):
    x, y, z = p[:, 0], p[:, 1], p[:, 2]; ax = np.abs(x)
    m = (ax < 0.075) & (y > 0.68) & (y < 0.93) & (z > -0.075) & (z < 0.14)
    m &= ~((y > 0.86) & (z < 0.0))  # keep the buttock cleft above the perineum
    return m


def main():
    _, meshes = read_glb(SRC)
    body = next(m for m in meshes if m['extras'].get('partRole') == 'body-surface')
    p, f, inv = weld(body['position'], body['indices'])
    first = np.zeros(len(p), np.int64); first[inv[::-1]] = np.arange(len(inv))[::-1]
    n0 = body['normal'][first]                       # original (seam-consistent) normals
    A = adjacency(len(p), f)

    groin = groin_mask(p)
    p = biharmonic_fill(p, A, groin)
    # the uniform-weight fill leaves a small fold at the lowest point and a
    # kink along the patch rim: relax the patch and a 3-ring rim only
    W = umbrella(A); w = groin.astype(float); ring = groin.copy()
    for k in range(1, 4):
        nxt = grow(A, ring, 1); w[nxt & ~ring] = 1 - k / 4; ring = nxt
    p = smooth(p, W, w, iters=SMOOTH_ITERS)
    # round the apex of the arch between the thighs (no crease or slit there)
    blob = smoothstep(1.0, 0.4, np.linalg.norm((p - APEX_C) / APEX_R, axis=1)) * groin
    p = laplace(p, W, APEX_W * blob, iters=APEX_ITERS)

    # normals: new on the patch, feathered back to the original over 4 rings
    nn = vertex_normals(p, f)
    w = groin.astype(float); ring = groin.copy()
    for k in range(1, 5):
        nxt = grow(A, ring, 1); w[nxt & ~ring] = 1 - k / 5; ring = nxt
    nrm = n0 * (1 - w[:, None]) + nn * w[:, None]
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)

    mat = {'name': body['material']['name'], 'pbrMetallicRoughness': body['material']['pbrMetallicRoughness'], 'doubleSided': True}
    extras = {**body['extras'], 'derivation': 'Fitness reference body without the shorts; groin/perineum biharmonically faired into a smooth mannequin surface (tools/mannequin/build_mannequin.py).'}
    size = write_glb(DST, [{'name': 'Fitness_Body_Surface', 'extras': extras, 'position': p, 'normal': nrm, 'indices': f, 'material': mat}], scene_name='Unclothed fitness reference')
    sha = hashlib.sha256(open(DST, 'rb').read()).hexdigest()
    stats = {'vertices': int(len(p)), 'triangles': int(len(f)), 'glbBytes': size, 'fairedGroinVertices': int(groin.sum())}
    meta = {
        'source': 'Blender Studio Human Base Meshes (via public/anatomy/fitness-reference.glb)', 'sourceId': 'GEO-body_male_realistic',
        'license': 'CC0-1.0', 'units': 'meters', 'upAxis': '+Y', 'frontAxis': '+Z', 'usedBy': 'muscle viewer (src/muscle-viewer.js)',
        'look': 'the fitness reference body (same sculpt, head and face) without clothing; smooth one-piece shop-mannequin pelvis without sex features',
        'parts': [{'name': 'Fitness_Body_Surface', 'partRole': 'body-surface', 'vertices': stats['vertices'], 'triangles': stats['triangles']}],
        'bounds': {'min': p.min(0).tolist(), 'max': p.max(0).tolist()}, 'glbBytes': size, 'glbSha256': sha,
        'modifications': [
            'Shorts mesh and unused UVs removed; UV-seam duplicates welded (identical normals, lossless).',
            f"Groin/perineum: biharmonic fairing of {stats['fairedGroinVertices']} vertices, Taubin relaxation of the patch + 3-ring rim, Laplacian rounding of the crotch apex -> smooth continuous mannequin surface.",
            'Normals recomputed on the faired patch only and feathered into the original normals over 4 edge rings; every other vertex and normal is unchanged.',
        ],
        'limits': ['Static reference pose.', 'Muscle panels are drawn per pixel by src/muscle-map.js: location only, never EMG or effort.'],
        'tool': 'tools/mannequin/build_mannequin.py',
    }
    open(DST.replace('.glb', '.json'), 'w').write(json.dumps(meta, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps(stats))
    return stats


if __name__ == '__main__':
    main()
