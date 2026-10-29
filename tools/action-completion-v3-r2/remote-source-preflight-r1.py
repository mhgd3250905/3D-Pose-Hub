#!/usr/bin/env python3
"""Verify the GitHub source pack; optionally create only missing selected sources.

No Git history, browser, third-party packages or rendering required.
The reference catalog stays in the pack and is never installed as a live catalog.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import zipfile

PACK = 'catalog/production/remaining219-source-pack-r1'


def require(ok, message):
    if not ok:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def checked_path(root, relative):
    p = PurePosixPath(relative)
    require(not p.is_absolute() and '..' not in p.parts and '\\' not in relative,
            'Unsafe source path: ' + relative)
    target = (root / relative).resolve()
    require(target.is_relative_to(root), 'Path escapes repository: ' + relative)
    return target


def preflight(root, restore=False):
    root = root.resolve(strict=True)
    pack = root / PACK
    manifest = json.loads((pack / 'manifest.json').read_bytes())
    require(manifest['format'] == 'pose-hub-source-recovery-pack@1', 'Unknown pack format')
    queue_path = checked_path(root, manifest['queue'])
    queue_raw = queue_path.read_bytes()
    require(sha(queue_raw) == manifest['queueSha256'], 'Queue hash changed')
    queue = json.loads(queue_raw)
    require(len(queue['actions']) == 219 and len({a['stableId'] for a in queue['actions']}) == 219,
            'Expected 219 unique stable IDs')
    require(manifest['archive'] == 'sources.zip', 'Unexpected archive name')
    raw = (pack / 'sources.zip').read_bytes()
    require(len(raw) == manifest['archiveBytes'] and sha(raw) == manifest['archiveSha256'],
            'Source archive hash/size mismatch')
    sources = manifest['sourceFiles']
    indexed = {f['path']: f for f in queue['files']}
    require(len(sources) == len(indexed) == 308, 'Unexpected source closure size')
    require({f['path'] for f in sources} == set(indexed), 'Source closure paths changed')
    records = sources + [manifest['referenceCatalog']]
    missing, conflicts, retained, payloads = [], [], [], {}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        require(len(archive.namelist()) == len(records) and
                set(archive.namelist()) == {f['path'] for f in records}, 'Archive entries changed')
        for ref in records:
            path = ref['path']
            target = checked_path(root, path)
            info = archive.getinfo(path)
            require(info.file_size == ref['bytes'] and info.file_size < 16 * 1024 * 1024,
                    'Unexpected source size: ' + path)
            data = archive.read(path)
            blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
            require(sha(data) == ref['sha256Raw'] and blob == ref['gitBlob'], 'Corrupt source: ' + path)
            if ref is records[-1]:
                require(sha(data) == queue['inputs']['catalog']['sha256'], 'Catalog hash changed')
                continue
            require(path.startswith(('drill-anim/', 'docs/diagnostics/')), 'Unexpected recovery destination: ' + path)
            normal = data.replace(b'\r\n', b'\n')
            expected = indexed[path]
            require(blob == expected['gitBlob'] and sha(normal) == expected['sha256Lf'] == ref['sha256Lf'],
                    'Source differs from selected queue: ' + path)
            if not target.exists():
                missing.append(path)
                payloads[path] = data
            elif target.is_file() and sha(target.read_bytes().replace(b'\r\n', b'\n')) == ref['sha256Lf']:
                retained.append(path)
            else:
                conflicts.append(path)
    # Check every file before any write. Exclusive creation also prevents race overwrites.
    require(not conflicts, 'Conflicting existing files; nothing restored: ' + ', '.join(conflicts))
    created = []
    if restore:
        for path in missing:
            target = checked_path(root, path)
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as stream:
                stream.write(payloads[path])
            created.append(path)
    return {'format': 'pose-hub-remote-source-preflight@1', 'stableIds': 219,
            'verifiedSources': len(sources), 'referenceCatalogVerified': True,
            'existingMatching': len(retained), 'missingCountBefore': len(missing),
            'missingPathsBefore': missing, 'createdPaths': created, 'conflicts': [],
            'restorationRequested': restore, 'userAccepted': False, 'releaseEligible': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--restore-missing', action='store_true')
    args = parser.parse_args()
    print(json.dumps(preflight(args.repo, args.restore_missing), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
