import argparse
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

from catalog_pointer import default_published_at, published_at, validate_catalog_pointer


BAD_PUBLICATION_TIME = "Sat 2026-11-07 12:45 AM CST (UTC+08:00)"


def pointer():
    return {
        "schema": 1,
        "pack": "r2-v7",
        "catalog": "https://media.uuugk.win/pack/r2-v7/catalog.json",
        "catalog_sha256": "a" * 64,
        "catalog_bytes": 4150804,
        "min_sdk": "0.8.0",
        "published_at": "2026-11-07T10:45:00+08:00",
    }


class CatalogPointerTest(unittest.TestCase):
    def test_iso_publication_times_with_timezone_are_accepted(self):
        for value in (
            "2026-11-07T10:45:00+08:00",
            "2026-11-07T02:45:00Z",
            "2026-11-07T02:45:00.123-05:30",
        ):
            with self.subTest(value=value):
                self.assertEqual(published_at(value), value)

    def test_invalid_or_timezone_less_publication_times_are_rejected(self):
        for value in (
            BAD_PUBLICATION_TIME,
            "2026-11-07T10:45:00",
            "2026-11-07",
            "2026-02-30T10:45:00+08:00",
            "2026-11-07T10:45:00+08:99",
            "2026-11-07T10:45:00+25:00",
            "",
            None,
        ):
            with self.subTest(value=value):
                with self.assertRaises(argparse.ArgumentTypeError):
                    published_at(value)

    def test_default_is_cst_iso_timestamp_at_second_precision(self):
        value = default_published_at()
        self.assertEqual(published_at(value), value)
        parsed = datetime.fromisoformat(value)
        self.assertEqual(parsed.utcoffset(), timedelta(hours=8))
        self.assertEqual(parsed.microsecond, 0)

    def test_valid_pointer_passes_sdk_field_checks(self):
        validate_catalog_pointer(pointer())

    def test_pointer_required_fields_stay_strict(self):
        for field, value in (
            ("schema", 2),
            ("schema", True),
            ("pack", "../r2-v7"),
            ("pack", "a" * 65),
            ("catalog", "http://media.uuugk.win/catalog.json"),
            ("catalog", "https:///catalog.json"),
            ("catalog", "https://media.uuugk.win/catalog.txt"),
            ("catalog_sha256", "A" * 64),
            ("catalog_bytes", 0),
            ("catalog_bytes", 64 * 1024 * 1024 + 1),
            ("catalog_bytes", True),
            ("min_sdk", "0.8"),
        ):
            with self.subTest(field=field, value=value):
                with self.assertRaises(ValueError):
                    validate_catalog_pointer({**pointer(), field: value})
        for field in pointer():
            with self.subTest(missing=field):
                invalid = pointer()
                del invalid[field]
                with self.assertRaises((ValueError, argparse.ArgumentTypeError)):
                    validate_catalog_pointer(invalid)

    def test_pointer_self_check_rejects_bad_publication_time(self):
        with self.assertRaises(argparse.ArgumentTypeError):
            validate_catalog_pointer({**pointer(), "published_at": BAD_PUBLICATION_TIME})

    def test_both_builders_reject_bad_cli_time_before_reading_or_writing(self):
        script_dir = Path(__file__).resolve().parent
        for name in ("build_r2_v6.py", "build_r2_v7.py"):
            with self.subTest(builder=name), tempfile.TemporaryDirectory() as work:
                out = Path(work) / "out"
                result = subprocess.run(
                    [
                        sys.executable,
                        str(script_dir / name),
                        "--out", str(out),
                        "--source-commit", "a" * 40,
                        "--media-root", str(Path(work) / "media"),
                        "--published-at", BAD_PUBLICATION_TIME,
                    ],
                    cwd=work,
                    capture_output=True,
                    text=True,
                )
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("ISO-8601 with a time zone", result.stderr)
                self.assertNotIn("FileNotFoundError", result.stderr)
                self.assertFalse(out.exists())


if __name__ == "__main__":
    unittest.main()
