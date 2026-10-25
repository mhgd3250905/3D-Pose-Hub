"""Small streaming-cache checks only. No renderer, FFmpeg, or production files."""
from pathlib import Path
import sys
import tempfile
import unittest

import numpy as np
from PIL import Image

here = Path(__file__).resolve().parent
tools = here if (here / 'export_stacked_alpha.py').is_file() else here.parent / 'tools'
sys.path.insert(0, str(tools))
import export_stacked_alpha as exporter


class ReferenceCacheTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='posehub-reference-cache-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.context = {'action': {'id': 'sample', 'frames': 2, 'fps': 30},
                        'framing': {'crop': [0, 0, 4, 4]}, 'layer': {'sourceSha256': 'source-sha'}}
        self.cache = exporter.ReferenceCache(self.root, self.context, size=4)
        self.addCleanup(self.cache.close)
        self.rgba = Image.new('RGBA', (4, 4), (200, 80, 40, 128))
        self.addCleanup(self.rgba.close)
        self.mask = np.zeros((4, 4), dtype=bool); self.mask[1, 2] = True

    def complete(self):
        self.cache.open()
        self.cache.append(0, self.rgba, self.mask)
        self.cache.append(1, self.rgba, ~self.mask)
        self.cache.finish()

    def test_write_read_hash_and_exact_pixels_then_owned_cleanup(self):
        self.complete()
        for frame, rgba, shadow in self.cache.iter_frames():
            self.assertEqual(rgba.tobytes(), self.rgba.tobytes())
            np.testing.assert_array_equal(shadow, self.mask if frame == 0 else ~self.mask)
        self.assertTrue(self.cache.read_verified)
        evidence = self.cache.evidence()
        self.assertEqual(evidence['bytes'], 2 * 4 * 4 * 5)
        self.assertEqual(evidence['sha256'], exporter.sha256(self.cache.raw_path))
        self.cache.remove_after_success()
        self.assertFalse(self.cache.raw_path.exists()); self.assertFalse(self.cache.metadata_path.exists())

    def test_short_cache_rejected_and_preserved(self):
        self.complete()
        self.cache.raw_path.write_bytes(self.cache.raw_path.read_bytes()[:-1])
        with self.assertRaisesRegex(ValueError, 'size mismatch'):
            list(self.cache.iter_frames())
        self.assertTrue(self.cache.raw_path.exists()); self.assertFalse(self.cache.read_verified)

    def test_same_length_tampering_rejected_by_readback_hash(self):
        self.complete()
        value = bytearray(self.cache.raw_path.read_bytes()); value[0] ^= 1
        self.cache.raw_path.write_bytes(value)
        with self.assertRaisesRegex(ValueError, 'readback hash'):
            list(self.cache.iter_frames())
        with self.assertRaisesRegex(ValueError, 'not fully read'):
            self.cache.remove_after_success()
        self.assertTrue(self.cache.raw_path.exists())

    def test_extra_bytes_rejected(self):
        self.complete()
        with self.cache.raw_path.open('ab') as stream:
            stream.write(b'extra')
        with self.assertRaisesRegex(ValueError, 'size mismatch'):
            list(self.cache.iter_frames())

    def test_interrupted_encode_keeps_partial_cache_and_closes_writer(self):
        with self.assertRaisesRegex(RuntimeError, 'simulated encode failure'):
            try:
                self.cache.open(); self.cache.append(0, self.rgba, self.mask)
                raise RuntimeError('simulated encode failure')
            finally:
                self.cache.close()
        self.assertTrue(self.cache.raw_path.exists()); self.assertIsNone(self.cache.writer)
        self.assertFalse(self.cache.metadata_path.exists())
        with self.assertRaisesRegex(ValueError, 'not fully read'):
            self.cache.remove_after_success()

    def test_wrong_identity_and_frame_order_rejected(self):
        self.cache.open()
        with self.assertRaisesRegex(ValueError, 'order mismatch'):
            self.cache.append(1, self.rgba, self.mask)
        self.cache.append(0, self.rgba, self.mask); self.cache.append(1, self.rgba, self.mask)
        self.cache.finish()
        self.cache.identity['action']['fps'] = 15
        with self.assertRaisesRegex(ValueError, 'identity/hash metadata'):
            list(self.cache.iter_frames())


if __name__ == '__main__':
    unittest.main(verbosity=2)
