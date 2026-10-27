"""Audit nearest-bone radius against an explicitly rigid per-owner reference.

The owner reference is discontinuous at ownership boundaries and is not a
repair candidate. It only tests whether a nearest-of-two-axes statistic can
change when each individual point is transformed by one rigid bone motion.
No existing source or artifact is edited. Requires NumPy only.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

import numpy as np

root = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('actual', type=Path)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
if args.output.exists():
    raise FileExistsError(args.output)
model_path = root / 'drill-anim/models/training-human-v2plus-limbs-base.json'
model = json.loads(model_path.read_text())
joints = np.frombuffer(base64.b64decode(model['joints']['u8']), np.uint8).reshape(-1, 4)
weights = np.frombuffer(base64.b64decode(model['weights']['u8']), np.uint8).reshape(-1, 4)/255


def read(name):
    data = json.loads((args.actual / name).read_text())
    mesh = data['meshes']['V2P_Base_Limbs']
    positions = np.frombuffer(base64.b64decode(mesh['A']), '<f4').reshape(-1, 6)[:, :3].astype(float)
    return positions, {k: np.asarray(v, float) for k, v in data['bones'].items()}


def segment(points, start, end):
    vec = end - start
    t = np.clip(((points-start)@vec)/(vec@vec), 0, 1)
    return np.linalg.norm(points-(start+t[:, None]*vec), axis=1)


def fit(x, y):
    xm, ym = x.mean(axis=0), y.mean(axis=0)
    u, _, vt = np.linalg.svd((x-xm).T@(y-ym))
    fix = np.eye(3)
    fix[2, 2] = np.linalg.det(u@vt)
    rot = u@fix@vt
    translation = ym-xm@rot
    error = np.linalg.norm(x@rot+translation-y, axis=1).max()
    return rot, translation, float(error*1000)


def stats(values):
    return {'n': len(values), 'p5': float(np.percentile(values, 5)), 'median': float(np.median(values)), 'below05': int((values < .5).sum())}


rest, b0 = read('rest.json')
out = {
    'status': 'measurement diagnosis only; original acceptance standard is not changed',
    'limitations': [
        'per-owner rigid reference is not a continuous valid skin or a collision solution',
        'dominant bone is a declared diagnostic ownership rule',
        'distance ratios alone do not establish tissue volume or visible penetration',
    ],
    'sourceSha256': {'model': hashlib.sha256(model_path.read_bytes()).hexdigest()},
    'states': {},
}
for time in [1, 3, 5]:
    source = args.actual/f't{time}-zero.json'
    pose, bones = read(source.name)
    out['sourceSha256'][source.name] = hashlib.sha256(source.read_bytes()).hexdigest()
    rows = {}
    for side, sign in [('left', 1), ('right', -1)]:
        indices = [model['bones'].index(side+part) for part in ['Thigh', 'Shin']]
        full_weights = np.stack([np.where(joints == i, weights, 0).sum(axis=1) for i in indices], axis=1)
        ids = np.flatnonzero((rest[:, 0]*sign > 0) & (np.linalg.norm(rest-b0[side+'Shin'], axis=1) < .06))
        owner = np.argmax(full_weights[ids], axis=1)
        rest_dist = np.stack([
            segment(rest[ids], b0[side+'Thigh'], b0[side+'Shin']),
            segment(rest[ids], b0[side+'Shin'], b0[side+'Foot']),
        ], axis=1)
        current_dist = np.stack([
            segment(pose[ids], bones[side+'Thigh'], bones[side+'Shin']),
            segment(pose[ids], bones[side+'Shin'], bones[side+'Foot']),
        ], axis=1)
        rigid = np.zeros((len(ids), 3))
        transported_axes = []
        fit_errors = []
        pivot_errors = []
        for k, (a, b) in enumerate([('Thigh', 'Shin'), ('Shin', 'Foot')]):
            pure = full_weights[:, k] > .999999
            rot, trans, error = fit(rest[pure], pose[pure])
            if error > .001:
                raise ValueError('pure rigid fit is not accurate enough')
            own = owner == k
            rigid[own] = rest[ids[own]]@rot+trans
            start, end = b0[side+a]@rot+trans, b0[side+b]@rot+trans
            transported_axes.append((start, end))
            fit_errors.append(error)
            pivot_errors.append([float(np.linalg.norm(start-bones[side+a])*1000), float(np.linalg.norm(end-bones[side+b])*1000)])
        rigid_dist = np.stack([
            segment(rigid, bones[side+'Thigh'], bones[side+'Shin']),
            segment(rigid, bones[side+'Shin'], bones[side+'Foot']),
        ], axis=1)
        transported_owner = np.empty(len(ids))
        for k, axis in enumerate(transported_axes):
            own = owner == k
            transported_owner[own] = segment(rigid[own], *axis)
        nearest_ratio = current_dist.min(axis=1)/np.maximum(rest_dist.min(axis=1), 1e-4)
        rigid_nearest_ratio = rigid_dist.min(axis=1)/np.maximum(rest_dist.min(axis=1), 1e-4)
        ridx = np.arange(len(ids))
        owner0 = rest_dist[ridx, owner]
        rigid_owner_ratio = transported_owner/np.maximum(owner0, 1e-4)
        rows[side] = {
            'actualNearestAxis': stats(nearest_ratio),
            'rigidOwnerNearestActualAxis': stats(rigid_nearest_ratio),
            'rigidOwnerDistanceToItsTransportedAxis': stats(rigid_owner_ratio),
            'pureRigidFitMaxErrorMm': max(fit_errors),
            'transportedOwnerAxisVsActualBoneEndpointErrorsMm': pivot_errors,
            'rigidOwnerNearestAxisChangedCount': int((rigid_dist.argmin(axis=1) != rest_dist.argmin(axis=1)).sum()),
            'pureDominantCount': int((full_weights[ids].max(axis=1) > .999999).sum()),
        }
    out['states'][str(time)] = rows
with args.output.open('x', encoding='utf8') as stream:
    json.dump(out, stream, indent=2)
print(json.dumps(out['states'], indent=2))
