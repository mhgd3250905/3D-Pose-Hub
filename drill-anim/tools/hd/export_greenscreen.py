"""Add green-screen derivatives from completed HipLab RGBA frames, without rendering.

python tools/hiplab-render/export_greenscreen.py --output <batch> --once --keep-alpha
python tools/hiplab-render/export_greenscreen.py --output <batch> --watch --keep-alpha
python tools/hiplab-render/export_greenscreen.py --output <batch> --demo-id n-chair-wiper --demo-frame 60

Only the additive <batch>/greenscreen subtree is written. Originals and App assets
are never changed. Completed source QA is inherited verbatim, including review.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd


SIZE = 1080
FPS = 30
GREEN = np.array([0, 255, 0], dtype=float)
TERMINAL = {'completed', 'completed_with_issues', 'failed', 'error', 'paused_low_disk', 'stopped'}


class IncompleteSource(Exception):
    """Source is still rendering; do not publish a shortened derivative."""


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + f'.{os.getpid()}.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n',
                         encoding='utf-8', newline='\n')
    temporary.replace(path)


def run(command):
    result = subprocess.run([str(arg) for arg in command], capture_output=True,
                            **({'creationflags': subprocess.CREATE_NO_WINDOW} if os.name == 'nt' else {}))
    if result.returncode:
        raise RuntimeError(result.stderr.decode('utf-8', errors='replace')[-6000:])
    return result.stdout


def ident(value):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', value):
        raise argparse.ArgumentTypeError('Drill ID must contain only letters, digits, hyphens or underscores')
    return value


def placement_round(value):
    # This batch's authoritative compositor is Python comp.py, including ties.
    return round(value)


def placed_rgba(raw, place):
    """Keep straight alpha: paste has NO mask argument, including at clipped edges."""
    with Image.open(raw) as image:
        if image.mode != 'RGBA':
            raise ValueError(f'Source must be actual RGBA, not a flattened RGB frame: {raw}')
        width = placement_round(image.width * place['s'])
        height = placement_round(image.height * place['s'])
        if not 1 <= width <= 8192 or not 1 <= height <= 8192:
            raise ValueError('Invalid placement scale')
        scaled = image.resize((width, height), Image.Resampling.LANCZOS)
    x, y = placement_round(place['ox']), placement_round(place['oy'])
    if x >= SIZE or y >= SIZE or x + width <= 0 or y + height <= 0:
        raise ValueError('Foreground placement falls outside the canvas')
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(scaled, (x, y))  # Using scaled as mask here would apply alpha twice.
    return canvas


def composite_reference(rgba, background=GREEN):
    array = np.asarray(rgba).astype(float)
    alpha = array[..., 3:4] / 255
    return np.uint8(np.clip(np.rint(array[..., :3]*alpha + background*(1-alpha)), 0, 255))


def encode(frames, target, count):
    # The renderer produces true 30fps. This does not interpolate or duplicate 15fps.
    filters = ('color=c=0x00ff00:s=1080x1080:r=30,format=rgb24[bg];'
               '[bg][0:v]overlay=0:0:format=rgb:alpha=straight:shortest=1,format=yuv420p[out]')
    run(['ffmpeg', '-v', 'error', '-n', '-filter_complex_threads', '1',
         '-framerate', str(FPS), '-start_number', '0', '-i', frames / 'm-%04d.png',
         '-filter_complex', filters, '-map', '[out]', '-frames:v', str(count),
         '-an', '-c:v', 'libx264', '-threads', '2', '-preset', 'slow', '-crf', '14',
         '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target])


def probe_video(path, count):
    probe = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames',
        '-show_entries', 'stream=codec_name,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_read_frames:format=duration',
        '-of', 'json', path]))
    stream = probe['streams'][0]
    expected = {'codec_name': 'h264', 'pix_fmt': 'yuv420p', 'width': SIZE,
                'height': SIZE, 'r_frame_rate': '30/1', 'avg_frame_rate': '30/1'}
    for key, value in expected.items():
        if stream.get(key) != value:
            raise ValueError(f'Unexpected {key}: {stream.get(key)} in {path}')
    if int(stream['nb_read_frames']) != count:
        raise ValueError(f'Incomplete output: expected {count} frames, got {stream["nb_read_frames"]}')
    if abs(float(probe['format']['duration']) - count/FPS) > .02:
        raise ValueError('Output duration differs from the complete source')
    run(['ffmpeg', '-v', 'error', '-xerror', '-threads', '1', '-i', path, '-f', 'null', '-'])
    return {'probe': probe, 'full_cpu_decode': True}


def decode_samples(path, indexes):
    select = '+'.join(f'eq(n\\,{i})' for i in indexes)
    raw = run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', path, '-vf', 'select='+select,
               '-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-threads', '1', 'pipe:1'])
    array = np.frombuffer(raw, np.uint8)
    if array.size != len(indexes)*SIZE*SIZE*3:
        raise ValueError('Temporal sample decode failed')
    return array.reshape(len(indexes), SIZE, SIZE, 3)


def key_matte(rgb):
    distance = np.sqrt(np.mean((rgb.astype(float)/255 - GREEN/255)**2, axis=2))
    return np.clip((distance-.10)/.10, 0, 1)


def compare_pixels(actual, reference):
    source = np.asarray(reference)
    alpha = source[..., 3].astype(float)/255
    expected = composite_reference(reference)
    opaque = nd.binary_erosion(alpha > .995, iterations=4)
    background = nd.distance_transform_edt(alpha == 0) > 8
    cyan = opaque & (source[..., 2] > 140) & (source[..., 1] > 120) & (
        source[..., 2].astype(float) > source[..., 0].astype(float)*1.4)
    error = np.abs(actual.astype(float)-expected)
    green = (actual[..., 0] <= 12) & (actual[..., 1] >= 245) & (actual[..., 2] <= 12)
    matte = key_matte(actual)
    edges = (alpha > .2) & (alpha < .8)
    double = source[..., :3]*alpha[..., None]**2 + GREEN*(1-alpha[..., None]**2)
    row = {'background_pixels': int(background.sum()), 'opaque_foreground_pixels': int(opaque.sum()),
           'background_green_fraction': float(green[background].mean()) if background.any() else None,
           'foreground_mae': float(error[opaque].mean()) if opaque.any() else None,
           'cyan_pixels': int(cyan.sum()), 'cyan_mae': float(error[cyan].mean()) if cyan.any() else None,
           'cyan_key_matte_min': float(matte[cyan].min()) if cyan.any() else None,
           'opaque_pixels_retained_by_ordinary_key_fraction': float((matte[opaque] > .99).mean()) if opaque.any() else None,
           'alpha_edge_pixels': int(edges.sum()),
           'straight_alpha_edge_mae': float(error[edges].mean()) if edges.any() else None,
           'double_alpha_edge_mae': float(np.abs(actual.astype(float)-double)[edges].mean()) if edges.any() else None}
    if not background.any() or row['background_green_fraction'] < .999:
        raise ValueError(f'Background is not pure remote green: {row}')
    if not opaque.any() or row['foreground_mae'] >= 8:
        raise ValueError(f'Foreground colors changed: {row}')
    if cyan.any() and (row['cyan_mae'] >= 10 or row['cyan_key_matte_min'] < .99):
        raise ValueError(f'Cyan highlight lost: {row}')
    return row


def panel(path, actual, reference):
    matte = key_matte(actual)[..., None]
    images = [actual, composite_reference(reference)]
    labels = ['Encoded green', 'Exact source alpha / green']
    for color, name in (([255, 255, 255], 'white'), ([24, 24, 28], 'dark')):
        images += [np.uint8(actual*matte+np.array(color)*(1-matte)),
                   composite_reference(reference, np.array(color))]
        labels += ['Ordinary key / '+name, 'Exact source alpha / '+name]
    sheet = Image.new('RGB', (3*360, 2*388), 'white')
    draw = ImageDraw.Draw(sheet)
    for index, (pixels, label) in enumerate(zip(images, labels)):
        x, y = index % 3*360, index // 3*388
        sheet.paste(Image.fromarray(pixels).resize((360, 360), Image.Resampling.LANCZOS), (x, y+28))
        draw.text((x+6, y+7), label, fill='black')
    sheet.save(path)


def recipe(keep_alpha):
    return {'version': 1, 'producer_sha256': sha(__file__), 'background': '#00FF00',
        'size': SIZE, 'fps': FPS, 'codec': 'h264', 'pixel_format': 'yuv420p', 'crf': 14,
        'placement': 'Source place.json with Python comp.py rounding; Pillow Lanczos resize, paste without mask',
        'alpha': 'straight, FFmpeg overlay alpha=straight; optional exact placed PNG sequence',
        'keep_alpha': keep_alpha, 'omitted': ['gradient', 'synthetic floor shadow', 'outer halo', 'external bloom'],
        'foreground': 'Original m- RGBA body, muscle highlights and props; no recoloring or 3D rendering',
        'ordinary_key': 'Preview only: normalized RGB distance .10/.20; fixed thresholds, no muscle erosion',
        'scope': 'Composition/codec QA only; source posture pass/review is inherited; no App replacement'}


def source_job(batch, sid):
    spec_path = batch/'work'/(sid+'.spec.json')
    place_path = batch/'work'/sid/'c/place.json'
    metric_path = batch/'master/metrics'/(sid+'.json')
    master_path = batch/'master'/(sid+'.mp4')
    if not all(p.is_file() for p in (spec_path, place_path, metric_path)):
        raise IncompleteSource('Awaiting completed QA, spec and placement')
    # New green-primary batches intentionally have no flattened dark master.
    # The exporter may be called synchronously before the queue status updates.
    queue_path = batch/'queue-status.json'
    queue = read(queue_path) if queue_path.is_file() else {}
    status = queue.get('items', {}).get(sid, {}).get('status')
    try:
        spec, qa = read(spec_path), read(metric_path)
    except json.JSONDecodeError:
        raise IncompleteSource('Source spec/QA write is still in progress')
    count = round(spec['timeline']['duration']*spec['fps'])
    if spec.get('id') != sid or spec['fps'] != FPS or qa.get('fps') != FPS:
        raise ValueError('Source ID/fps does not match a true 30fps batch')
    if not qa.get('frames_complete') or qa.get('frames') != count:
        raise IncompleteSource('Source QA has not recorded every frame')
    inherited = 'pass' if qa.get('pass') else 'review'
    if status == 'review':
        inherited = 'review'
    fr = batch/'work'/sid/'fr'
    frames = [fr/f'm-{i:04d}.png' for i in range(count)]
    if not all(p.is_file() for p in frames):
        raise IncompleteSource('Raw RGBA frame sequence has gaps')
    metrics = sorted(fr.glob('met-*.json'))
    rows = {}
    for path in metrics:
        for row in read(path):
            if row['f'] >= 0:
                if row['f'] in rows and rows[row['f']] != row:
                    raise ValueError('Conflicting source frame metadata')
                rows[row['f']] = row
    if set(rows) != set(range(count)) or any(abs(rows[i]['t']-i/FPS) > 1e-6 for i in range(count)):
        raise IncompleteSource('Source frame metadata is incomplete or not true 30fps')
    paths = [spec_path, place_path, metric_path, batch/'source-manifest.json', *metrics, *frames]
    if master_path.is_file():
        paths.append(master_path)  # Bind preserved old-style dark masters when present.
    hashes = {str(p.relative_to(batch)).replace('\\', '/'): sha(p) for p in paths}
    poster = max(0, min(count-1, round(float(spec.get('stillAt', 1))*FPS)))
    return {'id': sid, 'frames': frames, 'count': count, 'poster': poster,
            'place': read(place_path), 'qa_status': inherited, 'qa': qa,
            'inputs': hashes, 'source_manifest': read(batch/'source-manifest.json')}


def verify_inputs(batch, hashes):
    for relative, expected in hashes.items():
        if sha(batch/relative) != expected:
            raise ValueError('Frozen source changed: '+relative)


def verify_existing(batch, root, result, expected_recipe):
    if result['recipe'] != expected_recipe:
        raise ValueError('Existing recipe differs; preserve this batch and choose a new export batch')
    verify_inputs(batch, result['inputs'])
    for row in result['outputs'].values():
        if sha(root/row['path']) != row['sha256']:
            raise ValueError('Existing output changed: '+row['path'])
    probe_video(root/result['outputs']['master']['path'], result['frames'])
    return result


def publish(staged, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    # Hard link is an atomic, exclusive create, and never replaces an old product.
    os.link(staged, target)


def export_job(batch, sid, keep_alpha=False):
    root = batch/'greenscreen'
    result_path = root/'jobs'/sid/'result.json'
    expected_recipe = recipe(keep_alpha)
    if result_path.is_file():
        return verify_existing(batch, root, read(result_path), expected_recipe)
    job = source_job(batch, sid)
    lock_path = root/'locks'/(sid+'.lock')
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open('x', encoding='utf-8') as lock:
        lock.write(str(os.getpid()))
    try:
        with tempfile.TemporaryDirectory(prefix=sid+'-', dir=root) as directory:
            staging = Path(directory)
            alpha_dir = staging/'alpha'
            alpha_dir.mkdir()
            for i, raw in enumerate(job['frames']):
                placed_rgba(raw, job['place']).save(alpha_dir/f'm-{i:04d}.png')
            video = staging/'master.mp4'
            encode(alpha_dir, video, job['count'])
            validation = probe_video(video, job['count'])
            indexes = sorted({0, job['poster'], job['count']//2, job['count']-1})
            decoded = decode_samples(video, indexes)
            samples = []
            products = {'master': (video, Path('media/master')/(sid+'-greenscreen.mp4'))}
            poster = staging/'poster.png'
            with Image.open(alpha_dir/f'm-{job["poster"]:04d}.png') as image:
                Image.fromarray(composite_reference(image)).save(poster)
            products['poster'] = (poster, Path('media/posters')/(sid+'-greenscreen.png'))
            for i, f in enumerate(indexes):
                with Image.open(alpha_dir/f'm-{f:04d}.png') as reference:
                    row = compare_pixels(decoded[i], reference)
                    row['frame'] = f
                    samples.append(row)
                    comparison = staging/f'key-{f:04d}.png'
                    panel(comparison, decoded[i], reference)
                    products[f'comparison_{f}'] = (comparison, Path('verification')/sid/comparison.name)
            if keep_alpha:
                for i in range(job['count']):
                    products[f'alpha_{i}'] = (alpha_dir/f'm-{i:04d}.png', Path('alpha')/sid/f'm-{i:04d}.png')
            verify_inputs(batch, job['inputs'])
            for _, relative in products.values():
                if (root/relative).exists():
                    raise FileExistsError(f'Partial/old product preserved, refusing overwrite: {root/relative}')
            result = {'id': sid, 'status': 'green_media_complete', 'composition_qa_pass': True,
                'inherited_source_qa_status': job['qa_status'], 'inherited_source_qa': job['qa'],
                'all_posture_qa_passed': False, 'app_replaced': False, 'frames': job['count'],
                'fps': FPS, 'duration_seconds': job['count']/FPS, 'recipe': expected_recipe,
                'source_commit': job['source_manifest']['source_commit'], 'inputs': job['inputs'],
                'video_validation': validation, 'temporal_samples': samples,
                'outputs': {name: {'path': relative.as_posix(), 'sha256': sha(path), 'bytes': path.stat().st_size}
                            for name, (path, relative) in products.items()},
                'completed_at': datetime.now(timezone.utc).isoformat()}
            staged_result = staging/'result.json'
            write(staged_result, result)
            for path, relative in products.values():
                publish(path, root/relative)
            publish(staged_result, result_path)  # Commit marker is always the final write.
            return result
    finally:
        lock_path.unlink(missing_ok=True)


def demonstrate(batch, sid, frame):
    """One available preview frame, explicitly not a complete motion delivery."""
    target = batch/'greenscreen/demonstrations'/f'{sid}-frame{frame:04d}'
    raw = batch/'preview-work'/sid/'fr'/f'm-{frame:04d}.png'
    place_path = batch/'preview-work'/sid/'c/place.json'
    raw_sha, place_sha = sha(raw), sha(place_path)
    if target.exists():
        raise FileExistsError('Demonstration already exists; preserve it: '+str(target))
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='demo-', dir=target.parent) as temporary:
        stage = Path(temporary)
        reference = placed_rgba(raw, read(place_path))
        alpha_dir = stage/'alpha'
        alpha_dir.mkdir()
        reference.save(alpha_dir/'m-0000.png')
        encode(alpha_dir, stage/'one-frame-test.mp4', 1)
        video_check = probe_video(stage/'one-frame-test.mp4', 1)
        actual = decode_samples(stage/'one-frame-test.mp4', [0])[0]
        metrics = compare_pixels(actual, reference)
        Image.fromarray(composite_reference(reference)).save(stage/'greenscreen.png')
        panel(stage/'key-comparison.png', actual, reference)
        reference.save(stage/'placed-straight-alpha.png')
        # A one-frame codec check is not published into the full-motion media tree.
        (stage/'one-frame-test.mp4').unlink()
        shutil.rmtree(alpha_dir)
        write(stage/'demonstration.json', {'id': sid, 'frame': frame, 'scope': 'Single preview frame only; full loop not exported',
            'source_raw': str(raw), 'source_raw_sha256': raw_sha, 'placement_sha256': place_sha,
            'recipe': recipe(True), 'video_codec_single_frame_check': video_check, 'metrics': metrics,
            'outputs': {p.name: sha(p) for p in stage.iterdir() if p.is_file()}, 'app_replaced': False})
        if sha(raw) != raw_sha or sha(place_path) != place_sha:
            raise ValueError('Preview source changed during demonstration')
        target.mkdir()
        for path in stage.iterdir():
            publish(path, target/path.name)
    return target


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path, help='Existing HipLab render batch')
    parser.add_argument('--ids', nargs='+', type=ident, help='Only these source drill IDs')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--watch', action='store_true', help='Scan until source queue terminates')
    mode.add_argument('--once', action='store_true', help='One scan (default); incomplete items remain pending')
    parser.add_argument('--keep-alpha', action='store_true', help='Keep exact 1080 straight-alpha PNG sequence')
    parser.add_argument('--poll-seconds', type=float, default=10)
    parser.add_argument('--demo-id', type=ident, help='Only demonstrate an existing preview frame; never export a loop')
    parser.add_argument('--demo-frame', type=int, default=60)
    args = parser.parse_args(argv)
    if not 1 <= args.poll_seconds <= 60:
        parser.error('--poll-seconds must be between 1 and 60')
    batch = args.output.resolve()
    if not (batch/'source-manifest.json').is_file():
        parser.error('--output must point to an existing batch with source-manifest.json')
    if args.demo_id:
        print(demonstrate(batch, args.demo_id, args.demo_frame), flush=True)
        return 0
    ids = args.ids or [row['id'] for row in read(batch/'source-manifest.json')['drills']]
    manifest_ids = {row['id'] for row in read(batch/'source-manifest.json')['drills']}
    if not set(ids) <= manifest_ids:
        parser.error('Unknown source drill ID')
    done, failures, pending = {}, {}, {}
    while True:
        for sid in ids:
            if sid in done or sid in failures:
                continue
            try:
                result = export_job(batch, sid, args.keep_alpha)
                done[sid] = result
                pending.pop(sid, None)
                print('GREEN_COMPLETE', sid, result['inherited_source_qa_status'], flush=True)
            except IncompleteSource as exc:
                pending[sid] = str(exc)
            except Exception as exc:
                failures[sid] = str(exc)
                pending.pop(sid, None)
                print('GREEN_FAILED', sid, str(exc), file=sys.stderr, flush=True)
        queue_file = batch/'queue-status.json'
        queue_status = read(queue_file).get('status') if queue_file.is_file() else None
        terminal = queue_status in TERMINAL
        recorded = {}
        for path in sorted((batch/'greenscreen/jobs').glob('*/result.json')):
            row = read(path)
            recorded[row['id']] = {'result': f'jobs/{row["id"]}/result.json',
                'inherited_source_qa_status': row['inherited_source_qa_status'],
                'result_sha256': sha(path)}
        write(batch/'greenscreen/delivery-manifest.json', {'recipe': recipe(args.keep_alpha),
            'completed': recorded, 'requested_ids': ids,
            'requested_scope': 'selected_ids' if args.ids else 'entire_source_batch',
            'batch_source_count': len(manifest_ids), 'batch_completed_count': len(recorded),
            'all_batch_derivatives_complete': len(recorded) == len(manifest_ids),
            'pending': pending, 'failed': failures, 'source_queue_status': queue_status,
            'all_requested_complete': len(done) == len(ids), 'all_posture_qa_passed': False,
            'app_replaced': False, 'updated_at': datetime.now(timezone.utc).isoformat()})
        if not args.watch or terminal or len(done)+len(failures) == len(ids):
            print(f'Green derivatives: {len(done)} complete, {len(pending)} pending, {len(failures)} failed', flush=True)
            return 1 if failures or (terminal and pending) else 0
        time.sleep(args.poll_seconds)


if __name__ == '__main__':
    raise SystemExit(main())
