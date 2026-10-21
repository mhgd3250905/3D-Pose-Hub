"""Attach one batch's real media without modifying the six accepted pilot packs."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

from media import REPO, load_batch, core_for, read


def repo_ref(path):
    data = path.read_bytes()
    return {'root': 'repo', 'path': path.relative_to(REPO).as_posix(),
            'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}


def preflight(batch, root, voice_path=None):
    """Refuse incomplete/mixed inputs before the unchanged importer writes a pack."""
    recipe = read(root/'manifests/batch-source.json')
    if recipe.get('batchId') != batch['id']:
        raise ValueError('Render recipe belongs to a different batch')
    sources = {a['id']: a for a in recipe['actions']}
    if set(sources) != {a['id'] for a in batch['actions']}:
        raise ValueError('Render recipe action set differs')
    voice = read(voice_path) if voice_path else None
    derived = read(root/'manifests/derivatives.json')
    verified = set()

    def verify_media(ref):
        relative = ref.get('path', '')
        path = (root/relative).resolve()
        if (ref.get('root') != 'media' or not relative or ':' in relative or '\\' in relative
                or not path.is_relative_to(root.resolve())):
            raise ValueError('Unsafe media reference')
        identity = (path, ref.get('sha256'), ref.get('bytes'))
        if identity not in verified:
            raw = path.read_bytes()
            if len(raw) != ref['bytes'] or hashlib.sha256(raw).hexdigest() != ref['sha256']:
                raise ValueError('Media asset changed: '+relative)
            verified.add(identity)
        return path

    def verify_tree(value):
        if isinstance(value, dict):
            if value.get('root') == 'media':
                verify_media(value)
            for child in value.values():
                verify_tree(child)
        elif isinstance(value, list):
            for child in value:
                verify_tree(child)

    for action in batch['actions']:
        aid = action['id']
        package = read(REPO/'catalog/v2/actions'/f'{aid}.json')
        if package.get('id') != aid or package['source']['spec']['path'] != action['spec']:
            raise ValueError('Catalog and batch source revision differ')
        receipt = read(root/'manifests/completed'/f'full-{aid}.json')
        if (receipt.get('actionId') != aid or receipt.get('stage') != 'full'
                or receipt.get('recipeSha256') != recipe['sha256']
                or receipt.get('sourceSha256') != sources[aid]['sourceSha256']
                or not receipt.get('reviewSha256')):
            raise ValueError(f'{aid}: no matching reviewed full-render receipt')
        for skin in batch['skins']:
            ref = receipt['manifests'][skin]
            path = (root/ref['path']).resolve()
            if ref.get('root') != 'media' or not path.is_relative_to(root.resolve()):
                raise ValueError('Receipt reference escapes the media root')
            raw = path.read_bytes()
            if hashlib.sha256(raw).hexdigest() != ref['sha256'] or len(raw) != ref['bytes']:
                raise ValueError(f'{aid}/{skin}: full manifest changed')
            manifest = read(path)
            if (manifest.get('actionId') != aid or manifest.get('skin') != skin
                    or manifest.get('model', {}).get('id') != batch['model']['id']
                    or manifest.get('model', {}).get('version') != batch['model']['version']
                    or manifest.get('sourceSha256') != sources[aid]['sourceSha256']
                    or not manifest.get('complete') or manifest.get('frameCount') != 240
                    or manifest['spec']['sha256'] != package['source']['spec']['sha256']):
                raise ValueError(f'{aid}/{skin}: incomplete or different catalog source')
            for layer in ('body', 'highlight', 'shadow'):
                sequence = read(verify_media(manifest['sequences'][layer]))
                if [f['frame'] for f in sequence['frames']] != list(range(240)):
                    raise ValueError('Missing continuous 240-frame sequence')
        variants = [v for v in derived['variants'] if v['actionId'] == aid]
        matrix = {(v.get('skin'), v.get('theme')) for v in variants}
        if (len(variants) != 10 or matrix != {(s, t) for s in batch['skins'] for t in ('light', 'dark')}
                or set(derived['transparentCovers'].get(aid, {})) != set(batch['skins'])):
            raise ValueError(f'{aid}: incomplete five-skin derivative matrix')
        verify_tree(variants)
        verify_tree(derived['transparentCovers'][aid])
        if voice is not None and aid not in voice.get('actions', {}):
            raise ValueError(f'{aid}: batch voice manifest does not contain this action')
        if voice is not None:
            lines = voice['actions'][aid].get('lines', {})
            for lang in ('zh', 'en'):
                for role in ('name', 'primaryCue', 'phase.start', 'phase.peak', 'phase.end'):
                    item = lines.get(lang, {}).get(role)
                    if not item or not item.get('text'):
                        raise ValueError(f'{aid}: missing bilingual voice role {lang}/{role}')
                    if item.get('status') not in ('passed', 'pending', 'failed', 'missing'):
                        raise ValueError('Voice technical status is not explicit')
                    if item.get('status') == 'passed':
                        ref = item.get('ref', {})
                        audio = (root/ref.get('path', '')).resolve()
                        if ref.get('root') != 'media' or not audio.is_relative_to(root.resolve()):
                            raise ValueError('Unsafe or missing voice reference')
                        raw = audio.read_bytes()
                        if len(raw) != ref['bytes'] or hashlib.sha256(raw).hexdigest() != ref['sha256']:
                            raise ValueError('Voice asset changed')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', required=True, type=Path)
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--voice-manifest', type=Path)
    args = parser.parse_args()
    # Catalog references use the repo root. Reject unsupported external inputs
    # before the importer can mutate any action package.
    for path in (args.batch, args.voice_manifest):
        if path is not None and not path.resolve().is_relative_to(REPO):
            raise ValueError('Batch and voice manifest must be repository files')
    batch = load_batch(args.batch)
    core = core_for(batch)  # Also verifies the approved pixel core's exact SHA.
    root = args.root.resolve()
    if read(root/'manifests/batch-source.json').get('batchSha256') != repo_ref(args.batch.resolve())['sha256']:
        raise ValueError('The batch file changed after rendering')
    preflight(batch, root, args.voice_manifest)
    # The unchanged importer already checks 240-frame manifests, source SHA,
    # sequence SHA and derivative references. Configure only this batch's IDs.
    source = REPO/'tools/action-package-v2/import_pilot.py'
    spec = importlib.util.spec_from_file_location('batch_import_core', source)
    importer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(importer)
    importer.PEAKS = {a['id']: a['peakFrame'] for a in batch['actions']}
    for action in batch['actions']:
        package = read(REPO/'catalog/v2/actions'/f"{action['id']}.json")
        if package['source']['spec']['path'] != action['spec']:
            raise ValueError('Catalog and batch source revision differ')
    sys.argv = [str(source), '--root', str(root)]
    importer.main()
    geometry = []
    for action in batch['actions']:
        path = REPO/'catalog/v2/actions'/f"{action['id']}.json"
        package = read(path)
        package['derivatives']['compositor'] = repo_ref(Path(__file__).with_name('media.py'))
        if args.voice_manifest:
            voice_path = args.voice_manifest.resolve()
            voice = read(voice_path)
            if action['id'] not in voice.get('actions', {}):
                raise ValueError('Batch voice manifest does not contain this action')
            package['voice'] = {'actionId': action['id'], 'manifest': repo_ref(voice_path)}
        core.write_json(path, package)
        for skin, item in package['masters']['skins'].items():
            geometry.append({'actionId': action['id'], 'skin': skin,
                'geometrySha256': item['geometrySha256'], 'occlusionSha256': item['occlusionSha256'],
                'measurement': item['measurement']})
    core.write_json(root/'manifests/skin-geometry.json', {'format': 'pose-hub-skin-geometry@2',
        'modelVersion': batch['model']['version'], 'skins': core.SKINS,
        'actions': core.IDS, 'measurements': geometry,
        'sameGeometry': len({g['geometrySha256'] for g in geometry}) == 1,
        'sharingScope': 'Per-action measured geometry and occlusion; no future extra-geometry skin assumption.'})
    core.write_json(root/'manifests/import-summary.json', {'format': 'pose-hub-batch-import@1',
        'batchId': batch['id'], 'actions': core.IDS, 'batch': repo_ref(args.batch.resolve()),
        'compositor': repo_ref(Path(__file__).with_name('media.py')),
        'compositorCore': repo_ref(REPO/'tools/action-package-v2/composite.py'),
        'note': 'References attached. No editorial, listening, source-QA or user approval is granted by import.'})


if __name__ == '__main__':
    main()
