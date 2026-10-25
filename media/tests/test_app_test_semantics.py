"""Prescription uncertainty and live definition updates must not alter media."""
import copy
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import app_test_semantics as semantics
import run_app_test_exports as queue


class SemanticsTests(unittest.TestCase):
    def fixture(self, root):
        (root / 'catalog/test').mkdir(parents=True)
        (root / 'drill-anim/specs').mkdir(parents=True)
        (root / 'drill-anim/specs/hold.js').write_text('// Static straight-arm hold.\n', encoding='utf-8')
        definition = {'id': 'old', 'category': 'strength', 'level': 1, 'position': 'standing',
                      'unilateral': False, 'scenes': ['home'], 'cues': {'zh': ['控制下降']},
                      'defaultDose': {'mode': 'reps', 'sets': 2, 'reps': 6, 'restSeconds': 20}}
        source = root / 'catalog/catalog.json'
        semantics.write_atomic(source, {'drills': [definition]})
        semantics.write_atomic(root / 'catalog/taxonomy.json', {'equipment': {'pullup-bar': {'zh': '单杠'}}})
        rows = [{'id': aid, 'revision': aid, 'equipment': ['pullupBar'],
                 'source': {'spec': {'path': 'drill-anim/specs/hold.js'}},
                 'rhythm': {'durationSeconds': 8}, 'state': 'queued',
                 'reviewed': False, 'releaseEligible': False}
                for aid in ('old', 'h-straight-arm-hang-native')]
        base = {'id': 'test', 'actions': rows,
                'semanticCatalog': {'path': 'catalog/catalog.json', **semantics.fingerprint(source)}}
        draft = {'id': 'h-straight-arm-hang-native', 'revision': 'h-straight-arm-hang-native',
                 'category': 'strength', 'level': None, 'position': 'hanging',
                 'unilateral': False, 'scenes': ['gym'], 'equipment': ['pullup-bar'],
                 'cues': {'zh': ['双手握杠，手臂保持伸直']},
                 'defaultDose': {'mode': 'time', 'sets': None, 'seconds': None, 'restSeconds': None},
                 'doseRange': {}, 'unknownFields': [],
                 'evidence': [{'path': 'drill-anim/specs/hold.js', 'fields': ['defaultDose.mode', 'cues.zh'],
                               'note': 'Static hold; no numerical training prescription.'}]}
        batch = {'format': 'pose-hub-test-semantics@1', 'batchId': 'latest-r1',
                 'reviewed': False, 'releaseEligible': False, 'actions': [draft]}
        semantics.write_atomic(root / 'catalog/test/semantics-latest-r1.json', batch)
        return base, draft, batch

    def test_static_hold_keeps_unknown_seconds_and_is_not_plannable(self):
        with tempfile.TemporaryDirectory() as directory:
            base, _, _ = self.fixture(Path(directory))
            result = semantics.enrich(base, directory)
            old, hold = result['actions']
            self.assertTrue(old['trainingDefinitionComplete'])
            self.assertFalse(hold['trainingDefinitionComplete'])
            self.assertIsNone(hold['defaultDose']['seconds'])
            self.assertNotIn('reps', hold['defaultDose'])
            self.assertIn('defaultDose.seconds', hold['trainingSemantics']['missingRequiredFields'])
            self.assertIn('level', hold['trainingSemantics']['missingRequiredFields'])
            self.assertEqual(hold['rhythm']['durationSeconds'], 8)
            self.assertEqual(hold['equipment'], ['pullup-bar'])
            self.assertEqual(hold['renderPropTypes'], ['pullupBar'])
            self.assertEqual(result, semantics.enrich(result, directory))
            semantics.validate_semantics_refresh(base, result)

    def test_reject_invented_numerical_dose_and_static_reps(self):
        with tempfile.TemporaryDirectory() as directory:
            base, draft, _ = self.fixture(Path(directory))
            draft['defaultDose']['seconds'] = 8
            with self.assertRaisesRegex(ValueError, 'Numeric dose lacks'):
                semantics.validate_draft(draft, base['actions'][1])
            draft['defaultDose'] = {'mode': 'reps', 'reps': None}
            with self.assertRaisesRegex(ValueError, 'Static hold cannot'):
                semantics.validate_draft(draft, base['actions'][1])

    def test_live_refresh_rejects_revision_timing_and_approval_changes(self):
        with tempfile.TemporaryDirectory() as directory:
            base, _, _ = self.fixture(Path(directory))
            enriched = semantics.enrich(base, directory)
            for field, value in [('revision', 'different'), ('rhythm', {'durationSeconds': 30}),
                                 ('reviewed', True)]:
                changed = copy.deepcopy(enriched)
                changed['actions'][1][field] = value
                with self.assertRaises(ValueError):
                    semantics.validate_semantics_refresh(base, changed)

    def test_queue_hot_reload_reuses_media_and_rejects_invalid_update(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            base, _, _ = self.fixture(root)
            path = root / 'catalog/test/app-test-pack-r1.json'
            semantics.write_atomic(path, base)
            output = root / 'output'; output.mkdir()
            assembler = queue.Assembler(output, root / 'work', path, {}, 'same-exporter', [])
            assembler.ready = {'old': {'mediaIdentity': 'unchanged'}}
            after = semantics.enrich(base, root)
            semantics.write_atomic(path, after)
            assembler.refresh_catalog()
            self.assertEqual(assembler.ready, {'old': {'mediaIdentity': 'unchanged'}})
            self.assertEqual(assembler.catalog_sha, hashlib.sha256(path.read_bytes()).hexdigest())
            after['actions'][0]['source']['spec']['path'] = 'different.js'
            semantics.write_atomic(path, after)
            assembler.refresh_catalog()
            self.assertIn('rendering/source identity', assembler.semantic_refresh_error)
            self.assertNotEqual(assembler.catalog, after)

    def test_draft_revision_and_source_checksum_are_bound(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            base, _, batch = self.fixture(root)
            batch['actions'][0]['revision'] = 'old-revision'
            semantics.write_atomic(root / 'catalog/test/semantics-latest-r1.json', batch)
            with self.assertRaisesRegex(ValueError, 'revision mismatch'):
                semantics.enrich(base, root)
            base['semanticCatalog']['sha256'] = '0' * 64
            with self.assertRaisesRegex(ValueError, 'Pinned 142-action'):
                semantics.enrich(base, root)

    def test_evidence_hash_change_is_rejected_not_silently_refingerprinted(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            base, _, batch = self.fixture(root)
            source = root / 'drill-anim/specs/hold.js'
            batch['actions'][0]['evidence'][0].update(semantics.fingerprint(source))
            semantics.write_atomic(root / 'catalog/test/semantics-latest-r1.json', batch)
            source.write_text('// Changed source, old draft.\n', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Semantic evidence changed'):
                semantics.enrich(base, root)

    def test_delivered_old_batch_stays_valid_while_next_draft_is_edited(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            base, _, _ = self.fixture(root)
            enriched = semantics.enrich(base, root)
            path = root / 'catalog/test/app-test-pack-r1.json'
            semantics.write_atomic(path, enriched)
            output = root / 'output'; output.mkdir()
            assembler = queue.Assembler(output, root / 'work', path, {}, 'same-exporter', [])
            with patch.object(queue, '__file__', str(root / 'media/tools/run_app_test_exports.py')):
                first, _ = assembler.delivered_semantics()
                (root / 'catalog/test/semantics-latest-r1.json').write_text('unfinished new draft', encoding='utf-8')
                second, _ = assembler.delivered_semantics()
            self.assertEqual(first, second)
            self.assertTrue((output / 'catalog/catalog.json').exists())

    def test_completed_export_worker_process_exits_before_next_job(self):
        with queue.ActionProcessPool(1) as pool:
            self.assertIsNone(pool.executor)
            child_pid = pool.submit(os.getpid).result(timeout=15)
            self.assertTrue(queue.pid_alive(child_pid))
            pool.release_idle()
            self.assertIsNone(pool.executor)
            self.assertFalse(queue.pid_alive(child_pid))
            next_pid = pool.submit(os.getpid).result(timeout=15)
        self.assertFalse(queue.pid_alive(next_pid))


if __name__ == '__main__':
    unittest.main()
