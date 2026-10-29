#!/usr/bin/env python3
"""Verify immutable completion captures and prepare App media without a browser.

Input PNGs are straight RGBA with the highlight already baked in. The renderer
has removed the ground-shadow pass. This tool never edits a capture or grants
visual/content/release approval. Each operation requires a new output directory.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path, PurePosixPath
from fractions import Fraction
import re
import shutil
import subprocess
import sys

os.environ.setdefault('OMP_NUM_THREADS', '1')
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
os.environ.setdefault('MKL_NUM_THREADS', '1')

from PIL import Image, ImageDraw, ImageFont
import numpy as np


CAPTURE_FORMAT = 'pose-hub-completion-capture@1'
QA_FORMAT = 'pose-hub-completion-preview-qa@1'
EXPORT_FORMAT = 'pose-hub-completion-app-export@1'
APP_SIZE = 720
BACKGROUNDS = {'white': (255, 255, 255), 'dark': (16, 16, 19), 'cyan': (0, 220, 220)}
WINDOWS_HIDDEN = getattr(subprocess, 'CREATE_NO_WINDOW', 0)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def read_json(path):
    with Path(path).open('r', encoding='utf-8-sig') as stream:
        return json.load(stream)


def write_new_json(path, value):
    with Path(path).open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write('\n')


def reference(path, root=None, **extra):
    path = Path(path).resolve()
    return {'path': path.relative_to(root).as_posix() if root else str(path),
            'bytes': path.stat().st_size, 'sha256': sha256(path), **extra}


def new_output(path):
    output = Path(path).resolve()
    if output.exists():
        raise FileExistsError('Output already exists; choose a new attempt directory')
    output.mkdir(parents=True)
    return output


def safe_input(root, relative):
    require(isinstance(relative, str) and relative and '\\' not in relative,
            'Capture paths must be relative POSIX paths')
    pure = PurePosixPath(relative)
    require(not pure.is_absolute() and ':' not in relative and '..' not in pure.parts,
            'Capture path escapes its root')
    candidate = root.joinpath(*pure.parts).resolve()
    require(candidate.is_relative_to(root) and candidate.is_file(),
            'Missing image or resolved path outside capture root: ' + relative)
    return candidate


def bounds_union(left, right):
    if left is None:
        return list(right)
    return [min(left[0], right[0]), min(left[1], right[1]),
            max(left[2], right[2]), max(left[3], right[3])]


def image_bounds(image):
    with image.getchannel('A') as alpha:
        bounds = alpha.getbbox()
    margins = None if bounds is None else [bounds[0], bounds[1],
                                           image.width - bounds[2], image.height - bounds[3]]
    return {'bounds': list(bounds) if bounds else None, 'marginsPx': margins,
            'empty': bounds is None, 'touchesSourceEdge': margins is not None and min(margins) == 0}


def load_capture(capture_path, require_full=False):
    path = Path(capture_path).resolve()
    capture = read_json(path)
    require(capture.get('format') == CAPTURE_FORMAT and capture.get('complete') is True,
            'Complete pose-hub-completion-capture@1 input required')
    require(capture.get('groundShadow') is False, 'Ground-shadow-free capture required')
    require(capture.get('cameraMotion') is False, 'Fixed-camera capture required')
    require(capture.get('mode') in ('preview', 'full'), 'Invalid capture mode')
    if require_full:
        require(capture['mode'] == 'full', 'Export requires a complete full capture')
    size = capture.get('size')
    require(type(size) is int and 240 <= size <= 1080, 'Invalid capture dimensions')
    plan = capture.get('plan', {})
    fps, count, duration = plan.get('fps'), plan.get('frameCount'), plan.get('durationSeconds')
    require(type(fps) is int and 0 < fps <= 120 and type(count) is int and count > 0
            and isinstance(duration, (int, float)) and math.isfinite(duration) and duration > 0
            and abs(count - fps * duration) < 1e-6, 'Invalid capture timing')
    rows = capture.get('images')
    require(isinstance(rows, list) and rows, 'Capture contains no image references')
    seen, paths = set(), set()
    for row in rows:
        require(isinstance(row, dict), 'Invalid image reference')
        frame, view = row.get('frame'), row.get('view')
        require(type(frame) is int and 0 <= frame <= count and isinstance(view, str) and view,
                'Invalid frame/view identity')
        require((frame, view) not in seen and row.get('path') not in paths,
                'Duplicate image/frame/view reference')
        seen.add((frame, view)); paths.add(row.get('path'))
        file = safe_input(path.parent, row.get('path'))
        require(type(row.get('bytes')) is int and file.stat().st_size == row['bytes'],
                'Image byte length changed: ' + row['path'])
        require(sha256(file) == row.get('sha256', row.get('sha')),
                'Image SHA-256 changed: ' + row['path'])
        with Image.open(file) as image:
            require(image.format == 'PNG' and image.mode == 'RGBA' and image.size == (size, size),
                    'Actual image must be capture-sized RGBA PNG: ' + row['path'])
            image.load()
    main = sorted((r for r in rows if r['view'] == 'main' and r['frame'] < count), key=lambda r: r['frame'])
    require(main, 'No playable main-view frames')
    if capture['mode'] == 'full':
        require([r['frame'] for r in main] == list(range(count)),
                'Full capture main frames must cover exactly 0..N-1')
    elif 'previewFrames' in plan:
        require(sorted(r['frame'] for r in rows if r['view'] == 'main') == sorted(plan['previewFrames']),
                'Preview main coverage does not match its plan')
    # Bind the source-fingerprint manifest when supplied by the renderer. A
    # synthetic capture may omit it; this is explicit in the resulting report.
    source_manifest = path.parent / 'source-manifest.json'
    source_reference = None
    if source_manifest.exists():
        source = read_json(source_manifest)
        require(source.get('sha256') == capture.get('sourceSha256'), 'Source fingerprint identity changed')
        require(isinstance(source.get('sources'), list), 'Source fingerprint has no source list')
        payload = json.dumps(source['sources'], ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        require(hashlib.sha256(payload).hexdigest() == source['sha256'], 'Source fingerprint list changed')
        source_reference = reference(source_manifest)
    return {'path': path, 'root': path.parent, 'capture': capture, 'rows': rows,
            'main': main, 'sourceManifest': source_reference}


def scan_images(context):
    union = None
    measured = []
    count = context['capture']['plan']['frameCount']
    for row in context['rows']:
        with Image.open(safe_input(context['root'], row['path'])) as image:
            result = image_bounds(image)
        result.update({key: row[key] for key in ('frame', 'view', 'path')})
        result['endpoint'] = row['frame'] == count
        measured.append(result)
        if row['view'] == 'main' and row['frame'] < count and result['bounds'] is not None:
            union = bounds_union(union, result['bounds'])
    return measured, union


def checkerboard(size, cell=16):
    image = Image.new('RGBA', size, (238, 238, 238, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(198, 198, 198, 255))
    return image


def contact_sheet(context, measured, output, maximum=48):
    rows = sorted(measured, key=lambda row: (row['frame'], {'main': 0, 'side': 1, 'opposite': 2}.get(row['view'], 3)))
    if len(rows) > maximum:
        indices = sorted({round(i * (len(rows) - 1) / (maximum - 1)) for i in range(maximum)})
        rows = [rows[i] for i in indices]
    columns, tile, label, header = 4, 240, 44, 42
    sheet = Image.new('RGB', (columns * tile, math.ceil(len(rows) / columns) * (tile + label) + header), '#ffffff')
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 14)
    except OSError:
        font = ImageFont.load_default()
    draw.text((8, 8), context['capture'].get('specId', 'capture') + ' | actual RGBA preview', fill='#111111', font=font)
    for i, row in enumerate(rows):
        x, y = i % columns * tile, i // columns * (tile + label) + header
        with Image.open(safe_input(context['root'], row['path'])) as image:
            small = image.convert('RGBa').resize((tile, tile), Image.Resampling.LANCZOS).convert('RGBA')
        background = checkerboard((tile, tile))
        panel = Image.alpha_composite(background, small).convert('RGB')
        sheet.paste(panel, (x, y))
        state = 'EMPTY' if row['empty'] else 'EDGE' if row['touchesSourceEdge'] else 'bounds OK'
        suffix = ' endpoint' if row['endpoint'] else ''
        draw.text((x + 5, y + tile + 3), f"f{row['frame']:04d} {row['view']}{suffix}", fill='#111111', font=font)
        draw.text((x + 5, y + tile + 22), state, fill='#b00020' if state != 'bounds OK' else '#176a21', font=font)
        panel.close(); background.close(); small.close()
    file = output / 'contact-sheet.png'
    sheet.save(file); sheet.close()
    return reference(file, output), [{key: row[key] for key in ('frame', 'view', 'path')} for row in rows]


def preview_qa(capture_path, output_path):
    output = new_output(output_path)
    report = {'format': QA_FORMAT, 'createdAt': datetime.now(timezone.utc).isoformat(),
              'passed': False, 'status': 'failed', 'reviewed': False, 'releaseEligible': False,
              'groundShadow': False, 'limits': ['Bounds checks do not prove action correctness or mesh-contact quality.']}
    try:
        context = load_capture(capture_path)
        measured, union = scan_images(context)
        empty = [r for r in measured if r['empty']]
        edge = [r for r in measured if r['touchesSourceEdge']]
        report.update({'capture': reference(context['path']), 'sourceManifest': context['sourceManifest'],
                       'specId': context['capture'].get('specId'), 'sourceSha256': context['capture'].get('sourceSha256'),
                       'captureMode': context['capture']['mode'], 'size': context['capture']['size'],
                       'imageCount': len(measured), 'byView': dict(Counter(r['view'] for r in measured)),
                       'frames': measured, 'emptyFrames': empty, 'sourceEdgeFrames': edge,
                       'mainContentRect': union,
                       'mainContentRectPolicy': 'Union of main-view playable frames only; side/opposite views and N endpoint excluded.',
                       'mainRectIsFullCycle': context['capture']['mode'] == 'full'})
        report['contactSheet'], report['contactSheetFrames'] = contact_sheet(context, measured, output)
        report['passed'] = union is not None and not empty and not edge
        report['status'] = 'pass' if report['passed'] else 'failed'
        if not report['passed']:
            report['error'] = 'Empty RGBA or source-edge alpha detected; preserve this attempt and use a new capture.'
        require(sha256(context['path']) == report['capture']['sha256'], 'Capture metadata changed during QA')
    except Exception as error:
        report.update({'passed': False, 'status': 'failed', 'error': str(error)})
    write_new_json(output / 'qa.json', report)
    return report


def verify_image(context, row):
    file = safe_input(context['root'], row['path'])
    require(file.stat().st_size == row['bytes'] and sha256(file) == row.get('sha256', row.get('sha')),
            'Pinned source PNG changed: ' + row['path'])
    return file


def fixed_framing(bounds, source_size, margin=.06):
    require(bounds and .05 <= margin <= .25, 'Valid content bounds and 5..25% margin required')
    side = math.ceil(max(bounds[2] - bounds[0], bounds[3] - bounds[1]) / (1 - margin * 2))
    left = math.floor((bounds[0] + bounds[2] - side) / 2)
    top = math.floor((bounds[1] + bounds[3] - side) / 2)
    return {'format': 'pose-hub-completion-framing@1', 'sourceSize': [source_size, source_size],
            'sourceBounds': bounds, 'crop': [left, top, left + side, top + side],
            'marginFraction': margin, 'targetSize': [APP_SIZE, APP_SIZE],
            'policy': 'One fixed square from all playable main frames; body/props only; no ground shadow.'}


def resized_rgba(context, row, framing, size=APP_SIZE):
    with Image.open(verify_image(context, row)) as image:
        require(image.mode == 'RGBA', 'Source lost RGBA')
        with image.crop(tuple(framing['crop'])) as cropped:
            # Associated colour and alpha must be filtered together. Returning
            # to RGBA restores the straight RGB required by the App protocol.
            with cropped.convert('RGBa') as associated:
                with associated.resize((size, size), Image.Resampling.LANCZOS) as small:
                    return small.convert('RGBA')


def edge_bleed(rgba, radius=8):
    from scipy.ndimage import distance_transform_edt
    array = np.asarray(rgba, dtype=np.uint8)
    rgb = array[..., :3].copy()
    known = array[..., 3] > 0
    if known.any():
        distance, indices = distance_transform_edt(~known, return_indices=True)
        fill = (~known) & (distance <= radius)
        rgb[fill] = rgb[indices[0][fill], indices[1][fill]]
    return rgb


def pack_frame(rgba, bleed=8):
    array = np.asarray(rgba, dtype=np.uint8)
    alpha = np.repeat(array[..., 3:4], 3, axis=2)
    return np.ascontiguousarray(np.concatenate((edge_bleed(rgba, bleed), alpha), axis=0))


def tool(name):
    file = shutil.which(name)
    require(file is not None, name + ' is required on PATH')
    return file


def encoder_command(video, fps, crf=12, preset='slow'):
    return [tool('ffmpeg'), '-v', 'error', '-nostdin', '-filter_threads', '1',
            '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '720x1440', '-r', str(fps), '-i', 'pipe:0', '-an',
            '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709',
            '-c:v', 'libx264', '-threads', '2', '-preset', preset, '-crf', str(crf), '-pix_fmt', 'yuv420p',
            '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
            '-movflags', '+faststart', '-n', str(video)]


def probe_video(video, plan):
    process = subprocess.run([tool('ffprobe'), '-v', 'error', '-show_streams', '-show_format',
                              '-of', 'json', str(video)], capture_output=True, check=True,
                             creationflags=WINDOWS_HIDDEN)
    value = json.loads(process.stdout)
    streams = value.get('streams', [])
    videos = [stream for stream in streams if stream.get('codec_type') == 'video']
    require(len(videos) == 1 and not any(stream.get('codec_type') == 'audio' for stream in streams),
            'Exactly one video and no audio stream required')
    stream = videos[0]
    require(stream.get('codec_name') == 'h264' and stream.get('pix_fmt') == 'yuv420p'
            and stream.get('width') == APP_SIZE and stream.get('height') == APP_SIZE * 2,
            'Encoded video does not match the App codec/layout')
    require(Fraction(stream['avg_frame_rate']) == plan['fps']
            and int(stream.get('nb_frames', -1)) == plan['frameCount']
            and abs(float(stream['duration']) - plan['durationSeconds']) <= .005,
            'Encoded frame count/fps/duration changed')
    require(stream.get('color_range') == 'tv' and stream.get('color_space') == 'bt709',
            'BT.709 limited-range tags required')
    return {'codec': stream['codec_name'], 'pixelFormat': stream['pix_fmt'],
            'width': stream['width'], 'height': stream['height'], 'fps': str(stream['avg_frame_rate']),
            'frames': int(stream['nb_frames']), 'durationSeconds': float(stream['duration']),
            'colourSpace': stream['color_space'], 'range': stream['color_range']}


def composite_rgb(rgb, alpha, background):
    weight = alpha.astype(np.float32)[..., None] / 255
    return np.rint(rgb.astype(np.float32) * weight + np.asarray(background) * (1 - weight)).clip(0, 255).astype(np.uint8)


def read_exact(stream, size):
    value = bytearray(size)
    view, offset = memoryview(value), 0
    while offset < size:
        read = stream.readinto(view[offset:])
        require(bool(read), 'Decoded stream ended before the expected frame count')
        offset += read
    return value


class ErrorStats:
    """Bounded histogram; no per-pixel or full-video timeline is retained."""
    def __init__(self):
        self.histogram = np.zeros(256, dtype=np.int64)

    def add(self, values):
        values = np.asarray(values)
        if values.size:
            self.histogram += np.bincount(values.reshape(-1).astype(np.uint8), minlength=256)

    def summary(self):
        count = int(self.histogram.sum())
        if not count:
            return {'samples': 0, 'mae': None, 'p95': None, 'p99': None, 'max': None}
        cumulative = self.histogram.cumsum()
        percentile = lambda fraction: int(np.searchsorted(cumulative, math.ceil(count * fraction)))
        return {'samples': count, 'mae': float(np.dot(np.arange(256), self.histogram) / count),
                'p95': percentile(.95), 'p99': percentile(.99),
                'max': int(np.nonzero(self.histogram)[0][-1])}


def decode_check(context, video, framing, qa_output):
    command = [tool('ffmpeg'), '-v', 'error', '-nostdin', '-threads', '2', '-filter_threads', '1',
               '-i', str(video), '-map', '0:v:0', '-an',
               '-vf', 'scale=in_range=tv:out_range=pc:in_color_matrix=bt709',
               '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']
    stats = {name: ErrorStats() for name in ['visibleAlpha', 'semiTransparentAlpha', 'foregroundRgb',
                                            *['composite-' + name for name in BACKGROUNDS],
                                            *['semiComposite-' + name for name in BACKGROUNDS]]}
    frame_reports, boundary_max, leak_max = [], 0, 0
    log = qa_output / 'decoder.log'
    with log.open('xb') as stderr:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=stderr, creationflags=WINDOWS_HIDDEN)
        try:
            for row in context['main']:
                raw = read_exact(process.stdout, APP_SIZE * APP_SIZE * 2 * 3)
                decoded = np.frombuffer(raw, np.uint8).reshape(APP_SIZE * 2, APP_SIZE, 3)
                rgb, alpha = decoded[:APP_SIZE], decoded[APP_SIZE:, :, 0]
                boundary = max(int(alpha[:12].max()), int(alpha[-12:].max()),
                               int(alpha[:, :12].max()), int(alpha[:, -12:].max()))
                boundary_max = max(boundary_max, boundary)
                with resized_rgba(context, row, framing) as reference_image:
                    original = np.asarray(reference_image)
                    expected = original[..., 3]
                    visible, semi, foreground = expected > 0, (expected > 0) & (expected < 255), expected >= 128
                    roi = visible | (alpha > 3)
                    require(bool(visible.any()) and bool(foreground.any()), 'Decoded QA requires nonempty visible foreground')
                    delta = np.abs(alpha.astype(np.int16) - expected.astype(np.int16))
                    stats['visibleAlpha'].add(delta[visible]); stats['semiTransparentAlpha'].add(delta[semi])
                    if (~visible).any():
                        leak_max = max(leak_max, int(alpha[~visible].max()))
                    rgb_error = np.abs(rgb.astype(np.int16) - original[..., :3].astype(np.int16))
                    stats['foregroundRgb'].add(rgb_error[foreground])
                    frame = {'frame': row['frame'], 'visiblePixels': int(visible.sum()),
                             'semiTransparentPixels': int(semi.sum()), 'foregroundPixels': int(foreground.sum()),
                             'visibleAlphaMae': float(delta[visible].mean()),
                             'semiAlphaMae': float(delta[semi].mean()) if semi.any() else None,
                             'foregroundRgbMae': float(rgb_error[foreground].mean()), 'boundaryAlphaMax': boundary,
                             'compositeRgbMae': {}, 'semiCompositeRgbMae': {}}
                    for name, background in BACKGROUNDS.items():
                        actual = composite_rgb(rgb, alpha, background)
                        target = composite_rgb(original[..., :3], expected, background)
                        error = np.abs(actual.astype(np.int16) - target.astype(np.int16))
                        stats['composite-' + name].add(error[roi])
                        stats['semiComposite-' + name].add(error[semi])
                        frame['compositeRgbMae'][name] = float(error[roi].mean())
                        frame['semiCompositeRgbMae'][name] = float(error[semi].mean()) if semi.any() else None
                    frame_reports.append(frame)
                if row['frame'] % 60 == 0:
                    print(json.dumps({'event': 'decode-qa', 'frame': row['frame'], 'total': len(context['main'])}), flush=True)
            require(not process.stdout.read(1), 'Encoded video contains unexpected extra frames')
            require(process.wait() == 0, 'FFmpeg decode failed; preserved decoder.log')
        finally:
            if process.stdout:
                process.stdout.close()
            if process.poll() is None:
                process.kill(); process.wait()
    values = {name: item.summary() for name, item in stats.items()}
    # These are explicit numeric codec gates, not a claim of mathematical or
    # perceptual losslessness. Foreground/edge ROIs prevent transparent pixels
    # from diluting errors; worst-frame gates prevent a bad frame being hidden.
    thresholds = {'visibleAlphaMae': 2.5, 'semiAlphaMae': 8.0, 'foregroundRgbMae': 4.0,
                  'compositeRgbMae': 4.0, 'semiCompositeRgbMae': 10.0,
                  'worstFrameVisibleAlphaMae': 4.0, 'worstFrameSemiAlphaMae': 12.0,
                  'worstFrameForegroundRgbMae': 6.0, 'worstFrameCompositeRgbMae': 6.0,
                  'worstFrameSemiCompositeRgbMae': 14.0, 'boundaryAlphaMax': 3}
    below = lambda summary, limit: summary['samples'] == 0 or summary['mae'] <= limit
    passed = (below(values['visibleAlpha'], thresholds['visibleAlphaMae'])
              and below(values['semiTransparentAlpha'], thresholds['semiAlphaMae'])
              and below(values['foregroundRgb'], thresholds['foregroundRgbMae'])
              and all(below(values['composite-' + name], thresholds['compositeRgbMae']) for name in BACKGROUNDS)
              and all(below(values['semiComposite-' + name], thresholds['semiCompositeRgbMae']) for name in BACKGROUNDS)
              and boundary_max <= thresholds['boundaryAlphaMax'])
    for frame in frame_reports:
        passed = bool(passed and frame['visibleAlphaMae'] <= thresholds['worstFrameVisibleAlphaMae']
                      and (frame['semiAlphaMae'] is None or frame['semiAlphaMae'] <= thresholds['worstFrameSemiAlphaMae'])
                      and frame['foregroundRgbMae'] <= thresholds['worstFrameForegroundRgbMae']
                      and max(frame['compositeRgbMae'].values()) <= thresholds['worstFrameCompositeRgbMae']
                      and all(v is None or v <= thresholds['worstFrameSemiCompositeRgbMae'] for v in frame['semiCompositeRgbMae'].values()))
    report = {'format': 'pose-hub-completion-codec-qa@1', 'passed': bool(passed),
              'framesDecoded': len(frame_reports), 'statistics': values, 'thresholds': thresholds,
              'boundaryBandPixels': 12, 'boundaryAlphaMax': boundary_max, 'transparentAlphaLeakMax': leak_max,
              'frames': frame_reports, 'groundShadow': False,
              'reference': 'Same immutable source RGBA PNGs with the exact fixed crop and associated-alpha resize.',
              'decodeProtocol': 'Tagged BT.709 limited range to full RGB; lower-half red channel is alpha.',
              'errorRegion': 'Visible foreground and semi-transparent edge; composite ROI also includes decoded alpha leaks.',
              'limits': ['Numeric codec QA does not grant visual/content acceptance or prove losslessness.']}
    write_new_json(qa_output / 'decode-check.json', report)
    return report


def lossless_still(context, row, framing, output, size):
    with resized_rgba(context, row, framing, size) as image:
        bounds = image_bounds(image)
        require(not bounds['empty'] and min(bounds['marginsPx']) >= math.ceil(size * .04),
                'Insufficient transparent still margin; choose a new export with more fixed margin')
        image.save(output, format='WEBP', lossless=True, exact=True, method=6, quality=100)
        with Image.open(output) as actual:
            require(actual.mode == 'RGBA' and actual.size == (size, size)
                    and np.array_equal(np.asarray(actual), np.asarray(image)), 'Lossless WebP RGBA readback changed')
    return {'width': size, 'height': size, 'alpha': True, 'losslessRgbaVerified': True,
            'bounds': bounds['bounds'], 'marginsPx': bounds['marginsPx']}


def export_capture(capture_path, output_path, crf=12, preset='slow', margin=.06,
                   cover_frame=None, action_id=None, bleed=8):
    require(type(crf) is int and 0 <= crf <= 30, 'CRF must be an integer from 0..30')
    require(preset in ('ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'),
            'Unsupported x264 preset')
    require(type(bleed) is int and 2 <= bleed <= 32, 'Bleed radius must be 2..32 pixels')
    output = new_output(output_path)
    report = {'format': EXPORT_FORMAT, 'createdAt': datetime.now(timezone.utc).isoformat(),
              'complete': False, 'passed': False, 'status': 'failed', 'reviewed': False, 'releaseEligible': False,
              'groundShadow': False, 'limits': ['H.264/yuv420p CRF output is not strictly lossless RGBA.',
                                              'Action, contact and App/device visual acceptance remain separate.']}
    try:
        context = load_capture(capture_path, require_full=True)
        capture, plan = context['capture'], context['capture']['plan']
        aid = action_id or capture.get('stableId') or capture.get('specId')
        require(isinstance(aid, str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,127}', aid), 'Safe action ID required')
        cover_frame = cover_frame if cover_frame is not None else capture.get('coverFrame', plan.get('coverFrame', plan['frameCount'] // 2))
        require(type(cover_frame) is int and 0 <= cover_frame < plan['frameCount'], 'Cover frame must be playable; N endpoint is excluded')
        measured, union = scan_images(context)
        require(union is not None and not any(r['empty'] or r['touchesSourceEdge'] for r in measured),
                'Empty or already clipped RGBA source cannot be repaired by export padding')
        framing = fixed_framing(union, capture['size'], margin)
        qa = output / 'qa'; qa.mkdir()
        write_new_json(qa / 'framing-check.json', {'passed': True, 'frames': measured, 'framing': framing})
        report.update({'id': aid, 'specId': capture.get('specId'), 'capture': reference(context['path']),
                       'sourceManifest': context['sourceManifest'], 'sourceSha256': capture.get('sourceSha256'),
                       'runtimeModel': capture.get('runtimeModel'), 'plan': plan, 'coverFrame': cover_frame,
                       'framing': framing, 'mainContentRect': union,
                       'encoding': {'layout': 'top-rgb-bottom-alpha', 'width': 720, 'height': 1440,
                                    'colourRect': [0, 0, 720, 720], 'alphaRect': [0, 720, 720, 720],
                                    'rgbAlphaMode': 'straight', 'alphaChannelAfterRgbDecode': 'red',
                                    'matrix': 'bt709', 'range': 'limited', 'crf': crf, 'preset': preset,
                                    'threads': 2, 'rgbBleedPixels': bleed, 'strictLossless': False,
                                    'playerEquation': 'topRGB * bottomR + backgroundRGB * (1 - bottomR)'}})
        video = output / (aid + '.rgb-alpha.mp4')
        log = qa / 'encoder.log'
        with log.open('xb') as stderr:
            process = subprocess.Popen(encoder_command(video, plan['fps'], crf, preset), stdin=subprocess.PIPE,
                                       stderr=stderr, creationflags=WINDOWS_HIDDEN)
            try:
                for row in context['main']:
                    with resized_rgba(context, row, framing) as image:
                        process.stdin.write(pack_frame(image, bleed).tobytes())
                    if row['frame'] % 60 == 0:
                        print(json.dumps({'event': 'encode', 'frame': row['frame'], 'total': len(context['main'])}), flush=True)
                process.stdin.close()
                require(process.wait() == 0, 'FFmpeg encode failed; preserved encoder.log')
            finally:
                if process.poll() is None:
                    process.kill(); process.wait()
        probe = probe_video(video, plan)
        chosen = next(row for row in context['main'] if row['frame'] == cover_frame)
        cover = output / (aid + '.cover.alpha.webp')
        thumb = output / (aid + '.thumbnail.alpha.webp')
        cover_info = lossless_still(context, chosen, framing, cover, 720)
        thumb_info = lossless_still(context, chosen, framing, thumb, 240)
        report['files'] = {'video': reference(video, output, **probe),
                           'cover': reference(cover, output, **cover_info),
                           'thumbnail': reference(thumb, output, **thumb_info)}
        codec_qa = decode_check(context, video, framing, qa)
        report['codecQa'] = reference(qa / 'decode-check.json', output, passed=codec_qa['passed'])
        require(codec_qa['passed'], 'Decoded foreground/alpha/composite QA failed; preserve this attempt')
        # Final readback catches changes to any original PNG or capture metadata
        # between encoding and publication of this candidate manifest.
        load_capture(capture_path, require_full=True)
        require(sha256(context['path']) == report['capture']['sha256'], 'Capture metadata changed during export')
        report['mediaBytes'] = sum(row['bytes'] for row in report['files'].values())
        report.update({'complete': True, 'passed': True, 'status': 'technical-candidate-awaiting-review'})
    except Exception as error:
        report.update({'complete': False, 'passed': False, 'status': 'failed', 'error': str(error)})
    write_new_json(output / 'manifest.json', report)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    preview = commands.add_parser('preview-qa', help='Verify RGBA samples, content bounds and a labelled contact sheet')
    preview.add_argument('--capture', required=True, type=Path)
    preview.add_argument('--output', required=True, type=Path)
    export = commands.add_parser('export', help='Encode a complete RGBA capture directly to App MP4 and lossless WebP')
    export.add_argument('--capture', required=True, type=Path)
    export.add_argument('--output', required=True, type=Path)
    export.add_argument('--crf', type=int, default=12)
    export.add_argument('--preset', default='slow')
    export.add_argument('--margin', type=float, default=.06)
    export.add_argument('--cover-frame', type=int)
    export.add_argument('--action-id')
    export.add_argument('--bleed', type=int, default=8)
    args = parser.parse_args(argv)
    result = (preview_qa(args.capture, args.output) if args.command == 'preview-qa' else
              export_capture(args.capture, args.output, args.crf, args.preset, args.margin,
                             args.cover_frame, args.action_id, args.bleed))
    print(json.dumps({'status': result['status'], 'passed': result['passed'], 'output': str(args.output.resolve())}))
    return 0 if result['passed'] else 2


if __name__ == '__main__':
    sys.exit(main())
