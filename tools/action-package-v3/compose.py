"""Compose one action package from immutable v3 master layers. No 3D render.

python tools/action-package-v3/compose.py --root <root> --id <actionId> [--profile default] [--sizes-from-masters]

Reads <root>/masters/<id>/layer-manifest.json (from render-masters.mjs) and writes
<root>/packages/<id>/ :
  <skin>/<theme>/loop.<N>.mp4         H.264 loop on a dark/light background (highlight on)
  <skin>/loop.alpha.<N>.webm          VP9 + alpha transparent loop (video template)
  <skin>/<theme>/{start,peak,end}.<N>.png, cover.<N>.jpg, thumbnail.<N>.jpg
  <skin>/cover.transparent.<N>.png    transparent first-choice cover (peak frame)
  <skin>/first-frame.transparent.<N>.png
  framing.json, package.json          fixed crop + every file with sha256
One fixed square crop per action: union of body alpha over every skin and every loop frame.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(root: Path, path: Path, **extra):
    return {'path': path.relative_to(root).as_posix(), 'sha256': sha(path), 'bytes': path.stat().st_size, **extra}


def load_json(path: Path):
    return json.loads(path.read_text('utf-8'))


def load_profile(name: str):
    p = Path(name) if name.endswith('.json') else HERE / 'profiles' / f'{name}.json'
    data = load_json(p)
    if data.get('format') != 'pose-hub-package-profile@1':
        raise ValueError('bad profile')
    data['sha256'] = sha(p)
    return data


def load_skin(skin_id: str):
    data = load_json(HERE / 'skins' / f'{skin_id}.json')
    if data.get('id') != skin_id:
        raise ValueError('skin id mismatch')
    return data


def rgb(value: str):
    return np.array([int(value[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)


def blend_highlight(body: Image.Image, mask: Image.Image, color: str, brightness: float) -> Image.Image:
    """Mask changes RGB only; the alpha edge is the body's."""
    a = np.asarray(body.convert('RGBA'), dtype=np.float32) / 255
    g = np.asarray(mask.convert('L'), dtype=np.float32)[..., None] / 255 * brightness
    a[..., :3] = a[..., :3] * (1 - g) + rgb(color) / 255 * g
    return Image.fromarray(np.clip(np.rint(a * 255), 0, 255).astype(np.uint8))


def on_background(fg: Image.Image, color: str) -> Image.Image:
    base = Image.new('RGBA', fg.size, color)
    return Image.alpha_composite(base, fg).convert('RGB')


def framing(root: Path, manifest: dict, padding: float):
    boxes = []
    loop = [f for f in manifest['frames'] if not f['endpoint']]
    for f in loop:
        for name, rec in f['files'].items():
            if not name.endswith('/body'):
                continue
            with Image.open(root / rec['path']) as im:
                box = im.getchannel('A').getbbox()
                if box:
                    boxes.append(box)
    if not boxes:
        raise ValueError('no visible body/props in any frame')
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    side = int(np.ceil(max(x1 - x0, y1 - y0) * (1 + 2 * padding)))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left, top = int(np.floor(cx - side / 2)), int(np.floor(cy - side / 2))
    size = manifest['size']
    return {'crop': [left, top, left + side, top + side], 'sourceSize': [size, size], 'contentBox': [x0, y0, x1, y1],
            'policy': 'union of body+prop alpha over all skins and all loop frames; fixed square; never per-frame',
            'padding': padding, 'samples': len(boxes), 'complete': manifest['complete']}


