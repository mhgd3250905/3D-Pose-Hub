"""HipLab offline audit and v4.1 processing functions. Snapshot; see provenance.json."""

import json, math, re, subprocess, tempfile, shutil

from pathlib import Path

import numpy as np

SR = 44100

SILENCE_DB = -50.0

GAP_MIN_S = 0.45

GAP_FAIL_EXTRA_S = 0.25

EDGE_LOUD_DB = 18.0

TAIL_MIN_MS = 40

TAIL_MAX_MS = 200

LEAD_MAX_MS = 120

DROP_DB = 9.0

LUFS_TARGET = -16.0

LUFS_TOL = 1.0

TP_MAX = -1.0

RATE_MIN = 0.62

SPAN_SHORT_MS = 90

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1',
                          '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                          'format=duration:stream=duration,codec_name,channels,sample_rate',
                          '-of', 'json', str(path)], capture_output=True, text=True).stdout
    j = json.loads(out)
    s = j['streams'][0]
    return {
        'fmt_s': float(j['format']['duration']),
        'stream_s': float(s.get('duration') or 'nan'),
        'codec': s['codec_name'], 'channels': int(s['channels']), 'sr': int(s['sample_rate']),
    }

def loudness(path, loops=0):
    """(integrated LUFS, true peak dBTP). [loops] repeats the clip so the
    400 ms gating blocks also cover single words."""
    err = subprocess.run(['ffmpeg', '-v', 'info', '-nostats', '-stream_loop', str(loops),
                          '-i', str(path), '-af',
                          'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    summ = err[err.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', summ)
    tp = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', summ)
    f = lambda m: float(m.group(1)) if m and m.group(1) != '-inf' else float('-inf')
    return f(i), f(tp)

def db(x):
    return 20 * math.log10(max(float(x), 1e-9))

def win_db(x, ms):
    n = int(SR * ms / 1000)
    k = len(x) // n
    if k == 0:
        return np.array([db(np.sqrt(np.mean(x ** 2))) if len(x) else -180.0])
    w = x[:k * n].reshape(k, n)
    return 20 * np.log10(np.maximum(np.sqrt(np.mean(w ** 2, axis=1)), 1e-9))

def speech_span(x):
    """(first, last) 10 ms window index above SILENCE_DB, in seconds."""
    d = win_db(x, 10)
    idx = np.where(d > SILENCE_DB)[0]
    if len(idx) == 0:
        return None
    return idx[0] * .01, (idx[-1] + 1) * .01, d

def gaps(d):
    """Inner silent runs (10 ms windows) between first and last sound, seconds."""
    idx = np.where(d > SILENCE_DB)[0]
    if len(idx) == 0:
        return []
    out, run = [], 0
    for v in d[idx[0]:idx[-1] + 1]:
        if v <= SILENCE_DB:
            run += 1
        else:
            if run * .01 >= GAP_MIN_S:
                out.append(round(run * .01, 2))
            run = 0
    return out

ZH_DIGITS = {'0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1}

def units(text, lang):
    """Rough spoken syllables."""
    if lang == 'zh':
        n = len(re.findall(r'[\u4e00-\u9fff]', text))
        for num in re.findall(r'\d+', text):
            v = int(num)
            n += 1 if v <= 10 else (2 if v < 20 or v % 10 == 0 and v < 100 else 3)
        return max(n, 1)
    n = 0
    for w in re.findall(r"[A-Za-z']+|\d+", text):
        if w.isdigit():
            v = int(w)
            n += 1 if v <= 12 else 2 if v < 20 else 2 if v % 10 == 0 else 3
            continue
        g = re.findall(r'[aeiouy]+', w.lower())
        s = len(g) - (1 if w.lower().endswith('e') and len(g) > 1 and not w.lower().endswith('le') else 0)
        n += max(s, 1)
    return max(n, 1)

def audit_clip(path, text, lang, manifest_ms, raw=None):
    p = probe(path)
    x = decode(path)
    dec_s = len(x) / SR
    r = {'key': path.stem, 'lang': lang, 'text': text, 'fails': [], 'notes': []}
    r.update({'fmt_ms': round(p['fmt_s'] * 1000), 'stream_ms': round(p['stream_s'] * 1000),
              'decoded_ms': round(dec_s * 1000), 'manifest_ms': manifest_ms})
    if p['channels'] != 1 or p['sr'] != SR or p['codec'] != 'aac':
        r['fails'].append(f"format {p['codec']}/{p['channels']}ch/{p['sr']}")
    if abs(p['fmt_s'] - dec_s) > .05 or abs(p['stream_s'] - dec_s) > .05:
        r['fails'].append('container/stream/decoded length mismatch')
    if manifest_ms is not None and abs(manifest_ms - dec_s * 1000) > 50:
        r['fails'].append(f'manifest {manifest_ms} ms vs decoded {round(dec_s * 1000)} ms')

    span = speech_span(x)
    if span is None:
        r['fails'].append('no audio above silence')
        return r
    a, b, d10 = span
    r['lead_ms'] = round(a * 1000)
    r['tail_ms'] = round(dec_s * 1000 - b * 1000)
    r['speech_ms'] = round((b - a) * 1000)
    seg = x[int(a * SR):int(b * SR)]
    sp_rms = db(np.sqrt(np.mean(seg ** 2)))
    r['speech_rms_db'] = round(sp_rms, 2)
    r['peak_db'] = round(db(np.max(np.abs(x))), 2)
    # abrupt edges: compare the outermost 10 ms of the file with the speech level
    last10 = db(np.sqrt(np.mean(x[-441:] ** 2))) if len(x) > 441 else -180
    first10 = db(np.sqrt(np.mean(x[:441] ** 2))) if len(x) > 441 else -180
    r['end_10ms_db'] = round(last10, 1)
    if last10 > sp_rms - EDGE_LOUD_DB:
        r['fails'].append(f'abrupt end (last 10 ms {last10:.1f} dB vs speech {sp_rms:.1f})')
    if first10 > sp_rms - EDGE_LOUD_DB:
        r['fails'].append(f'abrupt start (first 10 ms {first10:.1f} dB)')
    if r['tail_ms'] < TAIL_MIN_MS:
        r['fails'].append(f"tail {r['tail_ms']} ms < {TAIL_MIN_MS}")
    if r['tail_ms'] > TAIL_MAX_MS:
        r['fails'].append(f"tail {r['tail_ms']} ms > {TAIL_MAX_MS}")
    if r['lead_ms'] > LEAD_MAX_MS:
        r['fails'].append(f"lead {r['lead_ms']} ms > {LEAD_MAX_MS}")
    r['gaps_s'] = gaps(d10)

    # loudness curve over speech, 200 ms windows, voiced windows only
    d200 = win_db(seg, 200)
    voiced = d200[d200 > sp_rms - 20]
    r['curve_db'] = [round(float(v), 1) for v in d200]
    if len(voiced) >= 4:
        h = len(voiced) // 2
        first, second = float(np.median(voiced[:h])), float(np.median(voiced[h:]))
        r['half_drop_db'] = round(first - second, 1)
        r['_drop'] = first - second
        spread = float(np.percentile(voiced, 90) - np.percentile(voiced, 10))
        r['spread_db'] = round(spread, 1)

    lufs, tp = loudness(path, loops=max(0, math.ceil(3 / max(dec_s, .05)) - 1))
    r['lufs'] = None if math.isinf(lufs) else round(lufs, 1)
    r['true_peak'] = None if math.isinf(tp) else round(tp, 1)
    if r['true_peak'] is not None and tp > TP_MAX:
        r['fails'].append(f'true peak {tp:.1f} dBTP > {TP_MAX}')
    if r['lufs'] is None or abs(lufs - LUFS_TARGET) > LUFS_TOL:
        r['fails'].append(f'LUFS {lufs:.1f} outside {LUFS_TARGET}±{LUFS_TOL}')

    r['units'] = units(text, lang)
    r['s_per_unit'] = round((b - a) / r['units'], 3)

    if raw is not None and raw.exists():
        y = decode(raw)
        rs = speech_span(y)
        if rs:
            ra, rb, rd = rs
            r['raw_speech_ms'] = round((rb - ra) * 1000)
            r['raw_gaps_s'] = gaps(rd)
            if r['speech_ms'] < r['raw_speech_ms'] - SPAN_SHORT_MS:
                r['fails'].append(f"truncated: speech {r['speech_ms']} ms vs source "
                                  f"{r['raw_speech_ms']} ms")
            # a level drop the source already has (a soft final "s") is speech,
            # not processing; fail only what processing added.
            rseg = y[int(ra * SR):int(rb * SR)]
            rd200 = win_db(rseg, 200)
            rv = rd200[rd200 > db(np.sqrt(np.mean(rseg ** 2))) - 20]
            if len(rv) >= 4 and '_drop' in r:
                h = len(rv) // 2
                r['raw_half_drop_db'] = round(float(np.median(rv[:h]) - np.median(rv[h:])), 1)
                if r['_drop'] > r['raw_half_drop_db'] + 3:
                    r['fails'].append(f"second half {r['_drop']:.1f} dB quieter "
                                      f"(source {r['raw_half_drop_db']})")
            rg = max(r['raw_gaps_s'] or [0])
            for g in r['gaps_s']:
                if g > rg + GAP_FAIL_EXTRA_S:
                    r['fails'].append(f'inner silence {g} s (source max {rg} s)')
    elif r.get('_drop', 0) > DROP_DB:
        r['fails'].append(f"second half {r['_drop']:.1f} dB quieter")
    r.pop('_drop', None)
    return r

SR = 44100

SILENCE_DB = -50.0

LEAD_S = 0.04

TAIL_S = 0.08

FADE_IN_S = 0.005

FADE_OUT_S = 0.02

TARGET_LUFS = -16.0

LIMIT_DB = -2.5

PROCESS_VERSION = 'v4.1'

def _decode(path):
    import numpy as np
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1',
                          '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def edge_trim(x):
    """Cut the silence before the first and after the last sound only."""
    import numpy as np
    n = SR // 100
    k = len(x) // n
    w = x[:k * n].reshape(k, n)
    lvl = 20 * np.log10(np.maximum(np.sqrt(np.mean(w ** 2, axis=1)), 1e-9))
    loud = np.where(lvl > SILENCE_DB)[0]
    if len(loud) == 0:
        raise RuntimeError('clip has no audio')
    a = max(0, loud[0] * n - int(LEAD_S * SR))
    b = (loud[-1] + 1) * n + int(TAIL_S * SR)
    y = x[a:b]
    if b > len(x):  # source tail shorter than TAIL_S: pad with silence
        y = np.concatenate([y, np.zeros(b - len(x), dtype=np.float32)])
    fi, fo = int(FADE_IN_S * SR), int(FADE_OUT_S * SR)
    y[:fi] *= np.linspace(0, 1, fi, dtype=np.float32)
    y[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)
    return y

def loop_lufs(wav, seconds):
    """(integrated LUFS, true peak dBTP) of the clip repeated to ≥ 3 s (EBU R128 gates in
    400 ms blocks, so a single word measured once reads as nothing)."""
    loops = max(0, int(3 / max(seconds, .05)))
    err = subprocess.run(['ffmpeg', '-v', 'info', '-nostats', '-stream_loop', str(loops),
                          '-i', str(wav), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    summ = err[err.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', summ)
    p = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', summ)
    return float(i.group(1)), float(p.group(1)) if p and p.group(1) != '-inf' else -99.0

def _process(src, dst):
    """Edge-trim, one fixed gain to −16 LUFS, peak-limit, encode mono AAC."""
    y = edge_trim(_decode(src))
    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / 'a.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1',
                        '-i', '-', '-c:a', 'pcm_f32le', str(wav)], input=y.tobytes(), check=True)
        gain = TARGET_LUFS - loop_lufs(wav, len(y) / SR)[0]
        limit_db = LIMIT_DB
        # Peak limiting can pull a peaky clip (a hissy final "s") a little
        # under target and the encoder can add a bit of peak: measure the
        # encoded clip and correct – still one fixed gain per clip.
        best = None
        for _ in range(6):
            limit = 10 ** (limit_db / 20)
            # The native AAC encoder at 64 kbit/s quantises the band above
            # ~12 kHz coarsely and overshoots peaks by ~3 dB on sibilants;
            # speech has nothing up there, so band-limit before the limiter
            # and the encoder.
            af = (f'volume={gain:.2f}dB,lowpass=f=12000:p=2,'
                  f'alimiter=limit={limit:.4f}:attack=5:release=50:level=0:latency=1')
            out = Path(td) / f'try{_}.m4a'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', af,
                            '-ar', str(SR), '-ac', '1', '-c:a', 'aac', '-b:a', '64k',
                            '-cutoff', '12000', '-movflags', '+faststart', str(out)], check=True)
            lufs, tp = loop_lufs(out, len(y) / SR)
            # score: loudness error, heavily penalising a peak over −1.2 dBTP
            score = abs(lufs - TARGET_LUFS) + 10 * max(0.0, tp + 1.2)
            if best is None or score < best[0]:
                best = (score, out)
            if abs(lufs - TARGET_LUFS) <= .3 and tp <= -1.2:
                break
            if tp > -1.2:
                limit_db -= tp + 1.6
            gain += TARGET_LUFS - lufs
        shutil.copyfile(best[1], dst)

SAMPLE = {
    'zh': ('下一个，青蛙式，停 60 秒。膝盖向两侧打开，脚尖朝外，臀部慢慢往后坐。'
           '准备，三，二，一，开始！呼气，再沉一点。还剩 10 秒。五，四，三，二，一。很好，休息 10 秒。'),
    'en': ('Next up, frog stretch, hold for 60 seconds. Knees wide, toes out, sit your hips back slowly. '
           'Get ready. Three, two, one, go! Breathe out and sink a little deeper. 10 seconds left. '
           'Five, four, three, two, one. Nice work. Rest for 10 seconds.'),
}

SAMPLE_VOICES = {
    'zh': ['zh-CN-XiaoxiaoNeural', 'zh-CN-YunxiNeural', 'zh-CN-YunjianNeural', 'zh-CN-XiaoyiNeural'],
    'en': ['en-US-AriaNeural', 'en-US-GuyNeural', 'en-US-JennyNeural', 'en-US-AndrewNeural'],
}
