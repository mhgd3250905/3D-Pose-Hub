"""Small CPU metadata fixtures; no production PNG scan, renderer or approval."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('batch_qa_binding_tests', HERE/'bind_qa.py')
binding = importlib.util.module_from_spec(spec); spec.loader.exec_module(binding)
SKINS = binding.SKINS


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(binding.encoded(data))
    return binding.file_ref(path.parents[0], path)


class Fixture:
    def __init__(self, base):
        self.repo, self.root = base/'repo', base/'media'
        self.ids = ['fixture-a', 'fixture-b']
        self.batch = {'format': 'pose-hub-v2-production-batch@1', 'id': 'test-batch',
            'skins': SKINS, 'model': {'id': 'training-human-v2plus', 'version': '1.0.0-rc2'},
            'actions': [{'id': aid, 'spec': 'drill-anim/specs/'+aid+'-r2.js', 'peakFrame': 63} for aid in self.ids]}
        self.batch_path = self.repo/'catalog/v2/batches/test.json'; write(self.batch_path, self.batch)
        self.runtime = {'sha256': 'runtime', 'browserVersion': '130', 'actualWebGLRenderer': 'Fixture NVIDIA',
                        'chromiumArgs': ['fixture'], 'chromiumChannel': None}
        recipe = {'batchId': self.batch['id'], 'batchSha256': binding.sha(self.batch_path.read_bytes()),
            'sha256': 'fixture-recipe', 'runtime': self.runtime,
            'runnerFiles': [{'path': 'tools/action-library-v2/runtime-guard.mjs', 'sha256': 'guard'}], 'actions': []}
        integrity = {'format': 'pose-hub-v2-batch-integrity@1', 'batchId': self.batch['id'],
            'recipeSha256': recipe['sha256'], 'issues': [], 'renders': []}
        pixels, anomalies, measured, sheets = {'renders': []}, {'renders': []}, {'actions': []}, {'sheets': []}
        self.review = {'format': 'pose-hub-v2-full-actual-review@1', 'actualReview': True,
            'approved': True, 'reviewedBy': 'Fixture reviewer; never production',
            'reviewedAt': '2026-10-21T22:00:00+08:00', 'batchId': self.batch['id'],
            'batchSha256': recipe['batchSha256'], 'recipeSha256': recipe['sha256'], 'actions': []}
        for a in self.batch['actions']:
            aid = a['id']; sp = self.repo/a['spec']; sp.parent.mkdir(parents=True, exist_ok=True); sp.write_bytes(b'fixture spec\n')
            digest = binding.sha(sp.read_bytes()); source = 'source-'+aid
            recipe['actions'].append({'id': aid, 'spec': a['spec'], 'specSha256': digest, 'sourceSha256': source})
            write(self.repo/'catalog/v2/actions'/f'{aid}.json', {'id': aid,
                'source': {'spec': {'path': a['spec'], 'sha256': digest}}})
            frames = binding.required_frames(a)
            sheet = self.asset(f'qa/review-sheets/{aid}.png', b'fixture sheet bytes, not production pixels')
            sheets['sheets'].append({'actionId': aid, 'skins': SKINS, 'frames': frames, 'asset': sheet})
            self.review['actions'].append({'id': aid, 'specSha256': digest, 'sourceSha256': source,
                'actualFullVisualFrames': {skin: frames for skin in SKINS}, 'viewedSheets': [sheet]})
            measured['actions'].append({'actionId': aid, 'sourceSha256': source,
                'specSha256': digest, 'productionFramesMeasured': 240, 'warnings': []})
            proof = self.asset(f'qa/runtime/full/{aid}.json', binding.encoded({'actionId': aid, 'stage': 'full',
                'runtimeSha256': 'runtime', 'guardSha256': 'guard', 'browserVersion': '130',
                'args': ['fixture'], 'channel': None, 'actualWebGL': {'unmaskedRenderer': 'Fixture NVIDIA', 'contextLost': False}, 'browserCount': 1}))
            receipt = {'actionId': aid, 'stage': 'full', 'recipeSha256': recipe['sha256'],
                'sourceSha256': source, 'runtimeSha256': 'runtime', 'reviewSha256': 'preview-review',
                'runtimeProof': proof, 'manifests': {}}
            for skin in SKINS:
                common = {'actionId': aid, 'skin': skin, 'sourceSha256': source}
                integrity['renders'].append({**common, 'counts': {'body': 240, 'highlight': 240, 'shadow': 240},
                    'poseQaFrames': 241, 'warningFrames': []})
                pixels['renders'].append({**common, 'numericIssues': [], 'frames': [
                    {'frame': f, 'size': [1080, 1080], 'bodyAlphaPixels': 10, 'maskColorError': 0,
                     'maskOutsideBodyPixels': 0, 'maskPixels': 5, 'shadowAlphaPixels': 5} for f in range(240)]})
                anomalies['renders'].append({**common, 'specSha256': digest, 'frames': 240,
                    'emptyFrames': [], 'canvasEdgeFrames': [], 'suddenAreaChangeFrames': []})
                sequences = {layer: self.asset(f'masters/{skin}/{aid}/{layer}/index.json', binding.encoded(
                    {'frames': [{'frame': f, 'path': f'masters/{skin}/{aid}/{layer}/{f}.png'} for f in range(240)]})) for layer in binding.LAYERS}
                manifest = {**common, 'spec': {'sha256': digest}, 'complete': True, 'reviewed': True,
                    'frameCount': 240, 'model': self.batch['model'], 'sequences': sequences,
                    'qaEndpoint': {layer: {**self.asset(f'qa/endpoints/{skin}/{aid}/{layer}.png', b'fixture endpoint'), 'frame': 240} for layer in binding.LAYERS}}
                receipt['manifests'][skin] = self.asset(f'masters/{skin}/{aid}/layer-manifest.json', binding.encoded(manifest))
            write(self.root/f'manifests/completed/full-{aid}.json', receipt)
        write(self.root/'manifests/batch-source.json', recipe)
        mosaic = {'schema': 'pose-hub-mosaic@2', 'status': 'complete', 'missing': [], 'actions': self.ids,
            'skins': SKINS, 'themes': ['dark', 'light'], 'highlightStates': [False, True],
            'asset': self.asset('previews/action-skin-theme-highlight-mosaic.png', b'fixture mosaic')}
        self.review['mosaic'] = mosaic['asset']
        for relative, data in zip(binding.REPORTS, [integrity, pixels, anomalies, measured, sheets, mosaic]):
            write(self.root/relative, data)
        self.review_path = base/'external-actual-review.json'; self.save_review()

    def asset(self, relative, data):
        path = self.root/relative; path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
        return binding.file_ref(self.root, path)

    def save_review(self):
        write(self.review_path, self.review)

    def bind(self):
        with patch.object(binding, 'REPO', self.repo):
            return binding.bind(self.batch_path, self.root, self.review_path)

    def assert_no_pass(self, test):
        test.assertFalse(any((self.root/'qa/reviews').glob('*.json')))


class BindingTests(unittest.TestCase):
    def test_valid_external_attestation_creates_only_exact_qa_payloads(self):
        with tempfile.TemporaryDirectory() as td:
            f = Fixture(Path(td)); files = f.bind(); self.assertEqual(len(files), 4)
            evidence = binding.read(f.root/'qa/reviews/fixture-a-evidence.json')
            self.assertEqual(len(evidence['fullSequences']), 15)
            self.assertEqual(evidence['checks']['loopSeam']['framesReviewed'], binding.required_frames(f.batch['actions'][0]))
            self.assertEqual(evidence['runtimeProof']['path'], 'qa/runtime/full/fixture-a.json')
            with self.assertRaisesRegex(ValueError, 'Existing QA'): f.bind()

    def test_explicit_actual_approval_and_reviewer_are_required(self):
        for key, value in [('approved', False), ('actualReview', False), ('reviewedBy', ''), ('reviewedAt', 'yesterday')]:
            with self.subTest(key=key), tempfile.TemporaryDirectory() as td:
                f = Fixture(Path(td)); f.review[key] = value; f.save_review()
                with self.assertRaises(ValueError): f.bind()
                f.assert_no_pass(self)

    def test_wrong_source_missing_skin_or_unviewed_sheet_cannot_grant_pass(self):
        for mutation in ['source', 'skin', 'sheet', 'frame']:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as td:
                f = Fixture(Path(td)); a = f.review['actions'][-1]
                if mutation == 'source': a['sourceSha256'] = 'wrong'
                elif mutation == 'skin': del a['actualFullVisualFrames'][SKINS[-1]]
                elif mutation == 'sheet': a['viewedSheets'] = []
                else: a['actualFullVisualFrames'][SKINS[0]] = [0, 240]
                f.save_review()
                with self.assertRaises(ValueError): f.bind()
                f.assert_no_pass(self)

    def test_incomplete_numeric_reports_fail_before_any_earlier_action_write(self):
        for relative, field in [('qa/full-integrity-qa.json', 'renders'), ('qa/masters-layer-pixels.json', 'renders'),
                                ('qa/full-sequences.json', 'renders'), ('qa/measured-production.json', 'actions')]:
            with self.subTest(report=relative), tempfile.TemporaryDirectory() as td:
                f = Fixture(Path(td)); path = f.root/relative; data = binding.read(path); data[field].pop(); write(path, data)
                with self.assertRaises(ValueError): f.bind()
                f.assert_no_pass(self)

    def test_nonempty_issues_warnings_or_incomplete_pixel_frames_fail(self):
        for mutation in ['issues', 'warnings', 'pixel-frame', 'colored-mask', 'area-spike']:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as td:
                f = Fixture(Path(td))
                if mutation == 'issues': rel = 'qa/full-integrity-qa.json'; data = binding.read(f.root/rel); data['issues'] = ['bad']
                elif mutation == 'warnings': rel = 'qa/measured-production.json'; data = binding.read(f.root/rel); data['actions'][-1]['warnings'] = ['bad']
                elif mutation == 'area-spike': rel = 'qa/full-sequences.json'; data = binding.read(f.root/rel); data['renders'][-1]['suddenAreaChangeFrames'] = [2]
                else:
                    rel = 'qa/masters-layer-pixels.json'; data = binding.read(f.root/rel)
                    if mutation == 'pixel-frame': data['renders'][-1]['frames'].pop()
                    else: data['renders'][-1]['frames'][-1]['maskColorError'] = 3
                write(f.root/rel, data)
                with self.assertRaises(ValueError): f.bind()
                f.assert_no_pass(self)

    def test_missing_sequence_or_changed_actual_sheet_and_runtime_cannot_pass(self):
        for mutation in ['sequence', 'sheet', 'runtime', 'endpoint']:
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as td:
                f = Fixture(Path(td))
                if mutation == 'sequence': (f.root/'masters/hologram/fixture-b/shadow/index.json').unlink()
                elif mutation == 'endpoint': (f.root/'qa/endpoints/hologram/fixture-b/shadow.png').unlink()
                elif mutation == 'sheet': (f.root/'qa/review-sheets/fixture-b.png').write_bytes(b'changed')
                else: (f.root/'qa/runtime/full/fixture-b.json').write_bytes(b'changed')
                with self.assertRaises((ValueError, OSError)): f.bind()
                f.assert_no_pass(self)

    def test_existing_last_destination_is_not_overwritten_and_no_new_pass_written(self):
        with tempfile.TemporaryDirectory() as td:
            f = Fixture(Path(td)); path = f.root/'qa/reviews/fixture-b.json'; path.parent.mkdir(parents=True); path.write_bytes(b'preserve')
            with self.assertRaises(ValueError): f.bind()
            self.assertEqual(path.read_bytes(), b'preserve')
            self.assertEqual(list(path.parent.iterdir()), [path])


if __name__ == '__main__': unittest.main()
