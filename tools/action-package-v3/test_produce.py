import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


spec = importlib.util.spec_from_file_location('v3_produce', Path(__file__).with_name('produce.py'))
produce = importlib.util.module_from_spec(spec)
spec.loader.exec_module(produce)


class ProductionResumeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.text = self.root / 'text'
        self.text.mkdir()

    def package(self, aid, *, voice='technical-passed', action=True):
        pdir = self.root / 'packages' / aid
        pdir.mkdir(parents=True, exist_ok=True)
        files = {
            'package.json': {'format': 'pose-hub-action-package-v3@1', 'actionId': aid,
                             'skins': {'realistic': {}}, 'flags': {'sampledOnly': False}},
            'definition.json': {'format': 'pose-hub-action-definition@3', 'id': aid,
                                'definition': {'name': {'zh': 'test', 'en': 'test'}},
                                'review': {'editorial': 'passed'}},
            'voice-manifest.json': {'format': 'pose-hub-voice@3', 'actionId': aid, 'status': voice,
                                    'contentReview': 'pending', 'manualListening': 'pending',
                                    'summary': {'auditFailed': [] if voice == 'technical-passed' else ['clip.m4a']}},
        }
        if action:
            files['action.json'] = {'format': 'pose-hub-action@3', 'id': aid,
                                    'status': {'render': 'complete', 'voiceTechnical': voice,
                                               'userAccepted': False, 'releaseEligible': False}}
        for name, data in files.items():
            (pdir / name).write_text(json.dumps(data), 'utf-8')
        return pdir

    def run_batch(self, *ids, no_voice=False):
        items = [(aid, self.root / f'{aid}.recipe.json') for aid in ids]
        stdout = io.StringIO()
        with patch.object(produce, 'collect', return_value=items), \
                patch.object(produce.T, 'TEXT_DIR', self.text), \
                patch.object(produce, 'ensure_dev_server', return_value=None), \
                patch.object(produce.subprocess, 'run', side_effect=AssertionError('must not render or call TTS')), \
                contextlib.redirect_stdout(stdout):
            code = produce.main(['--root', str(self.root)] + (['--no-voice'] if no_voice else []))
        rows = [json.loads(line) for line in stdout.getvalue().splitlines()]
        return code, next(row for row in rows if row.get('event') == 'summary')

    @staticmethod
    def snapshot(pdir):
        return {p.name: p.read_bytes() for p in pdir.iterdir() if p.is_file()}

    def test_failed_saved_voice_stays_failed_and_next_action_is_processed(self):
        bad = self.package('bad', voice='technical-failed')
        good = self.package('good')
        before = [self.snapshot(pdir) for pdir in (bad, good)]
        code, summary = self.run_batch('bad', 'good')
        self.assertEqual(code, 1)
        self.assertEqual(summary['voice-audit-failed'], 1)
        self.assertEqual(summary['complete'], 1)
        self.assertEqual([self.snapshot(pdir) for pdir in (bad, good)], before)

    def test_manifest_failure_cannot_be_hidden_by_saved_action_status(self):
        pdir = self.package('bad')
        voice = json.loads((pdir / 'voice-manifest.json').read_text('utf-8'))
        voice['status'] = 'technical-failed'
        (pdir / 'voice-manifest.json').write_text(json.dumps(voice), 'utf-8')
        code, summary = self.run_batch('bad')
        self.assertEqual(code, 1)
        self.assertEqual(summary['voice-audit-failed'], 1)

    def test_missing_text_is_nonzero(self):
        self.package('no-text', action=False)
        code, summary = self.run_batch('no-text')
        self.assertEqual(code, 1)
        self.assertEqual(summary['needs-text'], 1)

    def test_new_voice_failure_is_nonzero_and_stays_failed_on_resume(self):
        pdir = self.package('bad', voice='technical-failed', action=False)
        (self.text / 'bad.json').write_text('{}', 'utf-8')
        for _ in range(2):
            code, summary = self.run_batch('bad')
            self.assertEqual(code, 1)
            self.assertEqual(summary['voice-audit-failed'], 1)
        self.assertEqual(json.loads((pdir / 'action.json').read_text('utf-8'))['status']['voiceTechnical'], 'technical-failed')

    def test_normal_saved_and_new_completion_succeed(self):
        self.package('saved')
        fresh = self.package('fresh', action=False)
        (self.text / 'fresh.json').write_text('{}', 'utf-8')
        code, summary = self.run_batch('saved', 'fresh')
        self.assertEqual(code, 0)
        self.assertEqual(summary['complete'], 2)
        status = json.loads((fresh / 'action.json').read_text('utf-8'))['status']
        self.assertFalse(status['userAccepted'])
        self.assertFalse(status['releaseEligible'])

    def test_no_voice_render_package_remains_successful(self):
        pdir = self.package('render-only', action=False)
        code, summary = self.run_batch('render-only', no_voice=True)
        self.assertEqual(code, 0)
        self.assertEqual(summary['packaged'], 1)
        self.assertFalse((pdir / 'action.json').exists())

    def test_no_voice_does_not_fail_or_rewrite_an_existing_failed_voice(self):
        pdir = self.package('render-only', voice='technical-failed')
        before = self.snapshot(pdir)
        code, summary = self.run_batch('render-only', no_voice=True)
        self.assertEqual(code, 0)
        self.assertEqual(summary['packaged'], 1)
        self.assertEqual(self.snapshot(pdir), before)

    def test_missing_or_corrupt_saved_manifests_fail_without_overwrite_or_batch_abort(self):
        for name in ('action.json', 'package.json', 'definition.json', 'voice-manifest.json'):
            for damage in ('missing', 'corrupt'):
                if name == 'action.json' and damage == 'missing':
                    continue  # an absent bundle is a valid unfinished stage, covered above
                with self.subTest(name=name, damage=damage):
                    bad = self.package('bad')
                    good = self.package('good')
                    if damage == 'missing':
                        (bad / name).unlink()
                    else:
                        (bad / name).write_text('{broken', 'utf-8')
                    before = [self.snapshot(pdir) for pdir in (bad, good)]
                    code, summary = self.run_batch('bad', 'good')
                    self.assertEqual(code, 1)
                    self.assertEqual(summary['failed'], 1)
                    self.assertEqual(summary['complete'], 1)
                    self.assertEqual([self.snapshot(pdir) for pdir in (bad, good)], before)


if __name__ == '__main__':
    unittest.main()
