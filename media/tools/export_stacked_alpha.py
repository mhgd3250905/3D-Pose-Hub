"""Encode pinned RGBA layers as top-RGB/bottom-alpha H.264. No 3D rendering.

Input: prepare_smartfit_alpha.py's immutable plan; roots supplied with --bind.
Only new output directories are allowed. Source media is always read-only.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt


SIZE = 720
FORMAT = 'pose-hub-stacked-alpha-delivery@1'
BACKGROUNDS = {'white': (255, 255, 255), 'dark': (16, 16, 19), 'cyan': (48, 190, 210)}


def read_json(path):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            if key in value:
                raise ValueError('Duplicate JSON key: ' + key)
            value[key] = item
        return value
    return json.loads(Path(path).read_text(encoding='utf-8-sig'), object_pairs_hook=unique)


def sha256(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as handle:
        for data in iter(lambda: handle.read(1024 * 1024), b''):
            result.update(data)
    return result.hexdigest()


def safe_path(root, relative):
    if (not isinstance(relative, str) or not relative or '\\' in relative or ':' in relative
            or any(p in ('', '.', '..') for p in relative.split('/'))):
        raise ValueError('Unsafe relative path: ' + repr(relative))
    root = Path(root).resolve()
    result = (root / relative).resolve()
    if not result.is_relative_to(root):
        raise ValueError('Path escapes source root')
    return result


def verify_ref(root, ref):
    path = safe_path(root, ref['path'])
    if path.stat().st_size != ref['bytes'] or sha256(path) != ref['sha256']:
        raise ValueError('Source SHA/bytes mismatch: ' + str(path))
    return path


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8', newline='\n') as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write('\n')


def file_ref(root, path, **extra):
    return {'path': path.relative_to(root).as_posix(), 'bytes': path.stat().st_size,
            'sha256': sha256(path), **extra}


def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams',
                             '-of', 'json', str(path)], capture_output=True, text=True, check=True)
    streams = json.loads(result.stdout)['streams']
    if len(streams) != 1 or streams[0]['codec_type'] != 'video':
        raise ValueError('Expected one silent video stream: ' + str(path))
    return streams[0]


def check_timing(stream, action, packed=False):
    if (stream['codec_name'] != 'h264' or stream['width'] != SIZE
            or stream['height'] != SIZE * (2 if packed else 1)
            or int(stream['nb_read_frames']) != action['frames']
            or Fraction(stream['r_frame_rate']) != Fraction(str(action['fps']))
            or abs(float(stream['duration']) - action['durationSeconds']) > .001):
        raise ValueError('Video shape/timing differs from pinned source')
    if packed and (stream['pix_fmt'] != 'yuv420p' or stream.get('color_space') != 'bt709'
                   or stream.get('color_range') != 'tv'):
        raise ValueError('Packed video colour protocol mismatch')


def load_actions(plan, bindings, selected=None):
    if plan.get('format') != 'pose-hub-stacked-alpha-plan@1':
        raise ValueError('Unsupported export plan')
    roots = {key: Path(value).resolve() for key, value in bindings.items()}
    for alias, item in plan['bindings'].items():
        roots[alias] = safe_path(roots[item['parentBinding']], item['relativeRoot'])
    eligible = plan['consumer']['eligibleActionIds']
    if len(eligible) != len(set(eligible)):
        raise ValueError('Duplicate consumer IDs')
    actions = plan['actions']
    ids = [a['id'] for a in actions]
    if len(ids) != len(set(ids)) or any(a not in eligible for a in ids):
        raise ValueError('Plan actions do not belong to consumer selection')
    if selected and (len(selected) != len(set(selected)) or not set(selected) <= set(ids)):
        raise ValueError('Requested IDs are not in pinned plan')
    contexts = []
    for action in actions:
        if selected and action['id'] not in selected:
            continue
        if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', action['id']):
            raise ValueError('Unsafe action ID')
        if (type(action['frames']) is not int or action['frames'] <= 0
                or type(action['coverFrame']) is not int
                or isinstance(action['fps'], bool) or not isinstance(action['fps'], (int, float))
                or not math.isfinite(action['fps']) or action['fps'] <= 0
                or isinstance(action['durationSeconds'], bool) or not isinstance(action['durationSeconds'], (int, float))
                or not math.isfinite(action['durationSeconds']) or action['durationSeconds'] <= 0
                or not 0 <= action['coverFrame'] < action['frames']
                or abs(action['frames'] / float(action['fps']) - action['durationSeconds']) > .001
                or action['coverSize'] != [720, 720] or action['thumbnailSize'] != [240, 240]):
            raise ValueError('Invalid frame or image contract')
        source_root = roots[action['sourceRoot']]
        layer_path = verify_ref(roots[action['layerManifest']['root']], action['layerManifest'])
        layer = read_json(layer_path)
        fresh_capture = None
        if action.get('renderCapture'):
            capture_ref = action['renderCapture']
            fresh_capture = read_json(verify_ref(roots[capture_ref['root']], capture_ref))
            if (fresh_capture.get('complete') is not True or fresh_capture.get('mode') != 'full'
                    or fresh_capture.get('actionId') != action['id']
                    or fresh_capture.get('sourceSha256') != layer['sourceSha256']
                    or not re.search(r'RTX 4080', fresh_capture.get('runtime', {}).get('unmaskedRenderer', ''))
                    or fresh_capture.get('runtime', {}).get('contextLost') is not False):
                raise ValueError('New full layers require their completed 4080 capture proof')
        if (layer.get('format') != 'pose-hub-layer-render@2' or layer.get('complete') is not True
                or (layer.get('diagnosticOnly') is not False and fresh_capture is None) or layer['actionId'] != action['id']
                or layer['skin'] != plan['skin'] or layer['alphaMode'] != 'straight'
                or layer['frameCount'] != action['frames'] or layer['fps'] != action['fps']
                or abs(layer['durationSeconds'] - action['durationSeconds']) > .001):
            raise ValueError('Layer manifest does not match exact full source')
        framing_path = verify_ref(roots[action['framing']['root']], action['framing'])
        framing = read_json(framing_path)
        if framing.get('preview') is not False or framing['sourceSize'] != [1080, 1080]:
            raise ValueError('Full, bound framing required')
        crop = framing['crop']
        if (len(crop) != 4 or any(type(n) is not int for n in crop)
                or crop[2] <= crop[0] or crop[2] - crop[0] != crop[3] - crop[1]):
            raise ValueError('Invalid fixed square crop')
        derivatives = None
        if action.get('derivativeManifest'):
            derivative_path = verify_ref(roots[action['derivativeManifest']['root']], action['derivativeManifest'])
            derivatives = read_json(derivative_path)
        elif fresh_capture is None:
            raise ValueError('Existing layers must be bound to exact prior MP4 derivatives')
        baselines = {}
        for theme in action['baselineVideos']:
            ref = action['baselineVideos'][theme]
            baseline = verify_ref(roots[ref['root']], ref)
            check_timing(probe(baseline), action)
            if derivatives is None:
                raise ValueError('Prior video comparisons require derivative provenance')
            rows = [v for v in derivatives['variants'] if
                    (v['actionId'], v['skin'], v['theme']) == (action['id'], plan['skin'], theme)]
            if len(rows) != 1 or rows[0]['video']['sha256'] != ref['sha256']:
                raise ValueError('Baseline MP4 belongs to another derivative')
            row = rows[0]
            if (row['framing']['sha256'] != action['framing']['sha256']
                    or row['highlight'] != action['highlight']
                    or next(k['asset']['frame'] for k in row['keyframes'] if k['phase'] == 'peak') != action['coverFrame']):
                raise ValueError('Framing/highlight/poster selection changed')
            baselines[theme] = baseline
        sequences = {}
        for name in ('body', 'highlight', 'shadow'):
            index = read_json(verify_ref(source_root, layer['sequences'][name]))
            frames = index['frames']
            if len(frames) != action['frames'] or [f['frame'] for f in frames] != list(range(action['frames'])):
                raise ValueError('Missing, duplicate, reordered or sparse frames')
            for ref in frames:
                # Verify every source pixel file before launching any encoder.
                verify_ref(source_root, ref)
            sequences[name] = frames
        contexts.append({'action': action, 'root': source_root, 'layer': layer,
                         'framing': framing, 'sequences': sequences, 'baselines': baselines})
    if not contexts:
        raise ValueError('No selected actions')
    return contexts


def compose_rgba(body, mask, shadow, highlight):
    if body.mode != 'RGBA' or mask.mode != 'RGBA' or shadow.mode != 'RGBA' or not body.size == mask.size == shadow.size:
        raise ValueError('Three matching RGBA source layers required')
    colour = highlight['color']
    if not re.fullmatch(r'#[0-9A-Fa-f]{6}', colour) or not 0 <= highlight['brightness'] <= 1:
        raise ValueError('Invalid fixed highlight recipe')
    rgba = np.asarray(body, dtype=np.float32) / 255
    coverage = np.asarray(mask.convert('L'), dtype=np.float32) / 255
    tint = np.array([int(colour[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32) / 255
    weight = coverage[..., None] * (highlight['brightness'] if highlight['enabled'] else 0)
    rgba[..., :3] = rgba[..., :3] * (1 - weight) + tint * weight
    foreground = Image.fromarray(np.clip(np.rint(rgba * 255), 0, 255).astype(np.uint8))
    # Source-over on transparent shadow, never flatten onto black or white.
    return Image.alpha_composite(shadow, foreground)


def inspect_framing(context, margin=.05):
    """Fit the whole cycle including real shadow; padding cannot repair cut sources."""
    bounds = None
    clipped = {'body': [], 'shadow': []}
    for name in ('body', 'shadow'):
        for ref in context['sequences'][name]:
            with Image.open(safe_path(context['root'], ref['path'])) as image:
                with image.getchannel('A') as alpha:
                    box = alpha.getbbox()
                    if box is None:
                        continue
                    bounds = box if bounds is None else (
                        min(bounds[0], box[0]), min(bounds[1], box[1]),
                        max(bounds[2], box[2]), max(bounds[3], box[3]))
                    if box[0] == 0 or box[1] == 0 or box[2] == image.width or box[3] == image.height:
                        clipped[name].append({'frame': ref['frame'], 'bounds': list(box)})
    if bounds is None:
        raise ValueError('Empty transparent source cycle')
    side = math.ceil(max(bounds[2] - bounds[0], bounds[3] - bounds[1]) / (1 - 2 * margin))
    left = math.floor((bounds[0] + bounds[2] - side) / 2)
    top = math.floor((bounds[1] + bounds[3] - side) / 2)
    # Negative/outside-source crop coordinates add transparent pixels, never synthesize shadow.
    recipe = {'format': 'pose-hub-export-framing@2', 'preview': False,
              'sourceSize': [1080, 1080], 'targetSize': [1080, 1080],
              'crop': [left, top, left + side, top + side],
              'sourceBounds': list(bounds), 'marginFraction': margin,
              'policy': 'union-all-cycle-body-props-and-complete-shadow; fixed-square; 5%-transparent-margin'}
    return recipe, {'sourceFramesChecked': context['action']['frames'],
                    'sourceEdgeFrames': clipped,
                    'sourceShadowComplete': not clipped['shadow'],
                    'sourceBodyComplete': not clipped['body'],
                    'framingPassed': not clipped['shadow'] and not clipped['body']}


def iter_rgba(context):
    action, root = context['action'], context['root']
    for frame in range(action['frames']):
        images = []
        for name in ('body', 'highlight', 'shadow'):
            ref = context['sequences'][name][frame]
            source = verify_ref(root, ref)
            with Image.open(source) as image:
                if image.mode != 'RGBA' or image.size != (1080, 1080):
                    raise ValueError('Source layer must remain 1080-square straight RGBA')
                images.append(image.crop(tuple(context.get('exportFraming', context['framing'])['crop'])).resize((1080, 1080), Image.Resampling.LANCZOS))
        result = compose_rgba(*images, action['highlight'])
        # Pillow RGBa explicitly filters associated colour, then restores straight RGB.
        small = result.convert('RGBa').resize((SIZE, SIZE), Image.Resampling.LANCZOS).convert('RGBA')
        body_alpha = np.asarray(images[0].getchannel('A').resize((SIZE, SIZE), Image.Resampling.LANCZOS))
        shadow_alpha = np.asarray(images[2].getchannel('A').resize((SIZE, SIZE), Image.Resampling.LANCZOS))
        shadow_only = (body_alpha == 0) & (shadow_alpha > 0) & (shadow_alpha < 255)
        yield frame, small, shadow_only


def edge_bleed(rgba, radius=8):
    """Extend adjacent visible colours into zero-alpha pixels; never alter alpha.

    Bounded nearest-colour extension uses SciPy's exact distance transform.
    The partially transparent shadow and silhouette RGB remain untouched.
    """
    image = np.asarray(rgba, dtype=np.uint8)
    rgb = image[..., :3].copy()
    known = image[..., 3] > 0
    if not known.any():
        return rgb
    distance, indices = distance_transform_edt(~known, return_indices=True)
    fill = (~known) & (distance <= radius)
    rgb[fill] = rgb[indices[0][fill], indices[1][fill]]
    return rgb


def pack_frame(rgba, bleed=8):
    array = np.asarray(rgba, dtype=np.uint8)
    rgb = edge_bleed(rgba, bleed)
    alpha = np.repeat(array[..., 3:4], 3, axis=2)
    return np.ascontiguousarray(np.concatenate((rgb, alpha), axis=0))


def composite_rgb(rgb, alpha, background):
    a = alpha.astype(np.float32)[..., None] / 255
    return np.rint(rgb.astype(np.float32) * a + np.array(background) * (1 - a)).clip(0, 255).astype(np.uint8)


def encoder_command(path, action, crf):
    return ['ffmpeg', '-v', 'error', '-nostdin', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
            '-s', '720x1440', '-r', str(action['fps']), '-i', 'pipe:0', '-an',
            '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709',
            '-c:v', 'libx264', '-threads', '2', '-preset', 'medium', '-crf', str(crf),
            '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
            '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', '-n', str(path)]


def read_exact(stream, size):
    chunks, remaining = [], size
    while remaining:
        block = stream.read(remaining)
        if not block:
            raise ValueError('Decoded video ended before expected source frames')
        chunks.append(block)
        remaining -= len(block)
    return b''.join(chunks)


class ReferenceCache:
    """Single-attempt streaming reference; a second composition is unnecessary."""
    def __init__(self, directory, context, size=SIZE):
        self.directory = Path(directory).resolve()
        self.raw_path = self.directory / '.reference-cache.rgba-shadow.raw'
        self.metadata_path = self.directory / '.reference-cache.json'
        self.size, self.frames = size, context['action']['frames']
        self.identity = json.loads(json.dumps({'action': context['action'],
            'exportFraming': context.get('exportFraming', context['framing']),
            'sourceSha256': context['layer']['sourceSha256'], 'size': [size, size],
            'layout': 'per-frame-straight-rgba-u8-then-shadow-mask-u8'}))
        self.writer = None
        self.frames_written = self.bytes_written = 0
        self.write_hash = hashlib.sha256()
        self.read_verified = False
        self.verified_stat = None

    def open(self):
        if self.writer is not None or self.frames_written or self.metadata_path.exists():
            raise ValueError('Reference cache cannot be reused across attempts')
        self.writer = self.raw_path.open('xb')

    def append(self, frame, rgba, shadow_only):
        if (self.writer is None or frame != self.frames_written or frame >= self.frames
                or rgba.mode != 'RGBA' or rgba.size != (self.size, self.size)
                or shadow_only.shape != (self.size, self.size) or shadow_only.dtype != np.bool_):
            raise ValueError('Reference cache frame identity/shape/order mismatch')
        for data in (rgba.tobytes(), shadow_only.astype(np.uint8).tobytes()):
            if self.writer.write(data) != len(data):
                raise ValueError('Reference cache write was short')
            self.write_hash.update(data)
            self.bytes_written += len(data)
        self.frames_written += 1

    def close(self):
        if self.writer is not None:
            self.writer.close()
            self.writer = None

    def finish(self):
        if self.writer is None or self.frames_written != self.frames:
            raise ValueError('Reference cache is incomplete')
        self.writer.flush(); os.fsync(self.writer.fileno()); self.close()
        expected = self.frames * self.size * self.size * 5
        if self.bytes_written != expected or self.raw_path.stat().st_size != expected:
            raise ValueError('Reference cache written size mismatch')
        write_json(self.metadata_path, {'format': 'pose-hub-alpha-reference-cache@1', 'complete': True,
            'identity': self.identity, 'frames': self.frames,
            'raw': {'path': self.raw_path.name, 'bytes': expected, 'sha256': self.write_hash.hexdigest()}})

    @staticmethod
    def stat_identity(path):
        value = path.stat()
        return value.st_size, value.st_mtime_ns, value.st_ino

    def iter_frames(self):
        metadata = read_json(self.metadata_path)
        expected = self.frames * self.size * self.size * 5
        ref = metadata.get('raw', {})
        if (metadata.get('format') != 'pose-hub-alpha-reference-cache@1' or metadata.get('complete') is not True
                or metadata.get('identity') != self.identity or metadata.get('frames') != self.frames
                or ref.get('path') != self.raw_path.name or ref.get('bytes') != expected
                or ref.get('sha256') != self.write_hash.hexdigest()):
            raise ValueError('Reference cache identity/hash metadata mismatch')
        initial_stat = self.stat_identity(self.raw_path)
        if initial_stat[0] != expected:
            raise ValueError('Reference cache size mismatch (short or extra bytes)')
        incoming_hash = hashlib.sha256()
        plane = self.size * self.size
        with self.raw_path.open('rb') as stream:
            for frame in range(self.frames):
                colour = read_exact(stream, plane * 4)
                mask = read_exact(stream, plane)
                incoming_hash.update(colour); incoming_hash.update(mask)
                mask_values = np.frombuffer(mask, dtype=np.uint8).reshape(self.size, self.size)
                if mask_values.max() > 1:
                    raise ValueError('Reference cache shadow mask changed')
                rgba = Image.frombytes('RGBA', (self.size, self.size), colour)
                try:
                    yield frame, rgba, mask_values.astype(bool)
                finally:
                    rgba.close()
            if stream.read(1):
                raise ValueError('Reference cache contains extra bytes')
        if self.stat_identity(self.raw_path) != initial_stat or incoming_hash.hexdigest() != ref['sha256']:
            raise ValueError('Reference cache readback hash/identity mismatch')
        self.verified_stat, self.read_verified = initial_stat, True

    def evidence(self):
        if not self.read_verified:
            raise ValueError('Reference cache was not fully read and verified')
        return {'format': 'pose-hub-alpha-reference-cache@1', 'bytes': self.bytes_written,
                'sha256': self.write_hash.hexdigest(), 'frames': self.frames, 'readVerified': True,
                'reference': 'exact pre-pack RGBA and visible-shadow mask generated during this encode'}

    def remove_after_success(self):
        # Only these two exact names created by this instance may be removed.
        # Never recurse or clean the attempt directory, sources or delivered media.
        self.evidence()
        if (self.raw_path.resolve().parent != self.directory or self.metadata_path.resolve().parent != self.directory
                or self.stat_identity(self.raw_path) != self.verified_stat
                or read_json(self.metadata_path).get('identity') != self.identity):
            raise ValueError('Reference cache changed before owned cleanup')
        self.raw_path.unlink()
        self.metadata_path.unlink()


def decode_check(context, video, output):
    action = context['action']
    command = ['ffmpeg', '-v', 'error', '-nostdin', '-threads', '2', '-i', str(video),
               '-vf', 'scale=in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24',
               '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    alpha_sum = edge_sum = shadow_sum = 0.
    alpha_count = edge_count = shadow_count = leak_max = boundary_alpha_max = 0
    rgb_sum = {name: 0. for name in BACKGROUNDS}
    edge_rgb_sum = {name: 0. for name in BACKGROUNDS}
    samples = []
    references = None
    try:
        cache = context.get('_referenceCache')
        references = cache.iter_frames() if cache is not None else iter_rgba(context)
        for frame, reference, shadow_only in references:
            decoded = np.frombuffer(read_exact(process.stdout, SIZE * SIZE * 2 * 3), np.uint8).reshape(SIZE * 2, SIZE, 3)
            colour, alpha = decoded[:SIZE], decoded[SIZE:, :, 0]
            boundary_alpha_max = max(boundary_alpha_max, int(max(
                alpha[:12].max(), alpha[-12:].max(), alpha[:, :12].max(), alpha[:, -12:].max())))
            original = np.asarray(reference)
            expected = original[..., 3]
            delta = np.abs(alpha.astype(np.int16) - expected.astype(np.int16))
            edge = (expected > 0) & (expected < 255)
            alpha_sum += delta.sum(); alpha_count += delta.size
            edge_sum += delta[edge].sum(); edge_count += int(edge.sum())
            shadow_sum += delta[shadow_only].sum(); shadow_count += int(shadow_only.sum())
            if (expected == 0).any():
                leak_max = max(leak_max, int(alpha[expected == 0].max()))
            for name, background in BACKGROUNDS.items():
                actual = composite_rgb(colour, alpha, background)
                target = composite_rgb(original[..., :3], expected, background)
                error = np.abs(actual.astype(np.int16) - target.astype(np.int16))
                rgb_sum[name] += error.sum(); edge_rgb_sum[name] += error[edge].sum()
                if frame in (0, action['coverFrame'], action['frames'] - 1):
                    Image.fromarray(actual).save(output / f'decoded-{frame:04d}-{name}.png')
            if frame in (0, action['coverFrame'], action['frames'] - 1):
                samples.append({'frame': frame, 'semiTransparentPixels': int(edge.sum()),
                                'visibleShadowPixels': int(shadow_only.sum()),
                                'alphaMae': float(delta.mean())})
        if process.stdout.read(1):
            raise ValueError('Packed video has unexpected extra frames')
        error = process.stderr.read().decode('utf-8', errors='replace')
        if process.wait():
            raise RuntimeError(error)
    finally:
        if references is not None and hasattr(references, 'close'):
            references.close()
        if process.poll() is None:
            process.kill(); process.wait()
    report = {'framesDecoded': action['frames'], 'alphaMae': alpha_sum / alpha_count,
              'semiTransparentAlphaMae': edge_sum / max(edge_count, 1),
              'visibleShadowAlphaMae': shadow_sum / max(shadow_count, 1),
              'visibleShadowSamples': shadow_count, 'transparentAlphaLeakMax': leak_max,
              'compositeRgbMae': {k: v / (alpha_count * 3) for k, v in rgb_sum.items()},
              'semiTransparentCompositeRgbMae': {k: v / max(edge_count * 3, 1) for k, v in edge_rgb_sum.items()},
              'sampleFrames': samples,
              'framingPassed': context['framingCheck']['framingPassed'] and boundary_alpha_max <= 3,
              'framing': context['framingCheck'], 'decodedBoundaryBandPixels': 12,
              'decodedBoundaryAlphaMax': boundary_alpha_max,
              'decodeProtocol': 'Decode tagged BT.709 limited-range video to full-range RGB; bottom red is straight alpha.'}
    # Measurable encoding regressions, not certification of the underlying action.
    report['passed'] = bool(report['framingPassed'] and report['alphaMae'] <= 2 and report['semiTransparentAlphaMae'] <= 8
                        and report['visibleShadowAlphaMae'] <= 8 and shadow_count > 0
                        and max(report['compositeRgbMae'].values()) <= 3
                        and max(report['semiTransparentCompositeRgbMae'].values()) <= 10)
    if cache is not None:
        report['referenceCache'] = cache.evidence()
    write_json(output / 'decode-check.json', report)
    if not report['passed']:
        raise ValueError('Decoded alpha/composition QA failed; preserve this output and use a new revision')
    return report


def export_action(context, output, crf, bleed):
    action = context['action']; aid = action['id']
    media = output / aid; qa = output / 'qa' / aid
    media.mkdir(); qa.mkdir(parents=True)
    context['exportFraming'], context['framingCheck'] = inspect_framing(context)
    write_json(qa / 'framing-check.json', {**context['framingCheck'], 'exportFraming': context['exportFraming']})
    if not context['framingCheck']['framingPassed']:
        raise ValueError('Source RGBA touches its canvas edge; complete transparent layers are required. '
                         'Preserved framing-check.json identifies every affected frame; do not shrink a clipped source.')
    video = media / (aid + '.rgb-alpha.mp4')
    cover = thumbnail = None
    cache = ReferenceCache(qa, context)
    context['_referenceCache'] = cache
    process = subprocess.Popen(encoder_command(video, action, crf), stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        cache.open()
        for frame, rgba, shadow_only in iter_rgba(context):
            cache.append(frame, rgba, shadow_only)
            process.stdin.write(pack_frame(rgba, bleed).tobytes())
            if frame in (0, action['coverFrame'], action['frames'] - 1):
                rgba.save(qa / f'reference-{frame:04d}.png')
            if frame == action['coverFrame']:
                cover = media / (aid + '.cover.alpha.webp')
                thumbnail = media / (aid + '.thumbnail.alpha.webp')
                rgba.save(cover, format='WEBP', lossless=True, exact=True, method=4)
                rgba.convert('RGBa').resize((240, 240), Image.Resampling.LANCZOS).convert('RGBA').save(
                    thumbnail, format='WEBP', lossless=True, exact=True, method=4)
            if frame % 60 == 0:
                print(f'{aid}: encoded {frame}/{action["frames"]}', flush=True)
        process.stdin.close()
        error = process.stderr.read().decode('utf-8', errors='replace')
        if process.wait():
            raise RuntimeError(error)
        cache.finish()
    finally:
        cache.close()
        if process.poll() is None:
            process.kill(); process.wait()
    stream = probe(video); check_timing(stream, action, packed=True)
    for image_path, size in ((cover, (720, 720)), (thumbnail, (240, 240))):
        with Image.open(image_path) as image:
            if image.mode != 'RGBA' or image.size != size or image.getchannel('A').getextrema() != (0, 255):
                raise ValueError('Alpha WebP lost dimensions or transparency')
            box = image.getchannel('A').getbbox()
            if min(box[0], box[1], size[0] - box[2], size[1] - box[3]) < math.floor(size[0] * .04):
                raise ValueError('Alpha WebP must retain transparent margin around the complete body and shadow')
    metrics = decode_check(context, video, qa)
    return {'id': aid, 'nameZh': action['nameZh'], 'fps': action['fps'], 'frames': action['frames'],
            'durationSeconds': action['durationSeconds'], 'coverFrame': action['coverFrame'],
            'sourceVideos': action['baselineVideos'], 'sourceLayers': action['layerManifest'],
            'sourceSha256': context['layer']['sourceSha256'], 'framing': context['framing'],
            'exportFraming': context['exportFraming'],
            'highlight': action['highlight'], 'reviewed': False, 'releaseEligible': False,
            'files': {'video': file_ref(output, video, width=720, height=1440, codec='h264', pixelFormat='yuv420p'),
                      'cover': file_ref(output, cover, width=720, height=720, alpha=True),
                      'thumbnail': file_ref(output, thumbnail, width=240, height=240, alpha=True)},
            'qa': {'report': file_ref(output, qa / 'decode-check.json'), 'metrics': metrics}}


def run(plan_path, bindings, output, ids=None, crf=18, bleed=8):
    output = Path(output).resolve()
    if output.exists():
        raise FileExistsError('Choose a new output directory; existing results are immutable')
    if not 0 <= crf <= 30 or not 2 <= bleed <= 32:
        raise ValueError('CRF must be 0..30 and edge bleed radius 2..32')
    original_plan_sha = sha256(plan_path)
    plan = read_json(plan_path)
    contexts = load_actions(plan, bindings, ids)
    output.mkdir(parents=True)
    result = {'format': FORMAT, 'createdAt': datetime.now(timezone.utc).isoformat(),
              'status': 'sample-awaiting-user-review', 'complete': False,
              'sourceMediaVersion': plan['sourceMediaVersion'], 'skin': plan['skin'],
              'consumer': plan['consumer'], 'sourcePlanSha256': original_plan_sha,
              'exporterSha256': sha256(Path(__file__)),
              'encoding': {'layout': 'top-rgb-bottom-alpha', 'width': 720, 'height': 1440,
                           'colourRect': [0, 0, 720, 720], 'alphaRect': [0, 720, 720, 720],
                           'rgbAlphaMode': 'straight', 'alphaChannelAfterRgbDecode': 'red',
                           'matrix': 'bt709', 'range': 'limited', 'crf': crf, 'rgbBleedPixels': bleed,
                           'playerEquation': 'output = topRGB * bottomR + background * (1 - bottomR)',
                           'layers': ['body-and-props', 'bound-muscle-highlight', 'semi-transparent-ground-shadow']},
              'actions': []}
    try:
        for context in contexts:
            result['actions'].append(export_action(context, output, crf, bleed))
        # Detect modifications to source metadata after a long encode, too.
        if sha256(plan_path) != original_plan_sha:
            raise ValueError('Pinned plan file changed during export')
        load_actions(plan, bindings, ids)
        packed = sum(a['files']['video']['bytes'] for a in result['actions'])
        stills = sum(a['files'][k]['bytes'] for a in result['actions'] for k in ('cover', 'thumbnail'))
        dark = sum(a['sourceVideos'].get('dark', {}).get('bytes', 0) for a in result['actions'])
        light = sum(a['sourceVideos'].get('light', {}).get('bytes', 0) for a in result['actions'])
        result['sizes'] = {'packedMp4Bytes': packed, 'alphaWebpBytes': stills,
                           'deliveryMediaBytes': packed + stills, 'originalDarkMp4Bytes': dark,
                           'originalLightMp4Bytes': light, 'originalBothThemesMp4Bytes': dark + light,
                           'packedVsOneDarkRatio': packed / dark if dark else None,
                           'packedVsBothThemesRatio': packed / (dark + light) if dark + light else None,
                           'note': 'Delivery media only; QA PNGs, reports and HTML are listed separately, not App payload.'}
        result['complete'] = True
        write_json(output / 'manifest.json', result)
        for context in contexts:
            cache = context.get('_referenceCache')
            if cache is not None:
                try:
                    cache.remove_after_success()
                except (OSError, ValueError) as error:
                    # A valid completed export remains valid; preserve unknown files.
                    print('Reference cache cleanup deferred: ' + str(error), file=sys.stderr)
        print(json.dumps({'output': str(output), 'actions': len(result['actions']), 'sizes': result['sizes']}, ensure_ascii=False))
    except Exception as error:
        result['error'] = str(error)
        write_json(output / 'failed.json', result)
        raise
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--bind', action='append', default=[], metavar='NAME=ROOT')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--ids', nargs='+')
    parser.add_argument('--crf', type=int, default=18)
    parser.add_argument('--bleed', type=int, default=8)
    args = parser.parse_args()
    bindings = {}
    for item in args.bind:
        name, value = item.split('=', 1)
        if name in bindings:
            parser.error('Duplicate root binding')
        bindings[name] = value
    run(args.plan, bindings, args.output, args.ids, args.crf, args.bleed)


if __name__ == '__main__':
    main()
