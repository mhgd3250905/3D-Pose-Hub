"""Measure the two ankle seams and shoe/foot penetration on saved audit poses.

Usage: python measure-r3.py <audit-dir> --output NEW_FILE [--states rest squat plank fold]
The penetration statistic deliberately retains the legacy nearest-vertex/normal
method so it can be compared with the handoff, with a 1 mm acceptance threshold.
It is not a watertight signed-distance or triangle-intersection test.
"""
import argparse
import base64
import json
import sys
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'drill-anim/models/training-human-v2plus-limbs-base.json'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('audit_dir',type=Path)
parser.add_argument('--output',required=True,type=Path)
parser.add_argument('--states',nargs='+',default=['rest','squat','plank','fold'])
args=parser.parse_args()
if args.output.exists(): raise FileExistsError(args.output)
DATA=args.audit_dir
STATES=args.states


def load(state):
    data = json.loads((DATA / f'{state}.json').read_text(encoding='utf-8'))
    meshes = {}
    for name, m in data['meshes'].items():
        values = np.frombuffer(base64.b64decode(m['A']), np.float32).reshape(-1, 6).astype(float)
        faces = np.array(m['idx']).reshape(-1, 3)
        meshes[name] = (values[:, :3], values[:, 3:], faces)
    return meshes


seam = json.loads(SOURCE.read_text(encoding='utf-8'))['seam']
rest = load('rest')
shoe_rest = rest['Coach_Sneakers'][0]
result = {}
for state in STATES:
    meshes = load(state)
    skin, normals, faces = meshes['Coach_Body']
    shoes, _, shoe_faces = meshes['Coach_Sneakers']
    limbs, limb_normals, _ = meshes['V2P_Base_Limbs']
    used_skin = np.unique(faces)
    used_shoe = np.unique(shoe_faces)
    distance, closest = cKDTree(skin[used_skin]).query(shoes[used_shoe])
    closest = used_skin[closest]
    depth = -np.einsum('ij,ij->i', shoes[used_shoe] - skin[closest], normals[closest])
    result[state] = {}
    for side in ('left', 'right'):
        sign = 1 if side == 'left' else -1
        selected = (shoe_rest[used_shoe, 0] * sign > 0) & (distance < 0.03)
        positive = depth[selected & (depth > 0)]
        violations = depth[selected & (depth > 0.001)]
        a = [seam['first'] + i for i, r in enumerate(seam['ring']) if r == f'ankle_{side}']
        b = [seam['vid'][i] for i, r in enumerate(seam['ring']) if r == f'ankle_{side}']
        if len(a) != 28 or len(b) != 28:
            raise ValueError(f'unexpected {side} ankle seam')
        gap = np.linalg.norm(limbs[a] - skin[b], axis=1)
        dot = np.einsum('ij,ij->i', limb_normals[a], normals[b])
        angles = np.degrees(np.arccos(np.clip(dot, -1, 1)))
        result[state][side] = {
            'penetration_n_above_1mm': int(len(violations)),
            'penetration_max_mm': round(float(np.max(positive) * 1000), 3) if len(positive) else 0,
            'seam_n': len(a),
            'seam_max_mm': round(float(np.max(gap) * 1000), 5),
            'seam_normal_max_deg': round(float(np.max(angles)), 3),
        }
print(json.dumps(result, indent=2))
with args.output.open('x',encoding='utf-8') as output:
    json.dump(result,output,indent=2)
    output.write('\n')
