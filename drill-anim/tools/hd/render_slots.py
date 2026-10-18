"""Two cross-process GPU slots shared by every migrated HD batch."""
from contextlib import contextmanager
import os

@contextmanager
def gpu_slot(directory):
    directory.mkdir(parents=True,exist_ok=True);owned=None
    for slot in range(2):
        handle=(directory/f'slot-{slot}.lock').open('a+b');handle.seek(0,2)
        if handle.tell()==0:handle.write(b'0');handle.flush()
        handle.seek(0)
        try:
            if os.name=='nt':
                import msvcrt
                msvcrt.locking(handle.fileno(),msvcrt.LK_NBLCK,1)
            else:
                import fcntl
                fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except OSError:handle.close();continue
        owned=handle;break
    if owned is None:raise RuntimeError('Both HD GPU slots are occupied; wait for existing renders')
    try:yield slot
    finally:
        if os.name=='nt':
            import msvcrt
            owned.seek(0);msvcrt.locking(owned.fileno(),msvcrt.LK_UNLCK,1)
        else:
            import fcntl
            fcntl.flock(owned,fcntl.LOCK_UN)
        owned.close()
