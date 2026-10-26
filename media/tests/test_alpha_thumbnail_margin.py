from pathlib import Path
import sys
import unittest
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import export_stacked_alpha as exporter


class ThumbnailMarginTests(unittest.TestCase):
    def test_lanczos_nine_pixel_margin_is_padded_without_clipping_the_cover(self):
        image = Image.new('RGBA', (720, 720))
        ImageDraw.Draw(image).rectangle((33, 33, 686, 686), fill=(150, 90, 70, 255))
        old = image.convert('RGBa').resize((240, 240), Image.Resampling.LANCZOS).convert('RGBA')
        self.assertLess(exporter.alpha_margin_pixels(old), 10)
        result = exporter.alpha_thumbnail(image)
        self.assertEqual(result.size, (240, 240))
        self.assertEqual(result.getchannel('A').getextrema(), (0, 255))
        self.assertGreaterEqual(exporter.alpha_margin_pixels(result), 10)
        self.assertEqual(image.getchannel('A').getbbox(), (33, 33, 687, 687))

    def test_already_safe_thumbnail_keeps_its_exact_pixels(self):
        image = Image.new('RGBA', (720, 720))
        ImageDraw.Draw(image).rectangle((80, 80, 639, 639), fill=(100, 40, 20, 255))
        old = image.convert('RGBa').resize((240, 240), Image.Resampling.LANCZOS).convert('RGBA')
        self.assertEqual(exporter.alpha_thumbnail(image).tobytes(), old.tobytes())


if __name__ == '__main__':
    unittest.main()
