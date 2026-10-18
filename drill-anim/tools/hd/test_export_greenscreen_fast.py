"""CPU verification of cache reuse, safe fallback and frozen producer preservation."""
import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fast = load('green_fast_test', 'export_greenscreen_fast.py')
fixtures = load('green_fast_fixture', 'test_export_greenscreen.py')


def cache_fixture(batch, sid):
    job = fast._source_job(batch, sid)
    directory = batch/'work'/sid/'c'
    rows = []
    for i, raw in enumerate(job['frames']):
        name = f'{i:04d}'
        target = directory/(name+'.png')
        fast._placed_rgba(raw, job['place']).save(target)
        rows.append({'name': name, 'raw_sha256': fast.engine.sha(raw),
                     'output_sha256': fast.engine.sha(target), 'width': 1080,
                     'height': 1080, 'mode': 'RGBA'})
    certificate = directory/'cache-manifest-all.json'
    fast._base_write(certificate, {'schema': 1, 'producer_sha256': fast.optional_sha(fast.PARALLEL_PATH),
        'delegate_sha256': fast.optional_sha(fast.COMPOSITOR_PATH),
        'spec_sha256': fast.engine.sha(batch/'work'/(sid+'.spec.json')),
        'placement_sha256': fast.engine.sha(directory/'place.json'), 'range': 'all', 'frames': rows})
    return certificate


class GreenFastTests(unittest.TestCase):
    def test_two_frame_true_hq_encode_reuses_cache_without_resampling(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixtures.fixture(batch)
            cache_fixture(batch, sid)
            with patch.object(fast, '_placed_rgba', side_effect=AssertionError('Cache hit must not resample')):
                result = fast.export_job(batch, sid, True)
            self.assertTrue(result['cache_reuse']['reused'])
            self.assertEqual(result['cache_reuse']['frames_reused'], 2)
            self.assertEqual(result['inherited_source_qa_status'], 'review')
            self.assertTrue(result['video_validation']['full_cpu_decode'])
            self.assertEqual(result['video_validation']['probe']['streams'][0]['pix_fmt'], 'yuv444p')
            for sample in result['temporal_samples']:
                self.assertLess(sample['cyan_mae'], 10)
            source = batch/'work'/sid/'c/0000.png'
            saved = batch/'greenscreen/alpha'/sid/'m-0000.png'
            self.assertEqual(fast.engine.sha(source), fast.engine.sha(saved))
            # copyfile produces independent storage, unlike linking scratch to delivery.
            before = fast.engine.sha(saved)
            source.write_bytes(b'mutated scratch after export')
            self.assertEqual(fast.engine.sha(saved), before)

    def test_modified_cache_sha_falls_back_to_frozen_calculation(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixtures.fixture(batch)
            cache_fixture(batch, sid)
            (batch/'work'/sid/'c/0001.png').write_bytes(b'corrupt cache')
            result = fast.export_job(batch, sid, True)
            self.assertFalse(result['cache_reuse']['reused'])
            self.assertIn('SHA mismatch', result['cache_reuse']['reason'])
            self.assertTrue(result['composition_qa_pass'])

    def test_missing_frame_certificate_and_changed_placement_are_cache_misses(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixtures.fixture(batch)
            certificate = cache_fixture(batch, sid)
            row = fast.engine.read(certificate)
            row['frames'].pop()
            fast._base_write(certificate, row)
            _, _, result = fast.validate_cache(batch, fast._source_job(batch, sid))
            self.assertFalse(result['reused'])
            self.assertIn('incomplete', result['reason'])
            cache_fixture(batch, sid)
            place = batch/'work'/sid/'c/place.json'
            fast._base_write(place, {'s': 2, 'ox': 285, 'oy': 284})
            _, _, result = fast.validate_cache(batch, fast._source_job(batch, sid))
            self.assertFalse(result['reused'])
            self.assertIn('placement_sha256', result['reason'])

    def test_published_legacy_and_hq_recipes_are_strictly_preserved(self):
        for producer in ('legacy', 'hq'):
            with self.subTest(producer=producer), tempfile.TemporaryDirectory() as directory:
                batch = Path(directory)
                sid = fixtures.fixture(batch)
                # Load an untouched HQ module for producing a genuine v2 test result.
                untouched = load('green_hq_preservation_'+producer, 'export_greenscreen_hq.py')
                original = (untouched.legacy if producer == 'legacy' else untouched).export_job(batch, sid, True)
                path = batch/'greenscreen/jobs'/sid/'result.json'
                before = fast.engine.sha(path)
                with patch.object(fast.engine, 'encode', side_effect=AssertionError('Existing files cannot be encoded')):
                    verified = fast.export_job(batch, sid, True)
                self.assertEqual(verified['recipe'], original['recipe'])
                self.assertEqual(fast.engine.sha(path), before)
                tampered = dict(original)
                tampered['recipe'] = dict(original['recipe'], crf=0)
                fast._base_write(path, tampered)
                with self.assertRaisesRegex(ValueError, 'Existing recipe differs'):
                    fast.export_job(batch, sid, True)

    def test_fast_manifest_has_explicit_recipe_and_does_not_replace_old_summary(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixtures.fixture(batch)
            cache_fixture(batch, sid)
            sentinel = batch/'greenscreen/delivery-manifest.json'
            sentinel.parent.mkdir(parents=True, exist_ok=True)
            sentinel.write_text('preserve prior summary')
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(fast.main(['--output', str(batch), '--ids', sid, '--once', '--keep-alpha']), 0)
            manifest = fast.engine.read(batch/'greenscreen/delivery-manifest-fast.json')
            self.assertEqual(manifest['schema'], 3)
            self.assertTrue(manifest['completed'][sid]['cache_reuse']['reused'])
            self.assertEqual(manifest['completed'][sid]['pixel_format'], 'yuv444p')
            self.assertEqual(sentinel.read_text(), 'preserve prior summary')


if __name__ == '__main__':
    unittest.main()
