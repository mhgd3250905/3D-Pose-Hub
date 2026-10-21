"""Compose unreviewed first-pass masters without changing production approvals.

The immutable compositor is reused. Only complete draft receipts are consumed;
this tool never imports catalog packages, approves QA, or starts a 3D browser.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

REPO = Path(__file__).resolve().parents[2]
CORE = REPO / 'tools/action-package-v2/composite.py'
CORE_SHA = 'fedb15d24c7080926a857cacad3d3b10b15617735ab3d88053cb885af7c70507'
SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram']


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def atomic(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + f'.{os.getpid()}.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, path)


def safe(root, relative):
    if not isinstance(relative, str) or not relative or '\\' in relative or ':' in relative:
        raise ValueError('Unsafe media reference')
    target = (root / relative).resolve()
    if not target.is_relative_to(root.resolve()):
        raise ValueError('Media reference escapes root')
    return target


def verify(root, ref):
    if ref.get('root') != 'media':
        raise ValueError('Expected media reference')
    path = safe(root, ref.get('path'))
    raw = path.read_bytes()
    if len(raw) != ref['bytes'] or hashlib.sha256(raw).hexdigest() != ref['sha256']:
        raise ValueError(f'Changed media: {path}')
    return path


def validate_draft(root, aid):
    """The receipt is the completion barrier; a partial render is never encoded."""
    if not re.fullmatch(r'[A-Za-z0-9_-]+', aid):
        raise ValueError('Unsafe action ID')
    receipt = read(root / 'manifests/completed' / f'full-{aid}.json')
    if (receipt.get('actionId') != aid or receipt.get('reviewed') is not False
            or receipt.get('releaseEligible') is not False):
        raise ValueError('Expected an explicitly unreviewed draft receipt')
    if receipt.get('reviewSha256'):
        raise ValueError('Draft receipt must not claim a review')
    if set(receipt.get('manifests', {})) != set(SKINS):
        raise ValueError('Missing five-skin completion barrier')
    source_hashes = set()
    for skin in SKINS:
        manifest = read(verify(root, receipt['manifests'][skin]))
        if (manifest.get('actionId') != aid or manifest.get('skin') != skin
                or manifest.get('reviewed') is not False
                or manifest.get('status') != 'draft-unreviewed'
                or manifest.get('releaseEligible') is not False
                or manifest.get('complete') is not True
                or (manifest.get('width'), manifest.get('height'), manifest.get('fps'),
                    manifest.get('durationSeconds'), manifest.get('frameCount')) != (1080, 1080, 30, 8, 240)
                or manifest.get('model', {}).get('id') != 'training-human-v2plus'
                or manifest.get('model', {}).get('version') != '1.0.0-rc2'):
            raise ValueError(f'Invalid draft layer manifest: {aid}/{skin}')
        source_hashes.add(manifest['sourceSha256'])
        for layer in ('body', 'highlight', 'shadow'):
            sequence = read(verify(root, manifest['sequences'][layer]))
            if [frame['frame'] for frame in sequence['frames']] != list(range(240)):
                raise ValueError('Draft is missing a continuous 240-frame sequence')
            # Renderer has just hashed the complete closure. Check existence/size
            # here; image decoding and video decoding remain in the compositor.
            for frame in sequence['frames']:
                path = safe(root, frame['path'])
                if not path.is_file() or path.stat().st_size != frame['bytes']:
                    raise ValueError('Missing or truncated draft frame')
    if len(source_hashes) != 1 or receipt.get('sourceSha256') not in source_hashes:
        raise ValueError('Mixed draft source recipes')
    return receipt


def load_core():
    if hashlib.sha256(CORE.read_bytes()).hexdigest() != CORE_SHA:
        raise ValueError('Frozen compositor changed')
    spec = importlib.util.spec_from_file_location('draft_composite_core', CORE)
    core = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(core)
    return core


def available_memory_gib():
    if os.name == 'nt':
        import ctypes
        class MemoryStatus(ctypes.Structure):
            _fields_ = [('length', ctypes.c_ulong), ('load', ctypes.c_ulong)] + [
                (name, ctypes.c_ulonglong) for name in ('totalPhysical', 'availablePhysical',
                    'totalPageFile', 'availablePageFile', 'totalVirtual', 'availableVirtual', 'availableExtendedVirtual')]
        state = MemoryStatus()
        state.length = ctypes.sizeof(state)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(state)):
            raise OSError('Cannot read available memory')
        return state.availablePhysical / 1024**3
    return os.sysconf('SC_AVPHYS_PAGES') * os.sysconf('SC_PAGE_SIZE') / 1024**3


def compose(root, aid, peak):
    receipt = validate_draft(root, aid)
    if not 0 < peak < 239:
        raise ValueError('Peak must be an interior frame')
    if shutil.disk_usage(root).free < 50 * 1024**3:
        raise RuntimeError('Less than 50 GiB free; draft composition paused')
    core = load_core()
    core.IDS, core.PEAKS = [aid], {aid: peak}
    original_merge = core.merge_derivative_manifest

    def merge(path, variants, transparent, timeout=30):
        drafts = [{**item, 'status': 'draft-unreviewed', 'reviewed': False,
                   'releaseEligible': False, 'sourceSha256': receipt['sourceSha256']}
                  for item in variants]
        return original_merge(path, drafts, transparent, timeout)

    core.merge_derivative_manifest = merge
    core.make_derivatives(root, [aid], SKINS)
    core.make_mosaic(root, [aid], SKINS, set_name=aid)
    output = read(root / 'manifests/derivatives.json')
    variants = [v for v in output['variants'] if v['actionId'] == aid]
    if (len(variants) != 10 or {(v['skin'], v['theme']) for v in variants}
            != {(s, t) for s in SKINS for t in ('light', 'dark')}):
        raise ValueError('Incomplete draft derivative matrix')
    for variant in variants:
        for key in ('video', 'cover', 'thumbnail'):
            verify(root, variant[key])
        for keyframe in variant['keyframes']:
            verify(root, keyframe['asset'])
    covers = output['transparentCovers'][aid]
    if set(covers) != set(SKINS):
        raise ValueError('Missing transparent covers')
    for item in covers.values():
        verify(root, item)
    atomic(root / 'manifests/composed' / f'{aid}.json', {
        'format': 'pose-hub-draft-composition@1', 'actionId': aid,
        'status': 'draft-unreviewed', 'reviewed': False, 'releaseEligible': False,
        'sourceSha256': receipt['sourceSha256'], 'videos': 10, 'skins': SKINS,
        'compositorSha256': CORE_SHA, 'adapterSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'finished': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})


def run_one(root, item):
    aid = item['id']
    receipt = read(root / 'manifests/completed' / f'full-{aid}.json')
    peak = receipt.get('peakFrame', item.get('peakFrame'))
    if type(peak) is not int or not 0 < peak < 239:
        raise ValueError('Completed draft needs a bound interior peak frame')
    directory = root / 'work/cpu-logs'
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / f'{aid}.log').open('x', encoding='utf-8') as log:
        process = subprocess.run([sys.executable, '-B', '-X', 'utf8', str(Path(__file__)),
                                  'compose', '--root', str(root), '--action', aid,
                                  '--peak', str(peak)], stdout=log, stderr=log, cwd=REPO)
    return aid, process.returncode


def watch(root, inventory, once=False):
    core = load_core()
    active, attempted, failures = {}, set(), {}
    # One supervisor per draft root. OS lock is released after a crash.
    with core.manifest_lock(root / 'work/cpu-supervisor', timeout=1), ThreadPoolExecutor(max_workers=2) as pool:
        while True:
            actions = read(inventory)['actions']
            for future in list(active):
                if future.done():
                    aid = active.pop(future)
                    try:
                        _, code = future.result()
                        if code:
                            failures[aid] = {'exitCode': code, 'log': f'work/cpu-logs/{aid}.log'}
                    except Exception as error:
                        failures[aid] = {'error': str(error)}
            for item in actions:
                aid = item['id']
                if len(active) >= 2:
                    break
                if (aid in attempted or (root / 'manifests/composed' / f'{aid}.json').is_file()
                        or not (root / 'manifests/completed' / f'full-{aid}.json').is_file()):
                    continue
                # Do not replace leftovers of an interrupted prior encode.
                if (root / 'work/cpu-logs' / f'{aid}.log').exists():
                    failures[aid] = {'error': 'Prior attempt retained; needs a new output revision'}
                    attempted.add(aid)
                    continue
                if shutil.disk_usage(root).free < 50 * 1024**3 or available_memory_gib() < 4:
                    break
                attempted.add(aid)
                active[pool.submit(run_one, root, item)] = aid
            render_status_path = root / 'manifests/draft-run-status.json'
            render_status = read(render_status_path) if render_status_path.is_file() else {}
            render_terminal = render_status.get('terminal') is True
            expected = [a['id'] for a in actions if a.get('renderState') != 'reuse']
            awaiting_render = [aid for aid in expected
                               if not (root / 'manifests/completed' / f'full-{aid}.json').exists()]
            waiting = [item['id'] for item in actions if item['id'] not in attempted
                       and not (root / 'manifests/composed' / f"{item['id']}.json").exists()
                       and (root / 'manifests/completed' / f"full-{item['id']}.json").exists()]
            finished = (not active and not waiting
                        and (once or (render_terminal and
                             (not awaiting_render or render_status.get('status') == 'failed'))))
            atomic(root / 'status/cpu-queue.json', {
                'format': 'pose-hub-draft-cpu-queue@1',
                'status': ('completed-with-failures' if failures else 'completed') if finished else 'working',
                'terminal': finished,
                'running': list(active.values()), 'failures': failures,
                'waiting': waiting, 'availableMemoryGiB': available_memory_gib(),
                'awaitingRender': awaiting_render,
                'composed': sorted(p.stem for p in (root / 'manifests/composed').glob('*.json')),
                'reviewed': False, 'releaseEligible': False,
                'updated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
            if finished:
                break
            time.sleep(10)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['compose', 'watch'])
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--inventory', type=Path)
    parser.add_argument('--action')
    parser.add_argument('--peak', type=int)
    parser.add_argument('--once', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve()
    if args.command == 'compose':
        compose(root, args.action, args.peak)
    else:
        if not args.inventory:
            parser.error('--inventory is required for watch')
        watch(root, args.inventory, args.once)


if __name__ == '__main__':
    main()
