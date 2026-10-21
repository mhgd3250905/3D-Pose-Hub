"""Reuse verified straight-alpha compositor caches without altering frozen producers.

python tools/hiplab-render/export_greenscreen_fast.py --output <batch> --ids <id> --once --keep-alpha

Every raw/spec/placement/cache/output binding is checked before cached PNG bytes
are copied into independent staging files. Missing or mismatched cache certificates
fall back to the frozen placement computation, with an explicit reuse record.
Existing legacy/HQ products retain their exact original recipes and files.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import time

from PIL import Image


HQ_PATH = Path(__file__).with_name('export_greenscreen_hq.py')
HQ_SHA256 = 'cf0e9f31724690f57e04bebadc4d6d177a16aa606c3f5ce23d67ea23e709393a'
if hashlib.sha256(HQ_PATH.read_bytes()).hexdigest() != HQ_SHA256:
    raise RuntimeError('Frozen HQ exporter changed; audit provenance before making a new fast producer')
_spec = importlib.util.spec_from_file_location('greenscreen_hq_fast_delegate', HQ_PATH)
hq = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(hq)
engine = hq.engine
_source_job = engine.source_job
_placed_rgba = engine.placed_rgba
_frozen_export_job = hq._original_export_job
_base_write = hq._original_write
PARALLEL_PATH = Path(__file__).with_name('composite_alpha_parallel.py')
COMPOSITOR_PATH = Path(__file__).with_name('composite_alpha.py')
_active = None


def optional_sha(path):
    return engine.sha(path) if path.is_file() else None


def recipe(keep_alpha):
    result = hq.recipe(keep_alpha)
    result.update(version=3, producer_sha256=engine.sha(__file__),
        hq_producer_sha256=HQ_SHA256, base_producer_sha256=hq.FROZEN_SHA256,
        cache_producer_sha256=optional_sha(PARALLEL_PATH),
        cache_delegate_sha256=optional_sha(COMPOSITOR_PATH),
        cache_policy='Full contiguous frame set; all current raw/spec/place/certificate/cache SHA verified; copy bytes, never resample on a cache hit; frozen calculation on miss')
    return result


def validate_cache(batch, job):
    started = time.perf_counter()
    directory = batch/'work'/job['id']/'c'
    manifests = sorted(directory.glob('cache-manifest-*.json'))
    record = {'reused': False, 'frames_reused': 0, 'reason': None, 'certificates': {}}
    try:
        if not manifests:
            raise ValueError('No parallel-compositor cache certificates')
        producer, delegate = optional_sha(PARALLEL_PATH), optional_sha(COMPOSITOR_PATH)
        if not producer or not delegate:
            raise ValueError('Cache producer/delegate source is unavailable')
        spec_key = f'work/{job["id"]}.spec.json'
        place_key = f'work/{job["id"]}/c/place.json'
        rows, inputs = {}, {}
        for path in manifests:
            certificate = engine.read(path)
            expected = {'schema': 1, 'producer_sha256': producer, 'delegate_sha256': delegate,
                        'spec_sha256': job['inputs'][spec_key], 'placement_sha256': job['inputs'][place_key]}
            for key, value in expected.items():
                if certificate.get(key) != value:
                    raise ValueError('Cache certificate binding mismatch: '+key)
            relative = path.relative_to(batch).as_posix()
            inputs[relative] = engine.sha(path)
            record['certificates'][relative] = inputs[relative]
            for row in certificate['frames']:
                name = row['name']
                if name == 'still':
                    continue
                if name in rows and rows[name] != row:
                    raise ValueError('Conflicting cache frame certificates: '+name)
                rows[name] = row
        expected_names = {f'{i:04d}' for i in range(job['count'])}
        if set(rows) != expected_names:
            raise ValueError('Cache frame certificates are incomplete or contain extra frames')
        copies = {}
        for name in sorted(expected_names):
            row = rows[name]
            raw_key = f'work/{job["id"]}/fr/m-{name}.png'
            if row['raw_sha256'] != job['inputs'][raw_key]:
                raise ValueError('Cached frame is bound to a different raw frame: '+name)
            path = directory/(name+'.png')
            if row.get('mode') != 'RGBA' or row.get('width') != engine.SIZE or row.get('height') != engine.SIZE:
                raise ValueError('Cached frame certificate is not 1080 straight RGBA: '+name)
            if engine.sha(path) != row['output_sha256']:
                raise ValueError('Cached PNG SHA mismatch: '+name)
            with Image.open(path) as image:
                if image.mode != 'RGBA' or image.size != (engine.SIZE, engine.SIZE):
                    raise ValueError('Cached PNG mode/dimensions disagree: '+name)
                image.verify()
            inputs[path.relative_to(batch).as_posix()] = row['output_sha256']
            copies[str((batch/raw_key).resolve())] = (path, row['output_sha256'])
        record.update(reused=True, frames_reused=job['count'], reason='All cache certificates and current inputs match',
                      producer_sha256=producer, delegate_sha256=delegate)
        return copies, inputs, record
    except (OSError, ValueError, KeyError, TypeError) as exc:
        record['reason'] = str(exc)
        return {}, {}, record
    finally:
        record['validation_seconds'] = round(time.perf_counter()-started, 6)


class CopyOnlyFrame:
    def __init__(self, path, expected):
        self.path, self.expected = path, expected

    def save(self, target):
        # Independent bytes avoid coupling immutable published files to scratch.
        shutil.copyfile(self.path, target)
        if engine.sha(target) != self.expected:
            raise ValueError('Cache changed while copying into staging: '+str(self.path))


def source_job(batch, sid):
    global _active
    job = _source_job(batch, sid)
    copies, inputs, record = validate_cache(batch, job)
    job['inputs'].update(inputs)
    _active = {'id': sid, 'place': job['place'], 'copies': copies, 'record': record}
    print('GREEN_CACHE', sid, 'reused' if record['reused'] else 'fallback', record['reason'], flush=True)
    return job


def placed_rgba(raw, place):
    if _active and place == _active['place']:
        cached = _active['copies'].get(str(Path(raw).resolve()))
        if cached:
            return CopyOnlyFrame(*cached)
    return _placed_rgba(raw, place)


def export_job(batch, sid, keep_alpha=False):
    global _active
    root = batch/'greenscreen'
    path = root/'jobs'/sid/'result.json'
    if path.is_file():
        result = engine.read(path)
        row_recipe = result['recipe']
        if row_recipe.get('producer_sha256') == hq.FROZEN_SHA256:
            return hq.legacy.verify_existing(batch, root, result, hq.legacy.recipe(keep_alpha))
        if row_recipe.get('producer_sha256') == HQ_SHA256:
            return engine.verify_existing(batch, root, result, hq.recipe(keep_alpha))
        return engine.verify_existing(batch, root, result, recipe(keep_alpha))
    try:
        _frozen_export_job(batch, sid, keep_alpha)
        return engine.read(path)
    finally:
        _active = None


def write(path, data):
    if path.name == 'result.json' and data.get('status') == 'green_media_complete' and _active:
        data = dict(data, cache_reuse=dict(_active['record']))
    if path.name != 'delivery-manifest.json':
        return _base_write(path, data)
    root = path.parent
    recipes, actions = {}, {}
    for result_path in sorted((root/'jobs').glob('*/result.json')):
        row = engine.read(result_path)
        row_recipe = row['recipe']
        key = hashlib.sha256(json.dumps(row_recipe, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        recipes[key] = row_recipe
        stream = row['video_validation']['probe']['streams'][0]
        actions[row['id']] = {'result': result_path.relative_to(root).as_posix(),
            'result_sha256': engine.sha(result_path), 'recipe_sha256': key,
            'pixel_format': stream['pix_fmt'], 'codec': stream['codec_name'],
            'crf': row_recipe['crf'], 'frames': row['frames'],
            'cache_reuse': row.get('cache_reuse', {'reused': False, 'reason': 'Published by a prior frozen producer'}),
            'inherited_source_qa_status': row['inherited_source_qa_status']}
    default_recipe = data.get('recipe')
    data = dict(data)
    data.pop('recipe', None)
    data.update(schema=3, default_recipe_for_new_jobs=default_recipe, recipes=recipes,
                completed=actions, mixed_recipes=len(recipes) > 1,
                format_counts={fmt: sum(row['pixel_format'] == fmt for row in actions.values())
                               for fmt in sorted({row['pixel_format'] for row in actions.values()})})
    _base_write(root/'delivery-manifest-fast.json', data)


engine.source_job = source_job
engine.placed_rgba = placed_rgba
engine.recipe = recipe
engine.export_job = export_job
engine.write = write


def main(argv=None):
    return engine.main(argv)


if __name__ == '__main__':
    raise SystemExit(main())
