import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('batch_media', Path(__file__).with_name('media.py'))
media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media)


class BatchIsolation(unittest.TestCase):
    def test_existing_six_ids_are_not_silently_included_in_new_batch(self):
        batch = {'actions': [{'id': 'h-squat', 'peakFrame': 63}]}
        core = media.core_for(batch)
        self.assertEqual(core.IDS, ['h-squat'])
        self.assertEqual(core.PEAKS, {'h-squat': 63})
        fresh = media.core_for({'actions': [{'id': 'other', 'peakFrame': 90}]})
        self.assertEqual(fresh.IDS, ['other'])
        self.assertEqual(core.IDS, ['h-squat'])

    def test_duplicate_or_unsafe_ids_are_rejected_before_output(self):
        for ids in (['safe', 'safe'], ['../outside']):
            with self.subTest(ids=ids), tempfile.TemporaryDirectory() as tmp:
                path = Path(tmp)/'batch.json'
                path.write_text(json.dumps({'format': 'pose-hub-v2-production-batch@1',
                    'actions': [{'id': aid, 'peakFrame': 60} for aid in ids]}), encoding='utf-8')
                with self.assertRaises(ValueError):
                    media.load_batch(path)

    def test_unapproved_seven_skin_matrix_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)/'batch.json'
            path.write_text(json.dumps({'format': 'pose-hub-v2-production-batch@1',
                'actions': [{'id': 'safe', 'peakFrame': 60}], 'skins': media.SKINS+['extra']}), encoding='utf-8')
            with self.assertRaises(ValueError):
                media.load_batch(path)


if __name__ == '__main__':
    unittest.main()
