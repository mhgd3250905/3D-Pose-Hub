"""Count shoe/skin triangle contacts in the selected ankle region.

Uses fixed rest-pose face selections in each audit snapshot. Requires numpy and
python-fcl; output must be a new path. Zero contacts means no tested triangle
intersections, not proof of separation for all geometry or all poses.
"""
import argparse
import base64
import json
from pathlib import Path

import fcl
import numpy as np


def load(path):
    data = json.loads(path.read_text(encoding='utf-8'))['meshes']
    meshes = {}
    for name in ('Coach_Sneakers', 'Coach_Body'):
        item = data[name]
        a = np.frombuffer(base64.b64decode(item['A']), np.float32).reshape(-1, 6)
        meshes[name] = (a[:, :3].astype(np.float64), np.asarray(item['idx'], dtype=np.int32).reshape(-1, 3))
    return meshes


def obj(vertices, faces):
    model = fcl.BVHModel()
    model.beginModel(len(vertices), len(faces))
    model.addSubModel(vertices, faces)
    model.endModel()
    return fcl.CollisionObject(model)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('audit_dir', type=Path)
    parser.add_argument('--reference-dir', type=Path, help='select the same rest-space face identities as this reference audit')
    parser.add_argument('--states', nargs='+', default=['rest', 'squat', 'plank', 'fold'])
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError(f'refusing to overwrite {args.output}')
    rest = load(args.audit_dir / 'rest.json')
    reference = load((args.reference_dir or args.audit_dir) / 'rest.json')
    for name in rest:
        if not np.array_equal(rest[name][1], reference[name][1]):
            raise ValueError(f'{name}: topology changed from reference')
    masks = {}
    for name, (vertices, faces) in reference.items():
        center = vertices[faces].mean(axis=1)
        upper = .13 if name == 'Coach_Sneakers' else .17
        masks[name] = {
            side: (center[:, 0] * sign > 0) & (center[:, 1] > .04) & (center[:, 1] < upper) & (center[:, 2] < .07) & (np.abs(center[:, 0]) < .2)
            for side, sign in (('left', 1), ('right', -1))
        }
    output = {'method': 'FCL triangle contacts; ankle-region faces selected in rest space and reused by index',
              'caveat': 'Open meshes and cropped faces: zero contacts does not prove global separation or check containment.',
              'selection_reference': str(args.reference_dir or args.audit_dir), 'states': {}}
    for state in args.states:
        posed = load(args.audit_dir / f'{state}.json')
        for name in rest:
            if not np.array_equal(posed[name][1], rest[name][1]):
                raise ValueError(f'{state}: {name} topology changed from rest')
        output['states'][state] = {}
        for side in ('left', 'right'):
            objects = []
            counts = {}
            for name, (vertices, faces) in posed.items():
                selected = faces[masks[name][side]]
                if not len(selected):
                    raise ValueError(f'{state}: no {name} faces in {side} ankle')
                counts[name] = len(selected)
                objects.append(obj(vertices, selected))
            request = fcl.CollisionRequest(num_max_contacts=10000, enable_contact=True)
            result = fcl.CollisionResult()
            fcl.collide(*objects, request, result)
            if len(result.contacts) >= 10000:
                raise ValueError('contact result truncated')
            output['states'][state][side] = {
                'contact_pairs': len(result.contacts),
                'max_fcl_contact_depth_mm': round(max((float(c.penetration_depth) for c in result.contacts), default=0) * 1000, 3),
                'faces': counts,
            }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()
