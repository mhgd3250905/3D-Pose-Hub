#!/usr/bin/env python3
"""Resume CPU exports and assemble an explicitly unreviewed App test package.

Only this parent writes the package's atomic JSON indexes. Workers call the
existing exporter in fresh immutable attempt directories. No renderer is used.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor, wait, FIRST_COMPLETED
from contextlib import redirect_stderr, redirect_stdout
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import sys
import time
import traceback
import uuid

from app_test_semantics import validate_semantics_refresh


FORMAT = 'pose-hub-stacked-alpha-delivery@1'
ROLES = ('video', 'cover', 'thumbnail')
ID = re.compile(r'[A-Za-z0-9][A-Za-z0-9_-]*')
THREAD_ENV = ('OPENBLAS_NUM_THREADS', 'OMP_NUM_THREADS', 'MKL_NUM_THREADS')


def limit_worker_threads():
    # Process-local environment only; set before importing NumPy/SciPy or spawning.
    for key in THREAD_ENV:
        os.environ[key] = '1'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def now():
    return datetime.now(timezone.utc).isoformat()


def pid_alive(pid):
    """True/False/None; Windows never uses os.kill(pid, 0)."""
    if type(pid) is not int or pid <= 0:
        return None
    if os.name == 'nt':
        import ctypes
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.OpenProcess.argtypes = [ctypes.c_uint32, ctypes.c_int, ctypes.c_uint32]
        kernel.OpenProcess.restype = ctypes.c_void_p
        kernel.GetExitCodeProcess.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint32)]
        kernel.GetExitCodeProcess.restype = ctypes.c_int
        kernel.CloseHandle.argtypes = [ctypes.c_void_p]
        handle = kernel.OpenProcess(0x1000, False, pid)
        if not handle:
            error = ctypes.get_last_error()
            return False if error == 87 else True if error == 5 else None
        try:
            code = ctypes.c_uint32()
            if not kernel.GetExitCodeProcess(handle, ctypes.byref(code)):
                return None
            return code.value == 259
        finally:
            kernel.CloseHandle(handle)
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return None


def available_memory_bytes():
    """Return one atomic Windows commit/physical snapshot for resource admission."""
    if os.name != 'nt':
        return None
    import ctypes

    class MemoryStatus(ctypes.Structure):
        _fields_ = [('dwLength', ctypes.c_uint32), ('dwMemoryLoad', ctypes.c_uint32)] + [
            (name, ctypes.c_uint64) for name in ('ullTotalPhys', 'ullAvailPhys', 'ullTotalPageFile',
             'ullAvailPageFile', 'ullTotalVirtual', 'ullAvailVirtual', 'ullAvailExtendedVirtual')]
    state = MemoryStatus()
    state.dwLength = ctypes.sizeof(state)
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.GlobalMemoryStatusEx.argtypes = [ctypes.POINTER(MemoryStatus)]
    kernel.GlobalMemoryStatusEx.restype = ctypes.c_int
    if not kernel.GlobalMemoryStatusEx(ctypes.byref(state)):
        raise OSError(ctypes.get_last_error(), 'GlobalMemoryStatusEx failed; heavy task not started')
    return {'availableCommitBytes': state.ullAvailPageFile, 'availablePhysicalBytes': state.ullAvailPhys}


def available_commit_bytes():
    """Legacy single-lane guard retains its original optional-platform behavior."""
    memory = available_memory_bytes()
    return None if memory is None else memory['availableCommitBytes']


class HeavySlot:
    """Legacy shared slot, or opt-in atomic admission for one CPU plus one GPU."""
    def __init__(self, path, min_commit_bytes=4 * 1024 ** 3, peer_path=None, admission_path=None,
                 parallel_min_commit_bytes=8 * 1024 ** 3, parallel_min_physical_bytes=6 * 1024 ** 3):
        self.path = Path(path).resolve() if path else None
        self.minimum = min_commit_bytes
        self.owner = None
        require(bool(peer_path) == bool(admission_path), 'Supply both peer-heavy and admission locks, or neither')
        self.peer = Path(peer_path).resolve() if peer_path else None
        self.admission = Path(admission_path).resolve() if admission_path else None
        self.parallel_minimum = parallel_min_commit_bytes
        self.parallel_physical = parallel_min_physical_bytes
        if self.peer:
            require(self.path is not None and len({self.path, self.peer, self.admission}) == 3,
                    'Own, peer and admission lock paths must be distinct')
            require(self.minimum >= 4 * 1024 ** 3 and self.parallel_minimum >= 8 * 1024 ** 3
                    and self.parallel_physical >= 6 * 1024 ** 3, 'Resource admission thresholds cannot be lowered')

    @staticmethod
    def inspect_lock(path, role):
        try:
            owner = read_json(path)
        except FileNotFoundError:
            return {'state': 'missing'}
        except (OSError, ValueError) as error:
            return {'state': 'invalid', 'error': str(error)}
        if (not isinstance(owner, dict) or owner.get('role') != role
                or type(owner.get('pid')) is not int or owner['pid'] <= 0
                or not isinstance(owner.get('action'), str) or not owner['action']):
            return {'state': 'invalid', 'owner': owner}
        alive = pid_alive(owner['pid'])
        return {'state': 'alive' if alive is True else 'dead' if alive is False else 'unknown', 'owner': owner}

    def release_admission(self, owner):
        try:
            current = read_json(self.admission)
        except (OSError, ValueError):
            return False
        if (not isinstance(current, dict) or current.get('pid') != owner['pid']
                or current.get('token') != owner['token'] or current.get('role') != 'admission'):
            return False
        self.admission.unlink()
        return True

    @staticmethod
    def sufficient_memory(memory, minimum):
        return (isinstance(memory, dict)
                and type(memory.get('availableCommitBytes')) is int
                and type(memory.get('availablePhysicalBytes')) is int
                and memory['availableCommitBytes'] >= minimum['availableCommitBytes']
                and memory['availablePhysicalBytes'] >= minimum['availablePhysicalBytes'])

    def try_overlap(self, aid):
        self.admission.parent.mkdir(parents=True, exist_ok=True)
        guard = {'pid': os.getpid(), 'role': 'admission', 'token': uuid.uuid4().hex,
                 'action': aid, 'createdAt': now()}
        try:
            stream = self.admission.open('x', encoding='utf-8')
        except FileExistsError:
            existing = self.inspect_lock(self.admission, 'admission')
            state = ('awaiting-resource-admission' if existing['state'] == 'alive'
                     else 'awaiting-admission-lock-inspection')
            return state, {'lock': str(self.admission), **existing}
        with stream:
            json.dump(guard, stream); stream.flush(); os.fsync(stream.fileno())
        try:
            own = self.inspect_lock(self.path, 'cpu')
            if own['state'] != 'missing':
                state = 'awaiting-cpu-role-slot' if own['state'] == 'alive' else 'awaiting-cpu-lock-inspection'
                return state, {'lock': str(self.path), **own}
            peer = self.inspect_lock(self.peer, 'gpu')
            if peer['state'] not in ('missing', 'alive'):
                return 'awaiting-gpu-lock-inspection', {'lock': str(self.peer), **peer}
            parallel = peer['state'] == 'alive'
            # A GPU already working is the peer to overlap; its next-stage marker
            # must not prevent an otherwise safe CPU admission.
            if not parallel:
                request = self.peer.parent / 'gpu-wants-slot.json'
                requester = self.inspect_lock(request, 'gpu')
                if requester['state'] != 'missing':
                    state = 'awaiting-gpu-priority' if requester['state'] == 'alive' else 'awaiting-gpu-request-inspection'
                    return state, {'lock': str(request), **requester}
            minimum = {'availableCommitBytes': self.parallel_minimum if parallel else self.minimum,
                       'availablePhysicalBytes': self.parallel_physical if parallel else 0}
            memory = available_memory_bytes()
            detail = {'peer': peer.get('owner'), 'minimum': minimum, 'memory': memory}
            if not self.sufficient_memory(memory, minimum):
                return 'available-memory-below-admission-threshold', detail
            self.path.parent.mkdir(parents=True, exist_ok=True)
            owner = {'pid': os.getpid(), 'role': 'cpu', 'action': aid,
                     'token': uuid.uuid4().hex, 'createdAt': now()}
            try:
                own_stream = self.path.open('x', encoding='utf-8')
            except FileExistsError:
                return 'awaiting-cpu-role-slot', {'lock': str(self.path), **self.inspect_lock(self.path, 'cpu')}
            with own_stream:
                json.dump(owner, own_stream); own_stream.flush(); os.fsync(own_stream.fileno())
            self.owner = owner
            after = available_memory_bytes()
            if not self.sufficient_memory(after, minimum):
                self.release()
                return 'available-memory-dropped-during-admission', {**detail, 'memory': after}
            return None, None
        except BaseException:
            if self.owner is not None:
                self.release()
            raise
        finally:
            self.release_admission(guard)

    def try_acquire(self, aid):
        require(self.owner is None, 'CPU already holds a heavy slot')
        if self.peer:
            return self.try_overlap(aid)
        if self.path:
            if self.path.exists():
                try:
                    existing = read_json(self.path)
                except FileNotFoundError:
                    existing = None  # The active owner released between stat and read.
                except (OSError, ValueError) as error:
                    raise ValueError(f'Unknown heavy lock preserved at {self.path}: {error}; ask root to inspect') from error
                if existing is not None:
                    require(pid_alive(existing.get('pid')) is True,
                            f'Stale/unknown heavy lock preserved at {self.path}; owner={canonical(existing)}; ask root to inspect')
                    return 'awaiting-heavy-slot', existing
            request = self.path.parent / 'gpu-wants-slot.json'
            if request.exists():
                try:
                    requester = read_json(request)
                except (OSError, ValueError) as error:
                    raise ValueError(f'Unknown GPU priority marker preserved at {request}: {error}') from error
                require(pid_alive(requester.get('pid')) is True,
                        f'Stale/unknown GPU priority marker preserved at {request}; owner={canonical(requester)}; ask root to inspect')
                return 'awaiting-gpu-priority', requester
        available = available_commit_bytes()
        if available is not None and available < self.minimum:
            return 'awaiting-commit-memory', {'availableCommitBytes': available, 'minimumCommitBytes': self.minimum}
        if self.path:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            owner = {'pid': os.getpid(), 'role': 'cpu', 'action': aid,
                     'token': uuid.uuid4().hex, 'createdAt': now()}
            try:
                stream = self.path.open('x', encoding='utf-8')
            except FileExistsError:
                try:
                    existing = read_json(self.path)
                except (OSError, ValueError) as error:
                    raise ValueError(f'Unknown heavy lock preserved at {self.path}: {error}; ask root to inspect') from error
                require(pid_alive(existing.get('pid')) is True,
                        f'Stale/unknown heavy lock preserved at {self.path}; owner={canonical(existing)}; ask root to inspect')
                return 'awaiting-heavy-slot', existing
            with stream:
                json.dump(owner, stream); stream.flush(); os.fsync(stream.fileno())
            self.owner = owner
            # The lock may have been free while the system's remaining commit fell.
            available = available_commit_bytes()
            if available is not None and available < self.minimum:
                self.release()
                return 'awaiting-commit-memory', {'availableCommitBytes': available, 'minimumCommitBytes': self.minimum}
        return None, None

    def release(self):
        if self.owner is None:
            return
        require(self.path.exists(), 'Owned heavy lock disappeared; stop and inspect exclusivity')
        existing = read_json(self.path)
        require(existing == self.owner,
                f'Heavy lock owner changed; preserving {self.path}; owner={canonical(existing)}')
        self.path.unlink()
        self.owner = None


def read_json(path):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, 'Duplicate JSON key: ' + key)
            result[key] = value
        return result
    return json.loads(Path(path).read_text(encoding='utf-8-sig'), object_pairs_hook=unique)


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def hash_value(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


def safe(root, name):
    require(isinstance(name, str) and name and ':' not in name and '\\' not in name
            and all(p not in ('', '.', '..') for p in name.split('/')), 'Unsafe relative path: ' + repr(name))
    root = Path(root).resolve()
    path = (root / name).resolve()
    require(path.is_relative_to(root), 'Path escapes root')
    return path


def verify(root, ref):
    path = safe(root, ref['path'])
    require(type(ref.get('bytes')) is int and ref['bytes'] > 0 and path.is_file()
            and path.stat().st_size == ref['bytes'] and digest(path) == ref['sha256'],
            'File is missing, empty or has another identity: ' + str(path))
    return path


def atomic_json(output, name, value):
    target = safe(output, name)
    target.parent.mkdir(parents=True, exist_ok=True)
    staging = safe(output, '.staging')
    staging.mkdir(exist_ok=True)
    temporary = staging / (uuid.uuid4().hex + '.json')
    try:
        with temporary.open('x', encoding='utf-8', newline='\n') as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
            stream.write('\n'); stream.flush(); os.fsync(stream.fileno())
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def immutable_copy(source, output, name, ref=None):
    """Publish a fully copied file exclusively; a different existing hash is fatal."""
    source, output = Path(source), Path(output)
    expected = ref or {'bytes': source.stat().st_size, 'sha256': digest(source)}
    require(expected['bytes'] > 0 and source.stat().st_size == expected['bytes']
            and digest(source) == expected['sha256'], 'Copy source identity changed')
    target = safe(output, name)
    if target.exists():
        verify(output, {'path': name, **{k: expected[k] for k in ('bytes', 'sha256')}})
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    staging = safe(output, '.staging'); staging.mkdir(exist_ok=True)
    temporary = staging / (uuid.uuid4().hex + '.copy')
    try:
        with source.open('rb') as incoming, temporary.open('xb') as outgoing:
            shutil.copyfileobj(incoming, outgoing, length=1024 * 1024)
            outgoing.flush(); os.fsync(outgoing.fileno())
        require(temporary.stat().st_size == expected['bytes'] and digest(temporary) == expected['sha256'],
                'Copy verification failed')
        try:
            # Same-filesystem hard-link publication is atomic and never replaces an existing target.
            os.link(temporary, target)
        except FileExistsError:
            verify(output, {'path': name, **{k: expected[k] for k in ('bytes', 'sha256')}})
    finally:
        temporary.unlink(missing_ok=True)


def source_key(action, skin, exporter_sha, crf=12, bleed=8):
    # A different enclosing plan alone does not invalidate identical media inputs.
    selected = {key: action[key] for key in ('id', 'fps', 'frames', 'durationSeconds', 'coverFrame',
                                            'coverSize', 'thumbnailSize', 'highlight')}
    selected.update({key: action[key]['sha256'] for key in ('layerManifest', 'framing')})
    selected['baselineVideos'] = {t: ref['sha256'] for t, ref in sorted(action['baselineVideos'].items())}
    return hash_value({'action': selected, 'skin': skin, 'exporterSha256': exporter_sha,
                       'crf': crf, 'bleed': bleed})


def next_attempt(work_root, aid):
    for number in range(1, 100000):
        name = f'{aid}-r1' if number == 1 else f'{aid}-attempt-r{number}'
        directory = safe(work_root, name)
        log = safe(work_root, 'logs/' + name + '.log')
        if not directory.exists() and not log.exists():
            return directory, log
    raise ValueError('Too many preserved attempts: ' + aid)


def worker(task):
    """Each process has its own stdout/log and invokes the existing CPU exporter."""
    plan, bindings, output, aid, log = task
    limit_worker_threads()
    Path(log).parent.mkdir(parents=True, exist_ok=True)
    with Path(log).open('x', encoding='utf-8', buffering=1) as stream:
        with redirect_stdout(stream), redirect_stderr(stream):
            try:
                import export_stacked_alpha as exporter
                exporter.run(Path(plan), bindings, Path(output), ids=[aid], crf=12)
                return {'ok': True, 'id': aid, 'manifest': str(Path(output) / 'manifest.json'),
                        'attempt': str(output), 'log': str(log)}
            except Exception as error:
                traceback.print_exc()
                return {'ok': False, 'id': aid, 'error': str(error), 'attempt': str(output), 'log': str(log)}


class ActionProcessPool:
    """Create workers on demand and release their NumPy/Pillow heaps after work."""
    def __init__(self, workers):
        self.workers, self.executor, self.futures = workers, None, set()

    def __enter__(self):
        return self

    def submit(self, function, *args):
        if self.executor is None:
            self.executor = ProcessPoolExecutor(max_workers=self.workers)
        future = self.executor.submit(function, *args)
        self.futures.add(future)
        return future

    def release_idle(self):
        require(all(future.done() for future in self.futures), 'Cannot release an active export worker')
        self.close()

    def close(self):
        if self.executor is not None:
            self.executor.shutdown(wait=True)
            self.executor = None
        self.futures.clear()

    def __exit__(self, *_):
        self.close()


def expanded_roots(plan, bindings):
    roots = {key: Path(value).resolve() for key, value in bindings.items()}
    for alias, descriptor in plan['bindings'].items():
        require(descriptor['parentBinding'] in roots, 'Missing parent binding: ' + descriptor['parentBinding'])
        roots[alias] = safe(roots[descriptor['parentBinding']], descriptor['relativeRoot'])
    return roots


def validate_export(manifest_path, entry, expected_exporter):
    manifest = read_json(manifest_path)
    require(manifest.get('format') == FORMAT and manifest.get('complete') is True
            and manifest.get('exporterSha256') == expected_exporter, 'Incomplete or different-tool export')
    require(manifest.get('skin') == entry['skin'], 'Different source skin')
    encoding = manifest.get('encoding', {})
    require(encoding.get('crf') == 12 and encoding.get('rgbBleedPixels') == 8
            and encoding.get('layout') == 'top-rgb-bottom-alpha', 'Different export encoding')
    action = entry['action']
    matches = [row for row in manifest['actions'] if row['id'] == action['id']]
    require(len(matches) == 1, 'Missing or duplicate action in completed export')
    row = matches[0]
    require(row.get('reviewed') is False and row.get('releaseEligible') is False,
            'Export unexpectedly claims approval')
    for key in ('fps', 'frames', 'durationSeconds', 'coverFrame', 'highlight'):
        require(row[key] == action[key], 'Export source recipe changed: ' + key)
    require(row['sourceLayers']['sha256'] == action['layerManifest']['sha256'], 'Export belongs to another layer source')
    layer = read_json(verify(entry['roots'][action['layerManifest']['root']], action['layerManifest']))
    require(row['sourceSha256'] == layer['sourceSha256'], 'Export render fingerprint changed')
    framing = read_json(verify(entry['roots'][action['framing']['root']], action['framing']))
    require(row['framing'] == framing, 'Export framing changed')
    require(set(row['sourceVideos']) == set(action['baselineVideos']), 'Export baseline set changed')
    for theme in action['baselineVideos']:
        require(row['sourceVideos'][theme]['sha256'] == action['baselineVideos'][theme]['sha256'],
                'Export baseline changed: ' + theme)
    for role in ROLES:
        verify(Path(manifest_path).parent, row['files'][role])
    report = read_json(verify(Path(manifest_path).parent, row['qa']['report']))
    require(report.get('passed') is True and report == row['qa']['metrics'], 'Missing or failed actual decode QA')
    require(isinstance(row.get('exportFraming'), dict) and report.get('framingPassed') is True,
            'New exports require complete-source and full-cycle framing QA')
    return manifest, row


def thumbnail_margin(path):
    """Inspect a tiny still only; never decode or re-encode its associated video."""
    from PIL import Image
    with Image.open(path) as image:
        require(image.format == 'WEBP' and image.mode == 'RGBA' and image.size == (240, 240),
                'Thumbnail repair must be a 240x240 RGBA WebP')
        with image.getchannel('A') as alpha:
            bounds = alpha.getbbox()
        require(bounds is not None, 'Thumbnail repair has empty alpha')
        margins = [bounds[0], bounds[1], 240 - bounds[2], 240 - bounds[3]]
        required = math.ceil(240 * .04)
        require(min(margins) >= required, 'Thumbnail repair requires exact 4% alpha margins (10 pixels)')
        return {'alphaBounds': list(bounds), 'marginsPixels': margins, 'requiredPixels': required,
                'rule': 'any nonzero alpha; ceil(dimension * 0.04)', 'passed': True}


def thumbnail_framing_row(output, row, history):
    """Prove thumbnail-only deltas before using their original framing identity."""
    seen = set()
    while row.get('thumbnailDerivation') is not None:
        proof = row['thumbnailDerivation']
        aid = row['id']
        require(isinstance(proof, dict) and proof.get('format') == 'pose-hub-thumbnail-derivation@1'
                and proof in history.get(aid, []), 'Missing thumbnail repair history: ' + aid)
        previous_ref = proof['previousRow']
        require(previous_ref['path'].startswith('history/' + aid + '/')
                and previous_ref['sha256'] not in seen, 'Invalid thumbnail repair ancestry: ' + aid)
        seen.add(previous_ref['sha256'])
        previous = read_json(verify(output, previous_ref))
        require(previous.get('id') == aid and previous['files']['thumbnail'] == proof['previousThumbnail']
                and proof['thumbnail'] == row['files']['thumbnail']
                and isinstance(proof.get('mediaRevision'), str) and ID.fullmatch(proof['mediaRevision'])
                and proof['mediaRevision'] == row.get('mediaRevision')
                and proof['mediaRevision'] != previous.get('mediaRevision')
                and proof['thumbnail']['path'] == f'media/{aid}/{proof["mediaRevision"]}/{aid}.thumbnail.alpha.webp',
                'Thumbnail repair identity changed: ' + aid)
        expected = json.loads(json.dumps(previous))
        expected['files']['thumbnail'] = proof['thumbnail']
        expected['mediaRevision'] = proof['mediaRevision']
        expected['thumbnailDerivation'] = proof
        require(expected == row, 'Thumbnail-only repair changed another field: ' + aid)
        verify(output, proof['previousThumbnail'])
        current = verify(output, proof['thumbnail'])
        require(thumbnail_margin(current) == proof.get('alphaMarginQa'),
                'Thumbnail repair margin evidence changed: ' + aid)
        row = previous
    return row


class Assembler:
    def __init__(self, output, work_root, catalog_path, entries, exporter_sha, excludes,
                 repair_manifest=None, bindings=None):
        self.output, self.work_root = Path(output), Path(work_root)
        self.catalog_path = Path(catalog_path)
        self.catalog = read_json(catalog_path)
        self.catalog_sha = digest(catalog_path)
        self.semantic_refresh_error = None
        self.rows = {row['id']: row for row in self.catalog['actions']}
        require(len(self.rows) == len(self.catalog['actions']), 'Duplicate catalog ID')
        require(all(ID.fullmatch(a) for a in self.rows), 'Unsafe catalog ID')
        require(all(r.get('reviewed') is False and r.get('releaseEligible') is False for r in self.rows.values()),
                'Test catalog must remain unreviewed')
        self.entries, self.exporter_sha, self.excludes = entries, exporter_sha, set(excludes)
        self.base_entries = dict(entries)
        self.bindings = bindings or {}
        self.repair_path = Path(repair_manifest) if repair_manifest else None
        self.repairs, self.allowed_legacy, _ = read_repairs(self.repair_path)
        self.repair_sha = digest(self.repair_path) if self.repair_path else None
        self.repair_history, self.repair_authorizations, self.repair_plan_history = {}, {}, {}
        self.still_repair_history = {}
        require(self.excludes <= self.rows.keys(), 'Excluded IDs outside catalog')
        require(entries.keys() <= self.rows.keys(), 'Plan IDs outside catalog')
        self.ready, self.verified_ready, self.states, self.failures = {}, set(), {}, []
        self.queue_state, self.awaiting_source = 'running', False
        existing = self.output / 'manifest.json'
        if existing.exists():
            old = read_json(existing)
            require(old.get('format') == FORMAT and old.get('status') == 'test-unreviewed', 'Unexpected existing output manifest')
            self.states = old.get('states', {})
            self.failures = old.get('failures', [])
            self.repair_history = old.get('repairHistory', {})
            self.repair_authorizations = old.get('repairAuthorizations', {})
            self.repair_plan_history = old.get('repairPlanHistory', {})
            self.still_repair_history = old.get('stillRepairHistory', {})
            for row in old['actions']:
                aid = row['id']
                require(aid in self.rows, 'Existing deliverable is outside the current catalog: ' + aid)
                repair = self.repairs.get(aid)
                framing_row = thumbnail_framing_row(self.output, row, self.still_repair_history)
                expected_revision = (repair['catalogRevision'] if repair and framing_row.get('mediaRevision') == repair['mediaRevision']
                                     else self.rows[aid]['revision'])
                require(row.get('catalogRevision') == expected_revision, 'Catalog revision changed for ready action: ' + aid)
                require(row.get('exporterSha256') == exporter_sha or row.get('exporterSha256') in self.allowed_legacy,
                        'Ready action exporter is not explicitly allowed: ' + aid)
                require(row.get('reviewed') is False and row.get('releaseEligible') is False,
                        'Stored test action unexpectedly claims approval')
                for role in ROLES:
                    verify(self.output, row['files'][role])
                report = read_json(verify(self.output, row['qa']['report']))
                require(report.get('passed') is True and report == row['qa']['metrics'], 'Stored decode QA failed')
                if aid in entries and not repair:
                    entry = entries[aid]
                    expected_key = (entry['key'] if row.get('exporterSha256') == exporter_sha else
                                    source_key(entry['action'], entry['skin'], row['exporterSha256']))
                    require(row['queueSourceKey'] == expected_key, 'Source changed for ready action: ' + aid)
                self.ready[aid] = row
                self.verified_ready.add(aid)
        self.apply_repairs()

    def apply_repairs(self):
        """Withdraw only explicitly identified old media, and pin new source plans."""
        for aid, repair in self.repairs.items():
            require(aid in self.rows, 'Repair is outside catalog: ' + aid)
            require(repair['sourceRevision'] == self.rows[aid]['revision'], 'Repair source spec revision changed: ' + aid)
            public = {k: v for k, v in repair.items() if not k.startswith('_')}
            previous_auth = self.repair_authorizations.get(aid)
            row = self.ready.get(aid)
            plan_supersession = None
            if previous_auth:
                identity = lambda r: {k: v for k, v in r.items() if k not in ('plan', 'supersedesPlanSha256')}
                require(identity(previous_auth) == identity(public), 'Repair authority changed during continuation: ' + aid)
                previous_plan = previous_auth.get('plan')
                if previous_plan is not None and previous_plan != public.get('plan'):
                    require(row is None, 'Ready repair cannot replace its pinned plan: ' + aid)
                    require(public.get('plan') is not None and repair.get('_planPath') is not None
                            and public.get('supersedesPlanSha256') == previous_plan['sha256'],
                            'Pinned repair plan changed without exact supersedesPlanSha256: ' + aid)
                    previous_ref = {**previous_plan, 'path': f'plans/{previous_plan["sha256"]}.json'}
                    verify(self.output, previous_ref)
                    plan_supersession = {'supersedesPlanSha256': previous_plan['sha256'],
                                         'previousPlan': previous_ref, 'mediaRevision': repair['mediaRevision']}
            framing_row = thumbnail_framing_row(self.output, row, self.still_repair_history) if row else None
            already_repaired = framing_row is not None and framing_row.get('mediaRevision') == repair['mediaRevision']
            if row is not None and not already_repaired:
                require(row['catalogRevision'] == repair['expected']['catalogRevision']
                        and row['queueSourceKey'] == repair['expected']['queueSourceKey'],
                        'Repair does not identify the currently delivered version: ' + aid)
                snapshot = json.loads(json.dumps(row))
                snapshot['availableForApp'] = False
                snapshot['supersededReason'] = repair['reason']
                name = f'history/{aid}/{hash_value(snapshot)}.json'
                if not safe(self.output, name).exists():
                    atomic_json(self.output, name, snapshot)
                ref = {'path': name, 'bytes': safe(self.output, name).stat().st_size,
                       'sha256': digest(safe(self.output, name)), 'catalogRevision': row['catalogRevision'],
                       'mediaRevision': row.get('mediaRevision'), 'queueSourceKey': row['queueSourceKey']}
                history = self.repair_history.setdefault(aid, [])
                if ref not in history:
                    history.append(ref)
                self.ready.pop(aid)
                self.verified_ready.discard(aid)
            elif row is None and aid not in self.repair_history and aid not in self.repair_authorizations:
                base = self.base_entries.get(aid, self.entries.get(aid))
                require(base is not None, 'Pending repair must identify an existing source plan: ' + aid)
                possible = {source_key(base['action'], base['skin'], tool) for tool in self.allowed_legacy | {self.exporter_sha}}
                require(repair['expected']['catalogRevision'] == self.rows[aid]['revision']
                        and repair['expected']['queueSourceKey'] in possible, 'Pending repair source identity changed: ' + aid)
            if repair.get('_planPath'):
                # Keep a stable input even if the producer later edits its convenience plan path.
                plan_name = f'plans/{repair["plan"]["sha256"]}.json'
                immutable_copy(repair['_planPath'], self.output, plan_name, repair['plan'])
                new = collect_entries([safe(self.output, plan_name)], self.bindings, self.exporter_sha)
                require(set(new) == {aid}, 'Each repair plan must contain exactly its authorized action: ' + aid)
                self.entries[aid] = new[aid]
                if plan_supersession is not None:
                    plan_supersession.update({'replacementPlan': {**repair['plan'], 'path': plan_name},
                                               'changedAt': now()})
                    self.repair_plan_history.setdefault(aid, []).append(plan_supersession)
                if already_repaired:
                    old_tool = row.get('exporterSha256')
                    require(old_tool == self.exporter_sha or old_tool in self.allowed_legacy,
                            'Ready repair exporter is not explicitly allowed: ' + aid)
                    # A new encoder implementation does not invalidate already verified
                    # media from the exact same pinned plan and historical tool.
                    expected_key = source_key(new[aid]['action'], new[aid]['skin'], old_tool)
                    require(row['queueSourceKey'] == expected_key,
                            'Repaired source changed for ready action: ' + aid)
            else:
                require(not already_repaired, 'Ready repair lost its pinned source plan: ' + aid)
                self.entries.pop(aid, None)
            self.repair_authorizations[aid] = public
            if not already_repaired:
                self.states[aid] = {'state': 'queued-framing-repair' if repair.get('_planPath') else 'pending-framing-source',
                                    'mediaRevision': repair['mediaRevision'], 'reason': repair['reason'], 'updatedAt': now()}
        # Initial samples were excluded only to avoid duplicate work; an explicit repair supersedes that dispatch guard.
        self.excludes.difference_update(self.repairs)

    def refresh_repairs(self):
        if not self.repair_path or digest(self.repair_path) == self.repair_sha:
            return []
        repairs, allowed, _ = read_repairs(self.repair_path)
        require(self.repairs.keys() <= repairs.keys(), 'Repair authority cannot be removed during continuation')
        require(self.allowed_legacy <= allowed, 'Legacy exporter pins cannot be removed during continuation')
        before = {aid: entry['key'] for aid, entry in self.entries.items()}
        self.repairs, self.allowed_legacy = repairs, allowed
        self.apply_repairs()
        self.repair_sha = digest(self.repair_path)
        self.save()
        return [aid for aid, entry in self.entries.items() if before.get(aid) != entry['key']]

    def ingest(self, manifest_path, aid):
        require(aid in self.entries, 'Cannot ingest an action without its current source plan: ' + aid)
        entry = self.entries[aid]
        manifest, row = validate_export(manifest_path, entry, self.exporter_sha)
        root = Path(manifest_path).parent
        imported = json.loads(json.dumps(row))
        # Preflight all existing targets before any publication.
        copies = []
        repair = self.repairs.get(aid)
        version = repair['mediaRevision'] if repair else None
        media_prefix = f'media/{aid}/{version}' if version else f'media/{aid}'
        qa_prefix = f'qa/{aid}/{version}' if version else f'qa/{aid}'
        for role in ROLES:
            ref = row['files'][role]
            source = verify(root, ref)
            destination = f'{media_prefix}/{Path(ref["path"]).name}'
            if safe(self.output, destination).exists():
                verify(self.output, {**ref, 'path': destination})
            copies.append((source, destination, ref))
            imported['files'][role]['path'] = destination
        qa = row['qa']['report']
        copies.append((verify(root, qa), f'{qa_prefix}/decode-check.json', qa))
        for source, destination, ref in copies:
            immutable_copy(source, self.output, destination, ref)
        imported['qa']['report']['path'] = f'{qa_prefix}/decode-check.json'
        plan_name = f'plans/{entry["planSha"]}.json'
        immutable_copy(entry['path'], self.output, plan_name)
        imported.update({'queueSourceKey': entry['key'], 'exporterSha256': self.exporter_sha,
                         'sourcePlanSha256': entry['planSha'], 'sourcePlan': plan_name,
                         'sourceExportManifestSha256': digest(manifest_path),
                         'catalogRevision': repair['catalogRevision'] if repair else self.rows[aid]['revision'],
                         'reviewed': False, 'releaseEligible': False})
        if repair:
            imported.update({'sourceRevision': repair['sourceRevision'], 'mediaRevision': version,
                             'repairReason': repair['reason']})
        self.ready[aid] = imported
        self.verified_ready.add(aid)
        self.states[aid] = {'state': 'ready-test-unreviewed', 'sourceKey': entry['key'], 'updatedAt': now()}
        self.save()
        print(f'[ready {len(self.ready)}/{len(self.rows)} {aid}]', flush=True)

    def ingest_thumbnail_repairs(self, items, staging_root):
        """Publish an explicit still-only batch under the caller's queue lease.

        All items preflight before publication. Immutable orphan copies after an
        interrupted publication may be reused; live rows advance in one save.
        """
        lease_path = self.output / '.queue.lock'
        lease = read_json(lease_path)
        require(lease.get('pid') == os.getpid() and isinstance(lease.get('token'), str)
                and lease['token'], 'Thumbnail ingest requires this process queue lease')
        require(isinstance(items, list) and items, 'Supply an explicit nonempty thumbnail repair batch')
        root, prepared, ids = Path(staging_root).resolve(strict=True), [], set()
        for item in items:
            aid = item['id']
            require(aid in self.ready and aid in self.verified_ready and aid not in ids,
                    'Thumbnail repair requires a unique verified ready ID: ' + str(aid))
            ids.add(aid)
            old = json.loads(json.dumps(self.ready[aid]))
            require(old.get('availableForApp') is True, 'Thumbnail repair action is not App-ready: ' + aid)
            require(item.get('expectedThumbnailSha256') == old['files']['thumbnail']['sha256'],
                    'Thumbnail repair does not identify the current thumbnail: ' + aid)
            version = item.get('mediaRevision')
            require(isinstance(version, str) and ID.fullmatch(version)
                    and version != old.get('mediaRevision')
                    and all(p.get('mediaRevision') != version for p in self.still_repair_history.get(aid, [])),
                    'Thumbnail repair must use a new media revision: ' + aid)
            recipe = item.get('recipe')
            require(isinstance(recipe, dict) and recipe, 'Thumbnail repair needs an explicit recipe: ' + aid)
            recipe = json.loads(canonical(recipe))
            incoming = item['thumbnail']
            require((incoming.get('width'), incoming.get('height')) == (240, 240)
                    and incoming.get('alpha') is True
                    and incoming.get('sha256') != old['files']['thumbnail']['sha256'],
                    'Thumbnail repair reference did not change: ' + aid)
            source = verify(root, incoming)
            margin = thumbnail_margin(source)
            verify(self.output, old['files']['thumbnail'])
            destination = f'media/{aid}/{version}/{aid}.thumbnail.alpha.webp'
            replacement = {**incoming, 'path': destination}
            if safe(self.output, destination).exists():
                verify(self.output, replacement)
            history_name = f'history/{aid}/thumbnail-{hash_value(old)}.json'
            history_path = safe(self.output, history_name)
            if history_path.exists():
                require(read_json(history_path) == old, 'Immutable thumbnail history differs: ' + aid)
            prepared.append((aid, old, source, replacement, version, recipe, margin, history_name))
        require(read_json(lease_path) == lease, 'Queue lease changed before thumbnail publication')
        updates, proofs = {}, {}
        for aid, old, source, replacement, version, recipe, margin, history_name in prepared:
            immutable_copy(source, self.output, replacement['path'], replacement)
            history_path = safe(self.output, history_name)
            if not history_path.exists():
                atomic_json(self.output, history_name, old)
            previous_ref = {'path': history_name, 'bytes': history_path.stat().st_size,
                            'sha256': digest(history_path)}
            require(read_json(verify(self.output, previous_ref)) == old, 'Thumbnail history changed: ' + aid)
            proof = {'format': 'pose-hub-thumbnail-derivation@1', 'at': now(),
                     'previousRow': previous_ref, 'previousThumbnail': old['files']['thumbnail'],
                     'thumbnail': replacement, 'mediaRevision': version,
                     'recipe': recipe, 'alphaMarginQa': margin}
            updated = json.loads(json.dumps(old))
            updated['files']['thumbnail'] = replacement
            updated.update({'mediaRevision': proof['mediaRevision'], 'thumbnailDerivation': proof})
            updates[aid], proofs[aid] = updated, proof
        require(read_json(lease_path) == lease, 'Queue lease changed before thumbnail index update')
        for aid, updated in updates.items():
            self.ready[aid] = updated
            self.still_repair_history.setdefault(aid, []).append(proofs[aid])
        if len(self.ready) == len(self.rows):
            self.queue_state = 'complete'
        self.save()
        return {aid: self.ready[aid]['files']['thumbnail'] for aid in updates}

    def fail(self, aid, error, attempt=None, log=None):
        event = {'id': aid, 'error': str(error), 'at': now()}
        if attempt:
            event['attempt'] = Path(attempt).relative_to(self.work_root).as_posix()
        if log:
            event['log'] = Path(log).relative_to(self.work_root).as_posix()
        record_name = f'failures/{aid}/{uuid.uuid4().hex}.json'
        atomic_json(self.output, record_name, event)
        record_path = safe(self.output, record_name)
        event['record'] = {'path': record_name, 'bytes': record_path.stat().st_size,
                           'sha256': digest(record_path)}
        self.failures.append(event)
        self.states[aid] = {'state': 'failed-preserved', 'lastFailure': event}
        self.save()
        print(f'[failed {aid} {error}]', flush=True)

    def refresh_catalog(self):
        """Reload definition-only edits without restarting or re-encoding media."""
        raw = self.catalog_path.read_bytes()
        checksum = hashlib.sha256(raw).hexdigest()
        if checksum == self.catalog_sha:
            return
        try:
            catalog = json.loads(raw)
            validate_semantics_refresh(self.catalog, catalog)
        except (ValueError, KeyError, TypeError) as error:
            message = str(error)
            if self.semantic_refresh_error != message:
                print('[semantic-refresh-rejected ' + message + ']', flush=True)
            self.semantic_refresh_error = message
            return
        self.catalog, self.catalog_sha = catalog, checksum
        self.rows = {row['id']: row for row in catalog['actions']}
        self.semantic_refresh_error = None
        print('[semantic-refresh ' + checksum + ']', flush=True)

    def delivered_semantics(self):
        summary = json.loads(json.dumps(self.catalog.get('trainingSemantics')))
        if summary is None:
            return None, {}
        repo = Path(__file__).resolve().parents[2]
        delivered = {}
        for ref in summary['sourceFiles']:
            destination = ('catalog/catalog.json' if ref['path'] == 'catalog/catalog.json' else
                           f'catalog/semantic-sources/{ref["sha256"]}/{Path(ref["path"]).name}')
            if safe(self.output, destination).exists():
                verify(self.output, {**ref, 'path': destination})
            else:
                immutable_copy(verify(repo, ref), self.output, destination, ref)
            delivered[ref['path']] = {**ref, 'sourcePath': ref['path'], 'path': destination}
        summary['sourceFiles'] = [delivered[ref['path']] for ref in summary['sourceFiles']]
        for batch in summary['batches']:
            batch['source'] = delivered[batch['source']['path']]
        if self.semantic_refresh_error:
            summary['refreshError'] = self.semantic_refresh_error
        return summary, delivered

    def save(self):
        self.refresh_catalog()
        # Exclusion controls dispatch, not deletion of already completed deliveries.
        ready = [self.ready[aid] for aid in sorted(self.ready)]
        ready_ids = {r['id'] for r in ready}
        pending = sorted(self.rows.keys() - ready_ids)
        for row in ready:
            row['availableForApp'] = row['id'] in self.verified_ready
        states = {}
        for aid, row in self.rows.items():
            states[aid] = ({'state': 'ready-test-unreviewed'} if aid in ready_ids else
                           {'state': 'excluded-by-request'} if aid in self.excludes else
                           self.states.get(aid, {'state': 'queued' if aid in self.entries else row['state']}))
        packed = sum(a['files']['video']['bytes'] for a in ready)
        stills = sum(a['files'][r]['bytes'] for a in ready for r in ('cover', 'thumbnail'))
        comparable = [a for a in ready if {'dark', 'light'} <= a['sourceVideos'].keys()]
        comparable_packed = sum(a['files']['video']['bytes'] for a in comparable)
        dark = sum(a['sourceVideos']['dark']['bytes'] for a in comparable)
        light = sum(a['sourceVideos']['light']['bytes'] for a in comparable)
        sizes = {'packedMp4Bytes': packed, 'alphaWebpBytes': stills, 'deliveryMediaBytes': packed + stills,
                 'originalDarkMp4Bytes': dark, 'originalLightMp4Bytes': light,
                 'originalBothThemesMp4Bytes': dark + light,
                 'baselineComparableActionCount': len(comparable), 'baselineComparablePackedBytes': comparable_packed,
                 'packedVsOneDarkRatio': comparable_packed / dark if dark else None,
                 'packedVsBothThemesRatio': comparable_packed / (dark + light) if dark + light else None,
                 'comparisonScope': 'Only ready actions with both original baseline themes; fresh captures excluded from ratios.'}
        manifest = {'format': FORMAT, 'id': self.catalog['id'], 'status': 'test-unreviewed',
                    'complete': len(ready) == len(self.rows), 'reviewed': False, 'releaseEligible': False,
                    'updatedAt': now(), 'sourceCatalogSha256': self.catalog_sha,
                    'exporterSha256': self.exporter_sha, 'readyCount': len(ready), 'totalCount': len(self.rows),
                    'pendingCount': len(pending),
                    'queueState': self.queue_state,
                    'pendingIds': pending, 'excluded': sorted(self.excludes - ready_ids),
                    'queueExcludedIds': sorted(self.excludes), 'states': states,
                    'skin': 'realistic',
                    'workerThreadEnvironment': {key: '1' for key in THREAD_ENV},
                    'encoding': {'layout': 'top-rgb-bottom-alpha', 'width': 720, 'height': 1440,
                                 'crf': 12, 'rgbBleedPixels': 8, 'rgbAlphaMode': 'straight',
                                 'alphaChannelAfterRgbDecode': 'red', 'matrix': 'bt709', 'range': 'limited'},
                    'actions': ready, 'sizes': sizes, 'failures': self.failures,
                    'allowedLegacyExporterSha256': sorted(self.allowed_legacy),
                    'repairAuthorizations': self.repair_authorizations, 'repairHistory': self.repair_history,
                    'repairPlanHistory': self.repair_plan_history, 'stillRepairHistory': self.still_repair_history}
        catalog = json.loads(json.dumps(self.catalog))
        semantics, semantic_sources = self.delivered_semantics()
        if semantics is not None:
            manifest['trainingSemantics'] = semantics
            catalog['trainingSemantics'] = semantics
        for row in catalog['actions']:
            aid = row['id']
            if aid in self.repairs:
                repair = self.repairs[aid]
                row.update({'revision': repair['catalogRevision'], 'sourceRevision': repair['sourceRevision'],
                            'mediaRevision': repair['mediaRevision'], 'repairReason': repair['reason']})
            if aid in ready_ids:
                row.update({'files': self.ready[aid]['files'], 'qa': self.ready[aid]['qa'],
                            'state': 'ready-test-unreviewed', 'revision': self.ready[aid]['catalogRevision']})
                for field in ('sourceRevision', 'mediaRevision', 'thumbnailDerivation'):
                    if field in self.ready[aid]:
                        row[field] = self.ready[aid][field]
                    else:
                        row.pop(field, None)
            else:
                row.pop('files', None)
                row.pop('qa', None)
                row['state'] = states[aid]['state']
            row['availableForApp'] = aid in ready_ids and aid in self.verified_ready
            row['reviewed'] = False; row['releaseEligible'] = False
            row['availableForTraining'] = row['availableForApp'] and row.get('trainingDefinitionComplete') is True
            for ref in row.get('trainingSemantics', {}).get('evidence', []):
                if ref['path'] in semantic_sources:
                    delivered = semantic_sources[ref['path']]
                    ref.update({'path': delivered['path'], 'sourcePath': delivered['sourcePath'], 'root': 'pack'})
                else:
                    ref['root'] = 'repository'
        catalog.update({'readyCount': len(ready), 'pendingCount': len(pending),
                        'totalCount': len(self.rows), 'pendingIds': pending})
        progress = {key: manifest[key] for key in ('id', 'status', 'updatedAt', 'readyCount', 'totalCount',
                                                   'pendingCount', 'pendingIds', 'excluded', 'states', 'failures', 'sizes', 'queueState')}
        # Pin a complete catalog snapshot before advancing the mutable indexes.
        # Consumers can read manifest.catalog to avoid mixing two live batches.
        catalog_bytes = (json.dumps(catalog, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode('utf-8')
        catalog_sha = hashlib.sha256(catalog_bytes).hexdigest()
        snapshot = f'catalog/snapshots/{catalog_sha}.json'
        snapshot_path = safe(self.output, snapshot)
        if not snapshot_path.exists():
            atomic_json(self.output, snapshot, catalog)
        verify(self.output, {'path': snapshot, 'bytes': len(catalog_bytes), 'sha256': catalog_sha})
        manifest['catalog'] = {'path': snapshot, 'bytes': len(catalog_bytes), 'sha256': catalog_sha}
        atomic_json(self.output, 'catalog.json', catalog)
        atomic_json(self.output, 'manifest.json', manifest)
        atomic_json(self.output, 'progress.json', progress)


def collect_entries(paths, bindings, exporter_sha):
    entries = {}
    for path in paths:
        path = Path(path).resolve(strict=True)
        plan = read_json(path)
        require(plan.get('format') == 'pose-hub-stacked-alpha-plan@1', 'Unsupported plan')
        require(plan.get('skin') == 'realistic', 'Test pack preserves the realistic skin')
        eligible = plan['consumer']['eligibleActionIds']
        require(len(eligible) == len(set(eligible)), 'Duplicate plan eligible IDs')
        roots = expanded_roots(plan, bindings)
        plan_sha = digest(path)
        seen = set()
        for action in plan['actions']:
            aid = action['id']
            require(ID.fullmatch(aid) and aid in eligible and aid not in seen, 'Invalid or duplicate plan action')
            seen.add(aid)
            key = source_key(action, plan['skin'], exporter_sha)
            require(aid not in entries or entries[aid]['key'] == key, 'Conflicting sources in plans: ' + aid)
            entries[aid] = {'action': action, 'key': key, 'path': path, 'planSha': plan_sha,
                            'roots': roots, 'skin': plan['skin']}
    return entries


def read_repairs(path):
    """Explicit, checksum-pinned replacement authority, separate from source specs."""
    if path is None:
        return {}, set(), None
    path = Path(path).resolve(strict=True)
    document = read_json(path)
    require(document.get('format') == 'pose-hub-app-test-repairs@1', 'Unsupported repair manifest')
    legacy = document.get('allowedLegacyExporterSha256', [])
    require(isinstance(legacy, list) and all(isinstance(v, str) and re.fullmatch(r'[0-9a-f]{64}', v) for v in legacy),
            'Legacy exporters require explicit SHA-256 pins')
    repairs = {}
    for row in document['actions']:
        aid = row['id']
        require(ID.fullmatch(aid) and aid not in repairs, 'Invalid/duplicate repair action')
        require(all(isinstance(row.get(k), str) and row[k] for k in
                    ('mediaRevision', 'catalogRevision', 'sourceRevision', 'reason')), 'Incomplete repair identity')
        require(ID.fullmatch(row['mediaRevision']) and ID.fullmatch(row['catalogRevision']), 'Unsafe repair revision')
        expected = row['expected']
        require(isinstance(expected.get('catalogRevision'), str)
                and re.fullmatch(r'[0-9a-f]{64}', expected.get('queueSourceKey', '')), 'Repair must pin previous revision/source key')
        require(row['catalogRevision'] != expected['catalogRevision'], 'Repair must advance catalog revision')
        require('supersedesPlanSha256' not in row
                or (isinstance(row['supersedesPlanSha256'], str)
                    and re.fullmatch(r'[0-9a-f]{64}', row['supersedesPlanSha256'])),
                'Repair supersession requires an exact previous plan SHA-256')
        row = json.loads(json.dumps(row))
        if row.get('plan') is not None:
            ref = row['plan']
            candidate = Path(ref['path'])
            if not candidate.is_absolute():
                candidate = path.parent / candidate
            require(candidate.is_file() and type(ref.get('bytes')) is int and ref['bytes'] > 0
                    and candidate.stat().st_size == ref['bytes'] and digest(candidate) == ref['sha256'],
                    'Repair plan identity mismatch: ' + aid)
            row['_planPath'] = candidate.resolve()
        repairs[aid] = row
    return repairs, set(legacy), path


def stop_requested(path):
    return path is not None and Path(path).exists()


def refresh_watch(directory, entries, bindings, exporter_sha, seen, allowed, repairs=None):
    """Discover complete plan documents; never silently replace an existing ID."""
    added = []
    if directory is None or not Path(directory).exists():
        return added
    require(Path(directory).is_dir(), 'Watch-plan path is not a directory')
    for path in sorted(Path(directory).glob('*.json')):
        try:
            identity = digest(path)
            if seen.get(str(path)) == identity:
                continue
            document = read_json(path)
        except (OSError, ValueError):
            # A producer may still be finishing a file. No task is created from it.
            continue
        if document.get('format') != 'pose-hub-stacked-alpha-plan@1':
            seen[str(path)] = identity
            continue
        candidate = collect_entries([path], bindings, exporter_sha)
        require(candidate.keys() <= allowed, 'Watched plan contains IDs outside the test catalog')
        # Replacements come only from their checksum-pinned repair authority, never the ordinary source watcher.
        candidate = {aid: entry for aid, entry in candidate.items() if aid not in (repairs or {})}
        for aid, entry in candidate.items():
            require(aid not in entries or entries[aid]['key'] == entry['key'],
                    'Conflicting source in watched plan: ' + aid)
        for aid, entry in candidate.items():
            if aid not in entries:
                entries[aid] = entry
                added.append(aid)
        seen[str(path)] = identity
    return added


def check_source_overlap(entry, output, work):
    source = entry['roots'][entry['action']['sourceRoot']]
    require(not output.is_relative_to(source) and not work.is_relative_to(source)
            and not source.is_relative_to(output) and not source.is_relative_to(work),
            'Output/work root overlaps an immutable source media batch')


def run(args):
    limit_worker_threads()
    output, work = args.output.resolve(), args.work_root.resolve()
    require(not args.heavy_lock or args.workers == 1, '--heavy-lock requires --workers 1')
    heavy = HeavySlot(args.heavy_lock, int(args.min_commit_gib * 1024 ** 3),
                      args.peer_heavy_lock, args.admission_lock,
                      int(args.parallel_min_commit_gib * 1024 ** 3),
                      int(args.parallel_min_physical_gib * 1024 ** 3))
    require(output != work and not output.is_relative_to(work) and not work.is_relative_to(output),
            'Work attempts and final package must be separate roots')
    bindings = {}
    for text in args.bind:
        key, separator, value = text.partition('=')
        require(separator and key not in bindings and key in ('release', 'pilot', 'production'), 'Invalid/duplicate root binding')
        bindings[key] = str(Path(value).resolve(strict=True))
    require({'release', 'pilot', 'production'} <= bindings.keys(), 'Supply release, pilot and production bindings')
    exporter = Path(__file__).with_name('export_stacked_alpha.py')
    exporter_sha = digest(exporter)
    entries = collect_entries(args.plan, bindings, exporter_sha)
    for entry in entries.values():
        check_source_overlap(entry, output, work)
    for parent in bindings.values():
        require(output != Path(parent) and work != Path(parent), 'Never use a source binding root as output')
    output.mkdir(parents=True, exist_ok=True); work.mkdir(parents=True, exist_ok=True)
    lock = output / '.queue.lock'
    token = {'pid': os.getpid(), 'token': uuid.uuid4().hex, 'startedAt': now()}
    with lock.open('x', encoding='utf-8') as stream:
        json.dump(token, stream)
    try:
        assembler = Assembler(output, work, args.catalog, entries, exporter_sha, args.exclude_ids,
                              args.repair_manifest, bindings)
        for manifest_path in args.ingest:
            prior = read_json(manifest_path)
            require(prior.get('complete') is True, 'Cannot ingest a partial export')
            for row in prior['actions']:
                # Exclusion prevents duplicate encoding; completed supplied samples still ingest.
                assembler.ingest(Path(manifest_path), row['id'])
        todo = []
        for aid, entry in entries.items():
            if aid in assembler.ready or aid in assembler.excludes:
                continue
            reused = False
            candidates = sorted(work.glob(f'{aid}-*/manifest.json'), reverse=True)
            for candidate in candidates:
                try:
                    validate_export(candidate, entry, exporter_sha)
                except (OSError, ValueError, KeyError, TypeError):
                    continue
                assembler.ingest(candidate, aid); reused = True; break
            if not reused:
                todo.append(aid)
        assembler.save()
        # --ingest-only permits assembly while another task controls CPU load.
        if args.ingest_only:
            return assembler
        seen_watch, attempted = {}, set()
        idle_since = None
        with ActionProcessPool(args.workers) as pool:
            active = {}
            previous_heavy_wait = None
            while True:
                blocked_heavy = None
                if stop_requested(args.stop_after_current_file) and not active:
                    assembler.queue_state = 'stopped-after-current'
                    assembler.save()
                    break
                repaired = assembler.refresh_repairs() if not active else []
                # A newly withdrawn source must never remain queued under its earlier identity.
                todo = [aid for aid in todo if aid in entries and aid not in assembler.ready]
                for aid in repaired:
                    if aid not in assembler.ready and aid not in todo:
                        attempted.discard(aid)
                        todo.insert(0, aid)
                discovered = refresh_watch(args.watch_plan_dir, entries, bindings, exporter_sha,
                                           seen_watch, assembler.rows.keys(), assembler.repairs)
                for aid in discovered:
                    check_source_overlap(entries[aid], output, work)
                    if aid not in assembler.ready and aid not in assembler.excludes and aid not in attempted and aid not in todo:
                        reused = False
                        for candidate in sorted(work.glob(f'{aid}-*/manifest.json'), reverse=True):
                            try:
                                validate_export(candidate, entries[aid], exporter_sha)
                            except (OSError, ValueError, KeyError, TypeError):
                                continue
                            assembler.ingest(candidate, aid); reused = True; break
                        if not reused:
                            todo.append(aid)
                if discovered:
                    print('[new-source ' + ','.join(discovered) + ']', flush=True)
                    assembler.queue_state = 'running'
                    assembler.save()
                    idle_since = None
                while todo and len(active) < args.workers and not stop_requested(args.stop_after_current_file):
                    aid = todo[0]
                    state, owner = heavy.try_acquire(aid)
                    if state:
                        blocked_heavy = (state, owner)
                        assembler.queue_state = state
                        assembler.save()
                        detail = canonical({'state': state, 'owner': owner})
                        if detail != previous_heavy_wait:
                            print('[heavy-wait ' + detail + ']', flush=True)
                            previous_heavy_wait = detail
                        break
                    previous_heavy_wait = None
                    todo.pop(0)
                    attempted.add(aid)
                    attempt, log = next_attempt(work, aid)
                    assembler.queue_state = 'running'
                    assembler.states[aid] = {'state': 'encoding', 'attempt': attempt.name, 'updatedAt': now()}
                    assembler.save()
                    task = (str(entries[aid]['path']), bindings, str(attempt), aid, str(log))
                    try:
                        active[pool.submit(worker, task)] = (aid, attempt, log)
                    except BaseException:
                        heavy.release()
                        raise
                if not active:
                    if blocked_heavy:
                        idle_since = None
                        time.sleep(15)
                        continue
                    if not args.watch_plan_dir or len(assembler.ready) == len(assembler.rows):
                        assembler.queue_state = 'complete' if len(assembler.ready) == len(assembler.rows) else 'idle-pending-inputs'
                        break
                    if idle_since is None:
                        idle_since = time.monotonic()
                        assembler.queue_state = 'awaiting-source'
                        assembler.save()
                        print(f'[awaiting-source ready {len(assembler.ready)}/{len(assembler.rows)}]', flush=True)
                    remaining = args.idle_timeout - (time.monotonic() - idle_since)
                    if remaining <= 0:
                        assembler.awaiting_source = True
                        assembler.queue_state = 'awaiting-source'
                        assembler.save()
                        print(f'[awaiting-source timeout {args.idle_timeout}s; package incomplete]', flush=True)
                        break
                    time.sleep(min(args.poll_seconds, remaining))
                    continue
                idle_since = None
                done, _ = wait(active, return_when=FIRST_COMPLETED)
                for future in done:
                    aid, attempt, log = active.pop(future)
                    try:
                        result = future.result()
                        if not result['ok']:
                            assembler.fail(aid, result['error'], result['attempt'], result['log'])
                        else:
                            assembler.ingest(Path(result['manifest']), aid)
                    except Exception as error:
                        assembler.fail(aid, error, attempt, log)
                    finally:
                        if not active:
                            pool.release_idle()
                        heavy.release()
        assembler.save()
        return assembler
    finally:
        try:
            heavy.release()
        finally:
            if lock.exists() and read_json(lock) == token:
                lock.unlink()


def self_test():
    import tempfile
    import unittest
    from unittest.mock import patch

    class QueueTest(unittest.TestCase):
        def test_changed_plan_same_inputs_has_same_key(self):
            a = {'id': 'sample', 'fps': 30, 'frames': 240, 'durationSeconds': 8, 'coverFrame': 66,
                 'coverSize': [720, 720], 'thumbnailSize': [240, 240], 'highlight': {'enabled': True},
                 'layerManifest': {'sha256': 'a'}, 'framing': {'sha256': 'b'},
                 'derivativeManifest': {'sha256': 'c'}, 'baselineVideos': {'dark': {'sha256': 'd'}, 'light': {'sha256': 'e'}}}
            key = source_key(a, 'realistic', 'tool')
            a['irrelevantEnclosingPlan'] = 'new'
            self.assertEqual(source_key(a, 'realistic', 'tool'), key)
            a['derivativeManifest']['sha256'] = 'same-variant-in-extended-manifest'
            self.assertEqual(source_key(a, 'realistic', 'tool'), key)
            a['layerManifest']['sha256'] = 'new-source'
            self.assertNotEqual(source_key(a, 'realistic', 'tool'), key)
            self.assertNotEqual(source_key(a, 'realistic', 'new-tool'), key)

        def test_partial_attempt_and_empty_output_are_not_success(self):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp); (root / 'sample-r1').mkdir()
                self.assertEqual(next_attempt(root, 'sample')[0].name, 'sample-attempt-r2')
                empty = root / 'empty'; empty.touch()
                with self.assertRaises(ValueError):
                    verify(root, {'path': 'empty', 'bytes': 0, 'sha256': digest(empty)})

        def test_copy_is_immutable_and_atomic_json_is_readable(self):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp); output = root / 'output'; output.mkdir()
                source = root / 'source'; source.write_bytes(b'first')
                immutable_copy(source, output, 'media/sample/video.mp4')
                immutable_copy(source, output, 'media/sample/video.mp4')
                source.write_bytes(b'second')
                with self.assertRaises(ValueError):
                    immutable_copy(source, output, 'media/sample/video.mp4')
                self.assertEqual((output / 'media/sample/video.mp4').read_bytes(), b'first')
                atomic_json(output, 'progress.json', {'ready': 1})
                atomic_json(output, 'progress.json', {'ready': 2})
                self.assertEqual(read_json(output / 'progress.json')['ready'], 2)
                self.assertEqual(list((output / '.staging').iterdir()), [])

        def test_path_escape(self):
            with self.assertRaises(ValueError):
                safe(Path.cwd(), '../source')

        def test_worker_thread_limits_override_process_defaults(self):
            with patch.dict(os.environ, {key: '32' for key in THREAD_ENV}):
                limit_worker_threads()
                self.assertEqual({key: os.environ[key] for key in THREAD_ENV},
                                 {key: '1' for key in THREAD_ENV})

        def test_heavy_slot_exclusion_and_own_finally_release(self):
            with tempfile.TemporaryDirectory() as temp, patch(__name__ + '.available_commit_bytes', return_value=None):
                path = Path(temp) / 'heavy.lock'
                first, second = HeavySlot(path), HeavySlot(path)
                self.assertEqual(first.try_acquire('a'), (None, None))
                owner = read_json(path)
                self.assertEqual((owner['pid'], owner['role'], owner['action']), (os.getpid(), 'cpu', 'a'))
                with patch(__name__ + '.pid_alive', return_value=True):
                    state, blocked_owner = second.try_acquire('b')
                self.assertEqual(state, 'awaiting-heavy-slot')
                self.assertEqual(blocked_owner, owner)
                second.release()
                self.assertEqual(read_json(path), owner)
                try:
                    raise RuntimeError('simulated interrupted CPU job')
                except RuntimeError:
                    pass
                finally:
                    first.release()
                self.assertFalse(path.exists())
                self.assertEqual(second.try_acquire('b'), (None, None))
                second.release()

        def test_gpu_priority_and_low_commit_wait_instead_of_failure(self):
            with tempfile.TemporaryDirectory() as temp:
                path = Path(temp) / 'heavy.lock'; request = path.parent / 'gpu-wants-slot.json'
                request.write_text(json.dumps({'pid': os.getpid(), 'role': 'gpu'}), encoding='utf-8')
                gate = HeavySlot(path)
                with patch(__name__ + '.pid_alive', return_value=True):
                    self.assertEqual(gate.try_acquire('a')[0], 'awaiting-gpu-priority')
                self.assertFalse(path.exists())
                request.unlink()
                with patch(__name__ + '.available_commit_bytes', return_value=3 * 1024 ** 3):
                    state, available = gate.try_acquire('a')
                self.assertEqual(state, 'awaiting-commit-memory')
                self.assertEqual(available['minimumCommitBytes'], 4 * 1024 ** 3)
                self.assertFalse(path.exists())

        def test_stale_heavy_lock_is_reported_and_preserved(self):
            with tempfile.TemporaryDirectory() as temp:
                path = Path(temp) / 'heavy.lock'
                path.write_text('{"pid":999999999,"role":"gpu","action":"old"}', encoding='utf-8')
                before = digest(path)
                with patch(__name__ + '.available_commit_bytes', return_value=None), patch(__name__ + '.pid_alive', return_value=False):
                    with self.assertRaisesRegex(ValueError, 'Stale/unknown heavy lock preserved'):
                        HeavySlot(path).try_acquire('a')
                self.assertEqual(digest(path), before)

        def test_append_resume_keeps_ready_and_pending_has_no_files(self):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp); output = root / 'output'; output.mkdir()
                work = root / 'work'; work.mkdir()
                catalog_path = root / 'source-catalog.json'
                def write_catalog(ids):
                    catalog_path.write_text(json.dumps({'id': 'test', 'actions': [
                        {'id': aid, 'revision': aid + '-r1', 'state': 'pending-full',
                         'reviewed': False, 'releaseEligible': False} for aid in ids]}), encoding='utf-8')
                write_catalog(['a', 'b'])
                first = Assembler(output, work, catalog_path, {}, 'tool', [])
                refs = {}
                for role in ROLES:
                    name = f'media/a/{role}.bin'
                    path = safe(output, name); path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_bytes(role.encode())
                    refs[role] = {'path': name, 'bytes': path.stat().st_size, 'sha256': digest(path)}
                qa_path = safe(output, 'qa/a/decode-check.json'); qa_path.parent.mkdir(parents=True)
                qa_path.write_text('{"passed": true}', encoding='utf-8')
                first.ready['a'] = {'id': 'a', 'files': refs, 'qa': {'report': {
                    'path': 'qa/a/decode-check.json', 'bytes': qa_path.stat().st_size, 'sha256': digest(qa_path)},
                    'metrics': {'passed': True}}, 'catalogRevision': 'a-r1', 'exporterSha256': 'tool',
                    'queueSourceKey': 'same-inputs', 'reviewed': False, 'releaseEligible': False,
                    'sourceVideos': {'dark': {'bytes': 10}, 'light': {'bytes': 12}}}
                first.verified_ready.add('a')
                first.save()
                write_catalog(['a', 'b', 'c'])
                resumed = Assembler(output, work, catalog_path, {'a': {'key': 'same-inputs'}}, 'tool', ['a'])
                resumed.save()
                manifest = read_json(output / 'manifest.json')
                self.assertEqual(manifest['readyCount'], 1)
                self.assertEqual(manifest['pendingIds'], ['b', 'c'])
                self.assertEqual(manifest['sizes']['originalBothThemesMp4Bytes'], 22)
                pending = [r for r in read_json(output / 'catalog.json')['actions'] if r['id'] != 'a']
                self.assertTrue(all('files' not in r for r in pending))
                self.assertTrue(all(r['availableForApp'] is False for r in pending))
                ready_row = read_json(output / 'catalog.json')['actions'][0]
                self.assertIs(ready_row['availableForApp'], True)
                watching = root / 'plans'; watching.mkdir()
                (watching / 'not-an-export-plan.json').write_text('{"format":"catalog@1"}', encoding='utf-8')
                b = {'id': 'b', 'fps': 30, 'frames': 240, 'durationSeconds': 8, 'coverFrame': 66,
                     'coverSize': [720, 720], 'thumbnailSize': [240, 240], 'highlight': {'enabled': True},
                     'layerManifest': {'sha256': 'a'}, 'framing': {'sha256': 'b'},
                     'derivativeManifest': {'sha256': 'c'}, 'baselineVideos': {}, 'sourceRoot': 'capture-b'}
                new_plan = {'format': 'pose-hub-stacked-alpha-plan@1', 'skin': 'realistic',
                            'consumer': {'eligibleActionIds': ['a', 'b', 'c']},
                            'bindings': {'capture-b': {'parentBinding': 'production', 'relativeRoot': 'capture-b'}},
                            'actions': [b]}
                watched = watching / 'b.json'; watched.write_text(json.dumps(new_plan), encoding='utf-8')
                seen = {}
                self.assertEqual(refresh_watch(watching, resumed.entries, {'production': root}, 'tool', seen,
                                               resumed.rows.keys()), ['b'])
                self.assertEqual(set(resumed.ready), {'a'})
                self.assertEqual(refresh_watch(watching, resumed.entries, {'production': root}, 'tool', seen,
                                               resumed.rows.keys()), [])
                new_plan['actions'][0]['layerManifest']['sha256'] = 'different-source'
                watched.write_text(json.dumps(new_plan), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Conflicting source in watched plan'):
                    refresh_watch(watching, resumed.entries, {'production': root}, 'tool', seen, resumed.rows.keys())
                resumed.fail('b', 'actual encoder failure')
                failed = read_json(output / 'manifest.json')
                self.assertEqual(failed['readyCount'], 1)
                self.assertEqual(failed['states']['b']['state'], 'failed-preserved')
                verify(output, failed['failures'][0]['record'])

        def test_explicit_repair_withdraws_versions_and_resumes_without_overwrite(self):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp); output = root / 'output'; output.mkdir()
                work = root / 'work'; work.mkdir()
                catalog = root / 'catalog.json'
                catalog.write_text(json.dumps({'id': 'test', 'actions': [
                    {'id': 'a', 'revision': 'a-r1', 'state': 'pending-full',
                     'reviewed': False, 'releaseEligible': False}]}), encoding='utf-8')
                old_tool, new_tool = '0' * 64, '1' * 64
                action = {'id': 'a', 'fps': 30, 'frames': 240, 'durationSeconds': 8, 'coverFrame': 0,
                          'coverSize': [720, 720], 'thumbnailSize': [240, 240], 'highlight': {'enabled': True},
                          'layerManifest': {'sha256': 'old-source'}, 'framing': {'sha256': 'old-crop'},
                          'baselineVideos': {}, 'sourceRoot': 'source'}
                plan = {'format': 'pose-hub-stacked-alpha-plan@1', 'skin': 'realistic',
                        'consumer': {'eligibleActionIds': ['a']},
                        'bindings': {'source': {'parentBinding': 'production', 'relativeRoot': 'source'}},
                        'actions': [action]}
                old_plan = root / 'old-plan.json'; old_plan.write_text(json.dumps(plan), encoding='utf-8')
                bindings = {'production': root}
                first = Assembler(output, work, catalog, collect_entries([old_plan], bindings, old_tool), old_tool, [])

                def delivered_row(folder, content):
                    refs = {}
                    for role in ROLES:
                        name = f'{folder}/{role}.bin'; path = safe(output, name)
                        path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(content + role.encode())
                        refs[role] = {'path': name, 'bytes': path.stat().st_size, 'sha256': digest(path)}
                    qa = safe(output, folder + '/decode-check.json'); qa.write_text('{"passed":true}', encoding='utf-8')
                    return {'id': 'a', 'files': refs, 'qa': {'report': {
                        'path': qa.relative_to(output).as_posix(), 'bytes': qa.stat().st_size, 'sha256': digest(qa)},
                        'metrics': {'passed': True}}, 'catalogRevision': 'a-r1', 'exporterSha256': old_tool,
                        'queueSourceKey': first.entries['a']['key'], 'reviewed': False, 'releaseEligible': False,
                        'sourceVideos': {}}

                original = delivered_row('media/a', b'old-')
                first.ready['a'] = original; first.verified_ready.add('a'); first.save()
                repair_path = root / 'repairs.json'
                authority = {'format': 'pose-hub-app-test-repairs@1', 'allowedLegacyExporterSha256': [old_tool],
                             'actions': [{'id': 'a', 'expected': {'catalogRevision': 'a-r1',
                                 'queueSourceKey': original['queueSourceKey']}, 'sourceRevision': 'a-r1',
                                 'catalogRevision': 'a-r1-alpha-r2', 'mediaRevision': 'a-alpha-r2',
                                 'reason': 'complete ground shadow', 'plan': None}]}
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                repaired = Assembler(output, work, catalog, collect_entries([old_plan], bindings, new_tool),
                                     new_tool, ['a'], repair_path, bindings)
                repaired.save()
                self.assertFalse(repaired.ready)
                self.assertNotIn('a', repaired.entries)
                self.assertNotIn('a', repaired.excludes)
                pending = read_json(output / 'catalog.json')['actions'][0]
                self.assertEqual(pending['revision'], 'a-r1-alpha-r2')
                self.assertFalse(pending['availableForApp']); self.assertNotIn('files', pending)
                self.assertTrue(repaired.repair_history['a'])
                verify(output, repaired.repair_history['a'][0])
                self.assertEqual(safe(output, original['files']['video']['path']).read_bytes(), b'old-video')
                # The authority can later add exactly one pinned plan and the parent discovers it.
                plan['actions'][0]['layerManifest']['sha256'] = 'complete-new-source'
                new_plan = root / 'new-plan.json'; new_plan.write_text(json.dumps(plan), encoding='utf-8')
                authority['actions'][0]['plan'] = {'path': str(new_plan), 'bytes': new_plan.stat().st_size,
                                                   'sha256': digest(new_plan)}
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                self.assertEqual(repaired.refresh_repairs(), ['a'])
                pinned_sha = digest(new_plan)
                plan['actions'][0]['layerManifest']['sha256'] = 'replacement-full-capture'
                replacement = root / 'replacement-plan.json'
                replacement.write_text(json.dumps(plan), encoding='utf-8')
                authority['actions'][0]['plan'] = {'path': str(replacement), 'bytes': replacement.stat().st_size,
                                                   'sha256': digest(replacement)}
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'without exact supersedesPlanSha256'):
                    repaired.refresh_repairs()
                authority['actions'][0]['supersedesPlanSha256'] = 'e' * 64
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'without exact supersedesPlanSha256'):
                    repaired.refresh_repairs()
                authority['actions'][0]['supersedesPlanSha256'] = pinned_sha
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                self.assertEqual(repaired.refresh_repairs(), ['a'])
                audit = read_json(output / 'manifest.json')['repairPlanHistory']['a']
                self.assertEqual(len(audit), 1)
                self.assertEqual(audit[0]['supersedesPlanSha256'], pinned_sha)
                verify(output, audit[0]['previousPlan']); verify(output, audit[0]['replacementPlan'])
                incoming = delivered_row('incoming/a', b'new-')
                manifest_path = root / 'completed.json'; manifest_path.write_text('{}', encoding='utf-8')
                # isolate publication mechanics from codec validation; no renderer/encoder is launched.
                with patch(__name__ + '.validate_export', return_value=({}, incoming)):
                    # incoming references are relative to this fixture output root.
                    repaired.ingest(output / 'manifest.json', 'a')
                newest = read_json(output / 'manifest.json')['actions'][0]
                self.assertIn('/a-alpha-r2/', newest['files']['video']['path'])
                self.assertEqual(newest['catalogRevision'], 'a-r1-alpha-r2')
                self.assertEqual(safe(output, original['files']['video']['path']).read_bytes(), b'old-video')
                resumed = Assembler(output, work, catalog, collect_entries([old_plan], bindings, new_tool),
                                    new_tool, [], repair_path, bindings)
                self.assertEqual(resumed.ready['a']['mediaRevision'], 'a-alpha-r2')
                self.assertEqual(resumed.repair_plan_history, repaired.repair_plan_history)
                # The identical pinned repair survives a tool-only update only
                # through an explicit historical-exporter pin.
                authority['allowedLegacyExporterSha256'].append(new_tool)
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                newest_tool = '2' * 64
                upgraded = Assembler(output, work, catalog, collect_entries([old_plan], bindings, newest_tool),
                                     newest_tool, [], repair_path, bindings)
                self.assertEqual(upgraded.ready['a']['exporterSha256'], new_tool)
                stored = read_json(output / 'manifest.json')
                invalid = json.loads(json.dumps(stored)); invalid['actions'][0]['queueSourceKey'] = 'f' * 64
                atomic_json(output, 'manifest.json', invalid)
                with self.assertRaisesRegex(ValueError, 'Repaired source changed'):
                    Assembler(output, work, catalog, collect_entries([old_plan], bindings, newest_tool),
                              newest_tool, [], repair_path, bindings)
                atomic_json(output, 'manifest.json', stored)
                authority['allowedLegacyExporterSha256'].remove(new_tool)
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'exporter is not explicitly allowed'):
                    Assembler(output, work, catalog, collect_entries([old_plan], bindings, newest_tool),
                              newest_tool, [], repair_path, bindings)
                authority['allowedLegacyExporterSha256'].append(new_tool)
                # Even an exact supersession proof cannot overwrite a ready media revision.
                authority['actions'][0]['plan'] = {'path': str(new_plan), 'bytes': new_plan.stat().st_size,
                                                   'sha256': digest(new_plan)}
                authority['actions'][0]['supersedesPlanSha256'] = digest(replacement)
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Ready repair cannot replace'):
                    resumed.refresh_repairs()
                authority['actions'][0]['plan']['sha256'] = 'f' * 64
                repair_path.write_text(json.dumps(authority), encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'Repair plan identity mismatch'):
                    resumed.refresh_repairs()

        def test_unapproved_exporter_and_revision_changes_are_rejected(self):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp); output = root / 'output'; output.mkdir()
                catalog = root / 'catalog.json'
                catalog.write_text(json.dumps({'id': 'test', 'actions': [{'id': 'a', 'revision': 'a-r1',
                    'reviewed': False, 'releaseEligible': False}]}), encoding='utf-8')
                atomic_json(output, 'manifest.json', {'format': FORMAT, 'status': 'test-unreviewed', 'actions': [
                    {'id': 'a', 'catalogRevision': 'a-r1', 'exporterSha256': 'unapproved'}]})
                with self.assertRaisesRegex(ValueError, 'exporter is not explicitly allowed'):
                    Assembler(output, root / 'work', catalog, {}, 'current', [])
                row = read_json(output / 'manifest.json'); row['actions'][0]['catalogRevision'] = 'changed'
                atomic_json(output, 'manifest.json', row)
                with self.assertRaisesRegex(ValueError, 'Catalog revision changed'):
                    Assembler(output, root / 'work', catalog, {}, 'current', [])

    suite = unittest.defaultTestLoader.loadTestsFromTestCase(QueueTest)
    return 0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1


def main():
    if sys.argv[1:] == ['--self-test']:
        return self_test()
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--plan', action='append', type=Path, required=True)
    p.add_argument('--catalog', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--work-root', type=Path, required=True)
    p.add_argument('--bind', action='append', default=[])
    p.add_argument('--workers', type=int, choices=(1, 2), default=1)
    p.add_argument('--exclude-ids', nargs='*', default=[])
    p.add_argument('--ingest', action='append', type=Path, default=[])
    p.add_argument('--ingest-only', action='store_true')
    p.add_argument('--watch-plan-dir', type=Path)
    p.add_argument('--poll-seconds', type=float, default=15)
    p.add_argument('--idle-timeout', type=float, default=600)
    p.add_argument('--heavy-lock', type=Path)
    p.add_argument('--min-commit-gib', type=float, default=4)
    p.add_argument('--peer-heavy-lock', type=Path)
    p.add_argument('--admission-lock', type=Path)
    p.add_argument('--parallel-min-commit-gib', type=float, default=8)
    p.add_argument('--parallel-min-physical-gib', type=float, default=6)
    p.add_argument('--repair-manifest', type=Path)
    p.add_argument('--stop-after-current-file', type=Path,
                   help='When this file exists, finish the active export, release workers/locks, then exit without dispatching another.')
    args = p.parse_args()
    if not 0 < args.poll_seconds <= 60 or args.idle_timeout <= 0:
        p.error('--poll-seconds must be within (0,60], and --idle-timeout must be positive')
    if not math.isfinite(args.min_commit_gib) or args.min_commit_gib < 4 or (args.heavy_lock and args.workers != 1):
        p.error('Commit guard must be >=4 GiB; --heavy-lock requires --workers 1')
    if bool(args.peer_heavy_lock) != bool(args.admission_lock) or (args.peer_heavy_lock and not args.heavy_lock):
        p.error('Resource overlap requires --heavy-lock, --peer-heavy-lock and --admission-lock together')
    if (not math.isfinite(args.parallel_min_commit_gib) or not math.isfinite(args.parallel_min_physical_gib)
            or args.parallel_min_commit_gib < 8 or args.parallel_min_physical_gib < 6):
        p.error('Parallel admission requires at least 8 GiB commit and 6 GiB physical RAM')
    try:
        assembler = run(args)
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        return 1
    # Pending inputs without a ready plan are honest outstanding work, not failures.
    failed = [a for a in assembler.entries if assembler.states.get(a, {}).get('state') == 'failed-preserved']
    return 1 if failed else 2 if assembler.awaiting_source else 0


if __name__ == '__main__':
    sys.exit(main())
