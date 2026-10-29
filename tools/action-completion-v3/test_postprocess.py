import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from PIL import Image, ImageDraw

SPEC = importlib.util.spec_from_file_location('completion_postprocess', Path(__file__).with_name('postprocess.py'))
post = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(post)


class PreviewQaTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self):
        self.temporary.cleanup()

    def capture(self, boxes=None, mode='preview', size=240):
        boxes = boxes or [(0, 'main', (60, 70, 160, 180)),
                          (1, 'main', (70, 80, 170, 190)),
                          (2, 'main', (5, 5, 230, 230)),
                          (0, 'side', (5, 5, 230, 230))]
        source = self.root / 'capture'
        source.mkdir()
        rows = []
        for index, (frame, view, box) in enumerate(boxes):
            file = source / f'{index}.png'
            with Image.new('RGBA', (size, size)) as image:
                if box:
                    ImageDraw.Draw(image).rectangle(box, fill=(200, 90, 35, 255))
                image.save(file)
            rows.append({'frame': frame, 'view': view, **post.reference(file, source)})
        value = {'format': post.CAPTURE_FORMAT, 'specId': 'synthetic-test', 'complete': True,
                 'groundShadow': False, 'cameraMotion': False, 'mode': mode, 'size': size,
                 'plan': {'fps': 30, 'frameCount': 2, 'durationSeconds': 2 / 30,
                          'previewFrames': [0, 1, 2]}, 'images': rows}
        file = source / 'capture.json'
        file.write_text(json.dumps(value), encoding='utf8')
        return file

    def test_main_rect_excludes_alternate_views_and_endpoint(self):
        capture = self.capture()
        result = post.preview_qa(capture, self.root / 'qa')
        self.assertTrue(result['passed'])
        self.assertEqual(result['mainContentRect'], [60, 70, 171, 191])
        self.assertEqual(result['byView'], {'main': 3, 'side': 1})
        self.assertFalse(result['mainRectIsFullCycle'])
        self.assertFalse(result['reviewed'])
        with Image.open(self.root / 'qa/contact-sheet.png') as image:
            self.assertEqual(image.format, 'PNG')
            self.assertEqual(image.width, 960)
        self.assertEqual(len(result['contactSheetFrames']), 4)

    def test_empty_or_edge_frame_fails_with_report(self):
        capture = self.capture([(0, 'main', None), (1, 'main', (0, 30, 100, 130)),
                                (2, 'main', (20, 30, 100, 130))])
        result = post.preview_qa(capture, self.root / 'qa')
        self.assertFalse(result['passed'])
        self.assertEqual(len(result['emptyFrames']), 1)
        self.assertEqual(len(result['sourceEdgeFrames']), 1)
        self.assertTrue((self.root / 'qa/qa.json').is_file())

    def test_changed_png_is_rejected(self):
        capture = self.capture()
        with (capture.parent / '0.png').open('ab') as stream:
            stream.write(b'tampered')
        result = post.preview_qa(capture, self.root / 'qa')
        self.assertFalse(result['passed'])
        self.assertIn('byte length changed', result['error'])

    def test_alpha_channel_and_full_coverage_are_required(self):
        capture = self.capture(mode='full')
        value = post.read_json(capture)
        value['images'] = [row for row in value['images'] if row['frame'] != 1]
        capture.write_text(json.dumps(value), encoding='utf8')
        result = post.preview_qa(capture, self.root / 'qa')
        self.assertFalse(result['passed'])
        self.assertIn('0..N-1', result['error'])

    def test_existing_output_and_path_escape_are_rejected(self):
        capture = self.capture()
        output = self.root / 'occupied'
        output.mkdir()
        with self.assertRaises(FileExistsError):
            post.preview_qa(capture, output)
        value = post.read_json(capture)
        value['images'][0]['path'] = '../outside.png'
        capture.write_text(json.dumps(value), encoding='utf8')
        result = post.preview_qa(capture, self.root / 'qa')
        self.assertFalse(result['passed'])
        self.assertIn('escapes', result['error'])

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg/ffprobe unavailable')
    def test_real_short_video_export_and_lossless_stills(self):
        capture = self.capture(mode='full')
        result = post.export_capture(capture, self.root / 'export', preset='veryfast')
        self.assertTrue(result['passed'], result.get('error'))
        self.assertEqual(result['files']['video']['frames'], 2)
        self.assertEqual(result['files']['video']['width'], 720)
        self.assertEqual(result['files']['video']['height'], 1440)
        self.assertEqual(result['coverFrame'], 1)
        self.assertFalse(result['encoding']['strictLossless'])
        self.assertFalse(result['reviewed'])
        self.assertFalse(result['releaseEligible'])
        self.assertTrue(result['files']['cover']['losslessRgbaVerified'])
        self.assertTrue(result['files']['thumbnail']['losslessRgbaVerified'])
        self.assertGreaterEqual(min(result['files']['thumbnail']['marginsPx']), 10)
        check = post.read_json(self.root / 'export/qa/decode-check.json')
        self.assertEqual(check['framesDecoded'], 2)
        self.assertGreater(check['statistics']['foregroundRgb']['samples'], 0)

    @unittest.skipUnless(shutil.which('ffmpeg'), 'FFmpeg unavailable')
    def test_corrupt_foreground_in_real_encoded_video_is_rejected(self):
        capture = self.capture([(0, 'main', (100, 20, 102, 200)),
                                (1, 'main', (100, 20, 102, 200)),
                                (2, 'main', (100, 20, 102, 200))], mode='full')
        context = post.load_capture(capture, require_full=True)
        _, union = post.scan_images(context)
        framing = post.fixed_framing(union, 240)
        bad_video = self.root / 'bad.mp4'
        with (self.root / 'bad-encoder.log').open('wb') as log:
            process = subprocess.Popen(post.encoder_command(bad_video, 30, preset='veryfast'),
                                       stdin=subprocess.PIPE, stderr=log,
                                       creationflags=post.WINDOWS_HIDDEN)
            for row in context['main']:
                with post.resized_rgba(context, row, framing) as image:
                    packed = post.pack_frame(image)
                    packed[:720] = 0
                    process.stdin.write(packed.tobytes())
            process.stdin.close()
            self.assertEqual(process.wait(), 0)
        qa = self.root / 'bad-qa'; qa.mkdir()
        check = post.decode_check(context, bad_video, framing, qa)
        self.assertFalse(check['passed'])
        self.assertGreater(check['statistics']['foregroundRgb']['mae'], 30)

    def test_export_refuses_preview_and_clipped_capture(self):
        capture = self.capture()
        result = post.export_capture(capture, self.root / 'export')
        self.assertFalse(result['passed'])
        self.assertIn('full capture', result['error'])


if __name__ == '__main__':
    unittest.main()
