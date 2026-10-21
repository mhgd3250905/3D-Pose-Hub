"""Compose delivery assets from immutable v2 layers. No browser or 3D render.

python tools/action-package-v2/composite.py --root F:/PoseHub-v2-pilot --preview
python tools/action-package-v2/composite.py --root F:/PoseHub-v2-pilot
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from functools import lru_cache
import hashlib
import json
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

IDS = ['w-dead-bug', 'h-chair-step-up', 'h-db-curl', 'glute-max-A', 's-frog', 'h-catcow-quad']
SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram']
LABELS = {'realistic': 'Original', 'tech-white': 'Platinum', 'neon-night': 'Blue',
          'neon-night-b': 'Green', 'hologram': 'Hologram'}
PEAKS = {'w-dead-bug': 56, 'h-chair-step-up': 66, 'h-db-curl': 60,
         'glute-max-A': 63, 's-frog': 114, 'h-catcow-quad': 39}
THEMES = {'dark': '#101013', 'light': '#f3f2ef'}
COLORS = {'realistic': '#f08a3c', 'tech-white': '#f08a3c', 'neon-night': '#9fdcff',
          'neon-night-b': '#b6ffd0', 'hologram': '#e9d49c'}


def rgb(value):
    if len(value) != 7 or not value.startswith('#'):
        raise ValueError('Colour must be #RRGGBB')
    return np.array([int(value[i:i+2], 16) for i in (1, 3, 5)], dtype=np.float32)


def compose(body, mask, shadow, background, enabled=True, color='#f08a3c', brightness=.45):
    """Straight-alpha source-over, shadow below body; mask changes RGB only.

    A zero-alpha foreground stays transparent even for a nonzero mask. The
    visible, depth-tested mask never adds geometry or changes the alpha edge.
    """
    if not 0 <= brightness <= 1:
        raise ValueError('brightness must be in [0,1]')
    rgba = np.asarray(body.convert('RGBA'), dtype=np.float32) / 255
    grey = np.asarray(mask.convert('L'), dtype=np.float32) / 255
    if rgba.shape[:2] != grey.shape:
        raise ValueError('Mask and body dimensions differ')
    color_rgb = rgb(color) / 255
    weight = grey[..., None] * (brightness if enabled else 0)
    rgba[..., :3] = rgba[..., :3] * (1-weight) + color_rgb * weight
    foreground = Image.fromarray(np.clip(np.rint(rgba*255), 0, 255).astype(np.uint8))
    base = Image.new('RGBA', body.size, background)
    if shadow is not None:
        if shadow.size != body.size:
            raise ValueError('Shadow and body dimensions differ')
        base = Image.alpha_composite(base, shadow.convert('RGBA'))
    return Image.alpha_composite(base, foreground).convert('RGB'), foreground


def ref(root, path, **extra):
    raw = path.read_bytes()
    return {'root': 'media', 'path': path.relative_to(root).as_posix(),
            'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), **extra}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


@contextmanager
def manifest_lock(path, timeout=30):
    """OS lock released on exceptions or process exit; the lock file stays put.

    Keeping the same lock inode avoids a delete/recreate race between workers.
    The adjacent temporary file and lock both remain on the media drive.
    """
    path=Path(path)
    path.parent.mkdir(parents=True,exist_ok=True)
    handle=open(path.with_name(path.name+'.lock'),'a+b')
    locked=False
    try:
        if os.fstat(handle.fileno()).st_size==0:
            handle.write(b'\0');handle.flush()
        deadline=time.monotonic()+timeout
        while True:
            try:
                handle.seek(0)
                if os.name=='nt':
                    import msvcrt
                    msvcrt.locking(handle.fileno(),msvcrt.LK_NBLCK,1)
                else:
                    import fcntl
                    fcntl.flock(handle.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
                locked=True
                break
            except OSError:
                if time.monotonic()>=deadline:
                    raise TimeoutError(f'Timed out locking derivative manifest: {path}') from None
                time.sleep(.05)
        yield
    finally:
        try:
            if locked:
                handle.seek(0)
                if os.name=='nt':
                    import msvcrt
                    msvcrt.locking(handle.fileno(),msvcrt.LK_UNLCK,1)
                else:
                    import fcntl
                    fcntl.flock(handle.fileno(),fcntl.LOCK_UN)
        finally:
            handle.close()


def merge_derivative_manifest(path, variants, transparent, timeout=30):
    """Merge completed outputs under one cross-process read/merge/replace lock."""
    path=Path(path)
    with manifest_lock(path,timeout):
        # Never use the read cache for a manifest another process can update.
        current=json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else {}
        if current and current.get('schema')!='pose-hub-derivatives@2':
            raise ValueError('Existing derivative manifest has an unexpected schema')
        merged={}
        for item in [*current.get('variants',[]),*variants]:
            key=tuple(item[field] for field in ('actionId','skin','theme'))
            if key in merged and merged[key]!=item:
                raise FileExistsError(f'Different derivative already registered for {key}')
            merged[key]=item
        covers={action:dict(skins) for action,skins in current.get('transparentCovers',{}).items()}
        for action,skins in transparent.items():
            target=covers.setdefault(action,{})
            for skin,cover in skins.items():
                if skin in target and target[skin]!=cover:
                    raise FileExistsError(f'Different transparent cover already registered for {action}/{skin}')
                target[skin]=cover
        result={**current,'schema':'pose-hub-derivatives@2','variants':list(merged.values()),'transparentCovers':covers}
        temporary=None
        try:
            with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',newline='\n',
                    prefix=path.name+'.',suffix='.tmp',dir=path.parent,delete=False) as handle:
                temporary=Path(handle.name)
                json.dump(result,handle,ensure_ascii=False,indent=2)
                handle.write('\n');handle.flush();os.fsync(handle.fileno())
            os.replace(temporary,path)
        finally:
            if temporary is not None and temporary.exists():
                temporary.unlink()
        return result


@lru_cache(maxsize=256)
def read_json_cached(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def layer_paths(root, skin, action, frame, preview=False):
    base = (root/'qa'/'preview'/skin/action) if preview else (root/'masters'/skin/action)
    paths = [base/'body'/f'm-{frame:04d}.png', base/'highlight'/f'k-{frame:04d}.png',
             base/'shadow'/f's-{frame:04d}.png']
    # Sharing is explicit in the layer manifest; never infer it from a skin name.
    manifest = base/'layer-manifest.json'
    if manifest.exists():
        data = read_json_cached(str(manifest))
        for i, key in enumerate(('body','highlight','shadow')):
            sequence=data.get('sequences',{}).get(key)
            if sequence:
                index=read_json_cached(str(root/sequence['path']))
                record=next((r for r in index['frames'] if r.get('frame')==frame),None)
                if record:
                    relative=Path(record['path'])
                    if relative.is_absolute() or '..' in relative.parts:
                        raise ValueError('Invalid frame path')
                    paths[i]=root/relative
                else:
                    raise FileNotFoundError(f'Authoritative {key} sequence has no frame {frame}: {skin}/{action}')
    return paths


def read_layers(root, skin, action, frame, preview=False):
    paths = layer_paths(root, skin, action, frame, preview)
    if not all(p.is_file() for p in paths):
        raise FileNotFoundError(', '.join(str(p) for p in paths if not p.is_file()))
    images = []
    for p in paths:
        with Image.open(p) as image:
            images.append(image.copy())
    if any(im.size!=(1080,1080) or im.mode!='RGBA' for im in images):
        raise ValueError('Every master layer must be 1080x1080 RGBA before framing')
    return images


def framing(root, action, skins, preview=False):
    """One square crop for all times/skins/layers of an action, never per-frame.

    Full production scans every body frame. Preview scans available samples.
    The crop is padded by 8% on each side and may extend beyond the canvas;
    PIL fills RGBA outside the source with zero alpha.
    """
    boxes=[]
    for skin in skins:
        base=(root/'qa'/'preview'/skin/action) if preview else (root/'masters'/skin/action)
        files=sorted((base/'body').glob('m-*.png'))
        if not preview and len(files)!=240:
            raise ValueError(f'{action}/{skin}: expected 240 body frames before framing')
        for path in files:
            with Image.open(path) as image:
                box=image.convert('RGBA').getchannel('A').getbbox()
                if box:boxes.append(box)
    if not boxes:
        raise ValueError(f'{action}: no visible body/props')
    x0=min(b[0] for b in boxes); y0=min(b[1] for b in boxes)
    x1=max(b[2] for b in boxes); y1=max(b[3] for b in boxes)
    side=int(np.ceil(max(x1-x0,y1-y0)*1.16))
    cx,cy=(x0+x1)/2,(y0+y1)/2
    crop=(int(np.floor(cx-side/2)),int(np.floor(cy-side/2)),
          int(np.floor(cx-side/2))+side,int(np.floor(cy-side/2))+side)
    return {'crop':list(crop),'sourceSize':[1080,1080],'targetSize':[1080,1080],
            'policy':'union-of-all-body-and-prop-alpha; all-skins-and-frames; fixed-square; 8%-padding',
            'samples':len(boxes),'preview':preview}


def apply_framing(images, recipe):
    return [im.crop(tuple(recipe['crop'])).resize((1080,1080),Image.Resampling.LANCZOS) for im in images]


def probe_video(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames,duration',
        '-of', 'json', str(path)], capture_output=True, text=True, check=True)
    stream = json.loads(result.stdout)['streams'][0]
    if (stream['codec_name'], stream['width'], stream['height'], stream.get('nb_read_frames')) != ('h264', 720, 720, '240'):
        raise ValueError(f'Invalid delivery stream: {stream}')
    if stream['r_frame_rate'] != '30/1' or abs(float(stream['duration'])-8) > .001:
        raise ValueError('Invalid delivery timing')
    subprocess.run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(path), '-f', 'null', '-'],
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    return stream


def make_derivatives(root, ids, skins, enabled=True, color_override=None, brightness=.45,set_name=None):
    if not 0<=brightness<=1:
        raise ValueError('brightness must be in [0,1] before any output is written')
    if color_override is not None:rgb(color_override)
    manifest_path=root/'manifests'/('derivatives.json' if set_name is None else f'derivatives.{set_name}.json')
    output_base=root/'derivatives' if set_name is None else root/'derivatives'/set_name
    with manifest_lock(manifest_path):
        previous=json.loads(manifest_path.read_text(encoding='utf-8-sig')) if manifest_path.exists() else {}
    existing_variants=previous.get('variants',[])
    variants=[]
    transparent={}
    recipes={action:framing(root,action,SKINS) for action in ids}
    # Preflight the entire request before writing recipes or starting encoders.
    # A failed or interrupted batch is preserved and needs a new output revision.
    for action in ids:
        framing_path=root/'manifests'/'framing'/f'{action}.json'
        if framing_path.exists() and read_json_cached(str(framing_path))!=recipes[action]:
            raise FileExistsError('Existing framing uses another input set; choose a new revision')
        for skin in skins:
            for theme in THEMES:
                video=output_base/skin/action/theme/'loop.720.mp4'
                if video.exists() or any((v.get('actionId'),v.get('skin'),v.get('theme'))==(action,skin,theme) for v in existing_variants):
                    raise FileExistsError(f'Output already exists; no files were changed: {video}')
    for action in ids:
        framing_recipe=recipes[action]
        write_json(root/'manifests'/'framing'/f'{action}.json',framing_recipe)
        transparent.setdefault(action,{})
        for skin in skins:
            out = output_base/skin/action
            out.mkdir(parents=True, exist_ok=True)
            color = color_override or COLORS[skin]
            handles = {}
            for theme in THEMES:
                target = out/theme
                target.mkdir(exist_ok=True)
                video = target/'loop.720.mp4'
                if video.exists():
                    raise FileExistsError(f'Choose a new batch directory instead of overwriting {video}')
                proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-nostdin', '-f', 'rawvideo',
                    '-pix_fmt', 'rgb24', '-s', '720x720', '-r', '30', '-i', 'pipe:0', '-an',
                    '-c:v', 'libx264', '-threads', '2', '-preset', 'medium', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-n', str(video)],
                    stdin=subprocess.PIPE, stderr=subprocess.PIPE)
                handles[theme] = (proc, video)
            frames = {'start': 0, 'peak': PEAKS[action], 'end': 239}
            assets = {theme: {} for theme in THEMES}
            try:
                for f in range(240):
                    body, mask, shadow = apply_framing(read_layers(root, skin, action, f),framing_recipe)
                    for theme, background in THEMES.items():
                        image, foreground = compose(body, mask, shadow, background, enabled, color, brightness)
                        small = image.resize((720, 720), Image.Resampling.LANCZOS)
                        handles[theme][0].stdin.write(small.tobytes())
                        if f in frames.values():
                            phase = next(k for k, v in frames.items() if v == f)
                            path = out/theme/f'{phase}.720.png'
                            small.save(path)
                            assets[theme][phase] = ref(root, path, width=720, height=720, frame=f)
                        if f == PEAKS[action]:
                            cover = out/theme/'cover.720.jpg'
                            thumb = out/theme/'thumbnail.240.jpg'
                            small.save(cover, quality=94)
                            image.resize((240,240), Image.Resampling.LANCZOS).save(thumb, quality=94)
                            assets[theme]['cover'] = ref(root, cover, width=720, height=720)
                            assets[theme]['thumbnail'] = ref(root, thumb, width=240, height=240)
                            off,_=compose(body,mask,shadow,background,False,color,brightness)
                            off.resize((720,720),Image.Resampling.LANCZOS).save(out/theme/'comparison.off.720.png')
                            if theme == 'dark':
                                path = out/'cover.transparent.1080.png'
                                foreground.save(path)
                                transparent[action][skin] = ref(root, path, width=1080, height=1080, alpha=True)
                for proc, video in handles.values():
                    proc.stdin.close()
                    error = proc.stderr.read().decode('utf-8', errors='replace')
                    if proc.wait() != 0:
                        raise RuntimeError(error)
                    probe_video(video)
                for theme in THEMES:
                    video = handles[theme][1]
                    variants.append({'actionId': action, 'skin': skin, 'theme': theme,
                        'highlight': {'enabled': enabled, 'color': color, 'brightness': brightness},
                        'modelVersion': '1.0.0-rc2', 'mirrored': False,
                        'framing':ref(root,root/'manifests'/'framing'/f'{action}.json'),
                        'video': ref(root, video, width=720, height=720, durationSeconds=8,
                                     frames=240, fps=30, codec='h264', pixelFormat='yuv420p'),
                        'cover': assets[theme]['cover'], 'thumbnail': assets[theme]['thumbnail'],
                        'keyframes': [{'phase': p, 'asset': assets[theme][p]} for p in frames]})
                print(f'composed {action} {skin}: dark+light, 240 frames', flush=True)
            finally:
                for proc, _ in handles.values():
                    if proc.poll() is None:
                        proc.kill()
                        proc.wait()
            merge_derivative_manifest(manifest_path,variants,transparent)
    return variants


def make_mosaic(root, ids, skins, frame_override=None, brightness=.45, preview=False,color_override=None,set_name=None):
    """One figure covers every action x skin x theme x highlight state."""
    cell, caption, top, left = 168, 42, 60, 150
    width, height = left+len(skins)*cell*4, top+len(ids)*(cell+caption)
    sheet = Image.new('RGB', (width,height), '#e7e8eb')
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 16)
        small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 12)
    except OSError:
        font = small = ImageFont.load_default()
    for col, skin in enumerate(skins):
        x = left+col*cell*4
        draw.text((x+8, 8), LABELS[skin], fill='black', font=font)
        for sub, (theme, enabled) in enumerate([('light',False),('light',True),('dark',False),('dark',True)]):
            draw.text((x+sub*cell+8, 32), f'{theme} / HI {"ON" if enabled else "OFF"}', fill='black', font=small)
    missing = []
    for row, action in enumerate(ids):
        y = top+row*(cell+caption)
        draw.text((6, y+60), action, fill='black', font=small)
        frame = frame_override if frame_override is not None else PEAKS[action]
        recipe=framing(root,action,skins,preview)
        for col, skin in enumerate(skins):
            try:
                body, mask, shadow = apply_framing(read_layers(root, skin, action, frame, preview),recipe)
                for sub, (theme, enabled) in enumerate([('light',False),('light',True),('dark',False),('dark',True)]):
                    image, _ = compose(body, mask, shadow, THEMES[theme], enabled, color_override or COLORS[skin], brightness)
                    x = left+col*cell*4+sub*cell
                    sheet.paste(image.resize((cell,cell), Image.Resampling.LANCZOS),(x,y))
                    draw.text((x+5,y+cell+7), f'f{frame:03d} / {frame/30:.2f}s', fill='black', font=small)
            except FileNotFoundError:
                missing.append(f'{skin}/{action}/frame-{frame}')
    stem='action-skin-theme-highlight-mosaic'+('' if set_name is None else '.'+set_name)
    path = root/'previews'/(stem+'.png')
    path.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(path)
    write_json(root/'previews'/('mosaic.json' if set_name is None else f'mosaic.{set_name}.json'), {'schema':'pose-hub-mosaic@2','asset':ref(root,path),
        'actions':ids,'skins':skins,'themes':list(THEMES),'highlightStates':[False,True],
        'missing':missing,'status':'incomplete' if missing else 'complete'})
    if missing:
        raise ValueError('Mosaic has missing cells: '+', '.join(missing))
    return path


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root',type=Path,required=True)
    ap.add_argument('--ids',nargs='+',choices=IDS,default=IDS)
    ap.add_argument('--skins',nargs='+',choices=SKINS,default=SKINS)
    ap.add_argument('--preview',action='store_true')
    ap.add_argument('--preview-frame',type=int)
    ap.add_argument('--highlight-off',action='store_true')
    ap.add_argument('--highlight-color')
    ap.add_argument('--highlight-brightness',type=float,default=.45)
    ap.add_argument('--derivative-set',help='Safe name for another composite recipe; reuses the same masters')
    mode=ap.add_mutually_exclusive_group()
    mode.add_argument('--skip-mosaic',action='store_true',help='Compose only; concurrent workers must not write the same mosaic')
    mode.add_argument('--mosaic-only',action='store_true',help='Build a mosaic from full masters without recomposing delivery files')
    args=ap.parse_args()
    if args.derivative_set and not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}',args.derivative_set):
        ap.error('--derivative-set must be a simple directory name')
    if args.preview and (args.skip_mosaic or args.mosaic_only):
        ap.error('--preview already builds a preview mosaic; it cannot be combined with --skip-mosaic or --mosaic-only')
    if not args.preview and not args.mosaic_only:
        make_derivatives(args.root,args.ids,args.skins,not args.highlight_off,args.highlight_color,args.highlight_brightness,args.derivative_set)
    if not args.skip_mosaic:
        print(make_mosaic(args.root,args.ids,args.skins,args.preview_frame,args.highlight_brightness, args.preview,args.highlight_color,args.derivative_set))


if __name__=='__main__':
    main()
