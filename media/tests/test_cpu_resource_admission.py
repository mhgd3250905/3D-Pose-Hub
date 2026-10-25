"""Atomic resource-admission checks; no heavy processes or production locks."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

here = Path(__file__).resolve().parent
repo_tools = here.parent / 'tools'
sys.path.insert(0, str(repo_tools))
import run_app_test_exports as queue

GiB = 1024 ** 3


class CpuResourceAdmissionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='posehub-admission-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.own = self.root / 'cpu-heavy.lock'; self.peer = self.root / 'heavy.lock'
        self.guard = self.root / 'resource-admission.lock'
        self.gate = queue.HeavySlot(self.own, peer_path=self.peer, admission_path=self.guard)
        self.memory = {'availableCommitBytes': 10 * GiB, 'availablePhysicalBytes': 12 * GiB}
        self.mock_memory = patch.object(queue, 'available_memory_bytes', return_value=self.memory)
        self.mock_memory.start(); self.addCleanup(self.mock_memory.stop)
        self.mock_pid = patch.object(queue, 'pid_alive', return_value=True)
        self.mock_pid.start(); self.addCleanup(self.mock_pid.stop)

    def put(self, path, role, **fields):
        row = {'pid': os.getpid(), 'role': role, 'action': 'peer-action', **fields}
        path.write_text(json.dumps(row), encoding='utf-8')
        return row

    def test_one_cpu_plus_live_gpu_and_marker_are_allowed_at_parallel_threshold(self):
        peer = self.put(self.peer, 'gpu')  # Legacy GPU task owners need not have a token.
        marker = self.put(self.root / 'gpu-wants-slot.json', 'gpu')
        self.assertEqual(self.gate.try_acquire('cpu-action'), (None, None))
        self.assertEqual(queue.read_json(self.own)['role'], 'cpu')
        self.assertEqual(queue.read_json(self.peer), peer)
        self.assertEqual(queue.read_json(self.root / 'gpu-wants-slot.json'), marker)
        self.assertFalse(self.guard.exists())
        other_cpu = queue.HeavySlot(self.own, peer_path=self.peer, admission_path=self.guard)
        self.assertEqual(other_cpu.try_acquire('second-cpu')[0], 'awaiting-cpu-role-slot')
        self.assertFalse(self.guard.exists())
        self.gate.release()
        self.assertFalse(self.own.exists()); self.assertEqual(queue.read_json(self.peer), peer)

    def test_low_parallel_memory_waits_then_naturally_runs_solo(self):
        self.put(self.peer, 'gpu')
        for commit, physical in [(7 * GiB, 10 * GiB), (10 * GiB, 5 * GiB)]:
            with self.subTest(commit=commit, physical=physical), patch.object(queue, 'available_memory_bytes',
                    return_value={'availableCommitBytes': commit, 'availablePhysicalBytes': physical}):
                self.assertEqual(self.gate.try_acquire('cpu-action')[0], 'available-memory-below-admission-threshold')
                self.assertFalse(self.own.exists()); self.assertFalse(self.guard.exists())
        self.peer.unlink()
        with patch.object(queue, 'available_memory_bytes',
                          return_value={'availableCommitBytes': 4 * GiB, 'availablePhysicalBytes': 2 * GiB}):
            self.assertEqual(self.gate.try_acquire('cpu-solo'), (None, None))
        self.gate.release(); self.assertFalse(self.guard.exists())

    def test_gpu_priority_applies_only_before_gpu_is_active(self):
        self.put(self.root / 'gpu-wants-slot.json', 'gpu')
        self.assertEqual(self.gate.try_acquire('cpu-action')[0], 'awaiting-gpu-priority')
        self.assertFalse(self.own.exists()); self.assertFalse(self.guard.exists())
        self.put(self.peer, 'gpu')
        self.assertEqual(self.gate.try_acquire('cpu-overlap'), (None, None))
        self.gate.release()

    def test_admission_cas_contention_and_unknown_owners_are_preserved(self):
        guard = self.put(self.guard, 'admission', token='another-gate')
        self.assertEqual(self.gate.try_acquire('cpu-action')[0], 'awaiting-resource-admission')
        self.assertEqual(queue.read_json(self.guard), guard); self.assertFalse(self.own.exists())
        self.guard.unlink()
        dead = self.put(self.peer, 'gpu', pid=99999999)
        with patch.object(queue, 'pid_alive', return_value=False):
            state, detail = self.gate.try_acquire('cpu-action')
        self.assertEqual(state, 'awaiting-gpu-lock-inspection'); self.assertEqual(detail['state'], 'dead')
        self.assertEqual(queue.read_json(self.peer), dead); self.assertFalse(self.guard.exists())
        self.peer.write_text('{partial', encoding='utf-8')
        self.assertEqual(self.gate.try_acquire('cpu-action')[0], 'awaiting-gpu-lock-inspection')
        self.assertEqual(self.peer.read_text(encoding='utf-8'), '{partial')
        self.assertFalse(self.guard.exists())

    def test_guard_is_held_across_both_probes_and_claim_then_released(self):
        calls = []
        def probe():
            calls.append(queue.read_json(self.guard))
            self.assertEqual(calls[-1]['role'], 'admission')
            self.assertEqual(calls[-1]['action'], 'cpu-action')
            if len(calls) == 2:
                self.assertTrue(self.own.exists())
            return self.memory
        with patch.object(queue, 'available_memory_bytes', side_effect=probe):
            self.assertEqual(self.gate.try_acquire('cpu-action'), (None, None))
        self.assertEqual(len(calls), 2); self.assertFalse(self.guard.exists())
        self.gate.release()

    def test_post_claim_memory_drop_rolls_back_only_owned_lock(self):
        peer = self.put(self.peer, 'gpu')
        low = {'availableCommitBytes': 7 * GiB, 'availablePhysicalBytes': 12 * GiB}
        with patch.object(queue, 'available_memory_bytes', side_effect=[self.memory, low]):
            self.assertEqual(self.gate.try_acquire('cpu-action')[0], 'available-memory-dropped-during-admission')
        self.assertFalse(self.own.exists()); self.assertFalse(self.guard.exists())
        self.assertEqual(queue.read_json(self.peer), peer)

    def test_foreign_guard_token_is_not_removed_and_probe_errors_release_own_guard(self):
        original = {'pid': os.getpid(), 'role': 'admission', 'token': 'mine', 'action': 'cpu-action'}
        other = {**original, 'token': 'foreign'}
        self.guard.write_text(json.dumps(other), encoding='utf-8')
        self.assertFalse(self.gate.release_admission(original))
        self.assertEqual(queue.read_json(self.guard), other)
        self.guard.unlink()
        with patch.object(queue, 'available_memory_bytes', side_effect=OSError('probe failed')):
            with self.assertRaisesRegex(OSError, 'probe failed'):
                self.gate.try_acquire('cpu-action')
        self.assertFalse(self.guard.exists()); self.assertFalse(self.own.exists())

    def test_legacy_single_lane_stays_exclusive_without_overlap_arguments(self):
        legacy = queue.HeavySlot(self.peer)
        with patch.object(queue, 'available_commit_bytes', return_value=4 * GiB):
            self.assertEqual(legacy.try_acquire('legacy-cpu'), (None, None))
        other = queue.HeavySlot(self.peer)
        self.assertEqual(other.try_acquire('other-cpu')[0], 'awaiting-heavy-slot')
        self.assertFalse(self.guard.exists()); legacy.release()

    def test_node_and_python_share_guard_and_prevent_two_low_memory_starts(self):
        module = here / 'gpu-resource-admission.mjs'
        if not module.is_file():
            module = here.parents[1] / 'tools/app-test-pack/gpu-resource-admission.mjs'
        node = shutil.which('node')
        if node is None or not module.is_file():
            self.skipTest('Node resource admission helper is not available')
        def node_attempt():
            config = {'ownFile': str(self.peer), 'peerFile': str(self.own),
                      'guardFile': str(self.guard), 'action': 'gpu-action', 'stage': 'unit-test'}
            code = ('const {tryGpuAdmission}=await import(' + json.dumps(module.as_uri()) + ');\n'
                    'const result=await tryGpuAdmission({...'+json.dumps(config)+',probe:async()=>('
                    + json.dumps({'availableCommitBytes': 6 * GiB, 'availablePhysicalBytes': 10 * GiB})
                    + ')});console.log(JSON.stringify(result));')
            result = subprocess.run([node, '--input-type=module', '-'], input=code,
                                    capture_output=True, text=True, check=True, timeout=15)
            return json.loads(result.stdout)
        observations = []
        def probe():
            observations.append(node_attempt())
            self.assertFalse(observations[-1]['admitted'])
            self.assertEqual(observations[-1]['wait']['reason'], 'awaiting-resource-admission')
            return {'availableCommitBytes': 6 * GiB, 'availablePhysicalBytes': 10 * GiB}
        with patch.object(queue, 'available_memory_bytes', side_effect=probe):
            self.assertEqual(self.gate.try_acquire('cpu-action'), (None, None))
        self.assertEqual(len(observations), 2)
        self.assertTrue(self.own.exists()); self.assertFalse(self.peer.exists()); self.assertFalse(self.guard.exists())
        late_gpu = node_attempt()
        self.assertFalse(late_gpu['admitted'])
        self.assertEqual(late_gpu['wait']['reason'], 'available-memory-below-admission-threshold')
        self.assertFalse(self.peer.exists()); self.assertFalse(self.guard.exists())
        self.gate.release()


if __name__ == '__main__':
    unittest.main(verbosity=2)
