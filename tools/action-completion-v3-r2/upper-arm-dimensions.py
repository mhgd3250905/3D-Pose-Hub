"""Read-only upper-arm sections from actual probe geometry; no renderer required."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree
from scipy.signal import find_peaks

SHARED = 'V3_Head_Neck_Torso_Shared_R26'
LIMBS = 'V2P_Base_Limbs'
VERSIONS = {'r0': 'bear-arm-contour-baseline-r2', 'r1': 'bear-arm-contour-candidate-r1',
            'r2': 'bear-arm-fullness-candidate-r2'}


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def unit(v):
    return v / np.linalg.norm(v)


def rotation(bone):
    return np.array(bone['matrixWorld']).reshape(4, 4).T[:3, :3]


def frame(g, rest, side):
    s = np.array(g['bones'][side + 'UpperArm']['worldPosition'])
    e = np.array(g['bones'][side + 'Forearm']['worldPosition'])
    rs = np.array(rest['bones'][side + 'UpperArm']['worldPosition'])
    re = np.array(rest['bones'][side + 'Forearm']['worldPosition'])
    other = np.array(rest['bones'][('right' if side == 'left' else 'left') + 'UpperArm']['worldPosition'])
    ra = unit(re - rs)
    ru = unit(other - rs - ra * np.dot(other - rs, ra))
    u = rotation(g['bones'][side + 'UpperArm']) @ rotation(rest['bones'][side + 'UpperArm']).T @ ru
    axis = unit(e - s)
    u = unit(u - axis * np.dot(u, axis))
    return s, axis, u, np.cross(axis, u), np.linalg.norm(e - s)


def triangles(g, torso_count, side):
    """Only the current torso primitive and limb replacement, not hidden body/clothes."""
    xyz, weights = [], []
    for name in (SHARED, LIMBS):
        mesh = g['meshes'][name]
        vertices = {v['id']: v for v in mesh['vertices']}
        offset = mesh['vertexCount'] - torso_count if name == SHARED else 0
        for face in mesh['facesOriginalIndices']:
            # Shared indices >= offset are the known torso primitive. Exclude
            # the independent head/neck and collar bridge material groups.
            if name == SHARED and min(face) < offset:
                continue
            vs = [vertices[i] for i in face]
            xyz.append([v['world'] for v in vs])
            weights.append([sum(w['weight'] for w in v['weights']
                                if w['bone'] in (side + 'UpperArm', side + 'Forearm')) for v in vs])
    return np.asarray(xyz), np.asarray(weights)


def contains_origin(p):
    inside = False
    for a, b in zip(p, np.roll(p, -1, axis=0)):
        if (a[1] > 0) != (b[1] > 0) and 0 < a[0] + (b[0] - a[0]) * (-a[1]) / (b[1] - a[1]):
            inside = not inside
    return inside


def self_crosses(p):
    # Strict crossings only; shared adjacent endpoints are expected.
    def orient(a, b, c):
        d, e = b - a, c - a
        return d[0] * e[1] - d[1] * e[0]
    n = len(p)
    for i in range(n):
        a, b = p[i], p[(i + 1) % n]
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            c, d = p[j], p[(j + 1) % n]
            if orient(a, b, c) * orient(a, b, d) < -1e-20 and orient(c, d, a) * orient(c, d, b) < -1e-20:
                return True
    return False


def section(xyz, weights, s, axis, u, v, distance):
    signed = (xyz - s) @ axis - distance
    mask = (signed.min(axis=1) <= 0) & (signed.max(axis=1) > 0)
    ps, ds, ws = xyz[mask], signed[mask], weights[mask]
    cuts, cut_weights = [], []
    for p, d, w in zip(ps, ds, ws):
        hit, hw = [], []
        for i, j in ((0, 1), (1, 2), (2, 0)):
            if (d[i] <= 0 < d[j]) or (d[j] <= 0 < d[i]):
                t = d[i] / (d[i] - d[j])
                q = p[i] + t * (p[j] - p[i]) - s
                hit.append([q @ u, q @ v])
                hw.append(w[i] + t * (w[j] - w[i]))
        if len(hit) == 2 and np.linalg.norm(np.array(hit[0]) - hit[1]) > 1e-10:
            cuts.extend(hit)
            cut_weights.extend(hw)
    result = {'valid': False, 'reason': None, 'segments': len(cuts) // 2,
              'width_a_mm': None, 'width_b_mm': None, 'area_mm2': None, 'perimeter_mm': None}
    if not cuts:
        result['reason'] = 'no_surface_intersection'
        return result
    points = np.asarray(cuts)
    parent = list(range(len(points)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    # 0.001 mm positional weld, well below the source mesh edge size.
    for a, b in cKDTree(points).query_pairs(1e-6):
        parent[find(b)] = find(a)
    groups = {}
    for i in range(len(points)):
        groups.setdefault(find(i), []).append(i)
    pos = {i: points[ids].mean(axis=0) for i, ids in groups.items()}
    armw = {i: min(cut_weights[j] for j in ids) for i, ids in groups.items()}
    edges = {tuple(sorted((find(i), find(i + 1)))) for i in range(0, len(points), 2) if find(i) != find(i + 1)}
    adj = {i: set() for i in pos}
    for a, b in edges:
        adj[a].add(b)
        adj[b].add(a)
    unseen, candidates, open_count = set(adj), [], 0
    while unseen:
        start = next(iter(unseen))
        todo, component = [start], set()
        while todo:
            i = todo.pop()
            if i in component:
                continue
            component.add(i)
            todo.extend(adj[i] - component)
        unseen -= component
        if any(len(adj[i]) != 2 for i in component):
            open_count += 1
            continue
        order, previous, current = [], None, start
        for _ in range(len(component) + 1):
            if current == start and order:
                break
            order.append(current)
            following = next(j for j in adj[current] if j != previous)
            previous, current = current, following
        polygon = np.array([pos[i] for i in order])
        if len(order) != len(component) or not contains_origin(polygon):
            continue
        candidates.append((order, polygon))
    result.update(open_components=open_count, enclosing_closed_components=len(candidates))
    if len(candidates) != 1:
        result['reason'] = 'no_unique_closed_arm_loop'
        return result
    order, polygon = candidates[0]
    result.update(loop_vertices=len(order), minimum_arm_weight=min(armw[i] for i in order))
    if result['minimum_arm_weight'] < .9:
        result['reason'] = 'shoulder_trunk_blend_not_isolated_arm'
        return result
    if self_crosses(polygon):
        result['reason'] = 'self_crossing_section'
        return result
    q = np.roll(polygon, -1, axis=0)
    area = abs(np.sum(polygon[:, 0] * q[:, 1] - polygon[:, 1] * q[:, 0])) / 2
    result.update(valid=True, reason='closed_isolated_arm', width_a_mm=float(np.ptp(polygon[:, 0]) * 1000),
                  width_b_mm=float(np.ptp(polygon[:, 1]) * 1000), area_mm2=float(area * 1e6),
                  perimeter_mm=float(np.linalg.norm(q - polygon, axis=1).sum() * 1000),
                  min_a_mm=float(polygon[:, 0].min() * 1000), max_a_mm=float(polygon[:, 0].max() * 1000),
                  min_b_mm=float(polygon[:, 1].min() * 1000), max_b_mm=float(polygon[:, 1].max() * 1000))
    return result


def extrema(rows, metric):
    valid = [r for r in rows if r['valid']]
    if len(valid) < 7:
        return []
    # No filling through invalid sections. Segment consecutive valid samples.
    segments, group = [], []
    for r in rows:
        if r['valid']:
            group.append(r)
        elif group:
            segments.append(group)
            group = []
    if group:
        segments.append(group)
    found = []
    for group in segments:
        if len(group) < 7:
            continue
        x = np.array([r[metric] for r in group])
        smooth = np.convolve(x, np.ones(3) / 3, mode='valid')
        for kind, sign in [('peak', 1), ('valley', -1)]:
            ids, props = find_peaks(sign * smooth, prominence=max(abs(np.median(x)) * .01, .001), distance=3)
            for i, prominence in zip(ids, props['prominences']):
                r = group[int(i) + 1]
                found.append({'kind': kind, 'metric': metric, 'distance_mm': r['distance_mm'],
                              'normalized': r['normalized'], 'value': r[metric], 'prominence': float(prominence)})
    return found


def self_test():
    n = 128
    xyz = []
    for i in range(n):
        a, b = i * 2 * np.pi / n, (i + 1) * 2 * np.pi / n
        p = [[.04*np.cos(a), .03*np.sin(a), -.1], [.04*np.cos(b), .03*np.sin(b), -.1],
             [.04*np.cos(b), .03*np.sin(b), .1], [.04*np.cos(a), .03*np.sin(a), .1]]
        xyz.extend([[p[0], p[1], p[2]], [p[0], p[2], p[3]]])
    xyz = np.array(xyz)
    r = section(xyz, np.ones((len(xyz), 3)), np.zeros(3), np.array([0,0,1]), np.array([1,0,0]), np.array([0,1,0]), 0)
    assert r['valid'] and abs(r['width_a_mm']-80)<1e-8 and abs(r['width_b_mm']-60)<1e-8
    assert abs(r['area_mm2']-1200*np.pi)/(1200*np.pi)<.001
    assert not section(xyz[2:], np.ones((len(xyz)-2,3)), np.zeros(3), np.array([0,0,1]), np.array([1,0,0]), np.array([0,1,0]), 0)['valid']
    assert not section(xyz, np.ones((len(xyz),3))*.8, np.zeros(3), np.array([0,0,1]), np.array([1,0,0]), np.array([0,1,0]), 0)['valid']
    print('PASS: ellipse widths/area; open-loop rejection; shoulder-blend rejection')


def run(root, out, torso_count):
    if out.exists():
        raise RuntimeError('Output must be new: '+str(out))
    out.mkdir(parents=True)
    rows, axes, hashes = [], [], {}
    for version, folder in VERSIONS.items():
        p = root/folder
        rest = read(p/'probe.json')['rest']
        for pose, g in [('neutral', rest), ('bear_t2', read(p/'frame-0060-geometry.json'))]:
            hashes[f'{version}:{pose}'] = hashlib.sha256((p/('probe.json' if pose=='neutral' else 'frame-0060-geometry.json')).read_bytes()).hexdigest()
            for side in ['left', 'right']:
                s, axis, u, v, length = frame(g, rest, side)
                axes.append(dict(version=version,pose=pose,side=side,shoulder=s.tolist(),axis_shoulder_to_elbow=axis.tolist(),transverse_a=u.tolist(),transverse_b=v.tolist(),length_mm=length*1000))
                xyz, w = triangles(g, torso_count, side)
                n = math.ceil(length/.005)
                for j, d in enumerate(np.linspace(0, length, n+1)):
                    row = dict(version=version,pose=pose,side=side,index=j,distance_mm=float(d*1000),normalized=float(d/length))
                    row.update(section(xyz,w,s,axis,u,v,d))
                    rows.append(row)
                print(version,pose,side,'valid',sum(r['valid'] for r in rows[-n-1:]),'/',n+1,flush=True)
    lookup={(r['version'],r['pose'],r['side'],r['index']):r for r in rows}
    metrics=['width_a_mm','width_b_mm','area_mm2','perimeter_mm']
    for r in rows:
        for baseline in ['r0','r1']:
            b=lookup[(baseline,r['pose'],r['side'],r['index'])]
            for metric in metrics:
                r[f'delta_{baseline}_{metric}']=r[metric]-b[metric] if r['valid'] and b['valid'] else None
    summaries=[]
    for version in VERSIONS:
        for pose in ['neutral','bear_t2']:
            for side in ['left','right']:
                subset=[r for r in rows if (r['version'],r['pose'],r['side'])==(version,pose,side)]
                local=sum([extrema(subset,m) for m in metrics],[])
                summaries.append(dict(version=version,pose=pose,side=side,valid_sections=sum(r['valid']for r in subset),total_sections=len(subset),local_extrema=local))
    report={'method':'actual-triangle plane intersection; welded closed polygons; no assumed cylindrical anatomy','step_approx_mm':5,'axes':axes,'source_sha256':hashes,
            'axis_definition':'Longitudinal: shoulder to elbow. A: neutral direction toward opposite shoulder projected perpendicular to upper-arm axis, transported by UpperArm rotation into posed frame and reprojected. B: axis cross A. A/B are geometric references, not validated anatomical medial/lateral or anterior/posterior measurements.',
            'surface_scope':'Only shared-mesh current torso primitive (indices >= head/neck offset) and V2P_Base_Limbs; hidden Coach_Body, garments, hands, head/neck and duplicates excluded. No material/color area is counted.',
            'reliability':'Exactly one closed non-self-crossing loop enclosing the bone axis; all loop interpolated own UpperArm+Forearm weights >=0.9. Open/trunk-blended sections have no dimensions; no interpolation across them. CPU geometry excludes shader-only displacement.',
            'extrema_method':'3-sample moving average only within consecutive valid sections; prominence >=1% of segment median, peak distance >=3 samples. Not a diagnosis or requirement of uniform arm diameter.',
            'summary':summaries,'sections':rows}
    (out/'dimensions.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    fields=list(dict.fromkeys(k for r in rows for k in r))
    with(out/'dimensions.csv').open('w',newline='',encoding='utf-8-sig')as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    colors={'r0':'#555555','r1':'#4778b5','r2':'#e16b36'}
    for pose in ['neutral','bear_t2']:
        fig,axs=plt.subplots(3,2,figsize=(12,10),sharex=True)
        for c,side in enumerate(['left','right']):
            for row,(metric,label) in enumerate([('width_a_mm','Width A (mm)'),('width_b_mm','Width B (mm)'),('area_mm2','Section area (mm²)')]):
                ax=axs[row,c]
                for version in VERSIONS:
                    rr=[r for r in rows if (r['version'],r['pose'],r['side'])==(version,pose,side)]
                    ax.plot([r['normalized']for r in rr],[r[metric] if r['valid'] else np.nan for r in rr],label=version,color=colors[version],linewidth=1.8)
                ax.set_ylabel(label);ax.grid(alpha=.2);ax.set_xlim(0,1)
                # Explicitly show the entire requested shoulder-to-elbow axis.
                bad=[r for r in rows if (r['version'],r['pose'],r['side'])==('r2',pose,side) and not r['valid']]
                step=1/(len(rr)-1)
                for r in bad:ax.axvspan(max(0,r['normalized']-step/2),min(1,r['normalized']+step/2),color='#cccccc',alpha=.65,linewidth=0)
                if row==0:ax.set_title(side+' upper arm');ax.legend()
                if row==2:ax.set_xlabel('Shoulder → elbow (normalized)')
        fig.suptitle(pose+' | grey = unreliable sections; A/B are geometric reference axes')
        fig.tight_layout();fig.savefig(out/(pose+'-sections.png'),dpi=160);plt.close(fig)
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path);parser.add_argument('--out',type=Path);parser.add_argument('--self-test',action='store_true');args=parser.parse_args()
    if args.self_test:self_test()
    else:
        repo=Path(__file__).resolve().parents[2]
        run(args.root,args.out,read(repo/'drill-anim/models/training-human-v2plus-torso-base.json')['n'])
