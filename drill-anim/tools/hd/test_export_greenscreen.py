"""Run: python -m unittest discover -s tools/hiplab-render -p test_export_greenscreen.py -v."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image, ImageDraw


SPEC = importlib.util.spec_from_file_location('green_export', Path(__file__).with_name('export_greenscreen.py'))
green = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(green)


def fixture(batch, complete=True):
    sid = 'synthetic-test'
    fr = batch/'work'/sid/'fr'
    fr.mkdir(parents=True)
    green.write(batch/'source-manifest.json', {'source_commit': 'synthetic-fixture', 'drills': [{'id': sid}]})
    green.write(batch/'work'/(sid+'.spec.json'), {'id': sid, 'fps': 30, 'timeline': {'duration': 2/30}, 'stillAt': 0})
    green.write(batch/'work'/sid/'c/place.json', {'s': 2, 'ox': 284, 'oy': 284})
    green.write(batch/'master/metrics'/(sid+'.json'), {'id': sid, 'fps': 30, 'frames': 2,
                                                   'frames_complete': True, 'pass': False})
    (batch/'master'/(sid+'.mp4')).write_bytes(b'Unchanged source placeholder, not output media')
    green.write(batch/'queue-status.json', {'status': 'completed_with_issues', 'items': {sid: {'status': 'review'}}})
    green.write(fr/'met-0-2.json', [{'f': i, 't': i/30} for i in range(2)])
    image = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((20, 20, 236, 236), fill=(100, 105, 115, 255))
    draw.rectangle((50, 50, 130, 130), fill=(10, 205, 245, 255))
    draw.rectangle((140, 50, 210, 130), fill=(66, 189, 15, 255))  # B shade=[.26,.74,.06]
    draw.rectangle((15, 15, 19, 236), fill=(100, 105, 115, 128))
    image.save(fr/'m-0000.png')
    if complete:
        image.save(fr/'m-0001.png')
    return sid


class GreenExportTests(unittest.TestCase):
    def test_half_pixel_placement_matches_original_python_compositor(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'half-pixel.png'
            Image.new('RGBA', (2, 2), (80, 120, 160, 128)).save(path)
            placed = green.placed_rgba(path, {'s': 1, 'ox': .5, 'oy': 1.5})
            self.assertEqual(placed.getpixel((0, 2)), (80, 120, 160, 128))
            self.assertEqual(placed.getpixel((2, 2)), (0, 0, 0, 0))

    def test_paste_keeps_straight_alpha_once(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'edge.png'
            Image.new('RGBA', (2, 2), (100, 150, 200, 128)).save(path)
            placed = green.placed_rgba(path, {'s': 1, 'ox': 5, 'oy': 6})
            self.assertEqual(placed.getpixel((5, 6)), (100, 150, 200, 128))
            self.assertEqual(placed.getpixel((0, 0)), (0, 0, 0, 0))

    def test_negative_offset_clips_without_mask_or_color_change(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'clip.png'
            Image.new('RGBA', (3, 3), (5, 200, 245, 192)).save(path)
            placed = green.placed_rgba(path, {'s': 1, 'ox': -1, 'oy': -1})
            self.assertEqual(placed.getpixel((0, 0)), (5, 200, 245, 192))
            self.assertEqual(placed.getpixel((2, 2)), (0, 0, 0, 0))

    def test_flattened_rgb_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'rgb.png'
            Image.new('RGB', (3, 3)).save(path)
            with self.assertRaisesRegex(ValueError, 'actual RGBA'):
                green.placed_rgba(path, {'s': 1, 'ox': 0, 'oy': 0})

    def test_missing_raw_frame_cannot_publish_partial_clip(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixture(batch, complete=False)
            with self.assertRaises(green.IncompleteSource), patch.object(green, 'encode') as encode:
                green.export_job(batch, sid)
            encode.assert_not_called()
            self.assertFalse((batch/'greenscreen').exists())

    def test_low_fps_source_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixture(batch)
            spec_path = batch/'work'/(sid+'.spec.json')
            spec = green.read(spec_path)
            spec['fps'] = 15
            green.write(spec_path, spec)
            with self.assertRaisesRegex(ValueError, 'true 30fps'):
                green.source_job(batch, sid)

    def test_green_primary_source_requires_no_dark_master_or_finished_queue(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixture(batch)
            (batch/'master'/(sid+'.mp4')).unlink()
            green.write(batch/'queue-status.json', {'status': 'running', 'items': {sid: {'status': 'rendering'}}})
            job = green.source_job(batch, sid)
            self.assertEqual(job['count'], 2)
            self.assertEqual(job['qa_status'], 'review')
            self.assertNotIn(f'master/{sid}.mp4', job['inputs'])

    def test_failed_encode_preserves_old_output_and_has_no_result(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixture(batch)
            old = batch/'greenscreen/media/master'/(sid+'-greenscreen.mp4')
            old.parent.mkdir(parents=True)
            old.write_bytes(b'preserve-old-product')
            with patch.object(green, 'encode', side_effect=RuntimeError('codec failed')):
                with self.assertRaisesRegex(RuntimeError, 'codec failed'):
                    green.export_job(batch, sid)
            self.assertEqual(old.read_bytes(), b'preserve-old-product')
            self.assertFalse((batch/'greenscreen/jobs'/sid/'result.json').exists())

    def test_green_shade_and_cyan_survive_fixed_key(self):
        colors = np.array([[[66, 189, 15], [10, 205, 245]]], dtype=np.uint8)
        self.assertTrue(np.all(green.key_matte(colors) == 1))

    def test_actual_cpu_export_inherits_review_and_verifies_skip(self):
        with tempfile.TemporaryDirectory() as directory:
            batch = Path(directory)
            sid = fixture(batch)
            result = green.export_job(batch, sid, keep_alpha=True)
            self.assertEqual(result['inherited_source_qa_status'], 'review')
            self.assertTrue(result['composition_qa_pass'])
            self.assertFalse(result['all_posture_qa_passed'])
            self.assertFalse(result['app_replaced'])
            self.assertEqual(result['frames'], 2)
            self.assertEqual(len([key for key in result['outputs'] if key.startswith('alpha_')]), 2)
            for sample in result['temporal_samples']:
                self.assertGreater(sample['cyan_pixels'], 100)
                self.assertEqual(sample['cyan_key_matte_min'], 1)
                self.assertEqual(sample['opaque_pixels_retained_by_ordinary_key_fraction'], 1)
            again = green.export_job(batch, sid, keep_alpha=True)
            self.assertEqual(again['outputs'], result['outputs'])
            # A corrupted old product is rejected, never silently replaced.
            master = batch/'greenscreen'/result['outputs']['master']['path']
            master.write_bytes(b'corrupted')
            with self.assertRaisesRegex(ValueError, 'Existing output changed'):
                green.export_job(batch, sid, keep_alpha=True)
            self.assertEqual(master.read_bytes(), b'corrupted')


if __name__ == '__main__':
    unittest.main()
