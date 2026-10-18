import hashlib
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path


def load_module(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).resolve().parents[1] / 'tools' / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


parts = load_module('drive_sync_parts')
indexer = load_module('drive_sync_index')


class TransportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.path = self.root / 'original.zip'
        payload = {f'alpha/m-{i:04}.png': bytes([i]) * 2500 for i in range(4)}
        manifest = [{'file': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'role': 'alpha'}
                    for name, data in payload.items()]
        payload['file-manifest.json'] = parts.encoded(manifest)
        payload['SHA256SUMS.txt'] = ''.join(f'{hashlib.sha256(data).hexdigest()}  {name}\n'
                                            for name, data in sorted(payload.items())).encode()
        with zipfile.ZipFile(self.path, 'x') as archive:
            for name, data in payload.items():
                archive.writestr(name, data)
        self.payload = payload
        sha, md5 = parts.file_hash(self.path)
        self.entry = {'id': 'sample', 'actionId': 'sample', 'name': 'Sample', 'category': 'Home',
                      'state': 'ready', 'variantLabel': None, 'contentHash': 'c' * 64,
                      'zipPath': str(self.path), 'sha256': sha, 'md5': md5,
                      'bytes': self.path.stat().st_size, 'greenFiles': []}

    def split(self):
        return parts.split_entry(self.entry, maximum=6000, threshold=5000)

    def test_bounded_valid_zips_exact_original_coverage_and_unchanged_source(self):
        before = self.path.read_bytes()
        outputs = self.split()
        self.assertGreater(len(outputs), 1)
        observed = {}
        for row in outputs:
            self.assertLessEqual(row['bytes'], 6000)
            with zipfile.ZipFile(row['zipPath']) as archive:
                self.assertIsNone(archive.testzip())
                self.assertIn('READ-PARTS.txt', archive.namelist())
                for name in archive.namelist():
                    if name in self.payload:
                        self.assertNotIn(name, observed)
                        observed[name] = archive.read(name)
        self.assertEqual(observed, self.payload)
        self.assertEqual(self.path.read_bytes(), before)

    def test_reuses_verified_parts_and_does_not_overwrite_corrupt_existing_part(self):
        first = self.split()
        paths = [Path(row['zipPath']) for row in first]
        mtimes = [path.stat().st_mtime_ns for path in paths]
        self.assertEqual(first, self.split())
        self.assertEqual(mtimes, [path.stat().st_mtime_ns for path in paths])
        paths[0].write_bytes(b'corrupt existing transport')
        with self.assertRaises(zipfile.BadZipFile):
            self.split()
        self.assertEqual(paths[0].read_bytes(), b'corrupt existing transport')

    def test_single_large_member_and_original_hash_mismatch_fail(self):
        with self.assertRaisesRegex(ValueError, 'Single original member'):
            parts.split_entry(self.entry, maximum=2000, threshold=1000)
        entry = {**self.entry, 'sha256': '0' * 64}
        with self.assertRaisesRegex(ValueError, 'does not match plan'):
            parts.split_entry(entry, maximum=6000, threshold=5000)

    def test_no_split_for_original_below_upload_cap(self):
        result = parts.split_entry(self.entry, maximum=6000)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['zipPath'], str(self.path))

    def test_any_pending_part_prevents_whole_backup_verified_and_original_receipt_wins(self):
        files = self.split()
        transport = {'entries': [{**self.entry, 'transportFiles': files}]}
        receipts = {}

        def add(row):
            receipts[row['sha256']] = [{'sha256': row['sha256'], 'bytes': row['bytes'],
                'verified': True, 'driveId': 'ID', 'url': 'https://drive.google.com/file/d/ID/view',
                'mimeType': 'application/zip'}]

        for row in files[:-1]:
            add(row)
        catalog = indexer.build_catalog({'entries': [self.entry]}, receipts, {}, transport)
        self.assertEqual(catalog['entries'][0]['backupStatus'], 'pending')
        add(files[-1])
        catalog = indexer.build_catalog({'entries': [self.entry]}, receipts, {}, transport)
        self.assertEqual(catalog['entries'][0]['backupStatus'], 'verified')
        receipts.pop(files[-1]['sha256'])
        add(self.entry)
        catalog = indexer.build_catalog({'entries': [self.entry]}, receipts, {}, transport)
        self.assertEqual(catalog['entries'][0]['backupStatus'], 'verified')
        self.assertIn('url', catalog['entries'][0]['package'])


if __name__ == '__main__':
    unittest.main()
