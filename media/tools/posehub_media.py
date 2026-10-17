"""Shared helpers for Pose-Hub media tooling (Python 3.9+ standard library only).

Used by ingest.py and publish.py. sync.py is deliberately self-contained so App
repositories can vendor that single file.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import hmac
import json
import os
import struct
import urllib.parse
from pathlib import Path

SCHEMA = 'pose-hub/media-manifest@1'
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = REPO_ROOT / 'media' / 'manifest.json'
DEFAULT_CONFIG = REPO_ROOT / 'media' / 'config.json'
VARIANTS = ('dark', 'light', 'greenscreen', 'alpha')
ROLES = ('video', 'poster', 'still', 'frames')
CONTENT_TYPES = {'.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.png': 'image/png',
                 '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
                 '.json': 'application/json'}


def now_utc() -> str:
    return _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


def sha256_file(path, chunk=1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(chunk), b''):
            h.update(block)
    return h.hexdigest()


def sha256_text_lf(path) -> str:
    """Same rule as drill-anim/verify.mjs: UTF-8 text with CRLF normalised to LF."""
    return hashlib.sha256(Path(path).read_text(encoding='utf-8').replace('\r\n', '\n').encode('utf-8')).hexdigest()


def sha256_tree(root):
    """Directory digest for frame sequences: sha256 over sorted 'relpath<TAB>sha256<LF>' lines."""
    root = Path(root); lines = []; total = 0; count = 0
    for p in sorted(x for x in root.rglob('*') if x.is_file()):
        rel = p.relative_to(root).as_posix(); lines.append(f'{rel}\t{sha256_file(p)}\n')
        total += p.stat().st_size; count += 1
    return hashlib.sha256(''.join(lines).encode('utf-8')).hexdigest(), total, count


def version_ok(v: str) -> bool:
    parts = v.split('.')
    return len(parts) == 3 and all(p.isdigit() for p in parts)


# ---------------------------------------------------------------- manifest

def empty_manifest():
    return {'schema': SCHEMA, 'repository': 'mhgd3250905/3D-Pose-Hub',
            'storageLayout': '{file}', 'releases': {}}


def load_manifest(path=DEFAULT_MANIFEST):
    path = Path(path)
    if not path.exists():
        return empty_manifest()
    data = json.loads(path.read_text(encoding='utf-8'))
    if data.get('schema') != SCHEMA:
        raise ValueError(f'{path}: unexpected schema {data.get("schema")!r}')
    return data


def dump_manifest(data) -> str:
    for rel in data.get('releases', {}).values():
        rel['items'] = sorted(rel.get('items', []), key=item_key)
    data['releases'] = dict(sorted(data.get('releases', {}).items(), key=lambda kv: tuple(int(x) for x in kv[0].split('.'))))
    return json.dumps(data, ensure_ascii=False, indent=2) + '\n'


def save_manifest(data, path=DEFAULT_MANIFEST):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(dump_manifest(data), encoding='utf-8', newline='\n')
    os.replace(tmp, path)


def item_key(item):
    return (item['id'], item['variant'], item.get('role', 'video'), item.get('tag') or '', int(item.get('width') or 0))


def release_snapshot(data, version):
    """The frozen per-version manifest uploaded next to the media (v<version>/manifest.json)."""
    rel = data['releases'][version]
    return {'schema': SCHEMA, 'repository': data.get('repository'), 'storageLayout': data.get('storageLayout'),
            'version': version, 'release': rel}


def load_config(path=DEFAULT_CONFIG):
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f'{path} not found: copy media/config.example.json to media/config.json first')
    cfg = json.loads(path.read_text(encoding='utf-8'))
    return cfg


# ---------------------------------------------------------------- media probing (no ffprobe needed)

def _boxes(buf, start, end):
    i = start
    while i + 8 <= end:
        size, typ = struct.unpack('>I4s', buf[i:i + 8]); hdr = 8
        if size == 1:
            size = struct.unpack('>Q', buf[i + 8:i + 16])[0]; hdr = 16
        elif size == 0:
            size = end - i
        if size < hdr:
            return
        yield typ.decode('latin1'), i + hdr, i + size
        i += size


def _read_top_boxes(path, wanted=('moov',)):
    out = {}
    with open(path, 'rb') as f:
        f.seek(0, 2); n = f.tell(); pos = 0
        while pos + 8 <= n:
            f.seek(pos); h = f.read(16)
            if len(h) < 8:
                break
            size, typ = struct.unpack('>I4s', h[:8]); hdr = 8
            if size == 1:
                size = struct.unpack('>Q', h[8:16])[0]; hdr = 16
            elif size == 0:
                size = n - pos
            if size < hdr:
                break
            t = typ.decode('latin1')
            if t in wanted:
                f.seek(pos); out[t] = f.read(size)
            pos += size
    return out


def probe_mp4(path):
    moov = _read_top_boxes(path).get('moov')
    if not moov:
        return {}
    info = {}
    for typ, s, e in _boxes(moov, 8, len(moov)):
        if typ == 'mvhd':
            ver = moov[s]
            if ver == 1:
                ts, dur = struct.unpack('>IQ', moov[s + 20:s + 32])
            else:
                ts, dur = struct.unpack('>II', moov[s + 12:s + 20])
            if ts:
                info['durationSec'] = round(dur / ts, 3)
        if typ != 'trak':
            continue
        width = height = None; is_video = False; media_ts = media_dur = None; samples = None
        for t2, s2, e2 in _boxes(moov, s, e):
            if t2 == 'tkhd':
                w, h = struct.unpack('>II', moov[e2 - 8:e2]); width, height = w >> 16, h >> 16
            if t2 == 'mdia':
                for t3, s3, e3 in _boxes(moov, s2, e2):
                    if t3 == 'hdlr' and moov[s3 + 8:s3 + 12] == b'vide':
                        is_video = True
                    if t3 == 'mdhd':
                        ver = moov[s3]
                        if ver == 1:
                            media_ts, media_dur = struct.unpack('>IQ', moov[s3 + 20:s3 + 32])
                        else:
                            media_ts, media_dur = struct.unpack('>II', moov[s3 + 12:s3 + 20])
                    if t3 == 'minf':
                        for t4, s4, e4 in _boxes(moov, s3, e3):
                            if t4 == 'stbl':
                                for t5, s5, e5 in _boxes(moov, s4, e4):
                                    if t5 == 'stts':
                                        cnt = struct.unpack('>I', moov[s5 + 4:s5 + 8])[0]; samples = 0
                                        for k in range(cnt):
                                            samples += struct.unpack('>I', moov[s5 + 8 + 8 * k:s5 + 12 + 8 * k])[0]
        if is_video and width:
            info['width'], info['height'] = width, height
            if media_ts and media_dur:
                info['durationSec'] = round(media_dur / media_ts, 3)
                if samples:
                    info['frames'] = samples; info['fps'] = round(samples * media_ts / media_dur, 3)
            break
    return info


def probe_image(path):
    with open(path, 'rb') as f:
        head = f.read(64)
    if head[:8] == b'\x89PNG\r\n\x1a\n':
        w, h = struct.unpack('>II', head[16:24]); return {'width': w, 'height': h}
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        kind = head[12:16]
        if kind == b'VP8X':
            w = 1 + int.from_bytes(head[24:27], 'little'); h = 1 + int.from_bytes(head[27:30], 'little')
            return {'width': w, 'height': h}
        if kind == b'VP8L':
            b = head[21:25]; bits = int.from_bytes(b, 'little')
            return {'width': (bits & 0x3FFF) + 1, 'height': ((bits >> 14) & 0x3FFF) + 1}
        if kind == b'VP8 ':
            w, h = struct.unpack('<HH', head[26:30]); return {'width': w & 0x3FFF, 'height': h & 0x3FFF}
    if head[:2] == b'\xff\xd8':
        with open(path, 'rb') as f:
            data = f.read()
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1; continue
            marker = data[i + 1]
            if marker in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack('>HH', data[i + 5:i + 9]); return {'width': w, 'height': h}
            i += 2 + struct.unpack('>H', data[i + 2:i + 4])[0]
    return {}


def probe(path):
    ext = Path(path).suffix.lower()
    try:
        if ext in ('.mp4', '.mov', '.m4v'):
            return probe_mp4(path)
        if ext in ('.png', '.webp', '.jpg', '.jpeg'):
            return probe_image(path)
    except (struct.error, IndexError, OSError):
        return {}
    return {}


# ---------------------------------------------------------------- AWS SigV4 for R2's S3-compatible API

def _hmac(key, msg):
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()


def sigv4_headers(method, url, headers, payload_sha256, access_key, secret_key, region='auto', service='s3', amz_date=None):
    """Return headers (incl. Authorization) for an AWS Signature V4 request. `headers` must not include host."""
    u = urllib.parse.urlsplit(url)
    amz_date = amz_date or _dt.datetime.now(_dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    date = amz_date[:8]
    h = {k.lower(): str(v).strip() for k, v in headers.items()}
    h['host'] = u.netloc; h['x-amz-date'] = amz_date; h['x-amz-content-sha256'] = payload_sha256
    canonical_uri = '/'.join(urllib.parse.quote(urllib.parse.unquote(seg), safe='-_.~') for seg in (u.path or '/').split('/')) or '/'
    q = urllib.parse.parse_qsl(u.query, keep_blank_values=True)
    canonical_query = '&'.join(f'{urllib.parse.quote(k, safe="-_.~")}={urllib.parse.quote(v, safe="-_.~")}' for k, v in sorted(q))
    names = sorted(h)
    canonical_headers = ''.join(f'{n}:{h[n]}\n' for n in names)
    signed = ';'.join(names)
    creq = '\n'.join([method, canonical_uri, canonical_query, canonical_headers, signed, payload_sha256])
    scope = f'{date}/{region}/{service}/aws4_request'
    sts = '\n'.join(['AWS4-HMAC-SHA256', amz_date, scope, hashlib.sha256(creq.encode('utf-8')).hexdigest()])
    k = _hmac(_hmac(_hmac(_hmac(('AWS4' + secret_key).encode('utf-8'), date), region), service), 'aws4_request')
    sig = hmac.new(k, sts.encode('utf-8'), hashlib.sha256).hexdigest()
    out = {k2: v for k2, v in h.items() if k2 != 'host'}
    out['authorization'] = f'AWS4-HMAC-SHA256 Credential={access_key}/{scope}, SignedHeaders={signed}, Signature={sig}'
    return out
