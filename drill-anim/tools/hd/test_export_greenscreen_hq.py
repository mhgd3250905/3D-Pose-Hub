"""CPU tests for the additive HQ wrapper; frozen exporter is never edited."""
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


hq = load('green_hq_test', 'export_greenscreen_hq.py')
fixtures = load('green_fixtures', 'test_export_greenscreen.py')


class GreenHqTests(unittest.TestCase):
    def test_encoder_uses_full_chroma_and_does_not_change_source_or_timing(self):
        with patch.object(hq.engine, 'run') as run:
            hq.encode(Path('alpha'), Path('target.mp4'), 240)
        command = run.call_args.args[0]
        self.assertEqual(command[command.index('-crf')+1], '12')
        self.assertEqual(command[command.index('-pix_fmt')+1], 'yuv444p')
        self.assertEqual(command[command.index('-frames:v')+1], '240')
        self.assertEqual(command[command.index('-framerate')+1], '30')
        self.assertIn('alpha=straight', command[command.index('-filter_complex')+1])

    def test_cpu_hq_export_passes_original_qa_and_preserves_source(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixtures.fixture(batch)
            before = hq.engine.source_job(batch, sid)['inputs']
            result = hq.export_job(batch, sid, True)
            self.assertEqual(result['recipe']['pixel_format'], 'yuv444p')
            self.assertEqual(result['recipe']['crf'], 12)
            self.assertEqual(result['video_validation']['probe']['streams'][0]['pix_fmt'], 'yuv444p')
            self.assertTrue(result['video_validation']['full_cpu_decode'])
            self.assertEqual(result['inherited_source_qa_status'], 'review')
            for row in result['temporal_samples']:
                self.assertLess(row['cyan_mae'], 10)
                self.assertEqual(row['cyan_key_matte_min'], 1)
            hq.engine.verify_inputs(batch, before)
            self.assertEqual(hq.export_job(batch, sid, True)['outputs'], result['outputs'])

    def test_legacy_420_product_is_verified_and_never_reencoded(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixtures.fixture(batch)
            original = hq.legacy.export_job(batch, sid, True)
            with patch.object(hq.engine, 'encode') as encode:
                verified = hq.export_job(batch, sid, True)
            encode.assert_not_called()
            self.assertEqual(verified['recipe']['pixel_format'], 'yuv420p')
            self.assertEqual(verified['outputs'], original['outputs'])
            self.assertEqual(hq.engine.sha(hq.FROZEN_PATH), hq.FROZEN_SHA256)

    def test_cli_writes_separate_explicit_mixed_recipe_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixtures.fixture(batch)
            # Real 4:2:0 result plus a schema-only second record exercises aggregation.
            old = hq.legacy.export_job(batch, sid, True)
            row = dict(old)
            row['id'] = 'hq-schema-fixture'
            row['recipe'] = hq.recipe(True)
            row['video_validation'] = {'probe': {'streams': [{'pix_fmt': 'yuv444p', 'codec_name': 'h264'}]}}
            hq.legacy.write(batch/'greenscreen/jobs/hq-schema-fixture/result.json', row)
            sentinel = batch/'greenscreen/delivery-manifest.json'
            sentinel.write_text('Legacy watcher owns this summary', encoding='utf-8')
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(hq.main(['--output', str(batch), '--ids', sid, '--once', '--keep-alpha']), 0)
            data = hq.engine.read(batch/'greenscreen/delivery-manifest-hq.json')
            self.assertTrue(data['mixed_recipes'])
            self.assertEqual(data['format_counts'], {'yuv420p': 1, 'yuv444p': 1})
            self.assertNotIn('recipe', data)
            self.assertEqual(data['completed'][sid]['pixel_format'], 'yuv420p')
            self.assertEqual(sentinel.read_text(), 'Legacy watcher owns this summary')


if __name__ == '__main__':
    unittest.main()
