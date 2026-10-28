"""Offline, source-pinned WebXR wrist clipping and neutral loft recipes.

No production source is modified. All output files are new, exclusive files.
Coordinates are metres, canonical +Y longitudinal and +Z palmar.
"""
from pathlib import Path
import argparse
import hashlib
import json
import sys
import numpy as np
from scipy.spatial import cKDTree

REPO = Path(__file__).resolve().parents[3]
SOURCES = REPO / 'drill-anim/models/webxr-dumbbell-wrist-r1/sources'
sys.path.insert(0, str(REPO / 'tools/human-v2plus/torso-base'))
from meshops import boundary_loops_F


def pin(path):
    raw = path.read_bytes()
    return {'file': str(path.resolve()), 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}


def transform(points, matrix):
    return (np.c_[points, np.ones(len(points))] @ matrix.T)[:, :3]


def weld(points, tolerance=1e-7):
    parent = np.arange(len(points))
    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for a, b in cKDTree(points).query_pairs(tolerance):
        ra, rb = root(a), root(b)
        parent[max(ra, rb)] = min(ra, rb)
    roots = np.array([root(i) for i in range(len(points))])
    _, first, inverse = np.unique(roots, return_index=True, return_inverse=True)
    return first, inverse


def vertex_normals(points, faces):
    normals = np.zeros_like(points)
    area = np.cross(points[faces[:, 1]] - points[faces[:, 0]], points[faces[:, 2]] - points[faces[:, 0]])
    for j in range(3):
        np.add.at(normals, faces[:, j], area)
    return normals / np.maximum(np.linalg.norm(normals, axis=1)[:, None], 1e-30)


def evaluate_recipe(records, source):
    return np.array([sum((source[i] * w for i, w in record['source']), np.zeros(3)) for record in records])


