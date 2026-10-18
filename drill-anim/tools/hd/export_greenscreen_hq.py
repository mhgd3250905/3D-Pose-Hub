"""Chroma-preserving green-screen edit masters, using the frozen source/QA pipeline.

python tools/hiplab-render/export_greenscreen_hq.py --output <batch> --ids s-9090 --once --keep-alpha

New videos use H.264 yuv444p CRF12. Published yuv420p CRF14 videos remain intact
and are verified with their original exporter. Alpha placement and QA thresholds
are reused unchanged. The mixed-format manifest is delivery-manifest-hq.json,
so a concurrently running legacy watcher cannot overwrite its recipe records.
These 4:4:4 files are edit masters, not Android playback assets.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path


FROZEN_PATH = Path(__file__).with_name('export_greenscreen.py')
FROZEN_SHA256 = '2d58dddd48121734e432661b34a4fc4cd32d9e3a69a49de16c6f57f791f5ce75'
if hashlib.sha256(FROZEN_PATH.read_bytes()).hexdigest() != FROZEN_SHA256:
    raise RuntimeError('Frozen green exporter changed; audit its provenance before creating a new HQ producer')


def load_frozen(name):
    spec = importlib.util.spec_from_file_location(name, FROZEN_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# Separate module globals keep legacy verification completely unchanged.
legacy = load_frozen('greenscreen_frozen_yuv420p')
engine = load_frozen('greenscreen_frozen_hq_delegate')
_original_recipe = engine.recipe
_original_export_job = engine.export_job
_original_write = engine.write


def encode(frames, target, count):
    filters = ('color=c=0x00ff00:s=1080x1080:r=30,format=rgb24[bg];'
               '[bg][0:v]overlay=0:0:format=rgb:alpha=straight:shortest=1,format=yuv444p[out]')
    engine.run(['ffmpeg', '-v', 'error', '-n', '-filter_complex_threads', '1',
         '-framerate', str(engine.FPS), '-start_number', '0', '-i', frames / 'm-%04d.png',
         '-filter_complex', filters, '-map', '[out]', '-frames:v', str(count),
         '-an', '-c:v', 'libx264', '-threads', '2', '-preset', 'slow', '-crf', '12',
         '-pix_fmt', 'yuv444p', '-movflags', '+faststart', target])


def probe_video(path, count):
    probe = json.loads(engine.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames',
        '-show_entries', 'stream=codec_name,profile,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_read_frames:format=duration',
        '-of', 'json', path]))
    stream = probe['streams'][0]
    expected = {'codec_name': 'h264', 'pix_fmt': 'yuv444p', 'width': engine.SIZE,
                'height': engine.SIZE, 'r_frame_rate': '30/1', 'avg_frame_rate': '30/1'}
    for key, value in expected.items():
        if stream.get(key) != value:
            raise ValueError(f'Unexpected {key}: {stream.get(key)} in {path}')
    if int(stream['nb_read_frames']) != count:
        raise ValueError(f'Incomplete HQ output: expected {count} frames, got {stream["nb_read_frames"]}')
    if abs(float(probe['format']['duration']) - count/engine.FPS) > .02:
        raise ValueError('HQ output duration differs from the complete source')
    engine.run(['ffmpeg', '-v', 'error', '-xerror', '-threads', '1', '-i', path, '-f', 'null', '-'])
    return {'probe': probe, 'full_cpu_decode': True}


def recipe(keep_alpha):
    result = _original_recipe(keep_alpha)
    result.update(version=2, producer_sha256=engine.sha(__file__),
        delegate_producer_sha256=FROZEN_SHA256, pixel_format='yuv444p', crf=12,
        purpose='4:4:4 editing/chroma-key master; derive a compatible format before Android integration',
        qa='Frozen compare_pixels thresholds unchanged, including cyan MAE < 10')
    return result


def export_job(batch, sid, keep_alpha=False):
    root = batch/'greenscreen'
    path = root/'jobs'/sid/'result.json'
    if path.is_file():
        result = engine.read(path)
        pixel_format = result['recipe']['pixel_format']
        if pixel_format == 'yuv420p':
            return legacy.verify_existing(batch, root, result, legacy.recipe(keep_alpha))
        if pixel_format != 'yuv444p':
            raise ValueError('Unsupported published pixel format; old files are preserved: '+pixel_format)
    return _original_export_job(batch, sid, keep_alpha)


def write(path, data):
    if path.name != 'delivery-manifest.json':
        return _original_write(path, data)
    # Read every committed job's own recipe, never relabel old 4:2:0 products.
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
            'inherited_source_qa_status': row['inherited_source_qa_status']}
    keep_alpha = data.get('recipe', {}).get('keep_alpha', True)
    data = dict(data)
    data.pop('recipe', None)
    data.update(schema=2, default_recipe_for_new_jobs=recipe(keep_alpha),
                recipes=recipes, completed=actions, mixed_recipes=len(recipes) > 1,
                format_counts={fmt: sum(a['pixel_format'] == fmt for a in actions.values())
                               for fmt in sorted({a['pixel_format'] for a in actions.values()})})
    _original_write(root/'delivery-manifest-hq.json', data)


engine.encode = encode
engine.probe_video = probe_video
engine.recipe = recipe
engine.export_job = export_job
engine.write = write


def main(argv=None):
    return engine.main(argv)


if __name__ == '__main__':
    raise SystemExit(main())
