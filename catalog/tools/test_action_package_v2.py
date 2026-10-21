"""Release-gate regression tests. Fixtures are synthetic metadata, never real QA."""
import copy
import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from action_package_v2 import CAT, REPO, Check, PROFILES, SKINS, VOCABULARY, read, validate, write
from bootstrap_v2 import ref as repo_ref

class GateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix='pose-hub-v2-gate-')
        cls.media = Path(cls.tmp.name)
        cls.registry = {'skins': [{'id': skin} for skin in SKINS]}
        cls.package = p = read(CAT / 'v2/actions/w-dead-bug.json')
        def asset(path, data=b'synthetic test payload', **metadata):
            target = cls.media / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            return {'root': 'media', 'path': path, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data), **metadata}
        def jsonasset(path, data):
            write(cls.media / path, data)
            return asset(path, (cls.media / path).read_bytes())
        cls.asset = staticmethod(asset)
        evidence = asset('qa/evidence.txt')
        review = {'status': 'pass', 'reviewer': 'synthetic-test', 'reviewedAt': '2026-10-21T00:00:00Z', 'evidence': [evidence], 'framesReviewed': [0, 60, 120, 239, 240]}
        p['status'] = 'ready'
        p['definition']['editorialReview'] = copy.deepcopy(review)
        for kind in ('cautions', 'contraindications'):
            p['definition'][kind]['review'] = copy.deepcopy(review)
        p['source']['keyMoments'] = {'start': 0, 'peak': 2, 'end': 8}
        p['source']['qa'] = {key: copy.deepcopy(review) for key in ('intersections', 'handsFeet', 'propFlicker', 'loopSeam')}
        p['masters']['requiredSkins'] = SKINS
        p['masters']['loopReview'] = copy.deepcopy(review)
        geometry = hashlib.sha256(b'geometry').hexdigest()
        for skin in SKINS:
            entry = {'geometrySha256': geometry, 'occlusionSha256': geometry}
            for layer in ('bodyProps', 'highlightMask', 'shadow'):
                if skin != 'realistic' and layer != 'bodyProps':
                    entry[layer] = {'sharedFrom': 'realistic'}
                    continue
                prefix = f'masters/{skin}/{p["id"]}/{layer}'
                frames = [asset(f'{prefix}/{index:04d}.png', frame=index) for index in range(240)]
                entry[layer] = {'sequence': jsonasset(f'{prefix}/index.json', {'frames': frames}), 'width': 1080, 'height': 1080, 'frameCount': 240, 'fps': 30, 'durationSeconds': 8, 'alpha': True}
                if layer == 'highlightMask':
                    entry[layer].update({'grayscale': True, 'occlusionAware': True})
            p['masters']['skins'][skin] = entry
            entry['measurement'] = jsonasset(f'masters/{skin}/{p["id"]}/layer-manifest.json', {'format': 'pose-hub-layer-render@2', 'actionId': p['id'], 'skin': skin, 'complete': True, 'geometrySha256': geometry, 'occlusionSha256': geometry, 'spec': p['source']['spec'], 'model': p['source']['model']})
        sequences = [{'skin': skin, 'kind': kind, 'sha256': value[kind]['sequence']['sha256']} for skin, value in p['masters']['skins'].items() for kind in ('bodyProps', 'highlightMask', 'shadow') if 'sequence' in value[kind]]
        proof = jsonasset('qa/bound-report.json', {'id': p['id'], 'specSha256': p['source']['spec']['sha256'], 'modelVersion': p['source']['model']['version'], 'skins': SKINS, 'checks': {key: {'status': 'pass', 'framesReviewed': review['framesReviewed']} for key in p['source']['qa']}, 'fullSequences': sequences})
        for record in p['source']['qa'].values():
            record['evidence'] = [proof]
        p['masters']['loopReview']['evidence'] = [proof]
        p['derivatives']['compositor'] = repo_ref('catalog/tools/action_package_v2.py')
        p['derivatives']['framingId'] = 'fixed-square-pilot'
        for skin in SKINS:
            for theme in ('light', 'dark'):
                image = asset(f'derivatives/{skin}/{theme}/cover.jpg', width=720, height=720)
                p['derivatives']['variants'].append({'skin': skin, 'theme': theme, 'highlight': {'enabled': True, 'color': '#ff6600', 'brightness': 1}, 'modelVersion': p['source']['model']['version'], 'video': asset(f'derivatives/{skin}/{theme}/loop.mp4', width=720, height=720, durationSeconds=8, frameCount=240, codec='h264'), 'cover': image, 'thumbnail': image, 'keyframes': [{'phase': phase, 'asset': image} for phase in ('start', 'peak', 'end')]})
            p['derivatives']['transparentCovers'][skin] = asset(f'derivatives/{skin}/transparent.png', width=1080, height=1080, alpha=True)
        audio = asset('voice/test.m4a', durationSeconds=1, sampleRate=44100, channels=1, codec='aac')
        line = {'text': 'test', 'status': 'passed', 'ref': audio, 'audit': {'fails': [], 'lufs': -16, 'true_peak': -2, 'rawComparison': True}}
        actionlines = {}
        primary = p['definition']['cues'][0]['text']
        for lang in ('zh', 'en'):
            actionlines[lang] = {key: copy.deepcopy(line) for key in ('name', 'primaryCue', 'phase.start', 'phase.peak', 'phase.end')}
            actionlines[lang]['name']['text'] = p['definition']['name'][lang]
            actionlines[lang]['primaryCue']['text'] = primary[lang]
        voice = {'schema': 'pose-hub-voice@2', 'contentReview': 'passed', 'manualListening': 'passed', 'voiceProfile': PROFILES, 'auditStandard': {'lufsTarget': -16, 'lufsTolerance': 1, 'truePeakMaxDbtp': -1, 'codec': 'aac', 'sampleRate': 44100, 'channels': 1}, 'sharedVocabulary': {'status': 'passed', 'lines': {lang: {key: copy.deepcopy(line) for key in VOCABULARY} for lang in ('zh', 'en')}}, 'actions': {p['id']: {'lines': actionlines}}}
        p['voice']['manifest'] = jsonasset('voice/manifest.json', voice)
        assets = []
        for skin, layers in p['masters']['skins'].items():
            for kind in ('bodyProps', 'highlightMask', 'shadow'):
                layer = layers[kind]
                if 'sequence' in layer:
                    assets.append({**layer['sequence'], 'skin': skin, 'kind': kind, 'width': 1080, 'height': 1080, 'durationSeconds': 8, 'modelVersion': p['source']['model']['version']})
        for var in p['derivatives']['variants']:
            for kind in ('video', 'cover', 'thumbnail'):
                assets.append({**var[kind], 'skin': var['skin'], 'kind': kind, 'modelVersion': var['modelVersion']})
            for frame in var['keyframes']:
                assets.append({**frame['asset'], 'skin': var['skin'], 'kind': 'keyframe', 'modelVersion': var['modelVersion']})
        for skin, cover in p['derivatives']['transparentCovers'].items():
            assets.append({**cover, 'skin': skin, 'kind': 'transparentCover', 'modelVersion': p['source']['model']['version']})
        p['validation']['manifest'] = jsonasset('manifests/w-dead-bug.json', {'format': 'action-package-media-manifest@2', 'id': p['id'], 'modelVersion': p['source']['model']['version'], 'assets': assets})
        p['validation']['review'] = review

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def setUp(self):
        self.p = copy.deepcopy(self.package)

    def result(self):
        # Positive contract fixture intentionally does not claim genuine media
        # decoding or human QA. Binary probing has independent tests below.
        with patch.object(Check, 'probe_ref', return_value=None):
            return validate(self.p, self.registry, {'media': self.media}, check_files=True)

    def assertBlocked(self, layer):
        result = self.result()
        self.assertFalse(result['complete'])
        self.assertFalse(result['layers'][layer]['complete'], result)

    def test_complete_contract_fixture_passes(self):
        result = self.result()
        self.assertTrue(result['complete'], result)

    def test_missing_skin_blocks(self):
        del self.p['masters']['skins']['tech-white']
        self.assertBlocked('masters')

    def test_missing_english_blocks(self):
        del self.p['definition']['cues'][0]['text']['en']
        self.assertBlocked('definition')

    def test_qa_unreviewed_blocks(self):
        self.p['source']['qa']['handsFeet']['status'] = 'pending'
        self.assertBlocked('source')

    def test_empty_evidence_cannot_pass(self):
        self.p['source']['qa']['loopSeam']['evidence'] = []
        self.assertBlocked('source')

    def test_empty_frames_cannot_pass(self):
        self.p['source']['qa']['intersections']['framesReviewed'] = []
        self.assertBlocked('source')

    def test_bad_sha_blocks(self):
        self.p['derivatives']['variants'][0]['video']['sha256'] = '0' * 64
        self.assertBlocked('derivatives')

    def test_bad_size_blocks(self):
        self.p['derivatives']['variants'][0]['video']['bytes'] += 1
        self.assertBlocked('derivatives')

    def test_sharing_different_geometry_blocks(self):
        self.p['masters']['skins']['tech-white']['geometrySha256'] = '1' * 64
        self.assertBlocked('masters')

    def test_sharing_different_occlusion_blocks(self):
        self.p['masters']['skins']['tech-white']['occlusionSha256'] = '1' * 64
        self.assertBlocked('masters')

    def test_deprecated_model_blocks(self):
        self.p['source']['model']['id'] = 'training-human-v2'
        self.assertBlocked('source')

    def test_incomplete_derivative_matrix_blocks(self):
        self.p['derivatives']['variants'].pop()
        self.assertBlocked('derivatives')

    def test_absolute_path_blocks(self):
        self.p['source']['spec']['path'] = 'F:/not-portable/spec.js'
        self.assertBlocked('source')

    def test_missing_layer_blocks(self):
        self.p['masters']['skins']['realistic'].pop('shadow')
        self.assertBlocked('masters')

    def test_single_side_requires_start_and_switch(self):
        self.p['definition']['unilateral'] = True
        self.assertBlocked('definition')
        self.assertBlocked('source')

    def test_references_cannot_escape_root(self):
        self.p['validation']['manifest']['path'] = '../outside.json'
        self.assertBlocked('validation')

    def test_no_mirrors(self):
        self.p['derivatives']['mirrored'] = True
        self.assertBlocked('derivatives')

    def test_registry_cannot_drop_required_skins(self):
        self.registry = {'skins': [{'id': 'realistic'}]}
        self.assertBlocked('masters')

    def test_corrupt_actual_png_is_rejected(self):
        check = Check(self.p, self.registry, {'media': self.media}, check_files=True)
        check.ref('masters', self.asset('corrupt/frame.png'), 'corrupt frame')
        self.assertTrue(any('decoding/probing failed' in x for x in check.errors['masters']))

    def test_corrupt_actual_mp4_is_rejected(self):
        check = Check(self.p, self.registry, {'media': self.media}, check_files=True)
        check.ref('derivatives', self.asset('corrupt/movie.mp4'), 'corrupt movie')
        self.assertTrue(any('decoding/probing failed' in x for x in check.errors['derivatives']))

    def test_actual_png_dimension_mismatch_is_rejected(self):
        import io
        from PIL import Image
        stream = io.BytesIO()
        Image.new('RGBA', (16, 16)).save(stream, 'PNG')
        check = Check(self.p, self.registry, {'media': self.media}, check_files=True)
        check.ref('derivatives', self.asset('corrupt/wrong-size.png', stream.getvalue(), width=720, height=720), 'wrong size')
        self.assertTrue(any('actual width mismatch' in x for x in check.errors['derivatives']))

    def test_unrelated_text_evidence_cannot_pass_qa(self):
        self.p['source']['qa']['loopSeam']['evidence'] = [self.asset('qa/unrelated.txt')]
        self.assertBlocked('source')

    def test_unmeasured_geometry_cannot_share_layers(self):
        self.p['masters']['skins']['tech-white'].pop('measurement')
        self.assertBlocked('masters')

    def test_missing_motion_dependency_blocks(self):
        self.p['source']['dependencies'].pop()
        self.assertBlocked('source')

    def test_resolved_old_spec_is_rejected(self):
        self.p['source']['spec'] = repo_ref('drill-anim/specs/h-db-curl.js', True)
        result = self.result()
        self.assertTrue(any('resolved spec must bind' in error for error in result['layers']['source']['missing']))

    def test_grayscale_claim_checked_against_pixels(self):
        import io
        from PIL import Image
        stream = io.BytesIO()
        Image.new('RGBA', (16, 16), (255, 0, 0, 255)).save(stream, 'PNG')
        reference = self.asset('corrupt/colored-mask.png', stream.getvalue())
        check = Check(self.p, self.registry, {'media': self.media}, check_files=True)
        path = check.ref('masters', reference, 'colored mask')
        check.probe_ref('masters', path, {'grayscale': True}, 'colored mask')
        self.assertTrue(any('not grayscale' in error for error in check.errors['masters']))

if __name__ == '__main__':
    unittest.main()