def clipped_mesh(points, faces, clip_specs):
    """Exact triangle/plane clipping, shared source-edge cuts, compact recipes.

    A spec owns only its explicit source ROI faces, leaving other limbs intact.
    Records preserve original vertex identity; UV duplicates are not collapsed.
    """
    records = [{'source': [[i, 1.0]]} for i in range(len(points))]
    result = []
    cache = {}
    region_faces = {side: 0 for side in clip_specs}
    cut_faces = {side: 0 for side in clip_specs}
    for face in faces:
        owners = [s for s, spec in clip_specs.items() if spec['roi'][face].any()]
        if len(owners) > 1:
            raise ValueError('Clipping ROIs overlap on one source triangle')
        if not owners:
            result.append(face.tolist())
            continue
        side = owners[0]
        spec = clip_specs[side]
        region_faces[side] += 1
        signed = (spec['canonical'][face, 1] - spec['cut']) * spec['keepSign']
        if np.all(signed >= -1e-12):
            result.append(face.tolist())
            continue
        cut_faces[side] += 1
        polygon = []
        for k in range(3):
            a, b = int(face[k]), int(face[(k + 1) % 3])
            ya, yb = spec['canonical'][a, 1], spec['canonical'][b, 1]
            ina = (ya - spec['cut']) * spec['keepSign'] >= -1e-12
            inb = (yb - spec['cut']) * spec['keepSign'] >= -1e-12
            if ina:
                polygon.append(a)
            if ina != inb:
                t = (spec['cut'] - ya) / (yb - ya)
                if t < 1e-11:
                    polygon.append(a)
                    continue
                if t > 1 - 1e-11:
                    polygon.append(b)
                    continue
                edge = (side, min(a, b), max(a, b))
                if edge not in cache:
                    cache[edge] = len(records)
                    records.append({'source': [[a, float(1 - t)], [b, float(t)]], 'cutSide': side})
                polygon.append(cache[edge])
        polygon = [x for i, x in enumerate(polygon) if i == 0 or polygon[i - 1] != x]
        if len(polygon) > 1 and polygon[-1] == polygon[0]:
            polygon.pop()
        for j in range(1, len(polygon) - 1):
            tri = [polygon[0], polygon[j], polygon[j + 1]]
            if len(set(tri)) == 3:
                result.append(tri)
    result = np.asarray(result, int).reshape(-1, 3)
    used = np.unique(result)
    remap = np.full(len(records), -1, int)
    remap[used] = np.arange(len(used))
    records = [records[i] for i in used]
    result = remap[result]
    positions = evaluate_recipe(records, points)
    boundary = {}
    first, welded = weld(positions)
    wf = welded[result]
    if np.any(np.diff(np.sort(wf, axis=1), axis=1) == 0):
        raise ValueError('Clip introduced a welded degenerate triangle')
    loops = boundary_loops_F(wf)
    for side, spec in clip_specs.items():
        canonical = evaluate_recipe(records, spec['canonical'])
        selected = [loop for loop in loops if np.max(np.abs(canonical[first[loop], 1] - spec['cut'])) < 1e-7]
        if len(selected) != 1:
            raise ValueError(f'{side}: expected one cut loop, got {[len(x) for x in selected]}')
        ids = first[np.array(selected[0], int)]
        xyz = canonical[ids]
        # Positive atan2(z,x) winding around +Y, stable phase at +X.
        area = np.sum(xyz[:, 0] * np.roll(xyz[:, 2], -1) - xyz[:, 2] * np.roll(xyz[:, 0], -1))
        if area < 0:
            ids = ids[::-1]
            xyz = xyz[::-1]
        center = xyz[:, [0, 2]].mean(0)
        phase = np.abs(np.arctan2(xyz[:, 2] - center[1], xyz[:, 0] - center[0]))
        start = int(np.argmin(phase))
        ids = np.roll(ids, -start)
        xyz = canonical[ids]
        perimeter_edges = np.linalg.norm(np.roll(xyz, -1, axis=0) - xyz, axis=1)
        u = np.r_[0., np.cumsum(perimeter_edges[:-1])] / perimeter_edges.sum()
        boundary[side] = {'vertexIds': ids.tolist(),
                          'coincidentVertexIds': [np.flatnonzero(welded == welded[i]).tolist() for i in ids],
                          'canonicalRest': xyz.tolist(), 'u': u.tolist(),
                          'cutY': spec['cut'], 'perimeterM': float(perimeter_edges.sum()),
                          'phaseRule': 'nearest +X ray from actual cross-section centroid; positive atan2(z,x) winding',
                          'centerXZ': center.tolist()}
    return {'sourceVertices': len(points), 'sourceIndexCount': int(faces.size),
            'sourceIndexUint32LESha256': hashlib.sha256(faces.astype('<u4').tobytes()).hexdigest(),
            'vertices': records, 'retainedIndex': result.ravel().tolist(), 'boundary': boundary,
            'indexMeaning': 'retainedIndex and boundary.vertexIds address the NEW compact vertex buffer',
            'clipping': {'ownedSourceFaces': region_faces, 'changedOrRemovedSourceFaces': cut_faces,
                         'newSourceEdgeCutVertices': len(cache)}}, positions


def at_u(boundary, u):
    parameters = np.asarray(boundary['u'])
    ids = boundary['vertexIds']
    u = float(u % 1)
    k = int(np.searchsorted(parameters, u, side='right') - 1)
    end = parameters[k + 1] if k + 1 < len(parameters) else 1.
    t = (u - parameters[k]) / (end - parameters[k])
    if t < 1e-11:
        return [[int(ids[k]), 1.0]]
    return [[int(ids[k]), float(1 - t)], [int(ids[(k + 1) % len(ids)]), float(t)]]


def sample(values, weights):
    return sum((values[i] * w for i, w in weights), np.zeros(3))


