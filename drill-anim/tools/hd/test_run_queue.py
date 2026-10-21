"""CPU-only queue scheduling/recovery tests; never run Node, GPU, or workers."""
from contextlib import ExitStack, redirect_stdout, redirect_stderr
import importlib.util
import io
import hashlib
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch


def load_queue():
    spec = importlib.util.spec_from_file_location("hd_queue_under_test", Path(__file__).with_name("run_queue.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class QueueTest(unittest.TestCase):
    def setUp(self):
        self.q = load_queue()
        tmp = tempfile.TemporaryDirectory(prefix="pose-queue-test-")
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.output = self.root / "batch"
        self.drills = {sid: {"id": sid, "media": {"status": "poster"}} for sid in ("office-custom-r2", "short-pose", "new-action")}
        self.a = SimpleNamespace(app=None, output=self.output, ids=list(self.drills), spec_overrides=None,
                                 theme=None, pr=2, reviewed_ids=set(), dry_run=False)

    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding="utf-8")

    def preview(self, sid):
        root = self.output / "preview-work"
        self.write(root / (sid + ".spec.json"), {"id": sid})
        self.write(root / sid / "fr/met-0000.json", {})
        (root / sid / "c").mkdir(parents=True, exist_ok=True)
        (root / sid / "c/still.png").write_bytes(b"CPU fixture; no image decode required")
        self.write(self.output / "preview-evidence" / (sid + ".json"), {"bound": True})

    def completed(self, sid, qa_pass=True):
        qa = {"pass": qa_pass, "fps": 30, "frames": 1, "frames_complete": True}
        self.write(self.output / "master/metrics" / (sid + ".json"), qa)
        source = self.output / "source-manifest.json"
        if not source.exists():
            self.write(source, {"fixture": True})
        alpha = self.output / "greenscreen/alpha" / sid / "m-0000.png"
        alpha.parent.mkdir(parents=True, exist_ok=True)
        alpha.write_bytes(b"bound alpha fixture")
        digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
        result = {"id": sid, "status": "green_media_complete", "composition_qa_pass": True,
                  "video_validation": {"full_cpu_decode": True}, "inherited_source_qa": qa,
                  "frames": 1, "fps": 30, "inputs": {"source-manifest.json": digest(source),
                    "master/metrics/" + sid + ".json": digest(self.output / "master/metrics" / (sid + ".json"))},
                  "outputs": {"alpha_0": {"path": "alpha/" + sid + "/m-0000.png", "bytes": alpha.stat().st_size, "sha256": digest(alpha)}}}
        self.write(self.output / "greenscreen/jobs" / sid / "result.json", result)
        return result

    def state(self):
        return self.q.read_json(self.output / "queue-status.json", strict=True)

    def saved(self, slots=None, item_status=None):
        _, selection, items, _ = self.q.saved_state(self.a, self.drills, {})
        for sid, status in (item_status or {}).items():
            items[sid]["status"] = status
        self.write(self.output / "queue-status.json", {"app": None, "output": str(self.output),
                   "selection": selection, "items": items, "slots": slots or []})

    def runtime(self, codes=None, start_error=False, disk_free=None, recovered=None, preflight=None, real_verifier=False):
        q = self.q
        calls, processes, watches = [], {}, []
        locked = {"value": False}
        recovered = recovered or {}
        test = self

        class Lock:
            def __init__(self, path):
                test.assertFalse(locked["value"])
                locked["value"] = True
            def close(self):
                locked["value"] = False

        def prepare(command, **kwargs):
            test.assertTrue(locked["value"], "prepare must hold OS manager lock")
            test.assertEqual(command[3], "prepare")
            calls.append(("prepare", command))
            return SimpleNamespace(returncode=0)

        class Child:
            def __init__(self, command, **kwargs):
                if start_error:
                    raise OSError("CPU fixture start failure")
                self.command = command
                self.pid = 1000 + len(processes)
                self.sid = command[command.index("--ids") + 1]
                self.stage = command[3]
                self.code = (codes or {}).get(self.sid, 0)
                processes[self.pid] = self
                calls.append(("worker", command))
            def poll(self):
                return self.code
            def wait(self):
                return self.code

        class Watch:
            def __init__(self, pid, expected_created=None):
                self.pid, self.created, self.polls = pid, expected_created or pid * 10, 0
                self.closed = False
                watches.append((pid, expected_created, self))
            def poll(self):
                self.polls += 1
                if self.pid in recovered:
                    sequence = recovered[self.pid]
                    return sequence[min(self.polls - 1, len(sequence) - 1)]
                child = processes[self.pid]
                if child.code == 0:
                    if child.stage == "preview":
                        test.preview(child.sid)
                    else:
                        test.completed(child.sid)
                        port = child.command[child.command.index("--port") + 1]
                        test.write(test.output / ("progress-" + port + ".json"), {"items": {child.sid: {"status": "pass"}}})
                return True, child.code
            def close(self):
                self.closed = True

        stack = ExitStack()
        stack.enter_context(patch.object(q, "InstanceLock", Lock))
        stack.enter_context(patch.object(q, "ProcessWatch", Watch))
        stack.enter_context(patch.object(q.subprocess, "run", side_effect=prepare))
        stack.enter_context(patch.object(q.subprocess, "Popen", Child))
        stack.enter_context(patch.object(q, "preflight", return_value=preflight or {"status": "ready", "checks_pass": True}))
        verifier = None
        if not real_verifier:
            verifier = stack.enter_context(patch.object(q, "verify_completed", side_effect=lambda output, sid:
                q.read_json(output / "greenscreen/jobs" / sid / "result.json", strict=True)))
        stack.enter_context(patch.object(q.shutil, "disk_usage", return_value=SimpleNamespace(free=disk_free if disk_free is not None else 10 ** 15)))
        stack.enter_context(patch.object(q.time, "sleep"))
        stack.enter_context(redirect_stdout(io.StringIO()))
        self.addCleanup(stack.close)
        return SimpleNamespace(calls=calls, processes=processes, watches=watches, locked=locked, verifier=verifier)

    def test_repo_and_qa_root_are_hub_relative(self):
        self.assertEqual(self.q.REPO, Path(__file__).resolve().parents[3])
        self.assertEqual(self.q.ROOT, self.q.REPO / "drill-anim")

    def test_dynamic_selector_import_has_no_pycache_or_sys_path_side_effect(self):
        driver = self.root / "render_batch.py"
        driver.write_text("def load_selection(app, output, ids, override_path):\n return ({s:{'id':s} for s in ids}, {})\n", encoding="utf-8")
        original_path, bytecode = list(sys.path), sys.dont_write_bytecode
        with patch.object(self.q, "BATCH", driver):
            drills, overrides = self.q.load_selection(None, self.output, ["any-hub-id"], None)
        self.assertEqual(list(drills), ["any-hub-id"])
        self.assertEqual(overrides, {})
        self.assertEqual(sys.path, original_path)
        self.assertEqual(sys.dont_write_bytecode, bytecode)
        self.assertFalse((self.root / "__pycache__").exists())

    def test_completed_helper_and_delegate_import_are_bytecode_read_only(self):
        driver = self.root / "render_batch.py"
        delegate = self.root / "frozen.py"
        delegate.write_text("VALUE = True\n", encoding="utf-8")
        driver.write_text("import importlib.util,sys\ndef verify_completed(output,sid):\n"
                          " assert sys.dont_write_bytecode\n"
                          " s=importlib.util.spec_from_file_location('fake_frozen',output/'frozen.py')\n"
                          " m=importlib.util.module_from_spec(s);s.loader.exec_module(m)\n"
                          " return {'inherited_source_qa':{'pass':m.VALUE}}\n", encoding="utf-8")
        paths, bytecode = list(sys.path), sys.dont_write_bytecode
        with patch.object(self.q, "BATCH", driver):
            result = self.q.verify_completed(self.root, "any")
        self.assertTrue(result["inherited_source_qa"]["pass"])
        self.assertEqual(sys.path, paths)
        self.assertEqual(sys.dont_write_bytecode, bytecode)
        self.assertFalse((self.root / "__pycache__").exists())

    def test_dry_run_arbitrary_ids_no_writes_commands_processes_or_lock(self):
        before = list(self.root.rglob("*"))
        original_open = Path.open
        def read_only(path, mode="r", *args, **kwargs):
            if any(flag in mode for flag in "wax+"):
                raise AssertionError("dry-run attempted write")
            return original_open(path, mode, *args, **kwargs)
        with (patch.object(self.q, "load_selection", return_value=(self.drills, {})),
              patch.object(Path, "open", read_only),
              patch.object(Path, "mkdir", side_effect=AssertionError("mkdir")),
              patch.object(self.q.subprocess, "run", side_effect=AssertionError("external command")),
              patch.object(self.q.subprocess, "Popen", side_effect=AssertionError("process")),
              patch.object(self.q.subprocess, "check_output", side_effect=AssertionError("external command")),
              patch.object(self.q, "InstanceLock", side_effect=AssertionError("lock")),
              patch.object(self.q, "verify_completed", side_effect=AssertionError("dry-run must not decode/verify")),
              redirect_stdout(io.StringIO()) as stream):
            self.assertEqual(self.q.main(["--output", str(self.output), "--ids", *self.drills, "--dry-run"]), 0)
        plan = json.loads(stream.getvalue())
        self.assertEqual({x["id"] for x in plan["queue"]}, set(self.drills))
        self.assertEqual(list(self.root.rglob("*")), before)
        self.assertIn("unverified", plan["preserved_status_verification"])

    def test_unknown_reviewed_id_is_rejected_without_output(self):
        with patch.object(self.q, "load_selection", return_value=(self.drills, {})), redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                self.q.main(["--output", str(self.output), "--reviewed-ids", "unknown", "--dry-run"])
        self.assertFalse(self.output.exists())

    def test_source_output_rejected_before_lock_or_prepare(self):
        with (patch.object(self.q, "load_selection", side_effect=AssertionError("selection must not run")),
              patch.object(self.q, "InstanceLock", side_effect=AssertionError("lock must not run")),
              redirect_stderr(io.StringIO())):
            with self.assertRaises(SystemExit):
                self.q.main(["--output", str(self.q.ROOT / "specs"), "--ids", "any", "--dry-run"])

    def test_requested_work_subset_does_not_queue_entire_app_manifest(self):
        sid = next(iter(self.drills))
        with (patch.object(self.q, "load_selection", return_value=(self.drills, {})),
              redirect_stdout(io.StringIO()) as stream):
            self.q.main(["--app", str(self.root / "app"), "--output", str(self.output), "--ids", sid, "--dry-run"])
        self.assertEqual([x["id"] for x in json.loads(stream.getvalue())["queue"]], [sid])
        self.assertFalse(self.output.exists())

    def test_approval_cannot_preapprove_not_yet_generated_preview(self):
        self.a.reviewed_ids = {next(iter(self.drills))}
        with self.assertRaisesRegex(ValueError, "already-existing bound previews"):
            self.q.saved_state(self.a, self.drills, {})
        self.assertFalse(self.output.exists())

    def test_no_approval_previews_then_preflight_and_waits(self):
        rt = self.runtime()
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 0)
        workers = [cmd for kind, cmd in rt.calls if kind == "worker"]
        self.assertEqual(len(workers), 3)
        self.assertTrue(all(cmd[3] == "preview" and "--reviewed" not in cmd and "--frames" not in cmd for cmd in workers))
        state = self.state()
        self.assertEqual(state["status"], "awaiting_review")
        self.assertTrue(all(row["status"] == "review_awaiting_approval" and row["preflight"]["checks_pass"] for row in state["items"].values()))
        self.assertFalse(rt.locked["value"])

    def test_approval_resume_renders_only_approved_and_keeps_terminal_review(self):
        for sid in self.drills:
            self.preview(sid)
        ids = list(self.drills)
        self.saved(item_status={ids[0]: "review_awaiting_approval", ids[1]: "review_awaiting_approval", ids[2]: "review"})
        self.a.reviewed_ids = {ids[0], ids[2]}
        rt = self.runtime()
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 0)
        workers = [cmd for kind, cmd in rt.calls if kind == "worker"]
        self.assertEqual(len(workers), 1)
        self.assertEqual(workers[0][3], "render")
        self.assertIn("--reviewed", workers[0])
        self.assertEqual(workers[0][workers[0].index("--ids") + 1], ids[0])
        state = self.state()
        self.assertEqual(state["items"][ids[0]]["status"], "pass")
        self.assertEqual(state["items"][ids[1]]["status"], "review_awaiting_approval")
        self.assertEqual(state["items"][ids[2]]["status"], "review")

    def test_unapproved_waiting_resume_is_noop_without_repreview(self):
        self.saved(item_status={sid: "review_awaiting_approval" for sid in self.drills})
        rt = self.runtime()
        self.q.run_queue(self.a, self.drills, {})
        self.assertFalse([x for x in rt.calls if x[0] == "worker"])

    def test_prepare_all_ids_under_lock_and_same_recipe_flags_on_each_worker(self):
        self.a.app = self.root / "optional-app"
        self.a.spec_overrides = self.root / "override.json"
        self.a.theme = "glow-soft"
        self.a.reviewed_ids = set(self.drills)
        for sid in self.drills:
            self.preview(sid)
        rt = self.runtime()
        self.q.run_queue(self.a, self.drills, {"new-action": self.root / "revision.js"})
        prepare = rt.calls[0][1]
        self.assertEqual(prepare[prepare.index("--ids") + 1:prepare.index("--pr")], list(self.drills))
        for _, cmd in rt.calls:
            for flag, value in (("--app", str(self.a.app)), ("--spec-overrides", str(self.a.spec_overrides)), ("--theme", self.a.theme)):
                self.assertEqual(cmd[cmd.index(flag) + 1], value)
        self.assertEqual({cmd[cmd.index("--port") + 1] for kind, cmd in rt.calls if kind == "worker"}, {"8860", "8861"})

    def test_nonzero_worker_stops_new_dispatch_and_drains_other_lane(self):
        for sid in self.drills:
            self.preview(sid)
        self.a.reviewed_ids = set(self.drills)
        first, second, third = self.drills
        rt = self.runtime(codes={first: 7})
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
        self.assertEqual(len(rt.processes), 2)
        state = self.state()
        self.assertEqual(state["status"], "failed_diagnosis")
        self.assertEqual(state["items"][first]["exit_code"], 7)
        self.assertEqual(state["items"][first]["status"], "failed_diagnosis")
        self.assertEqual(state["items"][second]["status"], "pass")
        self.assertEqual(state["items"][third]["status"], "pending")
        self.assertFalse(state["slots"])

    def test_start_error_stops_dispatch_without_retry(self):
        rt = self.runtime(start_error=True)
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
        self.assertEqual(self.state()["status"], "failed_diagnosis")
        self.assertEqual(self.state()["items"][next(iter(self.drills))]["reason"], "Worker start error; dispatch stopped")
        self.assertFalse(rt.processes)

    def test_failed_saved_worker_is_not_retried_even_with_pass_ledger(self):
        sid = next(iter(self.drills))
        self.saved(item_status={sid: "failed_diagnosis"})
        self.write(self.output / "progress-8860.json", {"items": {sid: {"status": "pass"}}})
        rt = self.runtime()
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
        self.assertFalse(rt.calls)
        self.assertEqual(self.state()["items"][sid]["status"], "failed_diagnosis")

    def test_low_disk_stops_dispatch_without_prepare(self):
        rt = self.runtime(disk_free=self.q.MIN_FREE - 1)
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 2)
        self.assertEqual(self.state()["status"], "paused_low_disk")
        self.assertFalse(rt.calls)

    def test_saved_worker_identity_restored_and_drained_when_low_disk(self):
        sid = next(iter(self.drills))
        slot = {"port": 8860, "pid": 99, "created": 123456, "stage": "render", "ids": [sid]}
        self.saved(slots=[slot], item_status={sid: "running"})
        self.write(self.output / "progress-8860.json", {"items": {sid: {"status": "pass"}}})
        rt = self.runtime(disk_free=0, recovered={99: [(False, None), (True, 0)]})
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 2)
        self.assertEqual(rt.watches[0][:2], (99, 123456))
        self.assertEqual(rt.watches[0][2].polls, 2)
        self.assertTrue(rt.watches[0][2].closed)
        self.assertEqual(self.state()["items"][sid]["status"], "pass")
        self.assertFalse(rt.calls)

    def test_saved_slot_missing_creation_time_refused(self):
        sid = next(iter(self.drills))
        self.saved(slots=[{"port": 8860, "pid": 99, "created": None, "stage": "render", "ids": [sid]}])
        with self.assertRaisesRegex(ValueError, "creation-time"):
            self.q.saved_state(self.a, self.drills, {})

    def test_changed_selection_recipe_refused(self):
        self.saved()
        self.a.theme = "other-theme"
        with self.assertRaisesRegex(ValueError, "new output"):
            self.q.saved_state(self.a, self.drills, {})

    def test_partial_preview_or_full_scratch_never_restarted(self):
        for stage in ("preview", "render"):
            with self.subTest(stage=stage):
                self.output = self.root / stage
                self.a.output = self.output
                sid = next(iter(self.drills))
                if stage == "render":
                    self.preview(sid)
                    self.a.reviewed_ids = {sid}
                self.write(self.output / ("preview-work" if stage == "preview" else "work") / sid / "fr/partial.json", {})
                rt = self.runtime()
                self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
                self.assertFalse(rt.processes)
                self.assertIn("Partial " + stage, self.state()["items"][sid]["reason"])

    def test_preflight_fail_remains_terminal_review_not_approval_wait(self):
        for sid in self.drills:
            self.preview(sid)
        self.a.reviewed_ids = set(self.drills)
        rt = self.runtime(preflight={"status": "review", "checks_pass": False, "failed_checks": ["pins.handR"]})
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 0)
        self.assertFalse(rt.processes)
        self.assertTrue(all(x["status"] == "review" for x in self.state()["items"].values()))

    def test_preflight_error_stops_entire_dispatch(self):
        for sid in self.drills:
            self.preview(sid)
        rt = self.runtime(preflight={"status": "error", "reason": "QA process failed"})
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
        self.assertFalse(rt.processes)

    def test_completed_qa_overrides_false_pass_ledger_and_is_cached_per_manager(self):
        sid = next(iter(self.drills))
        self.completed(sid, qa_pass=False)
        self.saved(item_status={sid: "pass"})
        self.write(self.output / "progress-8860.json", {"items": {sid: {"status": "pass", "qa_pass": True}}})
        rt = self.runtime()
        self.q.run_queue(self.a, self.drills, {})
        self.assertEqual(rt.verifier.call_count, 1)
        self.assertEqual(self.state()["items"][sid]["status"], "review")
        self.assertFalse(self.state()["items"][sid]["qa_pass"])
        self.assertTrue(self.state()["items"][sid]["completed_verification"]["verified"])
        self.q.run_queue(self.a, self.drills, {})
        self.assertEqual(rt.verifier.call_count, 2, "new manager must verify again; saved cache is not trusted")

    def test_completed_dry_run_reports_unverified_and_does_not_call_helper(self):
        sid = next(iter(self.drills))
        self.completed(sid)
        self.saved(item_status={sid: "pass"})
        original = {p: p.read_bytes() for p in self.output.rglob("*") if p.is_file()}
        with (patch.object(self.q, "load_selection", return_value=(self.drills, {})),
              patch.object(self.q, "verify_completed", side_effect=AssertionError("dry-run verification")),
              patch.object(self.q.subprocess, "run", side_effect=AssertionError("external command")),
              redirect_stdout(io.StringIO()) as stream):
            self.q.main(["--output", str(self.output), "--dry-run"])
        self.assertEqual(original, {p: p.read_bytes() for p in self.output.rglob("*") if p.is_file()})
        self.assertIn("unverified", json.loads(stream.getvalue())["preserved_status_verification"])

    def test_missing_full_result_is_not_confused_with_preflight_review(self):
        sid = next(iter(self.drills))
        self.saved(item_status={sid: "pass"})
        rt = self.runtime()
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
        self.assertEqual(self.state()["items"][sid]["status"], "failed_diagnosis")
        self.assertIn("missing", self.state()["items"][sid]["error"])
        self.assertFalse(rt.processes)

    def test_missing_previous_verified_review_result_is_rejected(self):
        sid = next(iter(self.drills))
        self.saved(item_status={sid: "review"})
        p = self.output / "queue-status.json"
        state = self.q.read_json(p)
        state["items"][sid]["completed_verification"] = {"verified": True}
        self.write(p, state)
        rt = self.runtime()
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
        self.assertEqual(self.state()["items"][sid]["status"], "failed_diagnosis")
        self.assertFalse(rt.processes)

    def test_real_driver_rejects_tampered_master_alpha_and_result_without_gpu_or_writes(self):
        for target in ("master", "alpha", "result"):
            with self.subTest(target=target):
                self.output = self.root / ("tamper-" + target)
                self.a.output = self.output
                sid = next(iter(self.drills))
                self.completed(sid)
                self.saved(item_status={sid: "pass"})
                if target == "master":
                    self.write(self.output / "master/metrics" / (sid + ".json"), {"pass": False})
                elif target == "alpha":
                    (self.output / "greenscreen/alpha" / sid / "m-0000.png").write_bytes(b"tampered pixels")
                else:
                    p = self.output / "greenscreen/jobs" / sid / "result.json"
                    result = self.q.read_json(p)
                    result["status"] = "incomplete"
                    self.write(p, result)
                preserved = {p: p.read_bytes() for p in self.output.rglob("*") if p.is_file() and p.name != "queue-status.json"}
                rt = self.runtime(real_verifier=True)
                self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
                row = self.state()["items"][sid]
                self.assertEqual(row["status"], "failed_diagnosis")
                expected = {"master": "Result input changed", "alpha": "Result output changed", "result": "Green result incomplete"}[target]
                self.assertIn(expected, row["error"])
                self.assertFalse(rt.processes)
                self.assertEqual([kind for kind, _ in rt.calls], ["prepare"], "only mocked CPU prepare; no renderer/export subprocess")
                for p, value in preserved.items():
                    self.assertEqual(p.read_bytes(), value, "verification must not rewrite source/result/media")

    def test_verification_failure_drains_saved_other_lane_without_new_dispatch(self):
        first, second, third = self.drills
        self.completed(first)
        self.completed(second)
        self.saved(slots=[{"port": 8860, "pid": 99, "created": 111, "stage": "render", "ids": [second]}],
                   item_status={first: "pass", second: "running"})
        self.write(self.output / "progress-8860.json", {"items": {second: {"status": "pass"}}})
        rt = self.runtime(recovered={99: [(False, None), (True, 0)]})
        real = rt.verifier.side_effect
        def verify(output, sid):
            if sid == first:
                raise ValueError("CPU decode/recipe mismatch")
            return real(output, sid)
        rt.verifier.side_effect = verify
        self.assertEqual(self.q.run_queue(self.a, self.drills, {}), 1)
        state = self.state()
        self.assertEqual(state["items"][first]["status"], "failed_diagnosis")
        self.assertEqual(state["items"][second]["status"], "pass")
        self.assertEqual(state["items"][third]["status"], "pending")
        self.assertEqual(rt.watches[0][2].polls, 2)
        self.assertFalse(rt.processes)

    def test_preflight_uses_original_hub_qa_and_keeps_failures(self):
        sid = next(iter(self.drills))
        self.preview(sid)
        directory = self.output / "preview-work" / sid
        self.write(directory / "c/edge-0000.json", {})
        qa = {"frames": 3, "frames_complete": False, "below_floor": False,
              "pins": {"handR": {"ok": False}}, "straight": {}, "hand_clip": {},
              "limits": {key: True for key in ("knee_flex_backward", "elbow_flex_forward", "hip_ok", "waist_ok")},
              "self_clip": {"ok": True}, "frame_edge_touch_frames": 0}
        def run(cmd, **kwargs):
            self.assertEqual(cmd[1], str(self.q.ROOT / "lib/qa.py"))
            self.write(Path(cmd[4]), qa)
            return SimpleNamespace(returncode=0)
        log = self.root / "preflight.log"
        with patch.object(self.q.subprocess, "run", side_effect=run):
            result = self.q.preflight(self.output, sid, log)
        self.assertEqual(result["status"], "review")
        self.assertEqual(result["failed_checks"], ["pins.handR"])
        self.assertFalse(result["frames_complete"])

    def test_process_watch_reused_pid_closes_read_only_handle(self):
        kernel = SimpleNamespace(OpenProcess=Mock(return_value=123), GetProcessTimes=Mock(),
                                 CloseHandle=Mock(), WaitForSingleObject=Mock(), GetExitCodeProcess=Mock())
        def times(handle, created, *other):
            created._obj.dwLowDateTime = 222
            created._obj.dwHighDateTime = 0
            return 1
        kernel.GetProcessTimes.side_effect = times
        with patch.object(self.q.ctypes, "WinDLL", return_value=kernel, create=True):
            watch = self.q.ProcessWatch(77, expected_created=111)
        kernel.OpenProcess.assert_called_once_with(0x00100000 | 0x1000, False, 77)
        kernel.CloseHandle.assert_called_once_with(123)
        self.assertEqual(watch.created, 222)
        self.assertEqual(watch.poll(), (True, None))
        kernel.WaitForSingleObject.assert_not_called()


if __name__ == "__main__":
    unittest.main()
