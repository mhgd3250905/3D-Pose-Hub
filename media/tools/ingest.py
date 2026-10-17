#!/usr/bin/env python3
"""Scan a local folder of rendered media and add it to media/manifest.json (Python standard library only).

Typical use (Windows PowerShell, from the Pose-Hub checkout):
    py media/tools/ingest.py --version 0.1.0 --dry-run
    py media/tools/ingest.py --version 0.1.0

Rules come from media/config.json (copy media/config.example.json). Each rule maps a path pattern under
`src` to a variant (dark/light/greenscreen/alpha) and a role (video/poster/still/frames), e.g.
    {"variant": "dark", "role": "video", "pattern": "android/{id}.mp4", "storage": "archive", "theme": "drill-anim/themes/glow-b.json"}
`{id}` matches one drill id (no slash); optional `{tag}` names one of several files per id (e.g. self-test stills
a/b/c/front/back). A pattern ending in "/" matches a directory (a PNG frame sequence).

Records per item: drill id, variant, role, resolution, published file name, sha256, bytes, and the sha256 of
the spec and theme used to render it. The manifest never stores machine paths: `local` is relative to `src`.
Published releases are immutable; ingest refuses to change them.
"""
from __future__ import annotations

import argparse
import fnmatch
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import posehub_media as pm  # noqa: E402

ID_RE = r'(?P<id>[A-Za-z0-9][A-Za-z0-9_.-]*)'
TAG_RE = r'(?P<tag>[A-Za-z0-9_]+)'   # no '-' so '{id}-{tag}' splits at the last hyphen


def pattern_regex(pattern: str):
    parts = re.split(r'(\{id\}|\{tag\})', pattern.strip('/'))
    rx = ''.join(ID_RE if p == '{id}' else TAG_RE if p == '{tag}' else re.escape(p).replace(r'\*', '[^/]*') for p in parts)
    return re.compile('^' + rx + '$')


def published_name(item_id, variant, role, width, ext, kind, label=None):
    tag = ('' if role == 'video' else f'.{role}') + (f'.{label}' if label else '')
    size = f'.{width}' if width else ''
    if kind == 'frames':
        return f'{item_id}/{item_id}.{variant}{tag}{size}.frames/'
    return f'{item_id}/{item_id}.{variant}{tag}{size}{ext}'


def spec_info(repo: Path, item_id: str, overrides: dict):
    rel = overrides.get(item_id) or f'drill-anim/specs/{item_id}.js'
    p = repo / rel
    if not p.exists():
        return None
    return {'path': rel, 'sha256': pm.sha256_text_lf(p)}


def theme_info(repo: Path, rel):
    if not rel:
        return None
    p = repo / rel
    if not p.exists():
        raise SystemExit(f'theme not found: {rel}')
    return {'path': rel, 'sha256': pm.sha256_text_lf(p)}


def model_version(repo: Path):
    p = repo / 'drill-anim' / 'models' / 'training-human-v2.json'
    if not p.exists():
        return None
    m = json.loads(p.read_text(encoding='utf-8'))
    return f'{m["id"]}@{m["version"]}'


