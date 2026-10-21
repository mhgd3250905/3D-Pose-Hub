#!/usr/bin/env python3
"""Create immutable per-action private backup ZIPs and an incremental Drive plan.

Sources are read only. Only catalog-listed assets, selected specs and explicit
evidence files are collected; web galleries, configs and render work trees are
never recursively archived. This is a private backup, not a public media release.
Run again after production; unchanged content reuses the existing ZIP. The output
folder is a stable local cache. New direct inventory child catalogs are discovered
without scanning backup folders or render work trees; --catalog adds explicit ones.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import zipfile
from collections import Counter
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit

REPO = Path(__file__).resolve().parents[2]
STOCK = Path('E:/AII-3D/pose-hub-media/inventory')
ALLOWED_SUFFIXES = {'.mp4', '.webm', '.gif', '.png', '.jpg', '.jpeg', '.json', '.js', '.mjs', '.md', '.txt'}
SECRET_NAMES = {'.env', 'config.json', 'credentials.json', 'token.json', 'tokens.json', 'client_secret.json'}


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + '\n').encode('utf-8')


def digest_file(path):
    sha, md5 = hashlib.sha256(), hashlib.md5()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            sha.update(block)
            md5.update(block)
    return sha.hexdigest(), md5.hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def safe_segment(value):
    value = str(value)
    if value in {'', '.', '..'} or re.search(r'[<>:"/\\|?*\x00-\x1f]', value) or value.endswith((' ', '.')):
        raise ValueError(f'Unsafe path component: {value!r}')
    return value


def safe_member(value):
    path = PurePosixPath(value)
    if path.is_absolute() or any(x in {'', '.', '..'} for x in path.parts) or '\\' in value or ':' in value:
        raise ValueError(f'Unsafe ZIP member: {value!r}')
    return path.as_posix()


class Collector:
    def __init__(self, roots, repo=None):
        self.roots = [Path(x).resolve() for x in roots]
        self.repo = Path(repo).resolve() if repo else None
        self.files = {}
        self.seen = {}
        self.missing = []
        self.excluded = []
        self.hash_cache = {}
        self.resolved_sources = []

    def allowed(self, path):
        path = path.resolve()
        return any(path == root or root in path.parents for root in self.roots)

    def add(self, path, member, role='evidence', declared=None):
        path = Path(path).resolve()
        member = safe_member(member)
        if not self.allowed(path):
            raise ValueError(f'Source outside allowlist: {path}')
        legacy_prefix = '/3D-Body/tools/drill-anim/'
        if not path.exists() and self.repo and legacy_prefix.lower() in path.as_posix().lower():
            tail = path.as_posix()[path.as_posix().lower().index(legacy_prefix.lower()) + len(legacy_prefix):]
            candidate = (self.repo / 'drill-anim' / tail).resolve()
            if self.allowed(candidate) and candidate.is_file():
                self.resolved_sources.append({'original': str(path), 'resolved': str(candidate),
                                              'rule': 'drill-anim/lib/legacy-paths.mjs PATH_MAP'})
                path = candidate
        if path.name.lower() in SECRET_NAMES or path.name.lower().startswith('.env'):
            raise ValueError(f'Configuration/credential source forbidden: {path}')
        if path.suffix.lower() not in ALLOWED_SUFFIXES:
            self.excluded.append({'path': str(path), 'reason': 'not an allowed asset/evidence extension'})
            return
        if not path.is_file():
            self.missing.append({'path': str(path), 'role': role, 'reason': 'listed file absent'})
            return
        if path in self.seen:
            return
        if path not in self.hash_cache:
            self.hash_cache[path] = digest_file(path)
        sha, _ = self.hash_cache[path]
        size = path.stat().st_size
        if declared:
            if declared.get('bytes') is not None and declared['bytes'] != size:
                raise ValueError(f'Declared byte size mismatch: {path}')
            if declared.get('sha256') and declared['sha256'] != sha:
                raise ValueError(f'Declared SHA-256 mismatch: {path}')
            if declared.get('canonicalLfSha256') and hashlib.sha256(
                    path.read_bytes().replace(b'\r\n', b'\n')).hexdigest() != declared['canonicalLfSha256']:
                raise ValueError(f'Declared canonical LF SHA-256 mismatch: {path}')
        if member in self.files:
            raise ValueError(f'ZIP member collision: {member}')
        self.files[member] = {'path': path, 'sha256': sha, 'bytes': size, 'role': role}
        self.seen[path] = member

    def alpha(self, directory, member, declared=None, pattern='m-*.png', role='alpha'):
        directory = Path(directory).resolve()
        if not self.allowed(directory):
            raise ValueError(f'Alpha directory outside allowlist: {directory}')
        if '/' in pattern or '\\' in pattern or '..' in pattern:
            raise ValueError('Alpha pattern must match files in exactly one directory')
        paths = sorted(directory.glob(pattern)) if directory.is_dir() else []
        if pattern in {'m-*.png', 'g-*.png'}:
            paths = [p for p in paths if re.fullmatch(r'[mg]-\d+\.png', p.name)]
        if not paths:
            self.missing.append({'path': str(directory), 'role': 'alpha', 'reason': 'no declared PNG frames'})
        expected = (declared or {}).get('expectedFrames', (declared or {}).get('frames'))
        if expected is not None and len(paths) != expected:
            self.missing.append({'path': str(directory), 'role': 'alpha', 'expected': expected,
                                 'actual': len(paths), 'reason': 'frame count mismatch'})
        indices = [int(m.group(1)) for p in paths if (m := re.fullmatch(r'[mg]-(\d+)\.png', p.name))]
        if indices and len(indices) == len(paths) and indices != list(range(len(paths))):
            self.missing.append({'path': str(directory), 'role': 'alpha', 'reason': 'frame sequence has gaps'})
        for path in paths:
            if not self.allowed(path):
                raise ValueError(f'Alpha source outside allowlist: {path}')
            with path.open('rb') as stream:
                header = stream.read(26)
            if len(header) < 26 or header[:8] != b'\x89PNG\r\n\x1a\n' or header[25] != 6:
                raise ValueError(f'Alpha source is not an RGBA PNG: {path}')
            self.add(path, f'{member}/{path.name}', role)

    def explicit_evidence(self, node, base, prefix):
        """Collect exact file references in QA metadata; never follow JSON transitively."""
        if isinstance(node, dict):
            ref = node.get('path') or node.get('href') or node.get('repoPath') or node.get('file')
            if isinstance(ref, str):
                parsed = urlsplit(ref) if not re.match(r'^[A-Za-z]:', ref) else None
                if parsed is None or not parsed.scheme:
                    ref = unquote(ref.split('#')[0])
                    path = Path(ref)
                    if not path.is_absolute():
                        path = base / path
                    if path.suffix.lower() in {'.json', '.js', '.mjs', '.jpg', '.jpeg', '.png', '.md', '.txt'}:
                        # A referenced old machine path may be absent. Preserve that fact.
                        name_hash = hashlib.sha256(str(path.resolve()).encode('utf-8')).hexdigest()[:10]
                        self.add(path, f'{prefix}/{name_hash}-{path.name}', declared=node)
            for key, value in node.items():
                if key not in {'raw', 'assets', 'files'}:
                    self.explicit_evidence(value, base, prefix)
        elif isinstance(node, list):
            for value in node:
                self.explicit_evidence(value, base, prefix)


def asset_ref(node):
    if isinstance(node, str):
        return node
    return node.get('path') or node.get('href') or node.get('file') or node.get('directory')


def collect_row(collector, row, root, label, repo):
    prefix = f'variants/{safe_segment(label)}'
    if row.get('state') == 'stopped':
        return
    assets = row.get('assets', row)
    for role in ('green', 'mobile', 'poster', 'alpha', 'alphaStill'):
        node = assets.get(role)
        if not node:
            continue
        if role == 'alphaStill' and isinstance(node, list):
            for index, still in enumerate(node):
                path = Path(asset_ref(still))
                if not path.is_absolute():
                    path = root / path
                collector.add(path, f'{prefix}/alpha-stills/{index:02}-{path.name}', 'static-alpha', still)
            continue
        ref = asset_ref(node)
        if not ref:
            continue
        path = Path(ref)
        if not path.is_absolute():
            # Current catalogs include sourceBatch in file paths; accept older
            # catalogs that made file paths relative to their selected batch.
            batch = row.get('sourceBatch')
            path = (root / batch / path if batch and batch != '.' and
                    path.parts[0] != batch and not (root / path).exists() else root / path)
        if role == 'alpha':
            collector.alpha(path, f'{prefix}/alpha', node if isinstance(node, dict) else {'frames': row.get('frames')},
                            node.get('pattern', 'm-*.png') if isinstance(node, dict) else 'm-*.png')
        else:
            collector.add(path, f'{prefix}/{role}/{path.name}', role,
                          node if isinstance(node, dict) else None)
    for index, still in enumerate(assets.get('stills', []), 1):
        for role in ('green', 'alpha'):
            node = still.get(role)
            if node:
                path = Path(asset_ref(node))
                path = path if path.is_absolute() else root / path
                collector.add(path, f'{prefix}/stills/{index:02}/{role}/{path.name}', f'static-{role}', node)
    spec = row.get('selectedSpec') or row.get('spec')
    if spec:
        ref = spec.get('repoPath') or spec.get('file') or spec.get('path')
        if ref:
            path = repo / ref
            collector.add(path, f'{prefix}/spec/{path.name}', 'spec')
            if path.is_file() and spec.get('canonicalLfSha256'):
                canonical = path.read_bytes().replace(b'\r\n', b'\n')
                if hashlib.sha256(canonical).hexdigest() != spec['canonicalLfSha256']:
                    raise ValueError(f'Selected spec no longer matches inventory: {path}')
    collector.explicit_evidence(row.get('links', []), root, f'{prefix}/evidence')
    collector.explicit_evidence(row.get('productionReadiness', {}), root, f'{prefix}/evidence')
    for key in ('result', 'qa', 'derivation', 'sourceDefinition'):
        node = row.get(key)
        if isinstance(node, str):
            path = root / node
            collector.add(path, f'{prefix}/evidence/{path.name}')
        elif isinstance(node, dict):
            collector.explicit_evidence(node, root, f'{prefix}/evidence')
    definition = row.get('sourceDefinition', {})
    if definition.get('sourceSpecPath'):
        path = Path(definition['sourceSpecPath'])
        collector.add(path, f'{prefix}/spec/{path.name}', 'spec',
                      {'canonicalLfSha256': definition.get('sourceSpecCanonicalLfSha256')})
    if row.get('glowMask'):
        mask = row['glowMask']
        collector.alpha(mask['directory'], f'{prefix}/alpha-glow-mask', mask, mask.get('pattern', 'g-*.png'), 'glow-mask')
    source = row.get('source', {})
    for key in ('manifest', 'record', 'historicalResult'):
        if isinstance(source.get(key), str):
            path = Path(source[key])
            if not path.is_absolute():
                path = root / path
            collector.add(path, f'{prefix}/evidence/{key}-{path.name}', 'evidence',
                          {'sha256': source.get('recordSha256')} if key == 'record' else None)
    for key in ('selectedSpec', 'theme'):
        if isinstance(source.get(key), dict) and source[key].get('path'):
            path = repo / source[key]['path']
            collector.add(path, f'{prefix}/{key}/{path.name}', 'spec' if key == 'selectedSpec' else 'evidence',
                          {'canonicalLfSha256': source[key].get('sha256')})


def write_zip(path, files, generated):
    """Exclusive creation; deterministic entries, and verify bytes during streaming."""
    try:
        with zipfile.ZipFile(path, 'x', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
            for name in sorted(set(files) | set(generated)):
                info = zipfile.ZipInfo(safe_member(name), (1980, 1, 1, 0, 0, 0))
                info.external_attr = 0o100644 << 16
                if name in generated:
                    archive.writestr(info, generated[name])
                else:
                    entry = files[name]
                    actual = hashlib.sha256()
                    with entry['path'].open('rb') as src, archive.open(info, 'w', force_zip64=True) as dst:
                        for block in iter(lambda: src.read(1024 * 1024), b''):
                            actual.update(block)
                            dst.write(block)
                    if actual.hexdigest() != entry['sha256']:
                        raise ValueError(f'Source changed during packaging: {entry["path"]}')
    except FileExistsError:
        raise
    except BaseException:
        path.unlink(missing_ok=True)
        raise


def build_plan(pre_root, hd_root, extras_path, output, repo=REPO, allow_roots=(), supplemental=None, ids=None,
               variants=None, catalog_paths=(), discover=True):
    pre_root, hd_root, output, repo = [Path(p).resolve() for p in (pre_root, hd_root, output, repo)]
    extras_path = Path(extras_path).resolve()
    roots = [pre_root, hd_root, extras_path.parent, repo, *map(Path, allow_roots)]
    sources = [('pre-pr5', pre_root / 'catalog.json', pre_root),
               ('pr5-pr6-hd', hd_root / 'catalog.json', hd_root),
               ('historical-extra', extras_path, extras_path.parent)]
    if variants:
        variant_path = Path(variants).resolve()
        sources.append(('historical-version', variant_path, variant_path.parent))
    known_paths = {path.resolve() for _, path, _ in sources}
    candidates = list(map(Path, catalog_paths))
    if discover:
        candidates.extend(child / 'catalog.json' for child in sorted(pre_root.parent.iterdir())
                          if child.is_dir() and child.name not in {'backups', '_backup-records'}
                          and (child / 'catalog.json').is_file())
    extra_catalogs = set()
    for candidate in candidates:
        path = (candidate / 'catalog.json' if candidate.is_dir() else candidate).resolve()
        if path in known_paths:
            continue
        known_paths.add(path)
        extra_catalogs.add(path)
        sources.append(('inventory-' + safe_segment(path.parent.name), path, path.parent))
        roots.append(path.parent)
    grouped = {}
    catalogs = []
    snapshots = {}
    for label, path, root in sources:
        payload = path.read_bytes()
        data = json.loads(payload.decode('utf-8-sig'))
        if path in extra_catalogs:
            if data.get('schema') not in {'pose-hub/local-inventory@1', 'pose-hub/local-hd-stock@1'}:
                raise ValueError(f'Unsupported inventory catalog schema at {path}: {data.get("schema")!r}')
            if not isinstance(data.get('items'), list) or any(
                    not isinstance(row, dict) or not row.get('id') or
                    not ('assets' in row or 'green' in row or row.get('state') == 'stopped')
                    for row in data['items']):
                raise ValueError(f'Unsupported inventory items structure at {path}')
        snapshots[path] = hashlib.sha256(payload).hexdigest()
        catalogs.append({'label': label, 'path': str(path), 'sha256': snapshots[path]})
        for row in data['items']:
            action_id = safe_segment(row['id'])
            if ids and action_id not in ids:
                continue
            grouped.setdefault(action_id, []).append((label, row, root))
    supplements = {}
    if supplemental:
        supplemental_path = Path(supplemental).resolve()
        payload = supplemental_path.read_bytes()
        snapshots[supplemental_path] = hashlib.sha256(payload).hexdigest()
        for row in json.loads(payload.decode('utf-8-sig'))['items']:
            supplements.setdefault(row['id'], []).append(row)
        unknown = set(supplements) - set(grouped)
        if ids:
            unknown -= set(supplements) - set(ids)
        if unknown:
            raise ValueError(f'Supplemental alpha IDs have no catalog binding: {sorted(unknown)}')
    plan = {'schema': 'pose-hub/private-drive-sync-plan@1', 'catalogs': catalogs, 'entries': [],
            'policy': 'Private local-stock backup. Source QA/state and limitations retained; not a public release.',
            'missing': []}
    for action_id, rows in sorted(grouped.items()):
        primary = rows[-1][1]
        category = safe_segment(primary.get('category') or ('历史示范与变体' if rows[-1][0] == 'historical-extra' else '居家训练'))
        state = primary.get('state') or primary.get('maturity') or 'review_required'
        collector = Collector(roots, repo)
        for label, row, root in rows:
            collect_row(collector, row, root, label, repo)
        if state != 'stopped':
            for index, row in enumerate(supplements.get(action_id, []), 1):
                passes = row.get('passes') or {'m': row.get('alpha') or row}
                for kind, alpha in passes.items():
                    directory = alpha.get('directory') or alpha.get('path')
                    if directory:
                        role = 'glow-mask' if kind == 'g' else 'alpha'
                        label = 'original-glow-mask' if kind == 'g' else 'original-main'
                        collector.alpha(directory, f'variants/supplemental-{index}/alpha/{label}', alpha,
                                        alpha.get('pattern', 'm-*.png'), role)
                for still in row.get('alphaStill', []):
                    path = Path(still['path'])
                    collector.add(path, f'variants/supplemental-{index}/alpha-stills/{path.name}', 'static-alpha', still)
                if row.get('sourceEvidence'):
                    path = Path(row['sourceEvidence'])
                    collector.add(path, f'variants/supplemental-{index}/evidence/{path.name}', 'evidence',
                                  {'sha256': row.get('sourceEvidenceSha256')})
        roles = Counter(x['role'] for x in collector.files.values())
        if state not in {'stopped', 'static'}:
            for role in ('green', 'alpha', 'poster'):
                if not roles[role]:
                    collector.missing.append({'role': role, 'reason': 'no catalog-linked asset available'})
        metadata = {'id': action_id, 'name': primary.get('name', action_id), 'category': category, 'state': state,
                    'actionId': primary.get('actionId', action_id), 'variantLabel': primary.get('variant'),
                    'sourceRows': [{'batch': label, 'item': row} for label, row, _ in rows],
                    'supplementalAlphaEvidence': supplements.get(action_id, []),
                    'missing': collector.missing, 'excluded': collector.excluded,
                    'boundary': 'Archiving does not upgrade source QA, visual acceptance or completeness. Static rows are stills only; stopped production is not resumed.'}
        if collector.resolved_sources:
            metadata['resolvedSources'] = collector.resolved_sources
        generated = {'metadata.json': encoded(metadata)}
        generated['README.txt'] = (
            f'{metadata["name"]} ({action_id})\nCategory: {category}\nState: {state}\n\n'
            'Private production archive. Original files and catalog QA evidence are preserved.\n'
            'variants/*/green: green master; mobile: mobile derivative; alpha: RGBA PNG sequence.\n'
            'stills: static assessment poses, not a full animation. evidence/spec: original provenance.\n'
            'Read metadata.json for source QA, actual reviewed scope, warnings and missing assets.\n'
            'A successful backup does not constitute pose approval. Never resume stopped actions automatically.\n'
            'SHA256SUMS.txt covers every payload file except itself.\n').encode('utf-8')
        manifest = [{'file': name, 'sha256': value['sha256'], 'bytes': value['bytes'], 'role': value['role']}
                    for name, value in collector.files.items()]
        manifest.extend({'file': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data), 'role': 'metadata'}
                        for name, data in generated.items())
        manifest.sort(key=lambda x: x['file'])
        generated['file-manifest.json'] = encoded(manifest)
        sums = [(x['file'], x['sha256']) for x in manifest]
        sums.append(('file-manifest.json', hashlib.sha256(generated['file-manifest.json']).hexdigest()))
        generated['SHA256SUMS.txt'] = ''.join(f'{sha}  {name}\n' for name, sha in sorted(sums)).encode('utf-8')
        content_hash = hashlib.sha256(generated['SHA256SUMS.txt']).hexdigest()
        archive_dir = output / 'packages' / category / action_id
        archive_dir.mkdir(parents=True, exist_ok=True)
        zip_path = archive_dir / f'{action_id}--{content_hash[:16]}.zip'
        reused = zip_path.exists()
        if reused:
            # Never replace even a damaged archive. Require manual investigation.
            with zipfile.ZipFile(zip_path) as archive:
                if archive.read('SHA256SUMS.txt') != generated['SHA256SUMS.txt']:
                    raise ValueError(f'Existing archive integrity/content mismatch; left untouched: {zip_path}')
                expected_members = set(collector.files) | set(generated)
                if set(archive.namelist()) != expected_members:
                    raise ValueError(f'Existing archive file-list mismatch; left untouched: {zip_path}')
                for name in sorted(expected_members):
                    expected = (hashlib.sha256(generated[name]).hexdigest() if name in generated
                                else collector.files[name]['sha256'])
                    actual = hashlib.sha256()
                    with archive.open(name) as stream:
                        for block in iter(lambda: stream.read(1024 * 1024), b''):
                            actual.update(block)
                    if actual.hexdigest() != expected:
                        raise ValueError(f'Existing archive payload mismatch; left untouched: {zip_path}: {name}')
        else:
            write_zip(zip_path, collector.files, generated)
        sha, md5 = digest_file(zip_path)
        entry = {key: metadata[key] for key in ('id', 'name', 'category', 'state', 'actionId', 'variantLabel')}
        entry.update({'zipPath': str(zip_path), 'bytes': zip_path.stat().st_size, 'sha256': sha, 'md5': md5,
                      'contentHash': content_hash, 'fileCount': len(collector.files) + len(generated),
                      'alphaFrameCount': roles['alpha'], 'staticAlphaCount': roles['static-alpha'],
                      'glowMaskFrameCount': roles['glow-mask'],
                      'greenCount': roles['green'], 'mobileCount': roles['mobile'], 'reused': reused,
                      'missing': collector.missing,
                      'greenFiles': [{'localPath': str(value['path']), 'name': value['path'].name,
                                      'sha256': value['sha256'], 'bytes': value['bytes'], 'role': value['role']}
                                     for value in collector.files.values() if value['role'] == 'green']})
        plan['entries'].append(entry)
        plan['missing'].extend({'id': action_id, **item} for item in collector.missing)
        print(f'{action_id}: {entry["fileCount"]} files, {entry["alphaFrameCount"]} alpha, {entry["bytes"]} bytes' + (' (reused)' if reused else ''), flush=True)
    entries = plan['entries']
    for path, expected in snapshots.items():
        if digest_file(path)[0] != expected:
            raise ValueError(f'Catalog/audit changed during packaging; rerun to obtain a consistent plan: {path}')
    plan['totals'] = {'actions': len(entries), 'bytes': sum(x['bytes'] for x in entries),
                      'files': sum(x['fileCount'] for x in entries),
                      'alphaFrames': sum(x['alphaFrameCount'] for x in entries),
                      'glowMaskFrames': sum(x['glowMaskFrameCount'] for x in entries),
                      'greenMasters': sum(x['greenCount'] for x in entries),
                      'mobileVideos': sum(x['mobileCount'] for x in entries),
                      'states': dict(Counter(x['state'] for x in entries)), 'missingItems': len(plan['missing'])}
    # Readers keep seeing the previous complete plan until the new one is ready.
    with tempfile.NamedTemporaryFile(dir=output, prefix='plan-', suffix='.tmp', delete=False) as stream:
        temporary_plan = Path(stream.name)
        stream.write(encoded(plan))
    try:
        os.replace(temporary_plan, output / 'plan.json')
    finally:
        temporary_plan.unlink(missing_ok=True)
    return plan


def main(argv=None):
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pre-root', type=Path, default=STOCK / 'pre-pr5-1783dcc')
    parser.add_argument('--hd-root', type=Path, default=STOCK / 'pr5-pr6-hd-20261018-4428322')
    parser.add_argument('--extras', type=Path)
    parser.add_argument('--output', type=Path, default=REPO / 'output/drive-sync-20261018')
    parser.add_argument('--repo', type=Path, default=REPO)
    parser.add_argument('--allow-root', type=Path, action='append', default=[])
    parser.add_argument('--supplemental-alpha', type=Path)
    parser.add_argument('--variants', type=Path, help='Audited historical variants JSON with items[]')
    parser.add_argument('--catalog', type=Path, action='append', default=[], help='Additional known-schema inventory catalog; repeatable')
    parser.add_argument('--no-discover', action='store_true', help='Disable direct inventory child catalog discovery')
    parser.add_argument('--ids', help='Optional comma-separated IDs for a resumable subset')
    args = parser.parse_args(argv)
    roots = [REPO.parent / '3D-Body', STOCK.parent / 'greenscreen', STOCK.parent / 'dark', *args.allow_root]
    plan = build_plan(args.pre_root, args.hd_root, args.extras or args.pre_root / 'historical-extras/inventory.json',
                      args.output, args.repo, roots, args.supplemental_alpha,
                      set(args.ids.split(',')) if args.ids else None, args.variants, args.catalog, not args.no_discover)
    print(json.dumps(plan['totals'], ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, zipfile.BadZipFile) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
