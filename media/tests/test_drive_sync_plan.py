import contextlib
import importlib.util
import io
import json
import struct
import tempfile
import unittest
import zipfile
import zlib
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / 'tools/drive_sync_plan.py'
SPEC = importlib.util.spec_from_file_location('drive_sync_plan', MODULE)
sync = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sync)


def png(path):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 6, 0, 0, 0))
                     + chunk(b'IDAT', zlib.compress(b'\0\0\0\0\0')) + chunk(b'IEND', b''))


class DrivePlanTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.pre, self.hd, self.repo, self.out = [self.root / n for n in ('pre', 'hd', 'repo', 'out')]
        for path in (self.pre, self.hd, self.repo):
            path.mkdir()
        self.extra = self.pre / 'historical-extras/inventory.json'
        self.extra.parent.mkdir()
        self.extra.write_text('{"items": []}')
        (self.hd / 'catalog.json').write_text('{"items": []}')
        (self.pre / 'green.mp4').write_bytes(b'fake video')
        png(self.pre / 'poster.png')
        png(self.pre / 'alpha/m-0000.png')
        png(self.pre / 'alpha/m-0001.png')
        png(self.pre / 'alpha/m-still.png')
        (self.pre / 'alpha/failed.tmp').write_text('ignored')
        self.row = {'id': 'test-action', 'name': 'Test', 'category': 'Home', 'state': 'review_required',
                    'sourceQa': {'pass': False}, 'limitations': ['not visually accepted'],
                    'assets': {'green': {'href': 'green.mp4'}, 'poster': {'href': 'poster.png'},
                               'alpha': {'href': 'alpha', 'frames': 2}}}

    def build(self, rows=None, **kwargs):
        (self.pre / 'catalog.json').write_text(json.dumps({'items': rows or [self.row]}))
        with contextlib.redirect_stdout(io.StringIO()):
            return sync.build_plan(self.pre, self.hd, self.extra, self.out, self.repo, **kwargs)

    def test_idempotent_and_payload_qa_retained(self):
        first = self.build()['entries'][0]
        path = Path(first['zipPath'])
        before = path.stat().st_mtime_ns
        second = self.build()['entries'][0]
        self.assertEqual(first['sha256'], second['sha256'])
        self.assertTrue(second['reused'])
        self.assertEqual(before, path.stat().st_mtime_ns)
        self.assertEqual(first['alphaFrameCount'], 2)
        with zipfile.ZipFile(path) as archive:
            self.assertFalse(any('failed' in n or 'still' in n for n in archive.namelist()))
            metadata = json.loads(archive.read('metadata.json'))
            self.assertFalse(metadata['sourceRows'][0]['item']['sourceQa']['pass'])
            for line in archive.read('SHA256SUMS.txt').decode().splitlines():
                sha, name = line.split('  ', 1)
                self.assertEqual(sha, sync.hashlib.sha256(archive.read(name)).hexdigest())

    def test_changed_content_creates_new_archive_keeps_old(self):
        first = self.build()['entries'][0]
        original = Path(first['zipPath']).read_bytes()
        (self.pre / 'green.mp4').write_bytes(b'new movie')
        second = self.build()['entries'][0]
        self.assertNotEqual(first['zipPath'], second['zipPath'])
        self.assertEqual(original, Path(first['zipPath']).read_bytes())

    def test_damaged_existing_archive_is_never_overwritten(self):
        entry = self.build()['entries'][0]
        path = Path(entry['zipPath'])
        path.write_bytes(b'existing damaged archive')
        with self.assertRaises(zipfile.BadZipFile):
            self.build()
        self.assertEqual(path.read_bytes(), b'existing damaged archive')

    def test_valid_zip_with_altered_payload_is_rejected_even_with_valid_crc(self):
        entry = self.build()['entries'][0]
        path = Path(entry['zipPath'])
        with zipfile.ZipFile(path) as archive:
            payloads = {name: archive.read(name) for name in archive.namelist()}
        payloads['variants/pre-pr5/green/green.mp4'] = b'altered but valid ZIP entry'
        with zipfile.ZipFile(path, 'w') as archive:
            for name, data in payloads.items():
                archive.writestr(name, data)
        corrupted = path.read_bytes()
        with self.assertRaisesRegex(ValueError, 'payload mismatch'):
            self.build()
        self.assertEqual(path.read_bytes(), corrupted)

    def test_missing_frames_and_roles_reported_without_claiming_complete(self):
        (self.pre / 'alpha/m-0001.png').unlink()
        self.row['assets'].pop('poster')
        plan = self.build()
        self.assertEqual(plan['entries'][0]['state'], 'review_required')
        self.assertTrue(any(m['reason'] == 'frame count mismatch' for m in plan['missing']))
        self.assertTrue(any(m['role'] == 'poster' for m in plan['missing']))

    def test_source_escape_and_zip_traversal_rejected(self):
        outside = self.root / 'outside.mp4'
        outside.write_bytes(b'private')
        self.row['assets']['green'] = {'href': '../outside.mp4'}
        with self.assertRaisesRegex(ValueError, 'allowlist'):
            self.build()
        for member in ('../escape', '/absolute', 'C:/windows', 'ok\\bad'):
            with self.assertRaises(ValueError):
                sync.safe_member(member)

    def test_stopped_is_metadata_only_and_static_has_no_dynamic_missing(self):
        stopped = {**self.row, 'id': 'stopped', 'state': 'stopped'}
        static = {**self.row, 'id': 'static', 'state': 'static', 'assets': {'stills': [
            {'green': {'href': 'poster.png'}, 'alpha': {'href': 'alpha/m-0000.png'}}]}}
        plan = self.build([stopped, static])
        self.assertFalse(plan['missing'])
        by_id = {x['id']: x for x in plan['entries']}
        self.assertEqual(by_id['stopped']['greenCount'], 0)
        self.assertEqual(by_id['stopped']['fileCount'], 4)
        self.assertEqual(by_id['static']['staticAlphaCount'], 1)

    def test_supplemental_main_and_mask_are_distinct_and_stills_not_loop(self):
        png(self.pre / 'original/m-0000.png')
        png(self.pre / 'original/g-0000.png')
        png(self.pre / 'original/m-still.png')
        audit = self.root / 'audit.json'
        audit.write_text(json.dumps({'items': [{'id': self.row['id'], 'passes': {
            p: {'directory': str(self.pre / 'original'), 'pattern': f'{p}-*.png', 'frames': 1}
            for p in ('m', 'g')}, 'alphaStill': [{'path': str(self.pre / 'original/m-still.png')}]}]}))
        entry = self.build(supplemental=audit)['entries'][0]
        self.assertEqual(entry['alphaFrameCount'], 3)
        self.assertEqual(entry['glowMaskFrameCount'], 1)
        self.assertEqual(entry['staticAlphaCount'], 1)
        with zipfile.ZipFile(entry['zipPath']) as archive:
            self.assertTrue(any('/original-glow-mask/g-0000.png' in n for n in archive.namelist()))

    def test_historical_variant_with_still_list_preserves_action_binding(self):
        variants = self.root / 'variants.json'
        variants.write_text(json.dumps({'items': [{
            'id': 'test-action@old', 'actionId': 'test-action', 'variant': 'old',
            'name': 'Old test', 'category': 'Home', 'state': 'review_required',
            'green': {'file': str(self.pre / 'green.mp4')},
            'poster': {'file': str(self.pre / 'poster.png')},
            'alpha': {'directory': str(self.pre / 'alpha'), 'frames': 2},
            'alphaStill': [{'path': str(self.pre / 'alpha/m-still.png')}]
        }]}))
        plan = self.build(variants=variants)
        variant = next(x for x in plan['entries'] if x['id'].endswith('@old'))
        self.assertEqual(variant['actionId'], 'test-action')
        self.assertEqual(variant['variantLabel'], 'old')
        self.assertEqual(variant['staticAlphaCount'], 1)
        self.assertEqual(variant['alphaFrameCount'], 2)

    def test_future_catalog_is_discovered_but_backup_tree_is_not(self):
        future = self.root / 'future-stock'
        future.mkdir()
        (future / 'new.mp4').write_bytes(b'new completed video')
        (future / 'catalog.json').write_text(json.dumps({
            'schema': 'pose-hub/local-hd-stock@1', 'items': [
                {'id': 'new-action', 'name': 'New', 'state': 'ready', 'green': {'file': 'new.mp4'}}]}))
        backup = self.root / 'backups'
        backup.mkdir()
        (backup / 'catalog.json').write_text('{"schema":"unsupported"}')
        plan = self.build()
        entry = next(x for x in plan['entries'] if x['id'] == 'new-action')
        self.assertEqual(entry['greenCount'], 1)
        self.assertTrue(any(c['label'] == 'inventory-future-stock' for c in plan['catalogs']))

    def test_unknown_future_catalog_schema_raises_instead_of_silently_omitting(self):
        future = self.root / 'future-stock'
        future.mkdir()
        (future / 'catalog.json').write_text('{"schema":"future-unknown","items":[]}')
        with self.assertRaisesRegex(ValueError, 'Unsupported inventory catalog schema'):
            self.build()

    def test_expected_loop_frames_exclude_separate_still_count(self):
        self.row['assets']['alpha'].update(frames=3, expectedFrames=2)
        plan = self.build()
        self.assertFalse(plan['missing'])
        self.assertEqual(plan['entries'][0]['alphaFrameCount'], 2)


if __name__ == '__main__':
    unittest.main()
