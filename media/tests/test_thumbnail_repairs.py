"""Tiny still-only fixtures: no video codec, renderer, or production files."""
import copy
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import run_app_test_exports as queue


class ThumbnailRepairTest(unittest.TestCase):
    tool = 'a' * 64

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.output, self.stage = self.root / 'pack', self.root / 'staging'
        self.output.mkdir(); self.stage.mkdir()
        self.catalog = self.root / 'catalog.json'
        self.repairs = self.root / 'repairs.json'
        self.write(self.output / '.queue.lock', {'pid': os.getpid(), 'token': 'unit-test'})
        self.originals = {}
        actions = []
        for aid in ('a', 'b'):
            actions.append({'id': aid, 'revision': aid + '-r1', 'reviewed': False,
                            'releaseEligible': False, 'state': 'selected'})
            files = {}
            for role in ('video', 'cover'):
                path = self.output / f'media/{aid}/{role}.original'
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes((aid + role).encode())
                files[role] = self.file_ref(path, self.output)
            thumb = self.output / f'media/{aid}/thumbnail.webp'
            self.still(thumb, 9)
            files['thumbnail'] = self.file_ref(thumb, self.output, width=240, height=240, alpha=True)
            report = self.output / f'qa/{aid}/decode-check.json'
            self.write(report, {'passed': True, 'framesDecoded': 240})
            row = {'id': aid, 'catalogRevision': aid + '-r1', 'reviewed': False,
                   'releaseEligible': False, 'availableForApp': True, 'files': files,
                   'sourceVideos': {}, 'qa': {'report': self.file_ref(report, self.output),
                                             'metrics': {'passed': True, 'framesDecoded': 240}},
                   'exporterSha256': self.tool, 'queueSourceKey': 'b' * 64,
                   'sourcePlan': 'plans/original.json', 'sourcePlanSha256': 'c' * 64}
            self.originals[aid] = row
        action = {'id': 'a', 'fps': 30, 'frames': 240, 'durationSeconds': 8,
                  'coverFrame': 60, 'coverSize': [720, 720], 'thumbnailSize': [240, 240],
                  'highlight': {}, 'layerManifest': {'sha256': 'd' * 64},
                  'framing': {'sha256': 'e' * 64}, 'baselineVideos': {}}
        plan = self.root / 'source-plan.json'
        self.write(plan, {'format': 'pose-hub-stacked-alpha-plan@1', 'skin': 'realistic',
                          'consumer': {'eligibleActionIds': ['a']}, 'bindings': {}, 'actions': [action]})
        a = self.originals['a']
        a.update({'catalogRevision': 'a-alpha-r2', 'sourceRevision': 'a-r1',
                  'mediaRevision': 'a-alpha-r2', 'queueSourceKey': queue.source_key(action, 'realistic', self.tool)})
        self.write(self.catalog, {'id': 'unit-pack', 'actions': actions})
        self.write(self.repairs, {'format': 'pose-hub-app-test-repairs@1',
                   'allowedLegacyExporterSha256': [self.tool], 'actions': [
                       {'id': 'a', 'sourceRevision': 'a-r1', 'catalogRevision': 'a-alpha-r2',
                        'mediaRevision': 'a-alpha-r2', 'reason': 'original framing repair',
                        'expected': {'catalogRevision': 'a-r1', 'queueSourceKey': 'f' * 64},
                        'plan': self.file_ref(plan, self.root)}]})
        # The repair plan resolves relative to the authority file.
        self.write(self.output / 'manifest.json', {'format': queue.FORMAT, 'status': 'test-unreviewed',
                   'actions': list(self.originals.values())})
        self.assembler = self.resume()
        self.items = []
        for aid in ('a', 'b'):
            thumb = self.stage / (aid + '.webp')
            self.still(thumb, 10)
            self.items.append({'id': aid, 'expectedThumbnailSha256': self.originals[aid]['files']['thumbnail']['sha256'],
                               'mediaRevision': aid + '-thumbnail-r3',
                               'thumbnail': self.file_ref(thumb, self.stage, width=240, height=240, alpha=True),
                               'recipe': {'policy': 'unit-test transparent padding', 'sourceRole': 'cover'}})

    @staticmethod
    def write(path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding='utf-8')

    @staticmethod
    def file_ref(path, root, **extra):
        return {'path': path.relative_to(root).as_posix(), 'bytes': path.stat().st_size,
                'sha256': queue.digest(path), **extra}

    @staticmethod
    def still(path, margin):
        with Image.new('RGBA', (240, 240)) as image:
            with Image.new('RGBA', (240 - 2 * margin, 240 - 2 * margin), (40, 90, 120, 170)) as body:
                image.paste(body, (margin, margin))
            image.save(path, format='WEBP', lossless=True, exact=True)

    def resume(self):
        return queue.Assembler(self.output, self.root / 'work', self.catalog, {}, self.tool, [], self.repairs)

    def test_batch_versions_only_thumbnails_saves_once_and_survives_existing_framing_authority(self):
        before = copy.deepcopy(self.assembler.ready)
        with patch.object(self.assembler, 'save', wraps=self.assembler.save) as save:
            imported = self.assembler.ingest_thumbnail_repairs(self.items, self.stage)
            self.assertEqual(save.call_count, 1)
        self.assertEqual(set(imported), {'a', 'b'})
        for aid in before:
            row = self.assembler.ready[aid]
            for key in ('catalogRevision', 'sourceRevision', 'queueSourceKey', 'sourcePlan',
                        'sourcePlanSha256', 'exporterSha256', 'qa'):
                self.assertEqual((key in row, row.get(key)), (key in before[aid], before[aid].get(key)))
            for role in ('video', 'cover'):
                self.assertEqual(row['files'][role], before[aid]['files'][role])
            self.assertNotEqual(row['files']['thumbnail']['path'], before[aid]['files']['thumbnail']['path'])
            queue.verify(self.output, before[aid]['files']['thumbnail'])
            proof = row['thumbnailDerivation']
            self.assertEqual(queue.read_json(queue.verify(self.output, proof['previousRow'])), before[aid])
            self.assertEqual(proof['alphaMarginQa']['requiredPixels'], 10)
        resumed = self.resume()
        self.assertEqual(resumed.ready, self.assembler.ready)
        resumed.save()
        delivered = {r['id']: r for r in queue.read_json(self.output / 'catalog.json')['actions']}
        self.assertEqual(delivered['a']['mediaRevision'], 'a-thumbnail-r3')
        self.assertEqual(delivered['a']['sourceRevision'], 'a-r1')
        self.assertNotIn('sourceRevision', delivered['b'])
        self.assertEqual(delivered['b']['mediaRevision'], 'b-thumbnail-r3')

    def test_preflight_rejects_stale_sha_and_same_revision(self):
        for changes, message in [({'expectedThumbnailSha256': '0' * 64}, 'current thumbnail'),
                                  ({'mediaRevision': 'a-alpha-r2'}, 'new media revision')]:
            with self.subTest(changes=changes):
                items = copy.deepcopy(self.items); items[0].update(changes)
                with self.assertRaisesRegex(ValueError, message):
                    self.assembler.ingest_thumbnail_repairs(items, self.stage)
        self.assertEqual(self.assembler.ready, self.originals)

    def test_entire_batch_preflight_rejects_nine_pixels_before_any_publish(self):
        bad = self.stage / 'bad.webp'; self.still(bad, 9)
        items = copy.deepcopy(self.items)
        items[1]['thumbnail'] = self.file_ref(bad, self.stage, width=240, height=240, alpha=True)
        # Make its bytes differ from the previous thumbnail while retaining nine-pixel bounds.
        with Image.open(bad) as image:
            image.putpixel((120, 120), (1, 2, 3, 200))
            image.save(bad, format='WEBP', lossless=True, exact=True)
        items[1]['thumbnail'] = self.file_ref(bad, self.stage, width=240, height=240, alpha=True)
        manifest = (self.output / 'manifest.json').read_bytes()
        with self.assertRaisesRegex(ValueError, 'exact 4%'):
            self.assembler.ingest_thumbnail_repairs(items, self.stage)
        self.assertFalse((self.output / 'media/a/a-thumbnail-r3').exists())
        self.assertEqual((self.output / 'manifest.json').read_bytes(), manifest)
        self.assertEqual(self.assembler.ready, self.originals)

    def test_lease_duplicate_ids_and_existing_different_bytes_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'unique verified ready ID'):
            self.assembler.ingest_thumbnail_repairs([self.items[0], self.items[0]], self.stage)
        destination = self.output / 'media/a/a-thumbnail-r3/a.thumbnail.alpha.webp'
        destination.parent.mkdir(parents=True); destination.write_bytes(b'another prior version')
        with self.assertRaisesRegex(ValueError, 'another identity'):
            self.assembler.ingest_thumbnail_repairs(self.items, self.stage)
        self.write(self.output / '.queue.lock', {'pid': os.getpid() + 1, 'token': 'other'})
        with self.assertRaisesRegex(ValueError, 'this process queue lease'):
            self.assembler.ingest_thumbnail_repairs(self.items, self.stage)

    def test_resume_rejects_unrelated_delta_and_missing_history(self):
        self.assembler.ingest_thumbnail_repairs(self.items, self.stage)
        path = self.output / 'manifest.json'; clean = queue.read_json(path)
        changed = copy.deepcopy(clean); changed['actions'][0]['sourceRevision'] = 'unrelated'
        self.write(path, changed)
        with self.assertRaisesRegex(ValueError, 'changed another field'):
            self.resume()
        changed = copy.deepcopy(clean); changed['stillRepairHistory'] = {}
        self.write(path, changed)
        with self.assertRaisesRegex(ValueError, 'Missing thumbnail repair history'):
            self.resume()

    def test_later_still_revision_retains_every_ancestor_and_framing_identity(self):
        self.assembler.ingest_thumbnail_repairs(self.items, self.stage)
        first = copy.deepcopy(self.assembler.ready['a'])
        item = copy.deepcopy(self.items[0])
        item.update({'mediaRevision': 'a-thumbnail-r4',
                     'expectedThumbnailSha256': first['files']['thumbnail']['sha256']})
        path = self.stage / 'later.webp'; self.still(path, 11)
        item['thumbnail'] = self.file_ref(path, self.stage, width=240, height=240, alpha=True)
        self.assembler.ingest_thumbnail_repairs([item], self.stage)
        resumed = self.resume()
        self.assertEqual(resumed.ready['a']['mediaRevision'], 'a-thumbnail-r4')
        self.assertEqual(len(resumed.still_repair_history['a']), 2)
        self.assertEqual(queue.thumbnail_framing_row(self.output, resumed.ready['a'],
                                                    resumed.still_repair_history), self.originals['a'])
        queue.verify(self.output, first['files']['thumbnail'])


if __name__ == '__main__':
    unittest.main()
