"""Minimal tests for media/tools/{ingest,publish,sync}.py.  Run: python -m unittest discover -s media/tests -v"""
import contextlib
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from fixtures import FakeR2, make_mp4, make_png, write_config  # noqa: E402  (also puts media/tools on sys.path)
import posehub_media as pm  # noqa: E402
import ingest  # noqa: E402
import publish  # noqa: E402
import sync  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
RULES = [
    {'variant': 'dark', 'role': 'video', 'pattern': 'android/{id}.mp4', 'storage': 'r2', 'theme': 'drill-anim/themes/glow-b.json'},
    {'variant': 'dark', 'role': 'poster', 'pattern': 'android/posters/{id}.png', 'storage': 'r2'},
    {'variant': 'light', 'role': 'video', 'pattern': 'light/{id}.mp4', 'storage': 'r2'},
    {'variant': 'greenscreen', 'role': 'video', 'pattern': 'greenscreen/media/master/{id}-greenscreen.mp4', 'storage': 'local'},
    {'variant': 'alpha', 'role': 'frames', 'pattern': 'greenscreen/alpha/{id}/'},
    {'variant': 'dark', 'role': 'still', 'pattern': 'stills/{id}-{tag}.webp', 'storage': 'r2'},
]


def quiet(fn, *a, **k):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = fn(*a, **k)
    return code, out.getvalue() + err.getvalue()


class MediaToolsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); t = Path(self.tmp.name)
        self.src = t / 'renders'; self.manifest = t / 'manifest.json'; self.config = t / 'config.json'
        for i, sid in enumerate(['deltoids-A', 'h-9090-liftoff']):
            make_mp4(self.src / 'android' / f'{sid}.mp4', 1080, 1080, 240 - i * 120, 30, pad=sid.encode())
            make_png(self.src / 'android' / 'posters' / f'{sid}.png', 1080, 1080)
            make_mp4(self.src / 'light' / f'{sid}.mp4', 720, 720, 240, 30, pad=b'light' + sid.encode())
            make_mp4(self.src / 'greenscreen' / 'media' / 'master' / f'{sid}-greenscreen.mp4', 1080, 1080, 240, 30, pad=b'g' + sid.encode())
            for f in range(3):
                make_png(self.src / 'greenscreen' / 'alpha' / sid / f'{f:04d}.png', 16, 16, (0, 0, f, 128))
        (self.src / 'android' / 'notes.txt').write_text('ignored')
        for tag in ('a', 'b', 'c'):   # tagged self-test stills (stored as PNG bytes under a .webp name is fine for hashing)
            make_png(self.src / 'stills' / f'a-9090-r2-{tag}.webp', 4, 4, (ord(tag), 0, 0, 255))
        write_config(self.config, self.src, RULES)

    def tearDown(self):
        self.tmp.cleanup()

    def ingest(self, *extra):
        return quiet(ingest.main, ['--version', '0.1.0', '--config', str(self.config), '--manifest', str(self.manifest), *extra])

    # ------------------------------------------------------------ ingest
    def test_ingest_builds_manifest(self):
        code, log = self.ingest()
        self.assertEqual(code, 0, log)
        rel = pm.load_manifest(self.manifest)['releases']['0.1.0']
        self.assertEqual(rel['status'], 'draft')
        self.assertEqual(len(rel['items']), 13)
        st = sorted((i['id'], i.get('tag'), i['file']) for i in rel['items'] if i['role'] == 'still')
        self.assertEqual(st, [('a-9090-r2', t, f'a-9090-r2/a-9090-r2.dark.still.{t}.4.webp') for t in 'abc'])
        v = next(i for i in rel['items'] if i['id'] == 'deltoids-A' and i['variant'] == 'dark' and i['role'] == 'video')
        self.assertEqual(v['file'], 'deltoids-A/deltoids-A.dark.1080.mp4')
        self.assertEqual(v['local'], 'android/deltoids-A.mp4')
        self.assertEqual((v['width'], v['height'], v['frames'], v['fps'], v['durationSec']), (1080, 1080, 240, 30.0, 8.0))
        self.assertEqual(v['sha256'], pm.sha256_file(self.src / 'android' / 'deltoids-A.mp4'))
        self.assertEqual(v['bytes'], (self.src / 'android' / 'deltoids-A.mp4').stat().st_size)
        self.assertEqual(v['spec'], {'path': 'drill-anim/specs/deltoids-A.js', 'sha256': pm.sha256_text_lf(REPO / 'drill-anim/specs/deltoids-A.js')})
        self.assertEqual(v['theme']['path'], 'drill-anim/themes/glow-b.json')
        self.assertTrue(rel['model'].startswith('training-human-v2@'))
        a = next(i for i in rel['items'] if i['variant'] == 'alpha' and i['id'] == 'h-9090-liftoff')
        self.assertEqual((a['kind'], a['storage'], a['frames'], a['width']), ('frames', 'local', 3, 16))
        g = next(i for i in rel['items'] if i['variant'] == 'greenscreen')
        self.assertEqual(g['storage'], 'local')
        self.assertNotIn(str(self.src), self.manifest.read_text(encoding='utf-8'))   # no machine paths

    def test_ingest_is_idempotent_and_refuses_published_changes(self):
        self.ingest(); first = self.manifest.read_text(encoding='utf-8')
        code, log = self.ingest(); self.assertEqual(code, 0, log); self.assertIn('unchanged 13', log)
        data = pm.load_manifest(self.manifest); data['releases']['0.1.0']['status'] = 'published'; pm.save_manifest(data, self.manifest)
        code, log = self.ingest(); self.assertEqual(code, 0, log)
        make_mp4(self.src / 'android' / 'deltoids-A.mp4', 1080, 1080, 240, 30, pad=b'changed')
        code, log = self.ingest(); self.assertEqual(code, 2, log); self.assertIn('immutable', log)
        self.assertEqual(json.loads(first)['releases']['0.1.0']['items'], pm.load_manifest(self.manifest)['releases']['0.1.0']['items'])

    def test_ingest_dry_run_writes_nothing(self):
        code, _ = self.ingest('--dry-run'); self.assertEqual(code, 0); self.assertFalse(self.manifest.exists())

    # ------------------------------------------------------------ publish
    def env(self, r2):
        return {'POSE_HUB_R2_BUCKET': r2.bucket, 'POSE_HUB_R2_ENDPOINT': r2.url,
                'POSE_HUB_R2_ACCESS_KEY_ID': 'test-key', 'POSE_HUB_R2_SECRET_ACCESS_KEY': 'test-secret'}

    def publish(self, r2, *extra):
        return quiet(publish.main, ['--version', '0.1.0', '--config', str(self.config), '--manifest', str(self.manifest), *extra], env=self.env(r2))

    def test_publish_dry_run_then_upload_then_rerun(self):
        self.ingest(); r2 = FakeR2()
        try:
            code, log = self.publish(r2); self.assertEqual(code, 0, log); self.assertEqual(r2.objects, {})
            self.assertIn('dry run', log)
            code, log = self.publish(r2, '--yes'); self.assertEqual(code, 0, log)
            keys = sorted(r2.objects)
            self.assertEqual(len(keys), 10, keys)                    # 9 r2 items + manifest; greenscreen/alpha stay local
            self.assertIn('v0.1.0/deltoids-A/deltoids-A.dark.1080.mp4', keys)
            self.assertIn('v0.1.0/manifest.json', keys)
            self.assertFalse(any('greenscreen' in k or 'alpha' in k for k in keys))
            o = r2.objects['v0.1.0/deltoids-A/deltoids-A.dark.1080.mp4']
            self.assertEqual(o['meta'], hashlib.sha256(o['body']).hexdigest()); self.assertEqual(o['type'], 'video/mp4')
            snap = json.loads(r2.objects['v0.1.0/manifest.json']['body'])
            self.assertEqual((snap['version'], snap['release']['status']), ('0.1.0', 'published'))
            self.assertEqual(pm.load_manifest(self.manifest)['releases']['0.1.0']['status'], 'published')
            puts = sum(1 for r in r2.requests if r[0] == 'PUT')
            code, log = self.publish(r2, '--yes'); self.assertEqual(code, 0, log)
            self.assertEqual(puts, sum(1 for r in r2.requests if r[0] == 'PUT'))     # nothing re-uploaded
        finally:
            r2.close()

    def test_publish_never_overwrites(self):
        self.ingest(); r2 = FakeR2()
        try:
            r2.objects['v0.1.0/deltoids-A/deltoids-A.dark.1080.mp4'] = {'body': b'other', 'meta': 'f' * 64, 'type': 'video/mp4'}
            code, log = self.publish(r2, '--yes'); self.assertEqual(code, 3, log); self.assertIn('never overwritten', log)
            self.assertEqual(r2.objects['v0.1.0/deltoids-A/deltoids-A.dark.1080.mp4']['body'], b'other')
            self.assertEqual(pm.load_manifest(self.manifest)['releases']['0.1.0']['status'], 'draft')
        finally:
            r2.close()

    def test_publish_refuses_modified_local_file(self):
        self.ingest(); make_mp4(self.src / 'light' / 'deltoids-A.mp4', 720, 720, 240, 30, pad=b'edited')
        r2 = FakeR2()
        try:
            code, log = self.publish(r2, '--yes'); self.assertEqual(code, 2, log); self.assertEqual(r2.objects, {})
        finally:
            r2.close()

    def test_sigv4_matches_aws_documented_example(self):
        # AWS S3 SigV4 docs, "GET Object" example (examplebucket, Range bytes=0-9, 20130524T000000Z)
        h = pm.sigv4_headers('GET', 'https://examplebucket.s3.amazonaws.com/test.txt', {'range': 'bytes=0-9'},
                             'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                             'AKIAIOSFODNN7EXAMPLE', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region='us-east-1',
                             amz_date='20130524T000000Z')
        self.assertTrue(h['authorization'].endswith('Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41'), h['authorization'])

    # ------------------------------------------------------------ sync
    def published(self):
        self.ingest(); r2 = FakeR2(); self.publish(r2, '--yes'); return r2

    def sync(self, *args):
        return quiet(sync.main, list(args))

    def test_sync_downloads_only_requested_ids_and_verifies(self):
        r2 = self.published(); dest = Path(self.tmp.name) / 'app' / 'assets'
        try:
            lock = Path(self.tmp.name) / 'app' / 'pose-hub.lock.json'; lock.parent.mkdir(parents=True)
            lock.write_text(json.dumps({'poseHub': {'repo': 'mhgd3250905/3D-Pose-Hub', 'version': '0.1.0'}, 'baseUrl': r2.url,
                                        'targets': [{'variant': 'dark', 'role': 'video', 'dest': 'assets/videos', 'name': '{id}.mp4', 'ids': ['h-9090-liftoff']},
                                                    {'variant': 'dark', 'role': 'poster', 'dest': 'assets/posters', 'name': '{id}{ext}', 'ids': ['h-9090-liftoff']}]}))
            code, log = self.sync('--lock', str(lock)); self.assertEqual(code, 0, log)
            self.assertEqual(sorted(p.relative_to(dest).as_posix() for p in dest.rglob('*') if p.is_file()),
                             ['posters/h-9090-liftoff.png', 'videos/h-9090-liftoff.mp4'])
            self.assertEqual((dest / 'videos/h-9090-liftoff.mp4').read_bytes(), (self.src / 'android/h-9090-liftoff.mp4').read_bytes())
            code, log = self.sync('--lock', str(lock)); self.assertIn('2 up to date, 0 downloaded', log)
            code, log = self.sync('--lock', str(lock), '--check'); self.assertEqual(code, 0, log)
            (dest / 'videos/h-9090-liftoff.mp4').write_bytes(b'tampered')
            code, log = self.sync('--lock', str(lock), '--check'); self.assertEqual(code, 1, log); self.assertIn('DRIFT', log)
            code, log = self.sync('--lock', str(lock)); self.assertEqual(code, 0, log)
            self.assertEqual(pm.sha256_file(dest / 'videos/h-9090-liftoff.mp4'), pm.sha256_file(self.src / 'android/h-9090-liftoff.mp4'))
        finally:
            r2.close()

    def test_sync_rejects_corrupt_download_missing_ids_local_masters_and_drafts(self):
        r2 = self.published(); dest = Path(self.tmp.name) / 'out'
        try:
            r2.objects['v0.1.0/deltoids-A/deltoids-A.dark.1080.mp4']['body'] = b'corrupted in transit'
            with self.assertRaises(SystemExit) as e:
                self.sync('--version', '0.1.0', '--base-url', r2.url, '--ids', 'deltoids-A', '--dest', str(dest))
            self.assertIn('nothing written', str(e.exception)); self.assertFalse(any(dest.rglob('*.mp4')))
            self.assertFalse(any(dest.rglob('*.part')))
            with self.assertRaises(SystemExit) as e:
                self.sync('--version', '0.1.0', '--base-url', r2.url, '--ids', 'no-such-drill', '--dest', str(dest))
            self.assertIn('no-such-drill', str(e.exception))
            with self.assertRaises(SystemExit) as e:
                self.sync('--version', '0.1.0', '--base-url', r2.url, '--ids', 'deltoids-A', '--variant', 'greenscreen', '--dest', str(dest))
            self.assertIn('local-only', str(e.exception))
        finally:
            r2.close()
        mirror = Path(self.tmp.name) / 'mirror' / 'v0.1.0'; mirror.mkdir(parents=True)
        data = pm.load_manifest(self.manifest); data['releases']['0.1.0']['status'] = 'draft'
        (mirror / 'manifest.json').write_text(json.dumps(pm.release_snapshot(data, '0.1.0')))
        with self.assertRaises(SystemExit) as e:
            self.sync('--version', '0.1.0', '--source-dir', str(mirror.parent), '--ids', 'deltoids-A', '--dest', str(dest))
        self.assertIn('not published', str(e.exception))

    def test_sync_tagged_stills_with_lower_case_names(self):
        r2 = self.published(); dest = Path(self.tmp.name) / 'stills-out'
        try:
            with self.assertRaises(SystemExit) as e:
                self.sync('--version', '0.1.0', '--base-url', r2.url, '--ids', 'a-9090-r2', '--role', 'still', '--dest', str(dest), '--name', '{id}.webp')
            self.assertIn('{tag}', str(e.exception))
            code, log = self.sync('--version', '0.1.0', '--base-url', r2.url, '--ids', 'a-9090-r2', '--role', 'still',
                                  '--dest', str(dest), '--name', 'hip-{id_lower}-{tag}{ext}')
            self.assertEqual(code, 0, log)
            self.assertEqual(sorted(p.name for p in dest.iterdir()), ['hip-a-9090-r2-a.webp', 'hip-a-9090-r2-b.webp', 'hip-a-9090-r2-c.webp'])
        finally:
            r2.close()

    def test_sync_from_local_mirror(self):
        r2 = self.published()
        try:
            mirror = Path(self.tmp.name) / 'mirror'
            for k, o in r2.objects.items():
                (mirror / k).parent.mkdir(parents=True, exist_ok=True); (mirror / k).write_bytes(o['body'])
        finally:
            r2.close()
        dest = Path(self.tmp.name) / 'out2'
        code, log = self.sync('--version', '0.1.0', '--source-dir', str(mirror), '--ids', 'deltoids-A,h-9090-liftoff',
                              '--variant', 'light', '--dest', str(dest), '--name', '{id}.{variant}{ext}')
        self.assertEqual(code, 0, log)
        self.assertEqual(sorted(p.name for p in dest.iterdir()), ['deltoids-A.light.mp4', 'h-9090-liftoff.light.mp4'])

    def archive_fixture(self):
        """An extracted ZIP uses item.file, independent of the renderer's item.local."""
        self.ingest()
        data = pm.load_manifest(self.manifest)
        rel = data['releases']['0.1.0']; rel['status'] = 'published'
        archive = Path(self.tmp.name) / 'extracted'; archive.mkdir()
        for item in rel['items']:
            if item['storage'] != 'r2':
                continue
            item['storage'] = 'archive'
            target = archive / item['file']; target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((self.src / item['local']).read_bytes())
        pm.save_manifest(data, self.manifest)
        item = next(i for i in rel['items'] if i['id'] == 'deltoids-A' and i['variant'] == 'dark' and i['role'] == 'video')
        dest = Path(self.tmp.name) / 'archive-out'
        args = ['--version', '0.1.0', '--manifest', str(self.manifest), '--from-dir', str(archive),
                '--ids', 'deltoids-A', '--dest', str(dest), '--name', '{id}{ext}']
        return archive, dest, item, args

    def test_sync_extracted_archive_copy_idempotence_and_check(self):
        archive, dest, item, args = self.archive_fixture()
        self.assertFalse((archive / 'manifest.json').exists())
        self.assertFalse((archive / 'v0.1.0').exists())
        code, log = self.sync(*args); self.assertEqual(code, 0, log)
        out = dest / 'deltoids-A.mp4'
        self.assertEqual(out.read_bytes(), (archive / item['file']).read_bytes())
        timestamp = out.stat().st_mtime_ns
        code, log = self.sync(*args); self.assertIn('1 up to date, 0 downloaded', log)
        self.assertEqual(out.stat().st_mtime_ns, timestamp)
        # Check needs only the independent manifest and destinations, never source media bytes.
        (archive / item['file']).unlink()
        code, log = self.sync(*args, '--check'); self.assertEqual(code, 0, log)
        out.write_bytes(b'keep this drifted destination')
        code, log = self.sync(*args, '--check'); self.assertEqual(code, 1, log)
        self.assertEqual(out.read_bytes(), b'keep this drifted destination')
        self.assertFalse(list(dest.rglob('*.part')))

    def test_sync_archive_corruption_preserves_destination_and_removes_part(self):
        archive, dest, item, args = self.archive_fixture()
        source = archive / item['file']; original = source.read_bytes()
        dest.mkdir(); out = dest / 'deltoids-A.mp4'
        for corrupt in (original[:-1], bytes([original[0] ^ 1]) + original[1:]):
            with self.subTest(bytes=len(corrupt)):
                out.write_bytes(b'old destination'); source.write_bytes(corrupt)
                with self.assertRaises(SystemExit) as e:
                    self.sync(*args)
                self.assertIn('nothing written', str(e.exception))
                self.assertEqual(out.read_bytes(), b'old destination')
                self.assertFalse(list(dest.rglob('*.part')))

    def test_sync_archive_lock_relative_manifest_without_base_url(self):
        archive, _, item, _ = self.archive_fixture()
        app = Path(self.tmp.name) / 'app'; app.mkdir()
        lock = app / 'pose-hub.lock.json'
        lock.write_text(json.dumps({'poseHub': {'version': '0.1.0'}, 'manifest': '../manifest.json',
                                    'targets': [{'dest': 'assets', 'name': '{id}{ext}', 'ids': ['deltoids-A']}]}))
        # Run from another directory so accidentally using cwd to resolve the manifest fails.
        with mock.patch.dict(sync.os.environ, {}, clear=True):
            code, log = self.sync('--lock', str(lock), '--from-dir', str(archive))
        self.assertEqual(code, 0, log)
        self.assertEqual((app / 'assets/deltoids-A.mp4').read_bytes(), (archive / item['file']).read_bytes())
        # The standalone offline check also resolves manifest against the lock, with no source root or base URL.
        with mock.patch.dict(sync.os.environ, {}, clear=True):
            code, log = self.sync('--lock', str(lock), '--check')
        self.assertEqual(code, 0, log)
        self.assertIn('1 up to date, 0 downloaded', log)
        # CLI manifest overrides the lock and follows the same lock-relative convention.
        data = json.loads(lock.read_text()); data['manifest'] = 'missing.json'; lock.write_text(json.dumps(data))
        code, log = self.sync('--lock', str(lock), '--manifest', '../manifest.json', '--from-dir', str(archive), '--check')
        self.assertEqual(code, 0, log)

    def test_sync_archive_manifest_url_and_legacy_r2_storage(self):
        archive, dest, item, args = self.archive_fixture()
        data = pm.load_manifest(self.manifest)
        for row in data['releases']['0.1.0']['items']:
            if row['storage'] == 'archive':
                row['storage'] = 'r2'
        r2 = FakeR2()
        try:
            r2.objects['manifest.json'] = {'body': json.dumps(data).encode(), 'meta': '', 'type': 'application/json'}
            args[args.index('--manifest') + 1] = r2.url + '/manifest.json'
            code, log = self.sync(*args); self.assertEqual(code, 0, log)
            self.assertEqual((dest / 'deltoids-A.mp4').read_bytes(), (archive / item['file']).read_bytes())
            self.assertTrue(all(request[1] == 'manifest.json' for request in r2.requests), r2.requests)
        finally:
            r2.close()

    def test_sync_archive_default_manifest_only_in_hub_checkout(self):
        archive, _, _, args = self.archive_fixture()
        del args[args.index('--manifest'):args.index('--manifest') + 2]
        fake_tools = Path(self.tmp.name) / 'hub/media/tools'; fake_tools.mkdir(parents=True)
        (fake_tools.parent / 'manifest.json').write_bytes(self.manifest.read_bytes())
        with mock.patch.object(sync, '__file__', str(fake_tools / 'sync.py')):
            code, log = self.sync(*args); self.assertEqual(code, 0, log)
        with mock.patch.object(sync, '__file__', str(Path(self.tmp.name) / 'app/tools/pose_hub_sync.py')):
            with self.assertRaises(SystemExit) as e:
                self.sync(*args, '--check')
            self.assertIn('separate --manifest', str(e.exception))

    def test_sync_archive_rejects_invalid_roots_and_missing_files(self):
        archive, dest, item, args = self.archive_fixture()
        root_index = args.index('--from-dir') + 1
        for invalid in (str(archive / 'missing'), 'https://drive.example/share/archive'):
            with self.subTest(root=invalid):
                args[root_index] = invalid
                with self.assertRaises(SystemExit):
                    self.sync(*args)
                self.assertFalse(dest.exists())
        args[root_index] = str(archive)
        (archive / item['file']).unlink()
        with self.assertRaises(SystemExit) as e:
            self.sync(*args)
        self.assertIn('archive file not found', str(e.exception))
        self.assertFalse(dest.exists())
        with self.assertRaises(SystemExit):
            self.sync(*args, '--source-dir', str(archive))

    def test_sync_archive_rejects_source_and_target_path_escape(self):
        archive, dest, item, args = self.archive_fixture()
        data = pm.load_manifest(self.manifest)
        row = next(i for i in data['releases']['0.1.0']['items'] if i['file'] == item['file'])
        for unsafe in ('../outside.mp4', '/absolute.mp4', 'C:/absolute.mp4', '..\\outside.mp4'):
            with self.subTest(file=unsafe):
                row['file'] = unsafe; pm.save_manifest(data, self.manifest)
                with self.assertRaises(SystemExit) as e:
                    self.sync(*args)
                self.assertIn('unsafe path', str(e.exception))
                self.assertFalse(dest.exists())
        row['file'] = item['file']; pm.save_manifest(data, self.manifest)
        args[args.index('--name') + 1] = '../outside.mp4'
        with self.assertRaises(SystemExit) as e:
            self.sync(*args)
        self.assertIn('target name', str(e.exception))
        self.assertFalse((dest.parent / 'outside.mp4').exists())

    def test_sync_archive_rejects_local_masters_and_frame_groups(self):
        archive, dest, _, args = self.archive_fixture()
        for variant, role in (('greenscreen', 'video'), ('alpha', 'frames')):
            with self.subTest(variant=variant):
                with self.assertRaises(SystemExit) as e:
                    self.sync(*args, '--variant', variant, '--role', role)
                self.assertIn('local-only master', str(e.exception))
        self.assertFalse(dest.exists())


if __name__ == '__main__':
    unittest.main()
