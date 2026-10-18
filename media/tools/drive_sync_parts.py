#!/usr/bin/env python3
"""Create independently extractable ZIP transports for Drive's 100 MiB cap.

Original ZIPs and plan.json remain untouched. Extract every part into one folder;
the original SHA256SUMS.txt validates the complete original payload collection.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path, PurePosixPath

CAP = 100 * 1024 * 1024
DEFAULT_MAX = 95 * 1024 * 1024
README = ('These are independent ZIPs, not binary fragments. Download ALL parts and extract\n'
          'them into the SAME directory. Original member paths are unchanged.\n'
          'Original payload members occur exactly once across the complete set.\n'
          'The original SHA256SUMS.txt validates the complete original collection,\n'
          'not each individual part. PART-MANIFEST-*.json describes each transport.\n'
          'Private backup only; source QA and missing-asset states remain unchanged.\n').encode('utf-8')


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + '\n').encode('utf-8')


def file_hash(path):
    sha, md5 = hashlib.sha256(), hashlib.md5()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            sha.update(block)
            md5.update(block)
    return sha.hexdigest(), md5.hexdigest()


def stream_hash(stream):
    sha = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b''):
        sha.update(block)
    return sha.hexdigest()


def original_members(archive):
    names = archive.namelist()
    if len(names) != len(set(names)):
        raise ValueError('Duplicate original ZIP members')
    for name in names:
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or '\\' in name or ':' in name:
            raise ValueError(f'Unsafe original ZIP member: {name}')
        if name == 'READ-PARTS.txt' or name.startswith('PART-MANIFEST-'):
            raise ValueError(f'Reserved transport member already exists: {name}')
    sums = {}
    for line in archive.read('SHA256SUMS.txt').decode('utf-8').splitlines():
        sha, name = line.split('  ', 1)
        if name in sums or not re.fullmatch('[0-9a-f]{64}', sha):
            raise ValueError('Invalid or duplicate global SHA256SUMS record')
        sums[name] = sha
    if set(sums) != set(names) - {'SHA256SUMS.txt'}:
        raise ValueError('Global SHA256SUMS does not cover all original members')
    roles = {}
    for item in json.loads(archive.read('file-manifest.json')):
        name = item['file']
        if sums.get(name) != item['sha256'] or archive.getinfo(name).file_size != item['bytes']:
            raise ValueError(f'Global file manifest disagrees with original ZIP: {name}')
        roles[name] = item.get('role')
    members = []
    for name in sorted(names):
        with archive.open(name) as stream:
            actual = stream_hash(stream)
        if name in sums and actual != sums[name]:
            raise ValueError(f'Original ZIP member SHA-256 mismatch: {name}')
        members.append({'file': name, 'bytes': archive.getinfo(name).file_size,
                        'sha256': actual, 'role': roles.get(name, 'metadata')})
    return members


def generated_metadata(entry, members, index, count):
    manifest = {'schema': 'pose-hub/drive-transport-part@1', 'id': entry['id'],
                'originalSha256': entry['sha256'], 'originalContentHash': entry.get('contentHash'),
                'partIndex': index, 'partCount': count, 'members': members,
                'instruction': 'Extract ALL parts into the same directory; original global sums cover the complete collection.'}
    return {'READ-PARTS.txt': README, f'PART-MANIFEST-{index:03}.json': encoded(manifest)}


def predicted_size(entry, members, index=999999, count=999999):
    # Stored payload streams use force_zip64: local headers have a 20-byte extra.
    # Generated metadata uses writestr and therefore has ordinary local headers.
    size = 22 + sum(m['bytes'] + 96 + 2 * len(m['file'].encode('utf-8')) for m in members)
    return size + sum(len(data) + 76 + 2 * len(name.encode('utf-8'))
                      for name, data in generated_metadata(entry, members, index, count).items())


def group_members(entry, members, maximum):
    groups, current = [], []
    for member in members:
        if predicted_size(entry, [member]) > maximum:
            raise ValueError(f'Single original member exceeds transport limit: {member["file"]}')
        candidate = current + [member]
        if current and predicted_size(entry, candidate) > maximum:
            groups.append(current)
            current = [member]
        else:
            current = candidate
    if current:
        groups.append(current)
    return groups


def zip_info(name):
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_STORED
    info.external_attr = 0o100644 << 16
    return info


def verify_part(path, members, generated):
    expected = {m['file']: m['sha256'] for m in members}
    expected.update({name: hashlib.sha256(data).hexdigest() for name, data in generated.items()})
    with zipfile.ZipFile(path) as archive:
        if len(archive.namelist()) != len(expected) or set(archive.namelist()) != set(expected):
            raise ValueError(f'Existing transport member list mismatch, left untouched: {path}')
        for name, sha in expected.items():
            with archive.open(name) as stream:
                if stream_hash(stream) != sha:
                    raise ValueError(f'Existing transport payload mismatch, left untouched: {path}: {name}')


def split_entry(entry, maximum=DEFAULT_MAX, threshold=CAP):
    source = Path(entry['zipPath'])
    if source.stat().st_size != entry['bytes'] or file_hash(source)[0] != entry['sha256']:
        raise ValueError(f'Original ZIP does not match plan: {entry["id"]}')
    if entry['bytes'] <= threshold:
        return [{'zipPath': str(source), 'bytes': entry['bytes'], 'sha256': entry['sha256'],
                 'md5': entry.get('md5') or file_hash(source)[1], 'fileName': source.name,
                 'partIndex': 1, 'partCount': 1}]
    if maximum > CAP or maximum <= 0:
        raise ValueError('max-bytes must be positive and <=100 MiB')
    outputs = []
    with zipfile.ZipFile(source) as archive:
        members = original_members(archive)
        groups = group_members(entry, members, maximum)
        count = len(groups)
        for index, group in enumerate(groups, 1):
            generated = generated_metadata(entry, group, index, count)
            fingerprint = hashlib.sha256(encoded({'members': group, 'metadata': {
                name: hashlib.sha256(data).hexdigest() for name, data in generated.items()}})).hexdigest()[:16]
            path = source.with_name(f'{source.stem}--part{index:02}-of{count:02}--{fingerprint}.zip')
            if path.exists():
                verify_part(path, group, generated)
            else:
                created = False
                try:
                    with zipfile.ZipFile(path, 'x', compression=zipfile.ZIP_STORED, allowZip64=True) as target:
                        created = True
                        for member in group:
                            sha = hashlib.sha256()
                            with archive.open(member['file']) as src, target.open(zip_info(member['file']), 'w', force_zip64=True) as dst:
                                for block in iter(lambda: src.read(1024 * 1024), b''):
                                    sha.update(block)
                                    dst.write(block)
                            if sha.hexdigest() != member['sha256']:
                                raise ValueError(f'Source member changed while copying: {member["file"]}')
                        for name, data in generated.items():
                            target.writestr(zip_info(name), data)
                    if path.stat().st_size > maximum:
                        raise ValueError(f'Transport unexpectedly exceeds limit: {path}')
                except BaseException:
                    if created:
                        path.unlink(missing_ok=True)
                    raise
            if path.stat().st_size > maximum:
                raise ValueError(f'Existing transport exceeds limit, left untouched: {path}')
            sha, md5 = file_hash(path)
            outputs.append({'zipPath': str(path), 'bytes': path.stat().st_size, 'sha256': sha,
                            'md5': md5, 'fileName': path.name, 'partIndex': index, 'partCount': count})
    return outputs


def build_transport(plan, maximum=DEFAULT_MAX):
    entries = []
    for source in plan['entries']:
        entry = dict(source)
        entry['transportFiles'] = split_entry(source, maximum)
        entries.append(entry)
        print(f'{entry["id"]}: {len(entry["transportFiles"])} transport ZIP(s)', flush=True)
    result = {key: value for key, value in plan.items() if key != 'entries'}
    result.update({'schema': 'pose-hub/private-drive-transport-plan@1', 'entries': entries,
                   'transportTotals': {'entries': len(entries),
                    'splitEntries': sum(len(e['transportFiles']) > 1 for e in entries),
                    'transportFiles': sum(len(e['transportFiles']) for e in entries),
                    'bytes': sum(f['bytes'] for e in entries for f in e['transportFiles']),
                    'maxFileBytes': max((f['bytes'] for e in entries for f in e['transportFiles']), default=0)}})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, default=Path('output/drive-sync-20261018/plan.json'))
    parser.add_argument('--max-bytes', type=int, default=DEFAULT_MAX)
    parser.add_argument('--output', type=Path, help='Defaults to transport-plan.json beside plan')
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text(encoding='utf-8-sig'))
    result = build_transport(plan, args.max_bytes)
    output = args.output or args.plan.with_name('transport-plan.json')
    output.write_bytes(encoded(result))
    print(json.dumps(result['transportTotals'], ensure_ascii=False))


if __name__ == '__main__':
    main()
