"""Small contract tests for media isolation and the bilingual pilot script."""
import json
from pathlib import Path
import unittest
import build
import hiplab_audio as audio
import numpy as np


class VoiceV2Tests(unittest.TestCase):
    def test_no_reference_can_escape_approved_root(self):
        root = Path.cwd()
        for relative in ['../elsewhere.wav', '/elsewhere.wav', str(root / 'absolute.wav')]:
            with self.assertRaises(ValueError):
                build.safe_under(root, relative)

    def test_every_pilot_has_bilingual_required_lines_and_unique_media_paths(self):
        script = json.loads((build.REPO / 'catalog/voice-v2/script.json').read_text(encoding='utf-8'))
        self.assertEqual(len(script['actions']), 6)
        rows = list(build.entries(script))
        self.assertEqual(len({row[-1] for row in rows}), len(rows))
        for lines in script['actions'].values():
            self.assertEqual(set(lines), {'name', 'primaryCue', 'phase.start', 'phase.peak', 'phase.end'})
            self.assertTrue(all(set(text) == {'zh', 'en'} and all(text.values()) for text in lines.values()))
        self.assertEqual(script['playback']['countdownKeys'], ['n.5', 'n.4', 'n.3', 'n.2', 'n.1'])

    def test_edge_trim_preserves_a_pause_inside_speech(self):
        sr = audio.SR
        tone = .1 * np.sin(2 * np.pi * 440 * np.arange(int(.2 * sr)) / sr)
        signal = np.concatenate([np.zeros(int(.3 * sr)), tone,
                                 np.zeros(int(.7 * sr)), tone, np.zeros(int(.4 * sr))]).astype(np.float32)
        trimmed = audio.edge_trim(signal.copy())
        self.assertAlmostEqual(len(trimmed) / sr, 1.22, places=2)
        self.assertTrue(np.all(trimmed[int(.3 * sr):int(.9 * sr)] == 0))


if __name__ == '__main__':
    unittest.main()
