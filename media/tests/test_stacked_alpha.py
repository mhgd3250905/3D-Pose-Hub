"""Contract and two-frame codec regressions for the packed-alpha exporter.

All fixtures live in the system temporary directory. No source media or 3D
renderer is used. The real codec test requires FFmpeg with libx264.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import export_stacked_alpha as exporter


class TemporaryCase(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="posehub-alpha-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)


class SourceContractTest(TemporaryCase):
    def test_safe_paths_reject_traversal_absolute_and_windows_aliases(self):
        for value in ("../frame.png", "/frame.png", "C:/frame.png", "x\\frame.png",
                      "x//frame.png", "./frame.png", "x/../frame.png", "x:stream", ""):
            with self.subTest(value=value), self.assertRaises(ValueError):
                exporter.safe_path(self.root, value)
        self.assertEqual(exporter.safe_path(self.root, "layers/body.png"),
                         self.root / "layers/body.png")

    def test_symlink_escape_cannot_read_outside_binding(self):
        outside = self.root.parent / (self.root.name + "-outside")
        outside.mkdir()
        self.addCleanup(shutil.rmtree, outside)
        (outside / "frame.png").write_bytes(b"private source")
        try:
            (self.root / "link").symlink_to(outside, target_is_directory=True)
        except OSError as error:
            self.skipTest(f"Host does not permit creating test symlinks: {error}")
        with self.assertRaises(ValueError):
            exporter.safe_path(self.root, "link/frame.png")

    def test_pinned_file_rejects_same_size_content_replacement(self):
        path = self.root / "body.png"
        path.write_bytes(b"original")
        reference = exporter.file_ref(self.root, path)
        self.assertEqual(exporter.verify_ref(self.root, reference), path)
        path.write_bytes(b"replaced")
        with self.assertRaisesRegex(ValueError, "SHA/bytes mismatch"):
            exporter.verify_ref(self.root, reference)

    def test_json_rejects_duplicate_keys(self):
        path = self.root / "ambiguous.json"
        path.write_text('{"frames":2,"frames":240}', encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Duplicate JSON key"):
            exporter.read_json(path)

    def test_existing_output_refused_before_source_loading(self):
        output = self.root / "preserved"
        output.mkdir()
        sentinel = output / "original.txt"
        sentinel.write_bytes(b"preserve me")
        with self.assertRaises(FileExistsError):
            exporter.run(self.root / "missing-plan.json", {}, output)
        self.assertEqual(sentinel.read_bytes(), b"preserve me")
        self.assertEqual(list(output.iterdir()), [sentinel])

    def write_fixture(self, name, data):
        path = self.root / name
        if not isinstance(data, bytes):
            data = json.dumps(data).encode("utf-8")
        path.write_bytes(data)
        return {"root": "fixture", **exporter.file_ref(self.root, path)}

    def make_plan(self):
        # load_actions validates references without decoding PNGs. Real image
        # composition and video decoding are exercised in separate tests below.
        frame_refs = [dict(frame=n, **self.write_fixture(f"frame-{n}.png", b"frame " + bytes([n])))
                      for n in range(2)]
        indices = {name: self.write_fixture(name + ".json", {"frames": frame_refs})
                   for name in ("body", "highlight", "shadow")}
        layer = {"format": "pose-hub-layer-render@2", "complete": True,
                 "diagnosticOnly": False, "actionId": "fixture-action", "skin": "realistic",
                 "alphaMode": "straight", "frameCount": 2, "fps": 30,
                 "durationSeconds": 2 / 30, "sequences": indices,
                 "sourceSha256": {"fixture": "read-only"}}
        layer_ref = self.write_fixture("layer.json", layer)
        framing = {"preview": False, "sourceSize": [1080, 1080], "crop": [0, 0, 1080, 1080]}
        framing_ref = self.write_fixture("framing.json", framing)
        highlight = {"enabled": False, "color": "#ff4000", "brightness": 0.4}
        baseline = self.write_fixture("baseline.mp4", b"probe isolated in source-contract tests")
        derivatives = {"variants": [
            {"actionId": "fixture-action", "skin": "realistic", "theme": theme,
             "video": {"sha256": baseline["sha256"]}, "framing": framing_ref,
             "highlight": highlight, "keyframes": [{"phase": "peak", "asset": {"frame": 1}}]}
            for theme in ("dark", "light")]}
        derivative_ref = self.write_fixture("derivatives.json", derivatives)
        action = {"id": "fixture-action", "nameZh": "Fixture", "sourceRoot": "fixture",
                  "frames": 2, "fps": 30, "durationSeconds": 2 / 30, "coverFrame": 1,
                  "coverSize": [720, 720], "thumbnailSize": [240, 240], "highlight": highlight,
                  "layerManifest": layer_ref, "framing": framing_ref,
                  "derivativeManifest": derivative_ref,
                  "baselineVideos": {"dark": baseline, "light": baseline}}
        plan = {"format": "pose-hub-stacked-alpha-plan@1", "bindings": {}, "skin": "realistic",
                "sourceMediaVersion": "0.3.0", "consumer": {"eligibleActionIds": [action["id"]]},
                "actions": [action]}
        stream = {"codec_name": "h264", "width": 720, "height": 720,
                  "nb_read_frames": "2", "r_frame_rate": "30/1", "duration": str(2 / 30)}
        return plan, stream

    def test_plan_binds_full_source_and_rejects_sparse_or_changed_frames(self):
        plan, stream = self.make_plan()
        with mock.patch.object(exporter, "probe", return_value=stream):
            contexts = exporter.load_actions(plan, {"fixture": self.root})
            self.assertEqual(len(contexts), 1)
            self.assertEqual(len(contexts[0]["sequences"]["body"]), 2)
            (self.root / "frame-1.png").write_bytes(b"frame X")
            with self.assertRaisesRegex(ValueError, "SHA/bytes mismatch"):
                exporter.load_actions(plan, {"fixture": self.root})

    def test_sparse_duplicate_or_reordered_sequences_rejected_even_with_valid_hashes(self):
        for kind in ("sparse", "duplicate", "reordered"):
            plan, stream = self.make_plan()
            index_path = self.root / "body.json"
            index = exporter.read_json(index_path)
            frames = index["frames"]
            index["frames"] = (frames[:1] if kind == "sparse" else
                               [frames[0], frames[0]] if kind == "duplicate" else frames[::-1])
            index_path.write_text(json.dumps(index), encoding="utf-8")
            layer_path = self.root / "layer.json"
            layer = exporter.read_json(layer_path)
            layer["sequences"]["body"] = {"root": "fixture", **exporter.file_ref(self.root, index_path)}
            layer_path.write_text(json.dumps(layer), encoding="utf-8")
            plan["actions"][0]["layerManifest"] = {"root": "fixture", **exporter.file_ref(self.root, layer_path)}
            with self.subTest(kind=kind), mock.patch.object(exporter, "probe", return_value=stream):
                with self.assertRaisesRegex(ValueError, "sparse frames"):
                    exporter.load_actions(plan, {"fixture": self.root})

    def test_mismatched_consumer_unknown_ids_and_duplicate_ids_rejected(self):
        plan, _ = self.make_plan()
        variants = []
        other = copy.deepcopy(plan)
        other["consumer"]["eligibleActionIds"] = ["other-action"]
        variants.append((other, None))
        other = copy.deepcopy(plan)
        other["actions"].append(copy.deepcopy(other["actions"][0]))
        variants.append((other, None))
        variants.append((plan, ["unknown-action"]))
        variants.append((plan, ["fixture-action", "fixture-action"]))
        for value, selected in variants:
            with self.subTest(selected=selected), self.assertRaises(ValueError):
                exporter.load_actions(value, {"fixture": self.root}, selected)

    def test_diagnostic_layer_cannot_be_exported_as_full(self):
        plan, stream = self.make_plan()
        path = self.root / "layer.json"
        layer = exporter.read_json(path)
        layer["diagnosticOnly"] = True
        path.write_text(json.dumps(layer), encoding="utf-8")
        plan["actions"][0]["layerManifest"] = {"root": "fixture", **exporter.file_ref(self.root, path)}
        with mock.patch.object(exporter, "probe", return_value=stream):
            with self.assertRaisesRegex(ValueError, "exact full source"):
                exporter.load_actions(plan, {"fixture": self.root})

    def test_cover_frame_must_be_integer_not_float_or_boolean(self):
        plan, stream = self.make_plan()
        for frame in (0.5, True):
            malformed = copy.deepcopy(plan)
            malformed["actions"][0]["coverFrame"] = frame
            # Keep the derivative binding consistent, so strict frame typing is
            # the reason for rejection rather than a different poster choice.
            path = self.root / "derivatives.json"
            derivatives = exporter.read_json(path)
            for row in derivatives["variants"]:
                row["keyframes"][0]["asset"]["frame"] = frame
            path.write_text(json.dumps(derivatives), encoding="utf-8")
            malformed["actions"][0]["derivativeManifest"] = {"root": "fixture", **exporter.file_ref(self.root, path)}
            with self.subTest(frame=frame), mock.patch.object(exporter, "probe", return_value=stream):
                with self.assertRaises(ValueError):
                    exporter.load_actions(malformed, {"fixture": self.root})

    def test_plan_cannot_change_during_export(self):
        plan, _ = self.make_plan()
        path = self.root / "plan.json"
        path.write_text(json.dumps(plan), encoding="utf-8")
        context = {"action": plan["actions"][0]}
        def fake_export(*args):
            changed = copy.deepcopy(plan)
            changed["skin"] = "changed-after-encoding-started"
            path.write_text(json.dumps(changed), encoding="utf-8")
            return {"files": {k: {"bytes": 1} for k in ("video", "cover", "thumbnail")},
                    "sourceVideos": {k: {"bytes": 1} for k in ("dark", "light")}}
        with mock.patch.object(exporter, "load_actions", return_value=[context]), \
             mock.patch.object(exporter, "export_action", side_effect=fake_export):
            with self.assertRaisesRegex(ValueError, "[Pp]lan.*[Cc]hang|[Cc]hang.*[Pp]lan"):
                exporter.run(path, {"fixture": self.root}, self.root / "new-output")


class PixelContractTest(unittest.TestCase):
    def test_source_over_preserves_shadow_and_straight_half_transparent_rgb(self):
        body = Image.new("RGBA", (3, 1), (200, 80, 40, 0))
        body.putpixel((1, 0), (200, 80, 40, 128))
        body.putpixel((2, 0), (200, 80, 40, 128))
        shadow = Image.new("RGBA", (3, 1), (0, 0, 0, 64))
        shadow.putpixel((2, 0), (0, 0, 0, 0))
        mask = Image.new("RGBA", (3, 1), (0, 0, 0, 255))
        result = exporter.compose_rgba(body, mask, shadow,
                                       {"enabled": False, "color": "#ff4000", "brightness": 0.4})
        self.assertEqual(result.getpixel((0, 0)), (0, 0, 0, 64))
        self.assertEqual(result.getpixel((1, 0))[3], 160)
        self.assertEqual(result.getpixel((2, 0)), (200, 80, 40, 128))
        for background in exporter.BACKGROUNDS.values():
            composed = exporter.composite_rgb(np.asarray(result)[..., :3], np.asarray(result)[..., 3], background)
            expected = np.rint(np.array([200, 80, 40]) * (128 / 255) +
                               np.array(background) * (1 - 128 / 255)).astype(np.uint8)
            np.testing.assert_array_equal(composed[0, 2], expected)

    def test_highlight_changes_color_but_not_body_or_shadow_alpha(self):
        body = Image.new("RGBA", (2, 1), (50, 100, 150, 128))
        body.putpixel((0, 0), (50, 100, 150, 0))
        mask = Image.new("RGBA", (2, 1), (255, 255, 255, 255))
        shadow = Image.new("RGBA", (2, 1), (0, 0, 0, 64))
        recipe = {"enabled": True, "color": "#ff0000", "brightness": 0.5}
        result = exporter.compose_rgba(body, mask, shadow, recipe)
        self.assertEqual(result.getpixel((0, 0)), (0, 0, 0, 64))
        self.assertEqual(result.getpixel((1, 0))[3], 160)
        self.assertGreater(result.getpixel((1, 0))[0], result.getpixel((1, 0))[1])

    def test_edge_bleed_only_changes_zero_alpha_rgb_with_bounded_radius(self):
        source = np.zeros((25, 25, 4), dtype=np.uint8)
        source[12, 12] = [230, 90, 30, 128]
        source[12, 13] = [20, 40, 240, 255]
        original = source.copy()
        result = exporter.edge_bleed(Image.fromarray(source), radius=2)
        np.testing.assert_array_equal(source, original)
        np.testing.assert_array_equal(result[source[..., 3] > 0], source[..., :3][source[..., 3] > 0])
        self.assertGreater(int(result[11, 12].sum()), 0)
        np.testing.assert_array_equal(result[0, 0], [0, 0, 0])
        np.testing.assert_array_equal(result[12, 9], [0, 0, 0])

    def test_pack_has_straight_rgb_top_and_identical_gray_alpha_bottom(self):
        source = np.array([[[200, 80, 40, 128], [10, 20, 30, 255]],
                           [[90, 60, 30, 0], [40, 80, 120, 64]]], dtype=np.uint8)
        packed = exporter.pack_frame(Image.fromarray(source), bleed=0)
        self.assertEqual(packed.shape, (4, 2, 3))
        self.assertTrue(packed.flags.c_contiguous)
        np.testing.assert_array_equal(packed[:2], source[..., :3])
        np.testing.assert_array_equal(packed[2:], np.repeat(source[..., 3:4], 3, axis=2))
        np.testing.assert_array_equal(packed[0, 0], [200, 80, 40])


class FramingContractTest(TemporaryCase):
    def context(self, shadow_boxes):
        sequences = {'body': [], 'shadow': []}
        for frame, box in enumerate(shadow_boxes):
            for name, bounds in (('body', (400, 200, 600, 800)), ('shadow', box)):
                path = self.root / f'{name}-{frame}.png'
                with Image.new('RGBA', (1080, 1080)) as image:
                    image.paste((30, 30, 30, 128 if name == 'shadow' else 255), bounds)
                    image.save(path)
                sequences[name].append({'frame': frame, 'path': path.name})
        return {'root': self.root, 'sequences': sequences, 'action': {'frames': len(shadow_boxes)}}

    def test_whole_cycle_shadow_changes_fixed_crop_and_gets_margin(self):
        context = self.context([(500, 750, 850, 900), (500, 750, 1050, 1030)])
        recipe, report = exporter.inspect_framing(context)
        self.assertTrue(report['framingPassed'])
        self.assertEqual(recipe['sourceBounds'], [400, 200, 1050, 1030])
        left, top, right, bottom = recipe['crop']
        self.assertEqual(right - left, bottom - top)
        for gap in (400 - left, 200 - top, right - 1050, bottom - 1030):
            self.assertGreaterEqual(gap / (right - left), .049)

    def test_padding_cannot_certify_shadow_cut_at_source_edge(self):
        recipe, report = exporter.inspect_framing(self.context([(500, 750, 1080, 1080)]))
        self.assertFalse(report['framingPassed'])
        self.assertFalse(report['sourceShadowComplete'])
        self.assertEqual(report['sourceEdgeFrames']['shadow'][0]['frame'], 0)


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg/ffprobe unavailable")
class RealCodecTest(TemporaryCase):
    def test_two_frame_720_stacked_roundtrip_and_encoder_no_clobber(self):
        frames = []
        for color in ((204, 80, 40), (40, 164, 220)):
            rgba = np.zeros((720, 720, 4), dtype=np.uint8)
            rgba[..., :3] = color
            rgba[:240, :, 3] = 0
            rgba[240:480, :, 3] = 128
            rgba[480:, :, 3] = 255
            frames.append(rgba)
        action = {"fps": 30, "frames": 2, "durationSeconds": 2 / 30}
        output = self.root / "two-frames.rgb-alpha.mp4"
        raw = b"".join(exporter.pack_frame(Image.fromarray(frame)).tobytes() for frame in frames)
        encoded = subprocess.run(exporter.encoder_command(output, action, 18), input=raw,
                                 capture_output=True, timeout=40)
        self.assertEqual(encoded.returncode, 0, encoded.stderr.decode(errors="replace"))
        exporter.check_timing(exporter.probe(output), action, packed=True)
        decode = ["ffmpeg", "-v", "error", "-nostdin", "-threads", "1", "-i", str(output),
                  "-vf", "scale=in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24",
                  "-threads", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"]
        decoded = subprocess.run(decode, capture_output=True, timeout=30, check=True)
        pixels = np.frombuffer(decoded.stdout, dtype=np.uint8).reshape(2, 1440, 720, 3)
        for index, source in enumerate(frames):
            color = pixels[index, :720]
            alpha = pixels[index, 720:, :, 0]
            for start, end, expected in ((16, 224, 0), (256, 464, 128), (496, 704, 255)):
                with self.subTest(frame=index, alpha=expected):
                    delta = np.abs(alpha[start:end, 16:704].astype(np.int16) - expected)
                    self.assertLessEqual(float(delta.mean()), 1.5)
                    self.assertLessEqual(int(delta.max()), 3)
            # Includes half-transparent RGB, where an accidental second alpha
            # multiplication creates a large, background-dependent dark fringe.
            interior = np.s_[256:464, 16:704]
            for name, background in exporter.BACKGROUNDS.items():
                actual = exporter.composite_rgb(color, alpha, background)
                expected = exporter.composite_rgb(source[..., :3], source[..., 3], background)
                error = np.abs(actual[interior].astype(np.int16) - expected[interior].astype(np.int16))
                self.assertLessEqual(float(error.mean()), 3, (index, name))
        before = exporter.sha256(output)
        # Use a different input: deterministic re-encoding of identical data
        # could leave the same hash even if overwrite protection were broken.
        repeated = subprocess.run(exporter.encoder_command(output, action, 18), input=bytes(len(raw)),
                                  capture_output=True, timeout=20)
        self.assertIn("already exists", repeated.stderr.decode(errors="replace").lower())
        self.assertEqual(exporter.sha256(output), before)


if __name__ == "__main__":
    unittest.main()
