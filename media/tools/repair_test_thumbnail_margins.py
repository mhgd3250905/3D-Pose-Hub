"""Stage or version only undersized thumbnail margins; never encode video."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import uuid

for key in ('OPENBLAS_NUM_THREADS', 'OMP_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ[key] = '1'

from PIL import Image
from export_stacked_alpha import alpha_margin_pixels, alpha_thumbnail
from run_app_test_exports import Assembler, digest, now, read_json, require, verify


def stage(pack, output):
    manifest_path = pack / 'manifest.json'
    manifest_raw = manifest_path.read_bytes()
    manifest = json.loads(manifest_raw)
    require(manifest['readyCount'] == 219 and manifest['pendingCount'] == 0 and manifest['complete'],
            'This correction requires the existing complete 219-item pack')
    require(not output.exists(), 'Choose a fresh staging directory')
    output.mkdir(parents=True)
    items = []
    for row in manifest['actions']:
        old = row['files']['thumbnail']
        with Image.open(verify(pack, old)) as thumbnail:
            margin = alpha_margin_pixels(thumbnail)
        if margin >= math.ceil(240 * .04):
            continue
        revision = (row.get('mediaRevision') or row['catalogRevision']) + '-still-margin-r1'
        destination = output / 'media' / row['id'] / revision / Path(old['path']).name
        destination.parent.mkdir(parents=True)
        with Image.open(verify(pack, row['files']['cover'])) as cover:
            corrected = alpha_thumbnail(cover)
        with destination.open('xb') as handle:
            corrected.save(handle, format='WEBP', lossless=True, exact=True, method=4)
        with Image.open(destination) as actual:
            new_margin = alpha_margin_pixels(actual)
            require(new_margin >= 10, 'Corrected thumbnail still fails the exact margin')
        items.append({'id': row['id'], 'expectedThumbnailSha256': old['sha256'],
                      'mediaRevision': revision,
                      'thumbnail': {'path': destination.relative_to(output).as_posix(),
                                    'bytes': destination.stat().st_size, 'sha256': digest(destination),
                                    'width': 240, 'height': 240, 'alpha': True},
                      'recipe': {'format': 'pose-hub-thumbnail-transparent-inset@1',
                                 'sourceCover': row['files']['cover'],
                                 'method': 'Complete720-cover premultiplied Lanczos232 centered on transparent240',
                                 'oldMarginPixels': margin, 'newMarginPixels': new_margin,
                                 'requiredMarginPixels': 10, 'minimumFraction': .04,
                                 'videoAndCoverReencoded': False}})
    require(items, 'There are no thumbnails below the exact 4% requirement')
    plan = {'format': 'pose-hub-thumbnail-margin-repairs@1', 'createdAt': now(),
            'expectedManifest': {'path': 'manifest.json', 'bytes': len(manifest_raw),
                                 'sha256': hashlib.sha256(manifest_raw).hexdigest()},
            'stagingRoot': str(output.resolve()), 'actions': items,
            'status': 'test-unreviewed', 'reviewed': False, 'releaseEligible': False}
    require(manifest_path.read_bytes() == manifest_raw, 'Live manifest changed while preparing')
    with (output / 'plan.json').open('x', encoding='utf-8', newline='\n') as handle:
        json.dump(plan, handle, ensure_ascii=False, indent=2, allow_nan=False)
        handle.write('\n')
    print(json.dumps({'staged': len(items), 'plan': str(output / 'plan.json'), 'liveIndexesWritten': False}))


def apply(pack, work, catalog, authority, plan_path):
    plan = read_json(plan_path)
    require(plan['format'] == 'pose-hub-thumbnail-margin-repairs@1', 'Unexpected derivative plan')
    staging = Path(plan['stagingRoot']).resolve()
    require(plan_path.resolve().is_relative_to(staging), 'Plan must stay in its owned staging root')
    lock = pack / '.queue.lock'
    token = {'pid': os.getpid(), 'token': uuid.uuid4().hex, 'startedAt': now(),
             'operation': 'versioned-thumbnail-margin-repair'}
    with lock.open('x', encoding='utf-8') as handle:
        json.dump(token, handle)
    try:
        verify(pack, plan['expectedManifest'])
        current = read_json(pack / 'manifest.json')
        bindings = {'release': 'E:/AII-3D/3D-Pose-Hub/release/v0.3.0',
                    'pilot': 'F:/PoseHub-v2-pilot', 'production': 'F:/PoseHub-v2-production'}
        # This operation reuses the actual encoder identity and full-decode QA;
        # the separate thumbnail derivation has its own recipe and identity.
        assembler = Assembler(pack, work, catalog, {}, current['exporterSha256'], [], authority, bindings)
        assembler.queue_state = 'complete'
        assembler.ingest_thumbnail_repairs(plan['actions'], staging)
        after = read_json(pack / 'manifest.json')
        require(after['readyCount'] == 219 and after['pendingCount'] == 0 and after['complete'],
                'Thumbnail repair changed complete media availability')
        result = {'format': 'pose-hub-thumbnail-margin-repair-readback@1', 'at': now(),
                  'count': len(plan['actions']), 'planSha256': digest(plan_path),
                  'beforeManifest': plan['expectedManifest'],
                  'afterManifestSha256': digest(pack / 'manifest.json'),
                  'newMediaRevisionPerAction': True, 'videoAndCoverReencoded': False,
                  'originalDecodeQaReused': True, 'status': 'test-unreviewed',
                  'reviewed': False, 'releaseEligible': False}
        with (staging / 'applied-readback.json').open('x', encoding='utf-8', newline='\n') as handle:
            json.dump(result, handle, ensure_ascii=False, indent=2)
            handle.write('\n')
        print(json.dumps(result))
    finally:
        if lock.exists() and read_json(lock) == token:
            lock.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('stage', 'apply'))
    parser.add_argument('--pack', type=Path, required=True)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--repair-manifest', type=Path, required=True)
    parser.add_argument('--staging', type=Path, required=True)
    args = parser.parse_args()
    if args.mode == 'stage':
        stage(args.pack.resolve(), args.staging.resolve())
    else:
        apply(args.pack.resolve(), args.work.resolve(), args.catalog.resolve(),
              args.repair_manifest.resolve(), args.staging.resolve() / 'plan.json')


if __name__ == '__main__':
    main()
