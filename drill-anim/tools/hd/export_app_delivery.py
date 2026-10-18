"""Select accepted Pose-Hub masters and derive playback clips from exact alpha.

Never keys green video or rerenders 3D. Original masters/frames stay untouched.
Outputs are H.264/yuv420p CRF18, 1080 square, true 30fps, #101013 and no audio.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd


BACKGROUND = np.array([16, 16, 19], dtype=float)


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024*1024), b''):
            h.update(block)
    return h.hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name+f'.{os.getpid()}.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    temp.replace(path)


def run(args):
    result = subprocess.run([str(x) for x in args], capture_output=True,
        **({'creationflags': subprocess.CREATE_NO_WINDOW} if os.name == 'nt' else {}))
    if result.returncode:
        raise RuntimeError(result.stderr.decode('utf-8', errors='replace')[-5000:])
    return result.stdout


def accepted(result):
    return (result.get('status') == 'green_media_complete' and result.get('composition_qa_pass') is True
        and result.get('inherited_source_qa_status') == 'pass'
        and result.get('inherited_source_qa', {}).get('pass') is True
        and result.get('video_validation', {}).get('full_cpu_decode') is True)


def alpha_binding(result):
    count = result['frames']
    rows = [result['outputs'][f'alpha_{i}'] for i in range(count)]
    if result['fps'] != 30 or len([k for k in result['outputs'] if k.startswith('alpha_')]) != count:
        raise ValueError('Source must have a complete exact-alpha sequence at true 30fps')
    return hashlib.sha256(json.dumps([row['sha256'] for row in rows], separators=(',', ':')).encode()).hexdigest()


def validate_source(row):
    result_path = Path(row['result'])
    if sha(result_path) != row['result_sha256']:
        raise ValueError('Selected result changed: '+row['id'])
    result = read(result_path)
    if not accepted(result) or result['id'] != row['id'] or alpha_binding(result) != row['alpha_binding_sha256']:
        raise ValueError('Selected source is not fully accepted: '+row['id'])
    root = Path(row['batch'])/'greenscreen'
    for i in range(result['frames']):
        item = result['outputs'][f'alpha_{i}']
        path = root/item['path']
        if sha(path) != item['sha256']:
            raise ValueError(f'Source alpha changed: {row["id"]} {i}')
        with Image.open(path) as image:
            if image.mode != 'RGBA' or image.size != (1080, 1080):
                raise ValueError('Expected actual 1080 straight-alpha PNG')
    return result


def checked_ids(values, label):
    if (not isinstance(values, list) or not values
            or any(not isinstance(sid, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', sid) for sid in values)):
        raise ValueError(label+' must contain nonempty safe drill IDs')
    if len(set(values)) != len(values):
        raise ValueError(label+' contains duplicate drill IDs')
    return values


def select(app, primary, overrides, selection, ids=None):
    batch_ids = checked_ids([row['id'] for row in read(primary/'source-manifest.json')['drills']], 'Primary manifest')
    app_ids = checked_ids([row['id'] for row in read(app/'assets/hip/hip-content.json')['drills']], 'App content') if app else None
    chosen = checked_ids(ids, 'Requested selection') if ids is not None else (app_ids or batch_ids)
    if app_ids is not None and not set(chosen) <= set(app_ids):
        raise ValueError('Requested drill is outside this App')
    sources = {sid: primary for sid in chosen}
    for batch in overrides:
        for path in (batch/'greenscreen/jobs').glob('*/result.json'):
            sid = checked_ids([read(path)['id']], 'Revision result')[0]
            if path.parent.name != sid:
                raise ValueError('Revision result ID differs from its directory: '+sid)
            if app_ids is not None and sid not in app_ids:
                raise ValueError('Revision contains a drill outside this App: '+sid)
            if sid in sources:
                sources[sid] = batch
    items = []
    for sid in sorted(chosen):
        batch = sources[sid]
        path = batch/'greenscreen/jobs'/sid/'result.json'
        result = read(path)
        if not accepted(result):
            raise ValueError('Rejected incomplete/review source: '+sid)
        spec_path = batch/'work'/(sid+'.spec.json')
        spec = read(spec_path)
        spec_sha = result['inputs']['work/'+sid+'.spec.json']
        if sha(spec_path) != spec_sha:
            raise ValueError('Source spec changed: '+sid)
        item = {'id': sid, 'batch': str(batch), 'result': str(path), 'result_sha256': sha(path),
            'source_commit': result['source_commit'], 'source_spec_sha256': spec_sha,
            'alpha': str(batch/'greenscreen/alpha'/sid), 'alpha_binding_sha256': alpha_binding(result),
            'frames': result['frames'], 'fps': 30, 'duration_seconds': result['frames']/30,
            'poster_time_seconds': max(0, min(float(spec.get('stillAt', 1)), result['frames']/30-.1)),
            'inherited_source_qa_status': 'pass', 'composition_qa_pass': True, 'full_cpu_decode': True}
        validate_source(item)
        items.append(item)
    data = {'schema': 1, 'expected': len(chosen), 'selected_pass': len(items), 'unresolved': [],
        'selected_ids': sorted(chosen), 'app_ids': sorted(chosen), 'items': items, 'app_replaced': False,
        'created_at': datetime.now(timezone.utc).isoformat()}
    if selection.exists():
        old = read(selection)
        if (old['items'] != data['items'] or old.get('selected_ids', old.get('app_ids')) != data['selected_ids']
                or old.get('expected') != len(chosen) or old.get('selected_pass') != len(chosen)):
            raise ValueError('Existing selection differs; preserve it and use another destination')
        return old
    write(selection, data)
    return data


def recipe():
    return {'producer_sha256': sha(__file__), 'background': '#101013', 'source': 'Exact 1080 straight-alpha PNGs; no green key',
        'codec': 'h264', 'pixel_format': 'yuv420p', 'size': 1080, 'fps': 30, 'crf': 18,
        'audio': False, 'faststart': True, 'preset': 'slow'}


def probe(path, frames):
    data = json.loads(run(['ffprobe', '-v', 'error', '-count_frames', '-show_entries',
        'stream=codec_type,codec_name,pix_fmt,width,height,r_frame_rate,avg_frame_rate,nb_read_frames:format=duration', '-of', 'json', path]))
    if len(data['streams']) != 1:
        raise ValueError('Ready clips must contain only one video stream and no audio')
    stream = data['streams'][0]
    values = ('video', 'h264', 'yuv420p', 1080, 1080, '30/1', '30/1', str(frames))
    keys = ('codec_type', 'codec_name', 'pix_fmt', 'width', 'height', 'r_frame_rate', 'avg_frame_rate', 'nb_read_frames')
    if tuple(stream.get(k) for k in keys) != values or abs(float(data['format']['duration'])-frames/30) > .02:
        raise ValueError('Ready clip dimensions/frame timing/codec differ from delivery recipe')
    run(['ffmpeg', '-v', 'error', '-xerror', '-threads', '1', '-i', path, '-f', 'null', '-'])
    return data


def samples(video, row, directory):
    indexes = sorted({0, row['frames']//2, row['frames']-1})
    select_filter = '+'.join(f'eq(n\\,{i})' for i in indexes)
    pixels = run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', video, '-vf', 'select='+select_filter,
        '-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-threads', '1', 'pipe:1'])
    arrays = np.frombuffer(pixels, np.uint8).reshape(len(indexes), 1080, 1080, 3)
    sheet = Image.new('RGB', (360*len(indexes), 388), (16, 16, 19))
    draw = ImageDraw.Draw(sheet)
    reports = []
    for i, frame in enumerate(indexes):
        with Image.open(Path(row['alpha'])/f'm-{frame:04d}.png') as image:
            source = np.asarray(image).astype(float)
        alpha = source[..., 3]/255
        expected = source[..., :3]*alpha[..., None]+BACKGROUND*(1-alpha[..., None])
        error = np.abs(arrays[i].astype(float)-expected)
        interior = nd.binary_erosion(alpha > .995, iterations=4)
        remote = nd.distance_transform_edt(alpha == 0) > 8
        edge = (alpha > .2) & (alpha < .8)
        green = (arrays[i][..., 1].astype(float) > arrays[i][..., 0].astype(float)+30) & (
            arrays[i][..., 1].astype(float) > arrays[i][..., 2].astype(float)+30)
        report = {'frame': frame, 'foreground_mae': float(error[interior].mean()),
            'remote_background_mae': float(error[remote].mean()),
            'alpha_edge_mae': float(error[edge].mean()) if edge.any() else None,
            'unexpected_green_background_pixels': int((green & remote).sum())}
        if report['foreground_mae'] >= 8 or report['remote_background_mae'] >= 3 or report['unexpected_green_background_pixels']:
            raise ValueError('App composite color/background QA failed: '+str(report))
        sheet.paste(Image.fromarray(arrays[i]).resize((360, 360), Image.Resampling.LANCZOS), (i*360, 28))
        draw.text((i*360+8, 8), f'{row["id"]} / frame {frame}', fill='white')
        reports.append(report)
    target = directory/(row['id']+'.png')
    sheet.save(target)
    return reports, target


def export(row, output, selection, derivative_recipe):
    sid = row['id']
    metric = output/'metrics'/(sid+'.json')
    target = output/(sid+'.mp4')
    if metric.exists():
        old = read(metric)
        if old['recipe'] != derivative_recipe or old['provenance']['source_result_sha256'] != row['result_sha256'] or sha(target) != old['sha256']:
            raise ValueError('Existing derivative changed; preserve this output')
        validate_source(row)
        probe(target, row['frames'])
        return old
    source = validate_source(row)
    if target.exists():
        raise FileExistsError('Partial derivative preserved: '+str(target))
    with tempfile.TemporaryDirectory(prefix=sid+'-', dir=output) as temporary:
        staging = Path(temporary)
        video = staging/(sid+'.mp4')
        filters = ('color=c=0x101013:s=1080x1080:r=30,format=rgb24[bg];'
            '[bg][0:v]overlay=0:0:format=rgb:alpha=straight:shortest=1,format=yuv420p[out]')
        run(['ffmpeg', '-v', 'error', '-n', '-filter_complex_threads', '1', '-framerate', '30',
            '-start_number', '0', '-i', Path(row['alpha'])/'m-%04d.png', '-filter_complex', filters,
            '-map', '[out]', '-frames:v', str(row['frames']), '-an', '-c:v', 'libx264', '-threads', '2',
            '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', video])
        validation = probe(video, row['frames'])
        reports, panel = samples(video, row, staging)
        validate_source(row)
        value = {'id': sid, 'pass': True, 'inherited_source_qa_status': 'pass', 'composition_qa_pass': True,
            'full_cpu_decode': True, 'video': sid+'.mp4', 'sha256': sha(video), 'bytes': video.stat().st_size,
            'frames': row['frames'], 'fps': 30, 'duration_seconds': row['frames']/30,
            'poster_time_seconds': row['poster_time_seconds'], 'recipe': derivative_recipe, 'probe': validation,
            'sample_checks': reports, 'verification_panel': 'verification/'+sid+'.png',
            'provenance': {'source_batch': row['batch'], 'source_commit': row['source_commit'],
                'source_result': row['result'], 'source_result_sha256': row['result_sha256'],
                'source_alpha_binding_sha256': row['alpha_binding_sha256'], 'source_spec_sha256': row['source_spec_sha256'],
                'selection': str(selection), 'selection_sha256': sha(selection)},
            'completed_at': datetime.now(timezone.utc).isoformat()}
        staged_metric = staging/'metric.json'
        write(staged_metric, value)
        metric.parent.mkdir(parents=True, exist_ok=True)
        (output/'verification').mkdir(exist_ok=True)
        os.link(video, target)
        os.link(panel, output/value['verification_panel'])
        os.link(staged_metric, metric)
    print('APP_READY', sid, row['frames'], flush=True)
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', type=Path, help='Optional HipLab checkout to constrain the selected IDs')
    parser.add_argument('--ids', nargs='+', help='Hub drill IDs; defaults to App content or the primary batch manifest')
    parser.add_argument('--primary', type=Path, required=True)
    parser.add_argument('--override', type=Path, action='append', default=[])
    parser.add_argument('--selection', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--workers', type=int, choices=(1, 2), default=2)
    args = parser.parse_args()
    selected = select(args.app.resolve() if args.app else None, args.primary.resolve(),
        [p.resolve() for p in args.override], args.selection.resolve(), ids=args.ids)
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    derivative_recipe = recipe()
    items = {}
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        jobs = [pool.submit(export, row, output, args.selection.resolve(), derivative_recipe) for row in selected['items']]
        for job in as_completed(jobs):
            row = job.result()
            items[row['id']] = row
    expected_ids = selected.get('selected_ids', selected['app_ids'])
    if set(items) != set(expected_ids) or len(items) != len(expected_ids):
        raise ValueError('Incomplete Android delivery')
    write(output/'delivery.json', {'schema': 1, 'kind': 'pose-hub-app-exact-alpha', 'all_complete': True,
        'selection': str(args.selection.resolve()), 'selection_sha256': sha(args.selection), 'recipe': derivative_recipe,
        'items': dict(sorted(items.items())), 'created_at': datetime.now(timezone.utc).isoformat()})
    print('APP_DELIVERY_COMPLETE', len(items), output, flush=True)


if __name__ == '__main__':
    main()