def peak_frame(manifest: dict, overrides: dict):
    aid = manifest['actionId']
    loop = [f for f in manifest['frames'] if not f['endpoint']]
    if aid in overrides:
        want = round(overrides[aid] * manifest['fps'])
        best = min(loop, key=lambda f: abs(f['frame'] - want))
        return best['frame'], 'override'
    top = max(f['pulse'] for f in loop)
    plateau = [f['frame'] for f in loop if f['pulse'] >= top - 1e-6]
    return plateau[len(plateau) // 2], 'max highlight pulse (middle of plateau)'


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--root', type=Path, required=True)
    ap.add_argument('--id', required=True)
    ap.add_argument('--profile', default='default')
    ap.add_argument('--sizes-from-masters', action='store_true', help='verification runs: cap every output size at the master size')
    ap.add_argument('--allow-partial', action='store_true', help='compose from a sampled (non-complete) master set; output is marked sampled')
    args = ap.parse_args(argv)
    root = args.root.resolve()
    profile = load_profile(args.profile)
    d = profile['derivatives']
    mdir = root / 'masters' / args.id
    manifest = load_json(mdir / 'layer-manifest.json')
    if not manifest['complete'] and not args.allow_partial:
        raise SystemExit('masters are sampled only; pass --allow-partial for a verification package')
    out = root / 'packages' / args.id
    if out.exists():
        raise SystemExit(f'{out} exists; packages are immutable, use a new --root')
    out.mkdir(parents=True)
    cap = (lambda s: min(s, manifest['size'])) if args.sizes_from_masters else (lambda s: s)
    vsize, ksize, csize, tsize, tcsize = (cap(d[k]) for k in ('videoSize', 'keyframeSize', 'coverSize', 'thumbnailSize', 'transparentCoverSize'))
    overrides = load_json(HERE / 'peaks.json')['peakTimeSeconds'] if (HERE / 'peaks.json').exists() else {}
    frame_rec = framing(root, manifest, d['framing']['padding'])
    (out / 'framing.json').write_text(json.dumps(frame_rec, indent=2) + '\n')
    peak, peak_rule = peak_frame(manifest, overrides)
    loop = [f for f in manifest['frames'] if not f['endpoint']]
    by_frame = {f['frame']: f for f in loop}
    phases = {'start': loop[0]['frame'], 'peak': peak, 'end': loop[-1]['frame']}
    crop = tuple(frame_rec['crop'])
    hl = d['highlight']
    pkg = {'format': 'pose-hub-action-package-v3@1', 'actionId': args.id, 'profile': {'id': profile['id'], 'sha256': profile['sha256']},
           'masters': ref(root, mdir / 'layer-manifest.json'), 'recipe': manifest['recipe'], 'productionModel': manifest['productionModel'],
           'authoringModel': manifest['authoringModel'], 'fps': manifest['fps'], 'durationSeconds': manifest['durationSeconds'],
           'loopFrames': manifest['loopFrames'], 'framesUsed': len(loop), 'framing': ref(root, out / 'framing.json'),
           'keyframes': phases, 'peakRule': peak_rule, 'skins': {},
           'flags': {**manifest['flags'], 'sampledOnly': not manifest['complete']}}

    def fg(skin, frame, size, highlight=True):
        files = by_frame[frame]['files']
        if highlight and hl['source'] == 'body-highlight' and f'{skin["id"]}/body-highlight' in files:
            im = Image.open(root / files[f'{skin["id"]}/body-highlight']['path']).convert('RGBA')
        else:
            im = Image.open(root / files[f'{skin["id"]}/body']['path']).convert('RGBA')
            if highlight and 'mask' in files:
                im = blend_highlight(im, Image.open(root / files['mask']['path']), skin['highlightColor'], hl['blendBrightness'])
        return im.crop(crop).resize((size, size), Image.Resampling.LANCZOS)

    def encode(cmd, frames_iter):
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for buf in frames_iter:
            p.stdin.write(buf)
        p.stdin.close()
        if p.wait():
            raise SystemExit('ffmpeg failed: ' + ' '.join(cmd))

    fps = str(manifest['fps'])
    for skin_meta in manifest['skins']:
        skin = load_skin(skin_meta['id'])
        sdir = out / skin['id']
        entry = {'label': skin['label'], 'status': skin['status'], 'themes': {}}
        # transparent loop (video template) + transparent stills
        sdir.mkdir(parents=True)
        webm = sdir / f'loop.alpha.{vsize}.webm'
        encode(['ffmpeg', '-v', 'error', '-nostdin', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{vsize}x{vsize}', '-r', fps, '-i', 'pipe:0',
                '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-row-mt', '1', '-threads', '1', str(webm)],
               (fg(skin, f['frame'], vsize).tobytes() for f in loop))
        entry['transparentLoop'] = ref(root, webm, width=vsize, height=vsize, codec='vp9', alpha=True, frames=len(loop), fps=manifest['fps'])
        tc = sdir / f'cover.transparent.{tcsize}.png'; fg(skin, peak, tcsize).save(tc)
        ff = sdir / f'first-frame.transparent.{tcsize}.png'; fg(skin, phases['start'], tcsize).save(ff)
        entry['transparentCover'] = ref(root, tc, width=tcsize, height=tcsize, frame=peak)
        entry['transparentFirstFrame'] = ref(root, ff, width=tcsize, height=tcsize, frame=phases['start'])
        for theme, bg in d['themes'].items():
            tdir = sdir / theme; tdir.mkdir()
            mp4 = tdir / f'loop.{vsize}.mp4'
            encode(['ffmpeg', '-v', 'error', '-nostdin', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{vsize}x{vsize}', '-r', fps, '-i', 'pipe:0',
                    '-an', '-c:v', d['codec'], '-crf', str(d['crf']), '-pix_fmt', d['pixelFormat'], '-movflags', '+faststart', '-threads', '1', str(mp4)],
                   (on_background(fg(skin, f['frame'], vsize), bg).tobytes() for f in loop))
            t = {'video': ref(root, mp4, width=vsize, height=vsize, codec='h264', frames=len(loop), fps=manifest['fps'], background=bg)}
            for phase, frame in phases.items():
                pth = tdir / f'{phase}.{ksize}.png'; on_background(fg(skin, frame, ksize), bg).save(pth)
                t[phase] = ref(root, pth, width=ksize, height=ksize, frame=frame)
            cover = tdir / f'cover.{csize}.jpg'; on_background(fg(skin, peak, csize), bg).save(cover, quality=94)
            thumb = tdir / f'thumbnail.{tsize}.jpg'; on_background(fg(skin, peak, tsize), bg).save(thumb, quality=94)
            off = tdir / f'peak.highlight-off.{ksize}.png'; on_background(fg(skin, peak, ksize, highlight=False), bg).save(off)
            t.update(cover=ref(root, cover, width=csize, height=csize, frame=peak), thumbnail=ref(root, thumb, width=tsize, height=tsize, frame=peak),
                     peakHighlightOff=ref(root, off, width=ksize, height=ksize, frame=peak))
            entry['themes'][theme] = t
        pkg['skins'][skin['id']] = entry
        print(json.dumps({'event': 'skin-done', 'id': args.id, 'skin': skin['id']}), flush=True)
    (out / 'package.json').write_text(json.dumps(pkg, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'event': 'done', 'id': args.id, 'package': str(out / 'package.json')}))


if __name__ == '__main__':
    sys.exit(main())
