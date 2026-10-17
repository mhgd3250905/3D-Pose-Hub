#!/usr/bin/env python3
"""Upload one media release to Cloudflare R2 under v<version>/ (Python standard library only).

Nothing is uploaded unless --yes is given (the default is a dry run). Publishing needs the user's consent
(see AGENTS.md). No credentials are stored in this repository; everything comes from the environment:

  POSE_HUB_R2_BUCKET             bucket name                       (required)
  POSE_HUB_R2_ACCOUNT_ID         Cloudflare account id             (s3 backend, unless POSE_HUB_R2_ENDPOINT is set)
  POSE_HUB_R2_ACCESS_KEY_ID      R2 API token access key id        (s3 backend)
  POSE_HUB_R2_SECRET_ACCESS_KEY  R2 API token secret               (s3 backend)
  POSE_HUB_R2_ENDPOINT           optional override, e.g. https://<account>.r2.cloudflarestorage.com
  POSE_HUB_MEDIA_BASE_URL        public URL of the bucket (custom domain / r2.dev); used by the wrangler
                                 backend to check whether an object already exists

Backends: `s3` (default; SigV4 against R2's S3-compatible API) or `wrangler` (shells out to
`wrangler r2 object put --remote`; wrangler must already be logged in).

Rules enforced here:
  * only items with storage "r2" are uploaded; greenscreen/alpha masters stay local (+ off-site backup)
  * each local file must still match the manifest sha256 before upload
  * an object that already exists is skipped only if its sha256 matches; a different object at the same key
    aborts the run (published versions are append-only and never overwritten)
  * after all media, the frozen v<version>/manifest.json is uploaded and the release is marked published
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import posehub_media as pm  # noqa: E402


class Conflict(Exception):
    pass


def content_type(name):
    return pm.CONTENT_TYPES.get(Path(name.rstrip('/')).suffix.lower(), 'application/octet-stream')


class S3Backend:
    def __init__(self, env):
        self.bucket = env['POSE_HUB_R2_BUCKET']
        acct = env.get('POSE_HUB_R2_ACCOUNT_ID')
        self.endpoint = (env.get('POSE_HUB_R2_ENDPOINT') or (f'https://{acct}.r2.cloudflarestorage.com' if acct else '')).rstrip('/')
        self.ak = env.get('POSE_HUB_R2_ACCESS_KEY_ID'); self.sk = env.get('POSE_HUB_R2_SECRET_ACCESS_KEY')
        missing = [n for n, v in (('POSE_HUB_R2_ENDPOINT or POSE_HUB_R2_ACCOUNT_ID', self.endpoint),
                                  ('POSE_HUB_R2_ACCESS_KEY_ID', self.ak), ('POSE_HUB_R2_SECRET_ACCESS_KEY', self.sk)) if not v]
        if missing:
            raise SystemExit('missing environment: ' + ', '.join(missing))

    def url(self, key):
        return f'{self.endpoint}/{self.bucket}/{key}'

    def head_sha(self, key):
        """sha256 metadata of an existing object, '' if it exists without one, None if absent."""
        h = pm.sigv4_headers('HEAD', self.url(key), {}, pm.hashlib.sha256(b'').hexdigest(), self.ak, self.sk)
        req = urllib.request.Request(self.url(key), method='HEAD', headers=h)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.headers.get('x-amz-meta-sha256', '')
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise

    def put(self, key, path, sha):
        size = os.path.getsize(path)
        h = pm.sigv4_headers('PUT', self.url(key), {
            'content-type': content_type(key), 'content-length': str(size), 'x-amz-meta-sha256': sha,
            'cache-control': 'public, max-age=31536000, immutable'}, sha, self.ak, self.sk)
        with open(path, 'rb') as f:
            req = urllib.request.Request(self.url(key), data=f, method='PUT', headers=h)
            with urllib.request.urlopen(req, timeout=600) as r:
                if r.status not in (200, 201):
                    raise RuntimeError(f'PUT {key}: HTTP {r.status}')


class WranglerBackend:
    def __init__(self, env):
        self.bucket = env['POSE_HUB_R2_BUCKET']; self.base = (env.get('POSE_HUB_MEDIA_BASE_URL') or '').rstrip('/')
        self.exe = shutil.which('wrangler') or shutil.which('wrangler.cmd')
        if not self.exe:
            raise SystemExit('wrangler not found on PATH (npm i -g wrangler, then wrangler login)')
        if not self.base:
            raise SystemExit('POSE_HUB_MEDIA_BASE_URL is required with --backend wrangler (used to check existing objects)')

    def head_sha(self, key):
        try:
            with urllib.request.urlopen(f'{self.base}/{key}', timeout=60) as r:
                h = pm.hashlib.sha256()
                for block in iter(lambda: r.read(1 << 20), b''):
                    h.update(block)
                return h.hexdigest()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise

    def put(self, key, path, sha):
        subprocess.run([self.exe, 'r2', 'object', 'put', f'{self.bucket}/{key}', '--file', str(path), '--remote',
                        '--content-type', content_type(key), '--cache-control', 'public, max-age=31536000, immutable'],
                       check=True)


def upload(backend, key, path, sha, log):
    existing = backend.head_sha(key)
    if existing is None:
        backend.put(key, path, sha); log(f'  uploaded  {key}'); return 'uploaded'
    if existing == sha:
        log(f'  exists    {key} (same sha256, skipped)'); return 'skipped'
    raise Conflict(f'{key} already exists with different content (sha256 {existing or "unknown"}); '
                   'published versions are never overwritten - publish a new version')


def main(argv=None, env=None):
    env = dict(os.environ if env is None else env)
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--version', required=True)
    ap.add_argument('--config', default=str(pm.DEFAULT_CONFIG))
    ap.add_argument('--manifest', default=str(pm.DEFAULT_MANIFEST))
    ap.add_argument('--src', help='override config "src" (root folder of local renders)')
    ap.add_argument('--backend', choices=('s3', 'wrangler'), default='s3')
    ap.add_argument('--yes', action='store_true', help='really upload (otherwise dry run)')
    a = ap.parse_args(argv)
    data = pm.load_manifest(a.manifest)
    rel = data['releases'].get(a.version)
    if not rel:
        print(f'version {a.version} not in {a.manifest}; run ingest first', file=sys.stderr); return 2
    src = Path(a.src or pm.load_config(a.config).get('src') or '')
    todo = [i for i in rel['items'] if i.get('storage') == 'r2' and i.get('kind', 'file') == 'file']
    skipped_local = [i for i in rel['items'] if i not in todo]
    print(f'version {a.version}: {len(todo)} item(s) for R2, {len(skipped_local)} local-only item(s) not uploaded')
    # integrity first: every file must still match the manifest
    bad = []
    for i in todo:
        p = src / i['local']
        if not p.is_file():
            bad.append(f'missing local file {i["local"]}')
        elif p.stat().st_size != i['bytes'] or pm.sha256_file(p) != i['sha256']:
            bad.append(f'{i["local"]} no longer matches the manifest sha256 (re-run ingest into a draft/new version)')
    if bad:
        print('\n'.join(bad), file=sys.stderr); return 2
    prefix = f'v{a.version}/'
    if not a.yes:
        for i in todo:
            print(f'  would upload {prefix}{i["file"]}  ({i["bytes"]} bytes)')
        print(f'  would upload {prefix}manifest.json and mark {a.version} published')
        print('dry run: add --yes to upload (requires the user\'s go-ahead)'); return 0
    if not env.get('POSE_HUB_R2_BUCKET'):
        print('missing environment: POSE_HUB_R2_BUCKET', file=sys.stderr); return 2
    backend = (S3Backend if a.backend == 's3' else WranglerBackend)(env)
    try:
        counts = {'uploaded': 0, 'skipped': 0}
        for i in todo:
            counts[upload(backend, prefix + i['file'], src / i['local'], i['sha256'], print)] += 1
        snap_rel = json.loads(json.dumps(rel))
        snap_rel['status'] = 'published'; snap_rel['publishedAt'] = rel.get('publishedAt') or pm.now_utc()
        snapshot = pm.release_snapshot({**data, 'releases': {a.version: snap_rel}}, a.version)
        with tempfile.TemporaryDirectory() as td:
            mp = Path(td) / 'manifest.json'
            mp.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
            sha = pm.sha256_file(mp)
            existing = backend.head_sha(prefix + 'manifest.json')
            if existing is None:
                backend.put(prefix + 'manifest.json', mp, sha); print(f'  uploaded  {prefix}manifest.json')
            elif existing != sha:
                # a re-run after a successful publish: the release in Git must already say published
                if rel.get('status') != 'published':
                    raise Conflict(f'{prefix}manifest.json already exists with different content; refusing to overwrite')
                print(f'  exists    {prefix}manifest.json (published earlier, kept)')
    except Conflict as e:
        print(f'ABORT: {e}', file=sys.stderr); return 3
    if rel.get('status') != 'published':
        rel['status'] = 'published'; rel['publishedAt'] = snap_rel['publishedAt']
        pm.save_manifest(data, a.manifest)
    print(f'published {a.version}: uploaded {counts["uploaded"]}, already present {counts["skipped"]}. '
          f'Commit media/manifest.json in a PR.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
