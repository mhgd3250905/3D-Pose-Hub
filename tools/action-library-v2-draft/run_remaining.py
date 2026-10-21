"""Finish this finite production run: wait for the native queue, then run 12 adaptations.

No render restart, approval, publishing, notification, or recurring scheduling.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

REPO = Path(__file__).resolve().parents[2]


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + f'.{os.getpid()}.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, path)


def alive(pid):
    if os.name != 'nt':
        try:
            os.kill(pid, 0)
            return True
        except ProcessLookupError:
            return False
    import ctypes
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.OpenProcess.restype = ctypes.c_void_p
    kernel.OpenProcess.argtypes = [ctypes.c_ulong, ctypes.c_int, ctypes.c_ulong]
    kernel.GetExitCodeProcess.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)]
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    handle = kernel.OpenProcess(0x1000, 0, pid)
    if not handle:
        return False
    code = ctypes.c_ulong()
    try:
        if not kernel.GetExitCodeProcess(handle, ctypes.byref(code)):
            raise OSError('Cannot inspect current renderer process')
        return code.value == 259
    finally:
        kernel.CloseHandle(handle)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', required=True, type=Path)
    p.add_argument('--coordinator-root', required=True, type=Path)
    p.add_argument('--next-queue', required=True, type=Path)
    p.add_argument('--runtime', required=True, type=Path)
    p.add_argument('--node', required=True, type=Path)
    p.add_argument('--previous-run-id', required=True)
    p.add_argument('--previous-pid', required=True, type=int)
    args = p.parse_args()
    queue = read(args.next_queue)
    ids = [item['id'] for item in queue['actions'] if item.get('renderState') == 'native8-ready']
    if len(ids) != 12 or len(ids) != len(set(ids)):
        raise ValueError('Expected exactly the twelve separately authored adaptations')
    queue_sha = hashlib.sha256(args.next_queue.read_bytes()).hexdigest()
    status_path = args.root / 'status/remaining-render.json'
    status = {'format': 'pose-hub-finite-render-continuation@1', 'status': 'waiting-native-queue',
              'previousRunId': args.previous_run_id, 'previousPid': args.previous_pid,
              'nextQueueSha256': queue_sha, 'actionIds': ids, 'reviewed': False, 'releaseEligible': False}
    write(status_path, status)
    try:
        while True:
            previous = read(args.root / 'manifests/draft-run-status.json')
            if previous['runId'] != args.previous_run_id:
                raise RuntimeError('Another render run replaced the expected queue; retained for inspection')
            if previous.get('terminal'):
                if previous['status'] != 'completed':
                    raise RuntimeError('Previous queue failed; inspect the retained logs before proceeding')
                if set(previous['actionIds']) != set(previous['completedActionIds']):
                    raise RuntimeError('Previous queue reports incomplete actions')
                break
            if not alive(args.previous_pid):
                # Re-read after process exit to avoid mistaking the normal final
                # status write for a failure. Never restart an unexplained exit.
                previous = read(args.root / 'manifests/draft-run-status.json')
                if previous.get('terminal') and previous.get('status') == 'completed':
                    break
                raise RuntimeError('Renderer exited without a successful terminal status; inspect before retrying')
            time.sleep(20)
        for _ in range(12):
            if not (args.coordinator_root / '.action-library-v2-render.lock').exists():
                break
            time.sleep(5)
        else:
            raise RuntimeError('Previous render still owns the machine lock')
        if hashlib.sha256(args.next_queue.read_bytes()).hexdigest() != queue_sha:
            raise RuntimeError('The frozen adaptation queue changed')
        status['status'] = 'rendering-adaptations'
        write(status_path, status)
        command = [str(args.node), 'tools/action-library-v2-draft/run_draft.mjs',
                   '--queue', str(args.next_queue), '--root', str(args.root),
                   '--coordinator-root', str(args.coordinator_root), '--runtime', str(args.runtime), '--workers', '2']
        result = subprocess.run(command, cwd=REPO, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        if result.returncode:
            raise RuntimeError(f'Adaptation renderer exited {result.returncode}; output and logs retained')
        status['status'] = 'completed'
        write(status_path, status)
    except Exception as error:
        status['status'] = 'stopped-for-inspection'
        status['error'] = str(error)
        write(status_path, status)
        raise


if __name__ == '__main__':
    main()
