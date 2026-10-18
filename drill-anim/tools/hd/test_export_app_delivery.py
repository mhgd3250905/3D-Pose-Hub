"""Selection and provenance checks for arbitrary Pose-Hub playback batches."""
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image


SPEC = importlib.util.spec_from_file_location('hub_app_delivery', Path(__file__).with_name('export_app_delivery.py'))
delivery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(delivery)


class DeliverySelectionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.batch = self.root/'primary'
        self.selection = self.root/'selection.json'
        self.make_batch(self.batch, ['equipment-press', 'equipment-row'])

    def make_batch(self, batch, ids):
        delivery.write(batch/'source-manifest.json', {'drills': [{'id': sid} for sid in ids]})
        for sid in ids:
            spec = batch/'work'/(sid+'.spec.json')
            delivery.write(spec, {'id': sid, 'stillAt': 0})
            alpha = batch/'greenscreen/alpha'/sid/'m-0000.png'
            alpha.parent.mkdir(parents=True)
            Image.new('RGBA', (1080, 1080), (60, 90, 110, 255)).save(alpha)
            delivery.write(batch/'greenscreen/jobs'/sid/'result.json', {
                'id': sid, 'status': 'green_media_complete', 'composition_qa_pass': True,
                'inherited_source_qa_status': 'pass', 'inherited_source_qa': {'pass': True},
                'video_validation': {'full_cpu_decode': True}, 'source_commit': 'fixture-commit',
                'frames': 1, 'fps': 30, 'inputs': {'work/'+sid+'.spec.json': delivery.sha(spec)},
                'outputs': {'alpha_0': {'path': 'alpha/'+sid+'/m-0000.png', 'sha256': delivery.sha(alpha)}}})

    def make_app(self, ids):
        app = self.root/'app'
        delivery.write(app/'assets/hip/hip-content.json', {'drills': [{'id': sid} for sid in ids]})
        return app

    def select(self, **kwargs):
        return delivery.select(kwargs.pop('app', None), self.batch, kwargs.pop('overrides', []), self.selection, **kwargs)

    def test_non46_batch_defaults_to_manifest_and_reuses_exact_selection_bytes(self):
        selected = self.select()
        self.assertEqual(selected['expected'], 2)
        self.assertEqual(selected['selected_pass'], 2)
        self.assertEqual(selected['selected_ids'], ['equipment-press', 'equipment-row'])
        before = self.selection.read_bytes()
        self.assertEqual(self.select(), selected)
        self.assertEqual(self.selection.read_bytes(), before)

    def test_explicit_subset_ignores_unselected_results_in_override_batch(self):
        override = self.root/'override'
        self.make_batch(override, ['equipment-press', 'equipment-row'])
        selected = self.select(ids=['equipment-press'], overrides=[override])
        self.assertEqual(selected['expected'], 1)
        self.assertEqual(selected['items'][0]['batch'], str(override))

    def test_app_is_optional_filter_and_old_positional_select_remains_valid(self):
        app = self.make_app(['equipment-row', 'equipment-press'])
        all_selected = delivery.select(app, self.batch, [], self.selection)
        self.assertEqual(all_selected['expected'], 2)
        subset = delivery.select(app, self.batch, [], self.root/'subset.json', ids=['equipment-row'])
        self.assertEqual(subset['selected_ids'], ['equipment-row'])
        with self.assertRaisesRegex(ValueError, 'outside this App'):
            delivery.select(app, self.batch, [], self.root/'bad.json', ids=['unknown-hub-id'])
        self.assertFalse((self.root/'bad.json').exists())

    def test_duplicate_and_unsafe_ids_rejected_before_selection_write(self):
        for ids in (['equipment-row', 'equipment-row'], ['../escape'], ['/absolute'], ['x/y'], []):
            with self.subTest(ids=ids), self.assertRaises(ValueError):
                self.select(ids=ids)
            self.assertFalse(self.selection.exists())
        for ids in (['equipment-row', 'equipment-row'], ['../escape']):
            delivery.write(self.batch/'source-manifest.json', {'drills': [{'id': sid} for sid in ids]})
            with self.subTest(manifest=ids), self.assertRaises(ValueError):
                self.select()

    def test_duplicate_app_ids_and_misnamed_override_result_are_rejected(self):
        app = self.make_app(['equipment-row', 'equipment-row'])
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            self.select(app=app)
        override = self.root/'override'
        self.make_batch(override, ['equipment-row'])
        p = override/'greenscreen/jobs/equipment-row/result.json'
        r = delivery.read(p)
        r['id'] = 'equipment-press'
        delivery.write(p, r)
        with self.assertRaisesRegex(ValueError, 'directory'):
            self.select(overrides=[override])

    def test_review_source_is_rejected_without_publishing_selection(self):
        p = self.batch/'greenscreen/jobs/equipment-row/result.json'
        r = delivery.read(p)
        r['inherited_source_qa_status'] = 'review'
        r['inherited_source_qa']['pass'] = False
        delivery.write(p, r)
        with self.assertRaisesRegex(ValueError, 'incomplete/review'):
            self.select()
        self.assertFalse(self.selection.exists())

    def test_changed_result_spec_or_alpha_cannot_reuse_bound_selection(self):
        self.select()
        original_selection = self.selection.read_bytes()
        paths = [self.batch/'greenscreen/jobs/equipment-row/result.json',
                 self.batch/'work/equipment-row.spec.json',
                 self.batch/'greenscreen/alpha/equipment-row/m-0000.png']
        for path in paths:
            original = path.read_bytes()
            path.write_bytes(original+b' ')
            try:
                with self.subTest(path=path), self.assertRaises(ValueError):
                    self.select()
                self.assertEqual(self.selection.read_bytes(), original_selection)
            finally:
                path.write_bytes(original)

    def test_changed_selection_or_corrupt_expected_count_is_rejected(self):
        self.select()
        original = self.selection.read_bytes()
        with self.assertRaisesRegex(ValueError, 'selection differs'):
            self.select(ids=['equipment-row'])
        self.assertEqual(self.selection.read_bytes(), original)
        row = delivery.read(self.selection)
        row['expected'] = 46
        delivery.write(self.selection, row)
        with self.assertRaisesRegex(ValueError, 'selection differs'):
            self.select()

    def test_cli_without_app_writes_actual_selected_count_and_hub_kind(self):
        output = self.root/'delivery'
        argv = ['export_app_delivery.py', '--primary', str(self.batch), '--ids', 'equipment-row',
                '--selection', str(self.selection), '--output', str(output), '--workers', '1']
        def fake_export(row, *_args):
            return {'id': row['id'], 'frames': row['frames']}
        with patch.object(sys, 'argv', argv), patch.object(delivery, 'export', side_effect=fake_export):
            delivery.main()
        data = delivery.read(output/'delivery.json')
        self.assertEqual(data['kind'], 'pose-hub-app-exact-alpha')
        self.assertEqual(set(data['items']), {'equipment-row'})
        self.assertFalse((self.root/'app').exists())


if __name__ == '__main__':
    unittest.main()
