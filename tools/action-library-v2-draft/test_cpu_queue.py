"""Regressions for draft identity, immutable completion barriers and path bounds."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('draft_cpu', Path(__file__).with_name('cpu_queue.py'))
cpu = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cpu)


class DraftContractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.receipt = {'actionId': 'sample', 'reviewed': False, 'releaseEligible': False,
                        'sourceSha256': 'source', 'manifests': {}}
        frame = self.put('frames/example.png', b'test fixture; pixel decoding belongs to compositor')
        sequence = self.put('frames/index.json', {'frames': [{**frame, 'frame': i} for i in range(240)]})
        for skin in cpu.SKINS:
            manifest = {'actionId': 'sample', 'skin': skin, 'reviewed': False, 'releaseEligible': False,
                        'status': 'draft-unreviewed', 'complete': True, 'width': 1080,
                        'height': 1080, 'fps': 30, 'durationSeconds': 8, 'frameCount': 240,
                        'sourceSha256': 'source', 'model': {'id': 'training-human-v2plus', 'version': '1.0.0-rc2'},
                        'sequences': {k: sequence for k in ('body', 'highlight', 'shadow')}}
            self.receipt['manifests'][skin] = self.put(f'masters/{skin}/sample/layer-manifest.json', manifest)
        self.save_receipt()

    def put(self, path, value):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        raw = value if isinstance(value, bytes) else json.dumps(value).encode()
        target.write_bytes(raw)
        return {'root': 'media', 'path': path, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}

    def save_receipt(self):
        self.put('manifests/completed/full-sample.json', self.receipt)

    def test_unreviewed_complete_contract(self):
        result = cpu.validate_draft(self.root, 'sample')
        self.assertIs(result['reviewed'], False)
        self.assertNotIn('reviewSha256', result)

    def test_no_review_receipt_can_enter_draft_adapter(self):
        self.receipt['reviewed'] = True
        self.save_receipt()
        with self.assertRaisesRegex(ValueError, 'unreviewed'):
            cpu.validate_draft(self.root, 'sample')

    def test_no_review_sha_can_be_claimed(self):
        self.receipt['reviewSha256'] = 'pretend-review'
        self.save_receipt()
        with self.assertRaisesRegex(ValueError, 'claim a review'):
            cpu.validate_draft(self.root, 'sample')

    def test_release_claim_is_rejected(self):
        self.receipt['releaseEligible'] = True
        self.save_receipt()
        with self.assertRaisesRegex(ValueError, 'unreviewed'):
            cpu.validate_draft(self.root, 'sample')

    def test_changed_index_is_rejected(self):
        (self.root / 'frames/index.json').write_text('{}')
        with self.assertRaisesRegex(ValueError, 'Changed media'):
            cpu.validate_draft(self.root, 'sample')

    def test_truncated_frame_is_rejected(self):
        (self.root / 'frames/example.png').write_bytes(b'')
        with self.assertRaisesRegex(ValueError, 'truncated'):
            cpu.validate_draft(self.root, 'sample')

    def test_missing_skin_is_rejected(self):
        del self.receipt['manifests']['hologram']
        self.save_receipt()
        with self.assertRaisesRegex(ValueError, 'five-skin'):
            cpu.validate_draft(self.root, 'sample')

    def test_paths_cannot_escape_root(self):
        for relative in ('../outside.png', 'F:/outside.png', '\\server\\file', '/outside.png'):
            with self.subTest(relative=relative), self.assertRaises(ValueError):
                cpu.safe(self.root, relative)


if __name__ == '__main__':
    unittest.main()