def bridge_mesh(body, hand, body_positions, hand_positions, body_normals, hand_normals, rows_y):
    rows = []
    vertices = []
    n = 64
    low, high = rows_y[0], rows_y[-1]
    for row, y in enumerate(rows_y):
        endpoint = body if row == 0 else hand if row == len(rows_y) - 1 else None
        parameters = endpoint['u'] if endpoint else (np.arange(n) / n).tolist()
        ids = []
        for k, u in enumerate(parameters):
            bm = [[body['vertexIds'][k], 1.0]] if row == 0 else at_u(body, u)
            hm = [[hand['vertexIds'][k], 1.0]] if row == len(rows_y) - 1 else at_u(hand, u)
            a, b = sample(body_positions, bm), sample(hand_positions, hm)
            t = (y - low) / (high - low)
            # Cubic transverse Hermite loft, preserving actual asymmetric rings.
            # End slopes derive from source surface normals, bounded locally.
            slopes = []
            for normals, weights in [(body_normals, bm), (hand_normals, hm)]:
                normal = sample(normals, weights)
                radial = normal[[0, 2]]
                slope = -normal[1] * radial / max(float(radial @ radial), 1e-12)
                length = np.linalg.norm(slope)
                slopes.append(slope * min(1., .8 / max(length, 1e-30)))
            h00, h10, h01, h11 = 2*t**3-3*t*t+1, t**3-2*t*t+t, -2*t**3+3*t*t, t**3-t*t
            transverse = h00*a[[0, 2]] + h10*(high-low)*slopes[0] + h01*b[[0, 2]] + h11*(high-low)*slopes[1]
            p = np.array([transverse[0], y, transverse[1]])
            if row == 0:
                p = a
            elif row == len(rows_y) - 1:
                p = b
            ids.append(len(vertices))
            vertices.append({'canonicalRest': p.tolist(), 'row': row, 't': float(t),
                             'arcT': float(np.clip((y + .020) / .040, 0, 1)), 'y': y, 'u': float(u),
                             'limbMap': bm, 'handMap': hm})
        rows.append({'y': y, 't': float((y-low)/(high-low)),
                     'arcT': float(np.clip((y+.020)/.040, 0, 1)), 'vertexIds': ids,
                     'u': list(parameters), 'role': 'limbEndpoint' if row == 0 else 'handEndpoint' if row == len(rows_y)-1 else 'loft'})
    faces = []
    # Monotone zipper by shared circumferential parameter, including unequal endpoints.
    for a, b in zip(rows, rows[1:]):
        ai, bi = a['vertexIds'], b['vertexIds']
        au, bu = np.r_[a['u'], 1.], np.r_[b['u'], 1.]
        i = j = 0
        while i < len(ai) or j < len(bi):
            if i < len(ai) and (j == len(bi) or au[i+1] <= bu[j+1]):
                faces.append([ai[i % len(ai)], bi[j % len(bi)], ai[(i+1) % len(ai)]])
                i += 1
            else:
                faces.append([ai[i % len(ai)], bi[j % len(bi)], bi[(j+1) % len(bi)]])
                j += 1
    return {'vertices': vertices, 'indices': np.array(faces, int).ravel().tolist(), 'rows': rows,
            'endpointRows': {'limb': 0, 'hand': len(rows)-1}, 'internalRingSamples': n,
            'deformationRangeY': [-.020, .020], 'straightTransitionRangeY': [-.040, -.020],
            'crossSectionInterpolation': 'cubic Hermite actual endpoint XZ positions; source-normal-derived transverse slopes clamped to0.8m/m',
            'mapMeaning': 'limbMap addresses meshes.limbs NEW vertices; handMap addresses meshes.hands[side] NEW vertices'}


