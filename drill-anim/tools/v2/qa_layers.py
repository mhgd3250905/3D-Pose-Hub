"""Numeric layer checks for rendered previews or masters, using actual PNG pixels."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


def inspect(folder, root):
    manifest = json.loads((folder / 'layer-manifest.json').read_text(encoding='utf-8'))
    rows = []
    issues = []
    sequences = {layer: json.loads((root / ref['path']).read_text(encoding='utf-8'))
                 for layer, ref in manifest['sequences'].items()}
    index = sequences['body']
    for name in sorted(Path(f['path']).name for f in index['frames']):
        body_path = folder / 'body' / name
        suffix = body_path.stem[2:]
        body = np.array(Image.open(body_path).convert('RGBA'))
        row = {'frame': int(suffix), 'size': list(body.shape[:2]),
               'bodyAlphaPixels': int(np.count_nonzero(body[:, :, 3]))}
        if body.shape != (1080, 1080, 4) or not row['bodyAlphaPixels']:
            issues.append(f'{suffix}: empty/incorrect body')
        mask_ref = next((f for f in sequences.get('highlight', {}).get('frames', []) if f['frame'] == int(suffix)), None)
        mask_path = root / mask_ref['path'] if mask_ref else folder / 'highlight' / f'k-{suffix}.png'
        if mask_path.exists():
            mask = np.array(Image.open(mask_path).convert('RGBA'))
            rgb = mask[:, :, :3].astype(np.int16)
            row['maskColorError'] = int(np.max(np.max(rgb, axis=2) - np.min(rgb, axis=2)))
            row['maskPixels'] = int(np.count_nonzero(mask[:, :, 0]))
            row['maskOutsideBodyPixels'] = int(np.count_nonzero((mask[:, :, 0] > 0) & (body[:, :, 3] == 0)))
            if row['maskColorError'] or row['maskOutsideBodyPixels'] or not row['maskPixels']:
                issues.append(f'{suffix}: colored/empty/outside-body mask')
        shadow_ref = next((f for f in sequences.get('shadow', {}).get('frames', []) if f['frame'] == int(suffix)), None)
        shadow_path = root / shadow_ref['path'] if shadow_ref else folder / 'shadow' / f's-{suffix}.png'
        if shadow_path.exists():
            shadow = np.array(Image.open(shadow_path).convert('RGBA'))
            row['shadowAlphaPixels'] = int(np.count_nonzero(shadow[:, :, 3]))
            if not row['shadowAlphaPixels']:
                issues.append(f'{suffix}: empty floor shadow')
        rows.append(row)
    return {'actionId': manifest['actionId'], 'skin': manifest['skin'],
            'sourceSha256': manifest.get('sourceSha256'), 'frames': rows,
            'numericIssues': issues,
            'visualReviewRequired': ['interpenetration', 'hands/feet', 'prop flicker', 'loop seam',
                                     'source-vertex shadow silhouette/contact' if manifest.get('shadow', {}).get('vertexEquivalent')
                                     else 'stock shadow depth excludes shader-only cloth sink/breathing']}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--masters', action='store_true')
    args = parser.parse_args()
    source = args.root / ('masters' if args.masters else 'qa/preview')
    results = [inspect(f.parent, args.root) for f in sorted(source.glob('*/*/layer-manifest.json'))]
    sharing = []
    for action in sorted({r['actionId'] for r in results}):
        folders = [f.parent for f in sorted(source.glob(f'*/{action}/layer-manifest.json'))]
        manifests = [json.loads((f / 'layer-manifest.json').read_text(encoding='utf-8')) for f in folders]
        item = {'actionId': action, 'skins': [m['skin'] for m in manifests],
                'sameGeometry': len({m['geometrySha256'] for m in manifests}) == 1,
                'sameCanonicalOcclusion': len({m['occlusionSha256'] for m in manifests}) == 1,
                'layers': {}}
        for layer, prefix in [('highlight', 'k'), ('shadow', 's')]:
            layer_frames = [{p['frame']: args.root / p['path'] for p in
                             json.loads((args.root / m['sequences'][layer]['path']).read_text(encoding='utf-8'))['frames']}
                            if layer in m['sequences'] else {} for m in manifests]
            frame_sets = [set(f) for f in layer_frames]
            common = set.intersection(*frame_sets) if frame_sets else set()
            differences = []
            for name in sorted(common):
                hashes = {hashlib.sha256(f[name].read_bytes()).hexdigest() for f in layer_frames}
                if len(hashes) != 1:
                    differences.append(name)
            item['layers'][layer] = {'commonFrames': len(common), 'differentFrames': differences,
                                    'allCommonFramesByteIdentical': bool(common) and not differences}
        sharing.append(item)
    target = args.root / 'qa' / ('masters-layer-pixels.json' if args.masters else 'preview-layer-pixels.json')
    target.write_text(json.dumps({'renders': results, 'sharingEvidence': sharing}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'report': str(target), 'renders': len(results),
                      'numericIssues': sum(len(r['numericIssues']) for r in results)}))


if __name__ == '__main__':
    main()
