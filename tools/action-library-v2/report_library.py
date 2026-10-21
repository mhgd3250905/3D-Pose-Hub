"""Validate each action with its own batch media root; report all target IDs."""
import argparse
import importlib.util
import json
from pathlib import Path
import re

REPO = Path(__file__).resolve().parents[2]


def context_for(aid, plan, production, pilot):
    if aid in plan['reusedPilot']['actions']:
        return pilot.resolve()
    action = next(a for a in plan['actions'] if a['id'] == aid)
    batch = next(b for b in plan['batches'] if b['id'] == action['batchId'])
    relative = batch['root']['relativePath']
    if not relative or ':' in relative or '\\' in relative or '..' in Path(relative).parts or Path(relative).is_absolute():
        raise ValueError('Unsafe batch-root binding')
    root = (production/relative).resolve()
    if not root.is_relative_to(production.resolve()):
        raise ValueError('Batch root escapes production root')
    return root


def validate_plan(plan):
    ids = [a['id'] for a in plan['actions']]
    batches = [b['id'] for b in plan['batches']]
    if (any(not isinstance(aid, str) or not re.fullmatch(r'[\w-]+', aid) for aid in ids)
            or len(ids) != len(set(ids)) or len(ids) != plan['primaryTarget']):
        raise ValueError('Plan target and unique action count differ')
    if len(batches) != len(set(batches)):
        raise ValueError('Duplicate batch identity')
    reused = plan['reusedPilot']['actions']
    if len(reused) != len(set(reused)) or not set(reused) <= set(ids):
        raise ValueError('Invalid pilot reuse identities')
    for action in plan['actions']:
        if action['id'] not in reused and action['batchId'] not in batches:
            raise ValueError('Unbound planned action')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, default=REPO/'catalog/v2/production-plan.json')
    parser.add_argument('--production-root', type=Path, required=True)
    parser.add_argument('--pilot-root', type=Path, required=True)
    parser.add_argument('--check-files', action='store_true')
    parser.add_argument('--generate', action='store_true')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    spec = importlib.util.spec_from_file_location('batch_library_gate', REPO/'catalog/tools/action_package_v2.py')
    gate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gate)
    plan = gate.read(args.plan)
    validate_plan(plan)
    registry = gate.read(REPO/'catalog/v2/skins.json')
    packages, results, unwritten, contexts = [], [], [], []
    for item in plan['actions']:
        aid = item['id']
        path = REPO/'catalog/v2/actions'/f'{aid}.json'
        if not path.exists():
            unwritten.append(aid)
            continue
        root = context_for(aid, plan, args.production_root, args.pilot_root)
        package = gate.read(path)
        if package.get('id') != aid:
            raise ValueError(f'{aid}: catalog filename and stable action identity differ')
        result = gate.validate(package, registry, {'media': root}, args.check_files)
        packages.append(package)
        results.append(result)
        contexts.append({'id': aid, 'batchId': item['batchId'], 'rootBinding': 'pilot' if aid in plan['reusedPilot']['actions'] else 'production/'+next(b['root']['relativePath'] for b in plan['batches'] if b['id'] == item['batchId'])})
    report = {'format': 'pose-hub-v2-library-completeness@1', 'target': plan['primaryTarget'],
        'authored': len(packages), 'unwritten': unwritten, 'complete': sum(r['complete'] for r in results),
        'checkFiles': args.check_files, 'actions': results, 'contexts': contexts}
    gate.write(args.output, report)
    if args.generate:
        output = REPO/'catalog/action-library'
        gate.generate(packages, results, output)
        if unwritten:
            with (output/'index.md').open('a', encoding='utf-8') as stream:
                stream.write('\n## Scheduled actions without v2 packages\n\n')
                for aid in unwritten:
                    stream.write(f'- `{aid}`: scheduled; v2 content/media not yet authored.\n')
    print(json.dumps({'target': plan['primaryTarget'], 'authored': len(packages),
                      'unwritten': len(unwritten), 'releaseEligible': report['complete']}))


if __name__ == '__main__':
    main()
