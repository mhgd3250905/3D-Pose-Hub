"""Exact source-byte compatibility only; no capture, renderer or codec is run."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from prepare_captured_alpha import PlanError, digest, verify_spec_reference


class SpecReferenceTest(unittest.TestCase):
    raw = b"export default {\r\n  id: 'sample-r1',\r\n};\r\n"
    lf = raw.replace(b"\r\n", b"\n")

    def test_exact_raw_hash_validates_raw_length_and_retains_both_hashes(self):
        ref = {"sha256": digest(self.raw), "bytes": len(self.raw), "lfSha256": digest(self.lf)}
        self.assertEqual(verify_spec_reference(self.raw, ref), (digest(self.raw), digest(self.lf)))
        with self.assertRaisesRegex(PlanError, "matched-form byte length"):
            verify_spec_reference(self.raw, {**ref, "bytes": len(self.lf)})
        with self.assertRaisesRegex(PlanError, "Original spec LF SHA"):
            verify_spec_reference(self.raw, {**ref, "lfSha256": "f" * 64})

    def test_lf_equivalent_hash_validates_lf_length_and_retains_real_raw_hash(self):
        ref = {"sha256": digest(self.lf), "bytes": len(self.lf), "lfSha256": digest(self.lf)}
        result = verify_spec_reference(self.raw, ref)
        self.assertEqual(result, (digest(self.raw), digest(self.lf)))
        self.assertNotEqual(result[0], result[1])
        self.assertEqual(verify_spec_reference(self.raw, {"sha256": digest(self.lf)}), result)
        with self.assertRaisesRegex(PlanError, "matched-form byte length"):
            verify_spec_reference(self.raw, {**ref, "bytes": len(self.raw)})

    def test_substantive_edit_and_other_normalizations_are_rejected(self):
        ref = {"sha256": digest(self.lf), "bytes": len(self.lf)}
        for edited in (self.raw.replace(b"sample-r1", b"sample-r2"),
                       self.raw.replace(b"  id:", b"   id:"),
                       self.raw.replace(b"\r\n", b"\r"), b"\xef\xbb\xbf" + self.raw):
            with self.subTest(edited=edited), self.assertRaisesRegex(PlanError, "raw or LF SHA"):
                verify_spec_reference(edited, ref)


if __name__ == "__main__":
    unittest.main()
