"""Focused regressions for filesystem protection and real Node file imports.
Run with a configured config.json: python drill-anim/test_portability.py
"""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
module_spec = importlib.util.spec_from_file_location('drill', ROOT / 'drill.py')
drill = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(drill)

class PortabilityTests(unittest.TestCase):
    def test_node_import_handles_absolute_paths(self):
        _, output, spec = drill.spec_json('deltoids-A')
        self.assertEqual(spec['id'], 'deltoids-A')
        self.assertTrue(Path(output).is_absolute())

    def test_theme_import_handles_absolute_paths(self):
        output = drill.theme_json('themes/outfit-teal.json', 'test')
        theme=json.loads((ROOT/'themes/outfit-teal.json').read_text(encoding='utf-8'))
        self.assertEqual(json.loads(Path(output).read_text(encoding='utf-8'))['top']['base'], theme['top']['base'])

    def test_config_paths_resolve_from_tool_not_cwd(self):
        with patch.dict(os.environ, {'WORK_DIR':'../output/portability-test-work'}):
            self.assertEqual(drill.cfg()['work_dir'], str((ROOT/'../output/portability-test-work').resolve()))

    def test_invalid_drill_cannot_delete_any_scratch(self):
        with patch.object(drill.shutil, 'rmtree') as remove:
            for value in ('../src', '/tmp', 'E:/root', 'missing-action'):
                with self.assertRaises(ValueError): drill.clean_scratch(value, '')
            remove.assert_not_called()

    def test_scratch_cannot_delete_output_tree(self):
        with tempfile.TemporaryDirectory(dir=drill.WORK) as temp:
            output=Path(temp)/'deltoids-A'
            output.mkdir()
            sentinel=output/'original.mp4'
            sentinel.write_bytes(b'original output')
            with patch.object(drill,'WORK',temp),patch.object(drill,'OUT',str(output)):
                with self.assertRaises(ValueError): drill.clean_scratch('deltoids-A','')
            self.assertEqual(sentinel.read_bytes(),b'original output')

    def test_existing_media_requires_explicit_overwrite(self):
        with tempfile.TemporaryDirectory(dir=drill.WORK) as temp:
            sentinel=Path(temp)/'deltoids-A.mp4'
            sentinel.write_bytes(b'original output')
            with patch.object(drill,'OUT',temp):
                with self.assertRaises(FileExistsError): drill.ensure_outputs('deltoids-A',False)
                drill.ensure_outputs('deltoids-A',True)
            self.assertEqual(sentinel.read_bytes(),b'original output')

    def test_missing_composite_frames_cannot_encode_short_video(self):
        with tempfile.TemporaryDirectory(dir=drill.WORK) as temp,patch.object(drill,'run') as run:
            with self.assertRaises(RuntimeError):
                drill.encode('deltoids-A',temp,{'timeline':{'duration':1},'fps':30})
            run.assert_not_called()

if __name__ == '__main__': unittest.main()
