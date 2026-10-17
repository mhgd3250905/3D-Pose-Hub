"""Deterministic local media archive checks; standard library and fake bytes only."""
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile


MODULE = Path(__file__).resolve().parents[1] / 'tools/pack.py'
SPEC = importlib.util.spec_from_file_location('posehub_pack', MODULE)
pack = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pack)


class PackTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.src = self.root / 'source'
        self.src.mkdir()
        self.output = self.root / 'dist/media.zip'
        self.manifest_path = self.root / 'manifest.json'
        self.config_path = self.root / 'config.json'
        self.config_path.write_text(json.dumps({'src': str(self.src)}), encoding='utf-8')
        self.items = []
        for sid in ('a', 'b'):
            for ext, role in (('mp4', 'video'), ('jpg', 'poster')):
                content = f'{sid}-{role}'.encode()
                local = f'dark/{sid}.{ext}'
                (self.src / 'dark').mkdir(exist_ok=True)
                (self.src / local).write_bytes(content)
                self.items.append({'id': sid, 'variant': 'dark', 'role': role, 'kind': 'file',
                    'storage': 'archive' if sid == 'a' else 'r2', 'local': local,
                    'file': f'{sid}/{sid}.dark.{role}.1080.{ext}', 'bytes': len(content),
                    'sha256': hashlib.sha256(content).hexdigest()})
        # Missing local-only sources are intentionally not read or packed.
        self.items.extend([{'id': 'a', 'storage': 'local', 'kind': 'file', 'variant': 'greenscreen',
            'file': 'a/green.mp4', 'local': 'missing-green.mp4', 'bytes': 99, 'sha256': '0' * 64},
            {'id': 'a', 'storage': 'local', 'kind': 'frames', 'variant': 'alpha', 'local': 'missing-alpha/'}])
        self.manifest = {'schema': 1, 'releases': {'0.1.0': {'status': 'draft', 'items': self.items}}}

    def build(self, output=None):
        return pack.pack_release(self.manifest, '0.1.0', self.src, output or self.output)

    def test_full_members_hashes_metadata_and_no_local_masters(self):
        result = self.build()
        selected = [row for row in self.items if row['storage'] in ('archive', 'r2')]
        self.assertEqual(result['count'], 4)
        self.assertEqual(result['sha256'], hashlib.sha256(self.output.read_bytes()).hexdigest())
        self.assertEqual(Path(result['sidecar']).read_text(), f'{result["sha256"]}  media.zip\n')
        with zipfile.ZipFile(self.output) as archive:
            self.assertEqual(archive.namelist(), sorted(row['file'] for row in selected))
            self.assertFalse(any(name.startswith('v0.1.0/') or 'manifest.json' in name for name in archive.namelist()))
            for row in selected:
                self.assertEqual(hashlib.sha256(archive.read(row['file'])).hexdigest(), row['sha256'])
                info = archive.getinfo(row['file'])
                self.assertEqual((info.date_time, info.create_system, info.external_attr, info.compress_type),
                    (pack.FIXED_TIME, 3, pack.FILE_MODE, zipfile.ZIP_STORED))

    def test_reproducible_across_input_order_mtime_and_publication_metadata(self):
        first = self.build()
        original_mtime = self.output.stat().st_mtime_ns
        for path in self.src.rglob('*'):
            if path.is_file():
                path.touch()
        self.manifest['releases']['0.1.0'].update(status='published', archiveUrl='https://example.invalid/release.zip',
            publishedAt='2099-01-01T00:00:00Z')
        self.items.reverse()
        self.assertEqual(self.build(), first)
        self.assertEqual(self.output.stat().st_mtime_ns, original_mtime)
        second = self.build(self.root / 'another.zip')
        self.assertEqual(first['sha256'], second['sha256'])
        self.assertEqual(self.output.read_bytes(), (self.root / 'another.zip').read_bytes())

    def test_bad_source_does_not_replace_existing_zip_or_sidecar(self):
        result = self.build()
        before = self.output.read_bytes(), Path(result['sidecar']).read_bytes()
        (self.src / self.items[0]['local']).write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'match the manifest'):
            self.build()
        self.assertEqual((self.output.read_bytes(), Path(result['sidecar']).read_bytes()), before)

    def test_valid_different_release_refuses_existing_output(self):
        result = self.build()
        before = self.output.read_bytes(), Path(result['sidecar']).read_bytes()
        row = self.items[0]
        content = b'valid revised source'
        (self.src / row['local']).write_bytes(content)
        row.update(bytes=len(content), sha256=hashlib.sha256(content).hexdigest())
        with self.assertRaisesRegex(ValueError, 'different content'):
            self.build()
        self.assertEqual((self.output.read_bytes(), Path(result['sidecar']).read_bytes()), before)

    def test_unsafe_paths_and_duplicate_names_are_rejected(self):
        base = copy.deepcopy(self.items)
        for field in ('file', 'local'):
            for invalid in ('../escape', '/absolute', 'C:/absolute', 'a\\b', 'a/../b', './a', 'a//b'):
                with self.subTest(field=field, value=invalid):
                    self.items[:] = copy.deepcopy(base)
                    self.items[0][field] = invalid
                    with self.assertRaisesRegex(ValueError, 'unsafe'):
                        self.build()
        self.items[:] = copy.deepcopy(base)
        self.items[1]['file'] = self.items[0]['file'].upper()
        with self.assertRaisesRegex(ValueError, 'duplicate ZIP member'):
            self.build()
        self.assertFalse(self.output.exists())

    def test_symlink_outside_source_root_is_rejected_when_supported(self):
        outside = self.root / 'outside.mp4'
        outside.write_bytes((self.src / self.items[0]['local']).read_bytes())
        link = self.src / 'escaped.mp4'
        try:
            link.symlink_to(outside)
        except (OSError, NotImplementedError):
            self.skipTest('symlink creation is unavailable')
        self.items[0]['local'] = 'escaped.mp4'
        with self.assertRaisesRegex(ValueError, 'escaped'):
            self.build()

    def test_source_change_during_candidate_build_leaves_no_output(self):
        original = pack.build_candidate
        def mutate_then_build(path, items):
            items[0]['path'].write_bytes(b'raced source')
            return original(path, items)
        with patch.object(pack, 'build_candidate', side_effect=mutate_then_build):
            with self.assertRaisesRegex(ValueError, 'changed while packing'):
                self.build()
        self.assertFalse(self.output.exists())
        self.assertFalse(self.output.with_name('media.zip.sha256').exists())
        self.assertEqual(list(self.output.parent.iterdir()), [])

    def test_conflicting_sidecar_does_not_install_new_zip(self):
        self.output.parent.mkdir()
        sidecar = self.output.with_name('media.zip.sha256')
        sidecar.write_bytes(b'preserved existing checksum\n')
        with self.assertRaisesRegex(ValueError, 'different content'):
            self.build()
        self.assertFalse(self.output.exists())
        self.assertEqual(sidecar.read_bytes(), b'preserved existing checksum\n')

    def test_cli_config_and_src_override_do_not_modify_manifest(self):
        self.manifest_path.write_text(json.dumps(self.manifest), encoding='utf-8')
        before = self.manifest_path.read_bytes()
        argv = ['--version', '0.1.0', '--manifest', str(self.manifest_path), '--config', str(self.config_path),
            '--output', str(self.output)]
        stdout = io.StringIO()
        with contextlib.redirect_stdout(stdout):
            self.assertEqual(pack.main(argv), 0)
        self.assertEqual(json.loads(stdout.getvalue())['count'], 4)
        self.assertEqual(self.manifest_path.read_bytes(), before)
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(pack.main(['--version', '0.1.0', '--manifest', str(self.manifest_path),
                '--config', str(self.root / 'missing-config.json'), '--src', str(self.src),
                '--output', str(self.output)]), 0)


if __name__ == '__main__':
    unittest.main()
