#!/usr/bin/env python3
"""Build an immutable, reproducible media ZIP without publishing a release.

Archive and legacy R2 file items use item.file as the ZIP-root relative path.
Local masters, frame sequences, and the manifest are never included. Both draft
and published releases can be packed. Existing ZIPs/sidecars are kept only when
the complete newly verified candidate has exactly the same contents.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import tempfile
import zipfile


MEDIA = Path(__file__).resolve().parents[1]
FIXED_TIME = (1980, 1, 1, 0, 0, 0)
FILE_MODE = (stat.S_IFREG | 0o644) << 16
BLOCK = 1 << 20


def digest(stream):
    hasher, size = hashlib.sha256(), 0
    for block in iter(lambda: stream.read(BLOCK), b''):
        hasher.update(block)
        size += len(block)
    return size, hasher.hexdigest()


def file_digest(path):
    with Path(path).open('rb') as stream:
        return digest(stream)


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def relative_name(value, label):
    if (not isinstance(value, str) or not value or '\\' in value or ':' in value
            or any(ord(char) < 32 or ord(char) == 127 for char in value)
            or PurePosixPath(value).is_absolute()
            or any(part in ('', '.', '..') for part in value.split('/'))):
        raise ValueError(f'unsafe {label}: {value!r}; use a plain relative path with forward slashes')
    return value


def select_items(release, src):
    selected, names = [], set()
    for item in release['items']:
        if item.get('storage') not in ('archive', 'r2') or item.get('kind', 'file') != 'file':
            continue
        if item.get('variant') in ('greenscreen', 'alpha'):
            raise ValueError('greenscreen and alpha masters must remain local and cannot enter a release ZIP')
        name = relative_name(item['file'], 'ZIP member')
        if PurePosixPath(name).name.casefold() == 'manifest.json':
            raise ValueError('the manifest must not be included in its own media ZIP')
        # Reject case aliases too: the same archive is consumed on Windows.
        folded = name.casefold()
        if folded in names:
            raise ValueError(f'duplicate ZIP member: {name}')
        names.add(folded)
        local = relative_name(item['local'], 'local source')
        path = (src / local).resolve()
        if not path.is_relative_to(src) or not path.is_file():
            raise ValueError(f'missing or escaped local source: {local}')
        size, sha = item['bytes'], item['sha256']
        if isinstance(size, bool) or not isinstance(size, int) or size < 0:
            raise ValueError(f'invalid manifest bytes for {name}')
        if not isinstance(sha, str) or not re.fullmatch(r'[0-9a-fA-F]{64}', sha):
            raise ValueError(f'invalid manifest sha256 for {name}')
        selected.append({'name': name, 'path': path, 'bytes': size, 'sha256': sha.lower()})
    if not selected:
        raise ValueError('release has no archive/R2 file items to pack')
    return sorted(selected, key=lambda row: row['name'])


def verify_sources(items):
    for row in items:
        if file_digest(row['path']) != (row['bytes'], row['sha256']):
            raise ValueError(f'{row["name"]}: local bytes/sha256 no longer match the manifest')


def build_candidate(path, items):
    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
        for row in items:
            info = zipfile.ZipInfo(row['name'], date_time=FIXED_TIME)
            info.create_system = 3
            info.external_attr = FILE_MODE
            info.compress_type = zipfile.ZIP_STORED
            info.file_size = row['bytes']
            hasher, size = hashlib.sha256(), 0
            with row['path'].open('rb') as source, archive.open(info, 'w') as target:
                for block in iter(lambda: source.read(BLOCK), b''):
                    target.write(block)
                    hasher.update(block)
                    size += len(block)
            if (size, hasher.hexdigest()) != (row['bytes'], row['sha256']):
                raise ValueError(f'{row["name"]}: source changed while packing; candidate discarded')
    # Verify actual ZIP bytes, including CRC and each member's SHA, rather than
    # relying on the preflight/source read alone.
    with zipfile.ZipFile(path) as archive:
        if archive.namelist() != [row['name'] for row in items]:
            raise ValueError('candidate ZIP members differ from the manifest')
        for row in items:
            with archive.open(row['name']) as member:
                if digest(member) != (row['bytes'], row['sha256']):
                    raise ValueError(f'candidate ZIP member failed integrity: {row["name"]}')
    verify_sources(items)


def install_identical(candidate, target, expected):
    """Publish a complete local candidate atomically without replacing a file."""
    if target.exists():
        if file_digest(target) != expected:
            raise ValueError(f'{target} already exists with different content; use a new version/output')
        return
    try:
        # Candidate and target are on the same filesystem. An exclusive hard
        # link installs complete bytes atomically and cannot overwrite a racing
        # writer. The temporary link is removed when its directory is cleaned.
        os.link(candidate, target)
    except FileExistsError:
        if file_digest(target) != expected:
            raise ValueError(f'{target} appeared with different content; use a new version/output') from None


def pack_release(manifest, version, src, output):
    if not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', version):
        raise ValueError('version must be MAJOR.MINOR.PATCH')
    release = manifest.get('releases', {}).get(version)
    if release is None:
        raise ValueError(f'version {version} is not present in the manifest')
    src, output = Path(src).resolve(), Path(output).resolve()
    if '\n' in output.name or '\r' in output.name:
        raise ValueError('output filename cannot contain a newline')
    items = select_items(release, src)
    sidecar = output.with_name(output.name + '.sha256')
    if any(row['path'] in (output, sidecar) for row in items):
        raise ValueError('output ZIP/sidecar must not replace a selected source')
    verify_sources(items)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.pose-hub-pack-', dir=output.parent) as temporary:
        candidate = Path(temporary) / 'candidate.zip'
        build_candidate(candidate, items)
        size, sha = file_digest(candidate)
        checksum = Path(temporary) / 'candidate.sha256'
        checksum.write_bytes(f'{sha}  {output.name}\n'.encode('utf-8'))
        checksum_digest = file_digest(checksum)
        # Check both destinations before installing either new file.
        for target, expected in ((output, (size, sha)), (sidecar, checksum_digest)):
            if target.exists() and file_digest(target) != expected:
                raise ValueError(f'{target} already exists with different content; use a new version/output')
        install_identical(candidate, output, (size, sha))
        install_identical(checksum, sidecar, checksum_digest)
    return {'path': str(output), 'bytes': size, 'count': len(items), 'sha256': sha, 'sidecar': str(sidecar)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--version', required=True)
    parser.add_argument('--manifest', type=Path, default=MEDIA / 'manifest.json')
    parser.add_argument('--config', type=Path, default=MEDIA / 'config.json')
    parser.add_argument('--src', type=Path, help='override config.src (local render root)')
    parser.add_argument('--output', type=Path, help='default: media/dist/pose-hub-media-vVERSION.zip')
    args = parser.parse_args(argv)
    try:
        src = args.src
        if src is None:
            configured = read_json(args.config).get('src')
            if not configured:
                raise ValueError('set config.src or pass --src')
            src = Path(configured)
        output = args.output or MEDIA / 'dist' / f'pose-hub-media-v{args.version}.zip'
        result = pack_release(read_json(args.manifest), args.version, src, output)
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
        print(f'ABORT: {error}', file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == '__main__':
    sys.exit(main())
