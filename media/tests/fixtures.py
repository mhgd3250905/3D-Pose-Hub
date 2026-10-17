"""Tiny synthetic media files and a fake R2 (S3) server for the media tool tests. Standard library only."""
import hashlib
import json
import os
import struct
import sys
import threading
import zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1] / 'tools'
sys.path.insert(0, str(TOOLS))
# the fake R2 runs on 127.0.0.1; never send it through a configured HTTP proxy
for _k in ('NO_PROXY', 'no_proxy'):
    os.environ[_k] = ','.join(x for x in (os.environ.get(_k, ''), '127.0.0.1', 'localhost') if x)


def _box(typ, payload):
    return struct.pack('>I4s', 8 + len(payload), typ.encode()) + payload


def make_mp4(path, width=1080, height=1080, frames=240, fps=30, pad=b''):
    """ftyp + moov(mvhd, trak(tkhd, mdia(mdhd, hdlr vide, minf(stbl(stts))))) + mdat. Not playable; probe-able."""
    ts = fps * 1000; dur = frames * 1000
    mvhd = _box('mvhd', b'\0' * 4 + struct.pack('>IIII', 0, 0, ts, dur) + b'\0' * 80)
    tkhd = _box('tkhd', b'\0\0\0\x03' + b'\0' * 72 + struct.pack('>II', width << 16, height << 16))
    mdhd = _box('mdhd', b'\0' * 4 + struct.pack('>IIII', 0, 0, ts, dur) + b'\0' * 4)
    hdlr = _box('hdlr', b'\0' * 8 + b'vide' + b'\0' * 13)
    stts = _box('stts', b'\0' * 4 + struct.pack('>III', 1, frames, 1000))
    trak = _box('trak', tkhd + _box('mdia', mdhd + hdlr + _box('minf', _box('stbl', stts))))
    data = _box('ftyp', b'isom\0\0\x02\0isomiso2avc1mp41') + _box('moov', mvhd + trak) + _box('mdat', b'\0' * 64 + pad)
    Path(path).parent.mkdir(parents=True, exist_ok=True); Path(path).write_bytes(data)
    return data


def make_png(path, width=8, height=8, rgba=(16, 16, 19, 255)):
    raw = b''.join(b'\0' + bytes(rgba) * width for _ in range(height))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) + \
        chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
    Path(path).parent.mkdir(parents=True, exist_ok=True); Path(path).write_bytes(data)
    return data


class FakeR2:
    """In-memory S3-ish server: HEAD/PUT/GET on /<bucket>/<key>. Checks SigV4 header shape and payload sha."""

    def __init__(self, bucket='pose-hub-media'):
        self.bucket = bucket; self.objects = {}; self.requests = []
        outer = self

        class H(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _key(self):
                parts = self.path.lstrip('/').split('/', 1)
                return parts[1] if len(parts) == 2 and parts[0] == outer.bucket else None

            def do_HEAD(self):
                outer.requests.append(('HEAD', self.path, dict(self.headers)))
                k = self._key(); o = outer.objects.get(k)
                if not self.headers.get('Authorization', '').startswith('AWS4-HMAC-SHA256 Credential='):
                    self.send_response(403); self.end_headers(); return
                if o is None:
                    self.send_response(404); self.end_headers(); return
                self.send_response(200); self.send_header('Content-Length', str(len(o['body'])))
                self.send_header('x-amz-meta-sha256', o['meta']); self.end_headers()

            def do_PUT(self):
                n = int(self.headers.get('Content-Length', 0)); body = self.rfile.read(n)
                outer.requests.append(('PUT', self.path, dict(self.headers)))
                if hashlib.sha256(body).hexdigest() != self.headers.get('x-amz-content-sha256'):
                    self.send_response(400); self.end_headers(); return
                outer.objects[self._key()] = {'body': body, 'meta': self.headers.get('x-amz-meta-sha256', ''),
                                              'type': self.headers.get('Content-Type')}
                self.send_response(200); self.end_headers()

            def do_GET(self):  # public read (what an r2.dev / custom domain would serve): /<key>
                k = self.path.lstrip('/'); o = outer.objects.get(k)
                if o is None:
                    self.send_response(404); self.end_headers(); return
                self.send_response(200); self.send_header('Content-Length', str(len(o['body']))); self.end_headers()
                self.wfile.write(o['body'])

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), H)
        self.url = f'http://127.0.0.1:{self.server.server_address[1]}'
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self):
        self.server.shutdown(); self.server.server_close()


def write_config(path, src, rules, overrides=None):
    Path(path).write_text(json.dumps({'src': str(src), 'rules': rules, 'specOverrides': overrides or {}}), encoding='utf-8')
