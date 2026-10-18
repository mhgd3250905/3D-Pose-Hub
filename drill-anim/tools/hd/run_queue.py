"""Recoverable two-lane Pose-Hub render queue with explicit preview approval.

Use --dry-run for read-only planning, without writes or external commands.
Unapproved IDs stop after preview and original preflight. Resume with
--reviewed-ids ID ... only after actually reviewing those preview images.
Existing workers are monitored by PID plus creation time, never terminated.
"""
from __future__ import annotations

import argparse
import ctypes
from ctypes import wintypes
from datetime import datetime
import json
import importlib.util
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time


REPO = Path(__file__).resolve().parents[3]
ROOT = REPO / "drill-anim"
BATCH = Path(__file__).with_name("render_batch.py")
PORTS = (8860, 8861)
TERMINAL = {"pass", "review", "error", "failed_diagnosis", "review_awaiting_approval"}
MIN_FREE = 15 * 1024 ** 3


def now():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def read_json(path, strict=False):
    for attempt in range(3):
        try:
            return json.loads(path.read_text(encoding="utf-8-sig"))
        except FileNotFoundError:
            return None
        except (OSError, ValueError):
            if attempt < 2:
                time.sleep(0.05)
            elif strict:
                raise
    return None


def write_json(path, value):
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


class ProcessWatch:
    """Read-only Windows process handle, including identity to detect PID reuse."""

    def __init__(self, pid, expected_created=None):
        if os.name != "nt":
            raise RuntimeError("Process monitoring requires Windows; --dry-run is portable")
        self.pid, self.handle, self.created = int(pid), None, None
        kernel = self.kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
        kernel.GetExitCodeProcess.restype = wintypes.BOOL
        kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        kernel.WaitForSingleObject.restype = wintypes.DWORD
        kernel.GetProcessTimes.argtypes = [wintypes.HANDLE] + [ctypes.POINTER(wintypes.FILETIME)] * 4
        kernel.GetProcessTimes.restype = wintypes.BOOL
        kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        kernel.CloseHandle.restype = wintypes.BOOL
        self.handle = kernel.OpenProcess(0x00100000 | 0x1000, False, self.pid)
        if not self.handle:
            error = ctypes.get_last_error()
            if error in (87, 1168):
                return
            raise ctypes.WinError(error)
        times = [wintypes.FILETIME() for _ in range(4)]
        if not kernel.GetProcessTimes(self.handle, *[ctypes.byref(t) for t in times]):
            error = ctypes.get_last_error()
            self.close()
            raise ctypes.WinError(error)
        self.created = (times[0].dwHighDateTime << 32) | times[0].dwLowDateTime
        if expected_created is not None and self.created != expected_created:
            self.close()  # The original process ended and its PID was reused.

    def poll(self):
        if not self.handle:
            return True, None
        result = self.kernel.WaitForSingleObject(self.handle, 0)
        if result == 258:
            return False, None
        if result != 0:
            raise ctypes.WinError(ctypes.get_last_error())
        code = wintypes.DWORD()
        if not self.kernel.GetExitCodeProcess(self.handle, ctypes.byref(code)):
            raise ctypes.WinError(ctypes.get_last_error())
        return True, code.value

    def close(self):
        if self.handle:
            self.kernel.CloseHandle(self.handle)
            self.handle = None


