"""Audit actual batch outputs; measurements never grant visual/editorial approval."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image
from media import load_batch, read, SKINS


def audit(batch, root):
    root = root.resolve()
    recipe = read(root/'manifests/batch-source.json')
    expected = {a['id']: a for a in recipe['actions']}
    if recipe['batchId'] != batch['id'] or set(expected) != {a['id'] for a in batch['actions']}:
        raise ValueError('Different batch source/identity')
    verified, images, issues, renders = {}, set(), [], []

    def verify(ref, pixels=False):
        relative = ref['path']
        path = (root/relative).resolve()
        if ref.get('root') != 'media' or not path.is_relative_to(root) or ':' in relative or '\\' in relative:
            raise ValueError('Unsafe media reference')
        if path not in verified:
            raw = path.read_bytes()
            verified[path] = (hashlib.sha256(raw).hexdigest(), len(raw))
        if verified[path] != (ref['sha256'], ref['bytes']):
            raise ValueError('SHA/bytes changed: '+relative)
        if pixels and path not in images:
            with Image.open(path) as im:
                if im.size != (1080, 1080) or im.mode != 'RGBA':
                    issues.append('Wrong master dimensions/mode: '+relative)
                im.verify()
            images.add(path)
        return path

    for action in batch['actions']:
        aid = action['id']
        receipt = read(root/'manifests/completed'/f'full-{aid}.json')
        if (receipt['actionId'] != aid or receipt['stage'] != 'full'
                or receipt['recipeSha256'] != recipe['sha256']
                or receipt['sourceSha256'] != expected[aid]['sourceSha256']
                or not receipt.get('reviewSha256')):
            raise ValueError('No matching reviewed completion receipt: '+aid)
        if recipe.get('runtime'):
            runtime = recipe['runtime']
            proof = read(verify(receipt['runtimeProof']))
            guard = next(f for f in recipe['runnerFiles'] if f['path'].endswith('/runtime-guard.mjs'))
            if (receipt.get('runtimeSha256') != runtime['sha256']
                    or proof.get('runtimeSha256') != runtime['sha256']
                    or proof.get('actionId') != aid or proof.get('stage') != 'full'
                    or proof.get('guardSha256') != guard['sha256']
                    or proof.get('browserVersion') != runtime['browserVersion']
                    or proof.get('actualWebGL', {}).get('unmaskedRenderer') != runtime['actualWebGLRenderer']
                    or proof.get('actualWebGL', {}).get('contextLost') is not False
                    or proof.get('args') != runtime['chromiumArgs']
                    or proof.get('channel') != runtime['chromiumChannel']
                    or proof.get('browserCount') != 1):
                raise ValueError('Actual GPU/browser proof does not match the frozen recipe')
        for skin in SKINS:
            path = verify(receipt['manifests'][skin])
            manifest = read(path)
            if (manifest['actionId'] != aid or manifest['skin'] != skin
                    or not manifest['complete'] or not manifest.get('reviewed')
                    or manifest.get('diagnosticOnly') or manifest['frameCount'] != 240
                    or manifest['sourceSha256'] != expected[aid]['sourceSha256']
                    or manifest['model']['id'] != batch['model']['id']
                    or manifest['model']['version'] != batch['model']['version']):
                raise ValueError('Wrong identity/source/model/completion: '+str(path))
            verify(manifest['reviewedPreview'])
            counts = {}
            for layer in ('body', 'highlight', 'shadow'):
                sequence = read(verify(manifest['sequences'][layer]))
                frames = sequence['frames']
                if [f['frame'] for f in frames] != list(range(240)) or len({f['path'] for f in frames}) != 240:
                    raise ValueError('Noncontinuous/repeated sequence: '+str(path)+'/'+layer)
                for frame in frames:
                    verify(frame, pixels=True)
                endpoint = manifest['qaEndpoint'][layer]
                if endpoint['frame'] != 240 or not endpoint['path'].startswith('qa/endpoints/'):
                    raise ValueError('Missing independent endpoint')
                verify(endpoint, pixels=True)
                counts[layer] = len(frames)
            metrics = read(path.parent/'metrics.json')
            if [m['frame'] for m in metrics] != list(range(241)):
                raise ValueError('Missing full-sequence metrics')
            warnings = [{'frame': m['frame'], 'warn': m['warn'], 'solverWarn': m['solverWarn']}
                        for m in metrics if m['warn'] or m['solverWarn']]
            renders.append({'actionId': aid, 'skin': skin, 'sourceSha256': manifest['sourceSha256'],
                            'counts': counts, 'poseQaFrames': len(metrics), 'warningFrames': warnings,
                            'minimumSurfaceYmm': min(m['minY'] for m in metrics)*1000,
                            'seam': read(path.parent/'seam-qa.json')})
    return {'format': 'pose-hub-v2-batch-integrity@1', 'batchId': batch['id'],
            'recipeSha256': recipe['sha256'], 'renders': renders,
            'uniqueFilesChecked': len(verified), 'uniqueMasterImagesChecked': len(images),
            'issues': issues, 'automaticApproval': False,
            'limitations': 'File/pixel-format/source checks and pose measurements; no claim of exhaustive collision detection or manual all-frame viewing.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', required=True, type=Path)
    parser.add_argument('--root', required=True, type=Path)
    args = parser.parse_args()
    result = audit(load_batch(args.batch), args.root)
    out = args.root/'qa/full-integrity-qa.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'renders': len(result['renders']), 'files': result['uniqueFilesChecked'],
                      'images': result['uniqueMasterImagesChecked'], 'issues': result['issues']}))
    if result['issues']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
