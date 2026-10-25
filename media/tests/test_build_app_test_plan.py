"""Scope regressions: a complete old video must not replace a newer pending spec."""
import sys
import hashlib
import json
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import build_app_test_plan as builder


class LatestSelectionTest(unittest.TestCase):
    def existing(self):
        return [f'base-{i}' for i in range(186)] + sorted(builder.OVERLAPS)

    def test_pending_overrides_remove_three_complete_old_deliverables(self):
        ready, eligible, overrides = builder.selection(self.existing())
        self.assertEqual((len(ready), len(eligible), len(overrides)), (186, 212, 26))
        self.assertFalse(builder.OVERLAPS & set(ready))
        self.assertTrue(builder.OVERLAPS <= set(eligible))
        self.assertEqual(overrides['o-seated-sidebend'], 'o-seated-sidebend-rr2')
        self.assertEqual(overrides['h-kneeling-thread-needle'], 'h-kneeling-thread-needle-rr1')

    def test_reject_new_overlap_instead_of_silently_dropping_an_action(self):
        existing = self.existing()
        existing[0] = 'h-goblet-squat'
        with self.assertRaisesRegex(ValueError, 'Unexpected PR15/base overlap'):
            builder.selection(existing)

    def test_reject_duplicate_base_ids(self):
        existing = self.existing()
        existing[1] = existing[0]
        with self.assertRaisesRegex(ValueError, '189 unique'):
            builder.selection(existing)

    def test_no_automatic_latest_guessing_or_failed_pelvic_tilt(self):
        self.assertEqual(len(builder.FULL), 7)
        self.assertEqual(len(builder.SPARSE), 19)
        self.assertNotIn('h-pelvic-tilt', builder.FULL + builder.SPARSE)
        self.assertNotIn('h-chair-single-leg-hip-thrust-rr7', builder.FULL + builder.SPARSE)
        with self.assertRaisesRegex(ValueError, 'outside the explicit'):
            builder.family('h-chair-single-leg-hip-thrust-rr9')

    def test_generated_catalog_preserves_pending_sources_and_timing(self):
        repo = Path(__file__).resolve().parents[2]
        catalog = json.loads((repo / 'catalog/test/app-test-pack-r1.json').read_text(encoding='utf-8'))
        rows = {r['id']: r for r in catalog['actions']}
        self.assertEqual(len(rows), len(catalog['actions']))
        self.assertEqual(len(rows), 219)
        self.assertEqual(len({r['family'] for r in rows.values()}), 219)
        pending = [r for r in rows.values() if r['state'] == 'pending-latest-transparent-full-layers']
        self.assertEqual(len(pending), 33)
        for item in rows.values():
            self.assertIs(item['reviewed'], False)
            self.assertIs(item['releaseEligible'], False)
        for item in pending:
            source = item['source']['spec']
            self.assertEqual(hashlib.sha256((repo / source['path']).read_bytes()).hexdigest(), source['sha256'])
        for action in builder.OVERLAPS:
            self.assertEqual(rows[action]['state'], 'pending-latest-transparent-full-layers')
        for action in ('h-forward-lunge', 'h-lateral-step-lunge'):
            self.assertEqual(rows[action]['rhythm']['durationSeconds'], 10)
        self.assertIn('低位', rows['h-kneeling-thread-needle']['nameZh'])
        original = json.loads((repo / 'catalog/catalog.json').read_text(encoding='utf-8'))
        semantic = {r['id']: r for r in original['drills']}
        self.assertEqual(rows['glute-max-A']['rhythm']['execution'], semantic['glute-max-A']['rhythm'])
        self.assertEqual((rows['h-band-chest-fly']['rhythm']['execution'],
                          rows['h-band-chest-fly']['rhythm']['executionStatus']), (None, 'unknown-unreviewed'))


if __name__ == '__main__':
    unittest.main()