def scan(src: Path, rules, repo: Path, overrides, ids_filter=None):
    files = [p for p in src.rglob('*')]
    rel_files = {p.relative_to(src).as_posix(): p for p in files if p.is_file()}
    rel_dirs = {p.relative_to(src).as_posix(): p for p in files if p.is_dir()}
    items = []; seen = {}
    for rule in rules:
        variant = rule['variant']; role = rule.get('role', 'video'); storage = rule.get('storage', 'r2')
        if variant not in pm.VARIANTS:
            raise SystemExit(f'unknown variant {variant!r}; use one of {pm.VARIANTS}')
        if role not in pm.ROLES:
            raise SystemExit(f'unknown role {role!r}; use one of {pm.ROLES}')
        if storage not in ('archive', 'r2', 'local'):
            raise SystemExit(f'storage must be archive, local, or legacy r2, got {storage!r}')
        is_dir = rule['pattern'].endswith('/')
        rx = pattern_regex(rule['pattern'])
        pool = rel_dirs if is_dir else rel_files
        theme = theme_info(repo, rule.get('theme'))
        for rel, path in sorted(pool.items()):
            m = rx.match(rel)
            if not m:
                continue
            item_id = m.group('id'); label = m.groupdict().get('tag')
            if ids_filter and not any(fnmatch.fnmatch(item_id, f) for f in ids_filter):
                continue
            if is_dir:
                digest, size, count = pm.sha256_tree(path)
                if count == 0:
                    continue
                first = next((x for x in sorted(path.rglob('*')) if x.is_file()), None)
                meta = pm.probe(first) if first else {}
                meta = {'width': meta.get('width'), 'height': meta.get('height'), 'frames': count}
                kind = 'frames'; ext = ''
            else:
                digest, size = pm.sha256_file(path), path.stat().st_size
                meta = pm.probe(path); kind = 'file'; ext = path.suffix.lower()
            width = meta.get('width') or rule.get('width')
            item = {
                'id': item_id, 'variant': variant, 'role': role, 'kind': kind,
                'file': published_name(item_id, variant, role, width, ext, kind, label),
                'local': rel + ('/' if is_dir else ''), 'storage': 'local' if kind == 'frames' else storage,
                'bytes': size, 'sha256': digest,
                'width': width, 'height': meta.get('height') or rule.get('height'),
            }
            if label:
                item['tag'] = label
            for k in ('durationSec', 'fps', 'frames'):
                if meta.get(k) is not None:
                    item[k] = meta[k]
            item['spec'] = spec_info(repo, item_id, overrides)
            item['theme'] = theme
            key = pm.item_key(item)
            if key in seen:
                raise SystemExit(f'two local files map to the same published item {key}: {seen[key]} and {rel}')
            seen[key] = rel; items.append(item)
    return items


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--version', required=True, help='media release version, e.g. 0.1.0 (one immutable ZIP per version)')
    ap.add_argument('--config', default=str(pm.DEFAULT_CONFIG))
    ap.add_argument('--manifest', default=str(pm.DEFAULT_MANIFEST))
    ap.add_argument('--src', help='override config "src" (root folder of local renders)')
    ap.add_argument('--repo', default=str(pm.REPO_ROOT), help='Pose-Hub checkout used for spec/theme hashes')
    ap.add_argument('--ids', help='comma-separated id globs to include (default: all)')
    ap.add_argument('--replace', action='store_true', help='drop existing draft items of this version first')
    ap.add_argument('--notes', help='release notes to store on the draft')
    ap.add_argument('--dry-run', action='store_true', help='print what would change, write nothing')
    a = ap.parse_args(argv)
    if not pm.version_ok(a.version):
        ap.error('--version must look like 1.2.3')
    cfg = pm.load_config(a.config)
    src = Path(a.src or cfg.get('src') or '')
    if not src.is_dir():
        ap.error(f'src folder not found: {src}')
    repo = Path(a.repo)
    items = scan(src, cfg.get('rules', []), repo, cfg.get('specOverrides', {}),
                 [x.strip() for x in a.ids.split(',')] if a.ids else None)
    if not items:
        print('no files matched the rules; nothing to do', file=sys.stderr); return 1
    data = pm.load_manifest(a.manifest)
    rel = data['releases'].get(a.version)
    if rel and rel.get('status') == 'published':
        old = {pm.item_key(i): i for i in rel['items']}
        clash = [i for i in items if pm.item_key(i) not in old or old[pm.item_key(i)]['sha256'] != i['sha256']]
        if clash:
            print(f'release {a.version} is already published and immutable; {len(clash)} new/changed item(s), '
                  f'e.g. {clash[0]["file"]}. Ingest into a new version instead.', file=sys.stderr)
            return 2
        print(f'release {a.version} is published and already contains all {len(items)} scanned items; nothing to do')
        return 0
    if not rel:
        rel = {'status': 'draft', 'createdAt': pm.now_utc(), 'publishedAt': None, 'model': model_version(repo),
               'notes': '', 'items': []}
        data['releases'][a.version] = rel
    if a.notes is not None:
        rel['notes'] = a.notes
    current = {} if a.replace else {pm.item_key(i): i for i in rel['items']}
    added = changed = same = 0
    for i in items:
        k = pm.item_key(i)
        if k not in current:
            added += 1
        elif current[k]['sha256'] != i['sha256'] or current[k] != i:
            changed += 1
        else:
            same += 1
        current[k] = i
    rel['items'] = list(current.values()); rel['updatedAt'] = pm.now_utc(); rel['model'] = model_version(repo)
    by_variant = {}
    for i in items:
        by_variant.setdefault(f'{i["variant"]}/{i["role"]}', 0); by_variant[f'{i["variant"]}/{i["role"]}'] += 1
    print(f'version {a.version} (draft): scanned {len(items)} -> added {added}, changed {changed}, unchanged {same}; '
          + ', '.join(f'{k}: {v}' for k, v in sorted(by_variant.items())))
    missing_spec = sorted({i['id'] for i in items if not i['spec']})
    if missing_spec:
        print('warning: no spec found for ' + ', '.join(missing_spec) + ' (set "specOverrides" in config)', file=sys.stderr)
    if a.dry_run:
        print('dry run: manifest not written'); return 0
    pm.save_manifest(data, a.manifest)
    print(f'wrote {a.manifest}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