class InstanceLock:
    """OS releases this lock after a crash; a second manager cannot dispatch."""

    def __init__(self, path):
        import msvcrt
        self.file = path.open("a+b")
        self.file.seek(0, 2)
        if self.file.tell() == 0:
            self.file.write(b"0")
            self.file.flush()
        self.file.seek(0)
        try:
            msvcrt.locking(self.file.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            self.file.close()
            raise RuntimeError("Another queue manager holds this batch lock") from None

    def close(self):
        self.file.close()


def outputs(output, sid):
    master = output / "master"
    paths = [master / (sid + ext) for ext in (".mp4", ".gif", "-sheet.png")]
    paths.append(master / "metrics" / (sid + ".json"))
    return [str(path) for path in paths if path.exists()]


def progress(output):
    results = {}
    for path in sorted(output.glob("progress*.json")):
        data = read_json(path)
        if not isinstance(data, dict) or not isinstance(data.get("items"), dict):
            continue
        for sid, item in data["items"].items():
            if not isinstance(item, dict):
                continue
            previous = results.get(sid, {})
            if previous.get("status") not in ("pass", "review") or item.get("status") == "pass":
                results[sid] = {**item, "progress_file": str(path)}
    return results


def reconcile(items, output, evidence, protected):
    for sid, row in items.items():
        if sid in protected or row.get("status") in ("error", "failed_diagnosis"):
            continue
        observed = evidence.get(sid, {})
        if observed.get("status") in ("error", "failed_diagnosis"):
            row.update(observed, status="failed_diagnosis", reason="Saved worker failure requires diagnosis")
        elif observed.get("status") in ("pass", "review"):
            row.update(observed, preserved=True)
        elif row.get("status") in TERMINAL:
            continue
        elif existing := outputs(output, sid):
            row.update(status="review", preserved=True, reason="Existing outputs preserved; acceptance not established", outputs=existing)


def queue_order(drills):
    return sorted(drills, key=lambda sid: drills[sid].get("media", {}).get("status") == "video")


def finish(sid, row, output, evidence, code):
    observed = evidence.get(sid, {})
    existing = outputs(output, sid)
    if code not in (None, 0):
        row.update(status="failed_diagnosis", reason="Worker exited unsuccessfully; dispatch stopped")
    elif observed.get("status") in ("pass", "review"):
        row.update(observed)
    elif observed.get("status") in ("error", "failed_diagnosis"):
        row.update(observed, status="failed_diagnosis", reason="Worker reported failure; dispatch stopped")
    elif existing:
        row.update(status="review", reason="Worker ended with preserved outputs but no completed QA record", outputs=existing)
    else:
        row.update(status="failed_diagnosis", reason="Worker ended without completed outputs or QA record")
    row.update(exit_code=code, finished=now())


def preview_ready(output, sid):
    root = output / "preview-work"
    return ((root / sid / "c" / "still.png").is_file()
            and (root / (sid + ".spec.json")).is_file()
            and any((root / sid / "fr").glob("met-*.json"))
            and (output / "preview-evidence" / (sid + ".json")).is_file())


def scratch_present(output, sid, stage):
    root = output / ("preview-work" if stage == "preview" else "work")
    directory = root / sid
    return (directory.is_dir() and any(directory.iterdir())) or (root / (sid + ".spec.json")).exists()


def preflight(output, sid, logfile):
    """Run original QA, preserving its thresholds; omit only full-loop completeness."""
    root = output / "preview-work"
    directory = root / sid
    result_path = directory / "queue-preflight.json"
    command = [sys.executable, str(ROOT / "lib/qa.py"), str(directory / "fr"),
               str(root / (sid + ".spec.json")), str(result_path), str(directory / "c")]
    try:
        with logfile.open("ab", buffering=0) as stream:
            stream.write(("\nQUEUE_PREFLIGHT " + now() + "\n").encode("utf-8"))
            result = subprocess.run(command, cwd=REPO, stdout=stream, stderr=subprocess.STDOUT,
                timeout=30, creationflags=subprocess.CREATE_NO_WINDOW,
                env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"})
        if result.returncode:
            return {"status": "error", "reason": "Preview QA process failed", "exit_code": result.returncode}
        qa = read_json(result_path, strict=True)
        if not isinstance(qa, dict):
            raise ValueError("Preview QA produced no result")
        # Exactly the booleans used by qa.py's final pass expression. Its full-loop
        # frames_complete flag is expected to be false for three-frame previews.
        required = ("below_floor", "pins", "straight", "limits", "self_clip", "hand_clip", "frame_edge_touch_frames", "frames_complete")
        if any(key not in qa for key in required) or qa.get("frames", 0) < 3:
            raise ValueError("Preview QA is incomplete")
        failures = []
        if qa["below_floor"]:
            failures.append("below_floor")
        if qa["frame_edge_touch_frames"]:
            failures.append("frame_edge_touch_frames")
        for group in ("pins", "straight", "hand_clip"):
            for name, check in qa[group].items():
                if isinstance(check, dict) and check.get("ok") is False:
                    failures.append(group + "." + name)
        for key in ("knee_flex_backward", "elbow_flex_forward", "hip_ok", "waist_ok"):
            if qa["limits"].get(key) is not True:
                failures.append("limits." + key)
        if qa["self_clip"].get("ok") is not True:
            failures.append("self_clip")
        if not any((directory / "c").glob("edge-*.json")):
            failures.append("missing_frame_edge_evidence")
        return {"status": "review" if failures else "ready", "checks_pass": not failures,
                "failed_checks": failures, "frames_complete": qa["frames_complete"],
                "frames": qa["frames"], "metrics": str(result_path), "checked": now(),
                "scope": "Preview samples only; full-loop QA required after rendering"}
    except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
        return {"status": "error", "reason": "Preview QA could not complete: " + str(exc)}


def load_driver():
    """Import a sibling without sys.path pollution or bytecode writes."""
    spec = importlib.util.spec_from_file_location("pose_hub_queue_selection", BATCH)
    module = importlib.util.module_from_spec(spec)
    previous = sys.dont_write_bytecode
    try:
        sys.dont_write_bytecode = True
        spec.loader.exec_module(module)
    finally:
        sys.dont_write_bytecode = previous
    return module


def load_selection(app, output, ids, override_path):
    return load_driver().load_selection(app, output, ids, override_path)


def verify_completed(output, sid):
    # The driver requires an existing result before invoking the frozen
    # exporter's read-only reuse branch. Never call any rendering stage here.
    previous = sys.dont_write_bytecode
    try:
        sys.dont_write_bytecode = True
        return load_driver().verify_completed(output, sid)
    finally:
        sys.dont_write_bytecode = previous


def verify_completions(items, output, protected, verified, prepared):
    """Recheck once per manager; an old ledger cannot override real source QA."""
    for sid, row in items.items():
        if sid in protected or row.get("status") not in ("pass", "review"):
            continue
        result_path = output / "greenscreen" / "jobs" / sid / "result.json"
        prior_check = row.get("completed_verification") or {}
        claims_full = (row["status"] == "pass" or row.get("stage") == "render"
                       or any(key in row for key in ("decode_pass", "qa_pass", "green_result"))
                       or prior_check.get("verified") is True)
        if not result_path.is_file() and not claims_full:
            # Preflight rejection is terminal review, not a completed product.
            continue
        if not prepared:
            row["completed_verification"] = {"verified": False, "reason": "Batch prepare not verified in this manager; no acceptance implied"}
            continue
        try:
            if sid not in verified:
                if not result_path.is_file():
                    raise ValueError("Completed green result is missing")
                result = verify_completed(output, sid)
                passed = result["inherited_source_qa"]["pass"]
                if type(passed) is not bool:
                    raise ValueError("Completed result lacks a boolean original QA pass")
                with result_path.open("rb") as stream:
                    result_sha = hashlib.file_digest(stream, "sha256").hexdigest()
                verified[sid] = {"status": "pass" if passed else "review", "qa_pass": passed,
                                 "completed_verification": {"verified": True, "result_sha256": result_sha,
                                    "checked": now(), "scope": "Current manager: driver input/output/alpha SHA and recipe validation plus full CPU decode; no new export or GPU"}}
            row.update(verified[sid])
        except Exception as exc:
            row.update(status="failed_diagnosis", reason="Completed result verification failed; dispatch stopped",
                       error=str(exc), completed_verification={"verified": False, "checked": now()}, finished=now())


def command_for(a, stage, ids, port=None):
    command = [sys.executable, "-u", str(BATCH), stage, "--output", str(a.output), "--ids", *ids, "--pr", str(a.pr)]
    if a.app:
        command += ["--app", str(a.app)]
    if a.spec_overrides:
        command += ["--spec-overrides", str(a.spec_overrides)]
    if a.theme:
        command += ["--theme", a.theme]
    if port is not None:
        command += ["--port", str(port)]
    if stage == "render":
        command.append("--reviewed")
    return command


def saved_state(a, drills, overrides):
    for sid in a.reviewed_ids:
        if not preview_ready(a.output, sid):
            raise ValueError("--reviewed-ids requires already-existing bound previews; run preview and inspect before approval: " + sid)
    previous = read_json(a.output / "queue-status.json", strict=True) or {}
    selection = {"ids": list(drills), "overrides": {k: str(v) for k, v in sorted(overrides.items())},
                 "theme": a.theme, "pixel_ratio": a.pr,
                 "override_path": str(a.spec_overrides) if a.spec_overrides else None}
    if previous and (previous.get("app") != (str(a.app) if a.app else None)
                     or previous.get("output") != str(a.output)
                     or previous.get("selection") != selection):
        raise ValueError("Saved queue selection/app/theme differs; preserve this batch and use a new output")
    items = {sid: {"status": "pending", "original_app_status": row.get("media", {}).get("status"),
                   **previous.get("items", {}).get(sid, {})} for sid, row in drills.items()}
    slots = previous.get("slots", [])
    seen = set()
    for record in slots:
        if (record.get("port") not in PORTS or record["port"] in seen
                or not isinstance(record.get("pid"), int) or record["pid"] <= 0
                or not isinstance(record.get("created"), int) or record["created"] <= 0
                or record.get("stage") not in ("preview", "render")
                or not isinstance(record.get("ids"), list) or len(record["ids"]) != 1
                or record["ids"][0] not in items):
            raise ValueError("Saved slot lacks a safe PID/creation-time/stage/ID identity; manual diagnosis required")
        seen.add(record["port"])
    protected = {sid for slot in slots for sid in slot["ids"]}
    if len(protected) != len(slots):
        raise ValueError("Saved worker slots claim the same action")
    reconcile(items, a.output, progress(a.output), protected)
    for sid in a.reviewed_ids:
        row = items[sid]
        if sid not in protected and row.get("status") == "review_awaiting_approval":
            row.update(status="pending", reason="Explicit preview approval supplied on resume")
    return previous, selection, items, slots


def worker_options():
    return {"cwd": REPO, "creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0),
            "env": {**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}}


def run_queue(a, drills, overrides):
    # Creation of the lock file is the first mutation; dry-run never calls here.
    a.output.mkdir(parents=True, exist_ok=True)
    lock = InstanceLock(a.output / "queue-manager.lock")
    active, handles, verified = {}, {}, {}
    state = None
    try:
        previous, selection, items, saved_slots = saved_state(a, drills, overrides)
        logs = a.output / "queue-logs"
        logs.mkdir(exist_ok=True)
        state = {"schema": 2, "app": str(a.app) if a.app else None, "output": str(a.output),
                 "selection": selection, "manager_pid": os.getpid(), "started": previous.get("started", now()),
                 "resumed": now(), "items": items, "ports": list(PORTS), "minimum_free_bytes": MIN_FREE,
                 "status": "running", "slots": saved_slots, "reviewed_ids": sorted(a.reviewed_ids)}
        status_path = a.output / "queue-status.json"

        def save():
            protected = {sid for slot in active.values() for sid in slot["record"]["ids"]}
            state.update(updated=now(), slots=[slot["record"] for slot in active.values()],
                         pending=[sid for sid in queue_order(drills) if sid not in protected and items[sid]["status"] not in TERMINAL])
            state["counts"] = {name: sum(row["status"] == name for row in items.values())
                               for name in ("pending", "running", "pass", "review", "review_awaiting_approval", "error", "failed_diagnosis")}
            write_json(status_path, state)

        # Open all saved identities before any prepare or new worker. A recovered
        # manager never signals or restarts these processes.
        for record in saved_slots:
            watch = ProcessWatch(record["pid"], record["created"])
            handles[record["port"]] = watch
            active[record["port"]] = {"record": record, "watch": watch}
        halted = any(row["status"] in ("error", "failed_diagnosis") for row in items.values())
        low_disk = shutil.disk_usage(a.output).free < MIN_FREE
        prepared = False
        if not halted and not low_disk:
            # Prepare the full immutable selection while holding the manager OS
            # lock; subsequent single-ID workers repeat the same selection flags.
            try:
                subprocess.run(command_for(a, "prepare", list(drills)), check=True, **worker_options())
                prepared = True
            except (OSError, subprocess.CalledProcessError) as exc:
                halted = True
                state.update(reason="Batch prepare failed; no new workers dispatched", error=str(exc))
        verify_completions(items, a.output, {sid for slot in active.values() for sid in slot["record"]["ids"]}, verified, prepared)
        halted |= any(row["status"] in ("error", "failed_diagnosis") for row in items.values())
        save()
        while True:
            evidence = progress(a.output)
            for port, slot in list(active.items()):
                process = slot.get("process")
                if slot.get("watch"):
                    done, code = slot["watch"].poll()
                else:
                    code = process.poll()
                    done = code is not None
                if not done:
                    continue
                if process is not None:
                    code = process.wait()
                if slot.get("log"):
                    slot["log"].close()
                for sid in slot["record"]["ids"]:
                    row = items[sid]
                    if slot["record"]["stage"] == "preview":
                        if code in (None, 0) and preview_ready(a.output, sid):
                            row.update(status="pending", preview_finished=now())
                        else:
                            row.update(status="failed_diagnosis", reason="Preview failed or lacks complete bound sample evidence", exit_code=code, finished=now())
                    else:
                        # The ledger can be committed between the loop's read
                        # and process exit. Read it again after observing exit.
                        finish(sid, row, a.output, progress(a.output), code)
                    if row["status"] in ("error", "failed_diagnosis"):
                        halted = True
                        state["reason"] = "Worker failure requires diagnosis; existing lane allowed to finish"
                    print("QUEUE_RESULT", sid, row["status"], flush=True)
                if slot.get("watch"):
                    slot["watch"].close()
                handles.pop(port, None)
                del active[port]
            protected = {sid for slot in active.values() for sid in slot["record"]["ids"]}
            reconcile(items, a.output, evidence, protected)
            verify_completions(items, a.output, protected, verified, prepared)
            if any(row["status"] in ("error", "failed_diagnosis") for row in items.values()):
                halted = True
            pending = [sid for sid in queue_order(drills) if sid not in protected and items[sid]["status"] not in TERMINAL]
            state["free_bytes"] = shutil.disk_usage(a.output).free
            if state["free_bytes"] < MIN_FREE:
                low_disk = True
                state["reason"] = "Less than 15 GiB free; dispatch stopped, existing workers allowed to finish"
            if not halted and not low_disk:
                for port in PORTS:
                    if port in active:
                        continue
                    while pending:
                        sid = pending.pop(0)
                        reconcile(items, a.output, progress(a.output), protected)
                        verify_completions(items, a.output, protected, verified, prepared)
                        row = items[sid]
                        if any(x["status"] in ("error", "failed_diagnosis") for x in items.values()):
                            halted = True
                            break
                        if row["status"] in TERMINAL:
                            continue
                        logfile = logs / (sid + ".log")
                        stage = "preview"
                        if preview_ready(a.output, sid):
                            checked = preflight(a.output, sid, logfile)
                            row["preflight"] = checked
                            if checked["status"] != "ready":
                                row.update(status="failed_diagnosis" if checked["status"] == "error" else "review",
                                           reason="Preflight prevented full-loop rendering", finished=now())
                                if row["status"] == "failed_diagnosis":
                                    halted = True
                                    break
                                continue
                            if sid not in a.reviewed_ids:
                                row.update(status="review_awaiting_approval", reason="review_awaiting_approval",
                                           review_evidence=str(a.output / "preview-evidence" / (sid + ".json")), finished=now())
                                continue
                            stage = "render"
                        if scratch_present(a.output, sid, stage):
                            row.update(status="failed_diagnosis", reason="Partial " + stage + " scratch preserved; use diagnosis/new batch, never automatically rerender")
                            halted = True
                            break
                        if shutil.disk_usage(a.output).free < MIN_FREE:
                            low_disk = True
                            break
                        command = command_for(a, stage, [sid], port)
                        stream = logfile.open("ab", buffering=0)
                        stream.write(("\nQUEUE_START " + now() + " " + json.dumps(command) + "\n").encode("utf-8"))
                        try:
                            process = subprocess.Popen(command, stdout=stream, stderr=subprocess.STDOUT, **worker_options())
                        except OSError as exc:
                            stream.close()
                            row.update(status="failed_diagnosis", reason="Worker start error; dispatch stopped", error=str(exc), finished=now())
                            halted = True
                            break
                        record = {"port": port, "pid": process.pid, "created": None, "kind": "child", "stage": stage,
                                  "ids": [sid], "started": now(), "log": str(logfile)}
                        row.update(status="running", pid=process.pid, port=port, log=str(logfile), started=now())
                        active[port] = {"record": record, "process": process, "log": stream}
                        protected.add(sid)
                        save()  # Preserve a just-started PID even if opening its monitor fails.
                        try:
                            watch = ProcessWatch(process.pid)
                            handles[port] = watch
                            active[port]["watch"] = watch
                            record["created"] = watch.created
                        except OSError as exc:
                            halted = True
                            state.update(reason="Process identity monitor failed; stop dispatch and drain owned workers", error=str(exc))
                        print("QUEUE_START", sid, stage, "port", port, "pid", process.pid, flush=True)
                        break
                    if halted or low_disk:
                        break
            save()
            remaining = state["pending"]
            if not active and (not remaining or halted or low_disk):
                break
            time.sleep(3)
        state["status"] = ("failed_diagnosis" if halted else "paused_low_disk" if low_disk
                           else "awaiting_review" if any(row["status"] == "review_awaiting_approval" for row in items.values())
                           else "completed_with_issues" if any(row["status"] == "review" for row in items.values()) else "completed")
        state["finished"] = now()
        save()
        print("QUEUE_END", state["status"], json.dumps(state["counts"]), flush=True)
        return 1 if halted else 2 if state["status"] == "paused_low_disk" else 0
    except BaseException as exc:
        if state is not None:
            state.update(status="interrupted" if isinstance(exc, KeyboardInterrupt) else "failed_diagnosis", error=str(exc), finished=now())
            write_json(a.output / "queue-status.json", state)
        raise
    finally:
        for slot in active.values():
            if slot.get("log"):
                slot["log"].close()
        for watch in handles.values():
            watch.close()
        lock.close()


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--app", type=Path)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--ids", nargs="+")
    ap.add_argument("--spec-overrides", type=Path)
    ap.add_argument("--theme")
    ap.add_argument("--pr", type=float, default=2)
    ap.add_argument("--reviewed-ids", nargs="+", default=[])
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    a.app = a.app.resolve() if a.app else None
    a.output = a.output.resolve()
    if REPO.is_relative_to(a.output) or (a.output.is_relative_to(REPO) and not a.output.is_relative_to(REPO / "output")):
        ap.error("Batch output must be outside source, or under repository output/")
    a.spec_overrides = a.spec_overrides.resolve() if a.spec_overrides else None
    a.reviewed_ids = {sid for value in a.reviewed_ids for sid in value.split(",") if sid}
    if not 0 < a.pr <= 2:
        ap.error("--pr must be >0 and <=2")
    try:
        drills, overrides = load_selection(a.app, a.output, a.ids, a.spec_overrides)
        if not drills or any(not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", sid) for sid in drills):
            raise ValueError("Selection must contain safe unique drill IDs")
        # The selector returns the complete frozen manifest selection. Its IDs
        # may exceed the explicitly requested work subset of a resumed/App batch.
        if a.ids:
            if len(set(a.ids)) != len(a.ids) or not set(a.ids) <= drills.keys():
                raise ValueError("--ids must be unique members of this batch selection")
            drills = {sid: drills[sid] for sid in a.ids}
        if a.reviewed_ids - drills.keys():
            raise ValueError("--reviewed-ids must belong to this batch selection")
        _, selection, items, slots = saved_state(a, drills, overrides)
    except (ValueError, OSError) as exc:
        ap.error(str(exc))
    if a.dry_run:
        protected = {sid for slot in slots for sid in slot["ids"]}
        print(json.dumps({"dry_run": True, "selection": selection, "content_count": len(drills), "ports": list(PORTS),
                          "saved_slots": slots, "queue": [{"id": sid, "next_stage": "preflight" if preview_ready(a.output, sid) else "preview",
                                                               "reviewed": sid in a.reviewed_ids}
                             for sid in queue_order(drills) if sid not in protected and items[sid]["status"] not in TERMINAL],
                          "preserved": {sid: row["status"] for sid, row in items.items() if row["status"] in TERMINAL},
                          "preserved_status_verification": "Not performed: saved pass/review are unverified planning information; real resume validates completed green results after prepare",
                          "minimum_free_bytes": MIN_FREE}, ensure_ascii=False, indent=2))
        return 0
    if os.name != "nt":
        ap.error("This queue's process monitoring and lock require Windows")
    return run_queue(a, drills, overrides)


if __name__ == "__main__":
    raise SystemExit(main())
