"""Minimal tests for media/tools/{ingest,publish,sync}.py.  Run: python -m unittest discover -s media/tests -v"""
import contextlib
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path

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


if __name__ == '__main__':
    unittest.main()