def validate_assembly(limb_points, limb_faces, hand_points, hand_faces, bridge, canonical_to_world):
    bp = np.array([r['canonicalRest'] for r in bridge['vertices']])
    bf = np.array(bridge['indices'], int).reshape(-1, 3)
    offset_b, offset_h = len(limb_points), len(limb_points) + len(bp)
    points = np.vstack([limb_points, transform(bp, canonical_to_world), transform(hand_points, canonical_to_world)])
    faces = np.vstack([limb_faces, bf + offset_b, hand_faces + offset_h])
    _, wi = weld(points)
    wf = wi[faces]
    counts = {}
    directed = {}
    for tri in wf:
        for a, b in zip(tri, np.roll(tri, -1)):
            edge = (min(a, b), max(a, b))
            counts[edge] = counts.get(edge, 0) + 1
            directed[(a, b)] = directed.get((a, b), 0) + 1
    bridge_edges = set()
    for tri in wi[bf + offset_b]:
        for a, b in zip(tri, np.roll(tri, -1)):
            bridge_edges.add((min(a, b), max(a, b)))
    bad = [e for e in bridge_edges if counts.get(e) != 2]
    orientation = [e for e in bridge_edges if directed.get(e, 0) != 1 or directed.get(e[::-1], 0) != 1]
    xyz = bp[bf]
    area2 = np.linalg.norm(np.cross(xyz[:, 1]-xyz[:, 0], xyz[:, 2]-xyz[:, 0]), axis=1)
    report = {'bridgeVertices': len(bp), 'bridgeFaces': len(bf), 'bridgeEdges': len(bridge_edges),
              'nonManifoldBridgeEdges': len(bad), 'misorientedBridgeEdges': len(orientation),
              'minimumBridgeTriangleAreaM2': float(area2.min()/2),
              'newCutSeamsGeometricallyWelded': not bad, 'allBridgeEdgesOppositeWinding': not orientation,
              'noDegenerateBridgeTriangles': bool(area2.min() > 1e-13)}
    if bad or orientation or not report['noDegenerateBridgeTriangles']:
        raise ValueError('Bridge topology failed: ' + json.dumps(report))
    return report


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--reference', type=Path, default=SOURCES/'mesh-reference.json')
    ap.add_argument('--neutral', type=Path, default=SOURCES/'flex-0-twist-0.json')
    ap.add_argument('--hands', type=Path, default=SOURCES)
    ap.add_argument('--output', type=Path, required=True, help='New output directory; never overwrite the accepted package')
    args = ap.parse_args()
    if args.output.exists():
        raise FileExistsError(args.output)
    ref = json.loads(args.reference.read_text())
    neutral = json.loads(args.neutral.read_text())
    lp = np.array(neutral['limbWorld']).reshape(-1, 3)
    lf = np.array(ref['limbs']['index'], int).reshape(-1, 3)
    mappings = {
        'left': np.array([[0, 1, 0, 0], [0, 0, -1, 0], [-1, 0, 0, 0], [0, 0, 0, 1.]]),
        'right': np.array([[0, -1, 0, 0], [0, 0, -1, 0], [1, 0, 0, 0], [0, 0, 0, 1.]])}
    to_world, canon, clips, frames = {}, {}, {}, {}
    for side in ['left', 'right']:
        frame = neutral['frames'][side]
        matrix = np.array(frame['handMatrixWorld']).reshape(4, 4).T
        to_world[side] = matrix @ mappings[side]
        canon[side] = transform(lp, np.linalg.inv(to_world[side]))
        roi = np.zeros(len(lp), bool)
        roi[ref['limbs']['sides'][side]['ids']] = True
        clips[side] = {'canonical': canon[side], 'cut': -.040, 'keepSign': -1, 'roi': roi}
        frames[side] = {**frame, 'handMatrixOrder': 'column-major',
                        'webCanonicalToHandLocalRowMajor': mappings[side].ravel().tolist(),
                        'canonicalToWorldRowMajor': to_world[side].ravel().tolist()}
    limbs, new_lp = clipped_mesh(lp, lf, clips)
    source_normals_world = vertex_normals(lp, lf)
    clipped_normals_world = evaluate_recipe(limbs['vertices'], source_normals_world)
    hands, bridges, report, hand_pins = {}, {}, {}, {}
    rows_y = [round(float(x), 6) for x in np.arange(-.040, .0201, .005)]
    for side in ['left', 'right']:
        hand_path = args.hands/(side+'-grasp.json')
        hd = json.loads(hand_path.read_text())
        hand_pins[side] = pin(hand_path)
        hp = np.array(hd['positions']).reshape(-1, 3)
        hf = np.array(hd['indices'], int).reshape(-1, 3)
        hn = np.array(hd['normals']).reshape(-1, 3)
        clipped, cp = clipped_mesh(hp, hf, {side: {'canonical': hp, 'cut': .020, 'keepSign': 1, 'roi': np.ones(len(hp), bool)}})
        clipped['source'] = hand_pins[side]
        clipped['boundary'] = clipped['boundary'][side]
        for rec, p in zip(clipped['vertices'], cp):
            rec['canonicalRest'] = p.tolist()
        hands[side] = clipped
        body_canonical = evaluate_recipe(limbs['vertices'], canon[side])
        body_normals = clipped_normals_world @ to_world[side][:3, :3]
        hand_normals = evaluate_recipe(clipped['vertices'], hn)
        bridge = bridge_mesh(limbs['boundary'][side], clipped['boundary'], body_canonical, cp, body_normals, hand_normals, rows_y)
        bridges[side] = bridge
        report[side] = validate_assembly(new_lp, np.array(limbs['retainedIndex']).reshape(-1, 3), cp,
                                         np.array(clipped['retainedIndex']).reshape(-1, 3), bridge, to_world[side])
        report[side].update(limbCutBoundary=len(limbs['boundary'][side]['vertexIds']),
                            handCutBoundary=len(clipped['boundary']['vertexIds']),
                            handProtectedOriginalVertices=int(np.sum(hp[:, 1] >= .020)),
                            handProtectedVerticesRetainedExactly=all(any(rec['source'] == [[i, 1.0]] for rec in clipped['vertices']) for i in np.where(hp[:, 1] >= .020)[0]))
        if not report[side]['handProtectedVerticesRetainedExactly']:
            raise ValueError('Hand protection failed')
    output = {'format': 'pose-hub-webxr-wrist-join-recipe@1', 'units': 'metres', 'scale': 1,
              'reviewed': False, 'releaseEligible': False,
              'sources': {'limbReference': pin(args.reference), 'neutral': pin(args.neutral), 'hands': hand_pins},
              'sourcePins': {'limbs': {'sourceVertices': limbs['sourceVertices'], 'sourceIndexCount': limbs['sourceIndexCount'],
                                       'sourceIndexUint32LESha256': limbs['sourceIndexUint32LESha256']}},
              'neutralFrames': frames, 'meshes': {'limbs': limbs, 'hands': hands}, 'bridge': bridges,
              'design': {'limbCutY': -.040, 'handCutY': .020, 'wristPivot': [0, 0, 0],
                         'straightTransitionRangeY': [-.040, -.020], 'deformableArcRangeY': [-.020, .020],
                         'protectedHandRangeY': [.020, None], 'handLengthScale': 1,
                         'attributeContract': 'Source recipes interpolate positions/normals/UV/etc. Merge bone influences by bone ID, never numerically interpolate skinIndex; normalize merged weights. Hand mesh is fixed baked geometry.'},
              'checks': report,
              'limitations': ['Neutral topology/recipe builder only; no GPU or dynamic acceptance.',
                              'Exact source-weight recipes describe clipped attributes, not a claim that LBS of interpolated attributes equals interpolation of skinned source vertices.',
                              'Runtime must take actual clipped skinned endpoint positions, preserve source hand/prop rigidly, transport only the short wrist band, and validate bend/twist extremes.']}
    args.output.mkdir(parents=True)
    with (args.output/'recipe.json').open('x', encoding='utf8') as out:
        json.dump(output, out, separators=(',', ':'))
    with (args.output/'topology-report.json').open('x', encoding='utf8') as out:
        json.dump({'checks': report, 'recipeSha256': pin(args.output/'recipe.json')['sha256'],
                   'builderSource': pin(Path(__file__))}, out, indent=2)
    print(json.dumps({'output': str(args.output), 'recipeSha256': pin(args.output/'recipe.json')['sha256'], 'checks': report}, indent=2))


if __name__ == '__main__':
    main()
