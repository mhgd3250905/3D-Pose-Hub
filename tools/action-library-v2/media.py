"""Batch adapter for the unchanged, tested v2 compositor and QA tools.

python tools/action-library-v2/media.py --batch catalog/v2/batches/b001.json compose --root <batch-root> --skip-mosaic
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
CORE = REPO / 'tools/action-package-v2'
CORE_SHA256 = 'fedb15d24c7080926a857cacad3d3b10b15617735ab3d88053cb885af7c70507'
SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram']


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def load_batch(path):
    batch = read(path)
    if batch.get('format') != 'pose-hub-v2-production-batch@1':
        raise ValueError('Unknown batch contract')
    actions = batch.get('actions', [])
    ids = [a.get('id') for a in actions]
    if not ids or len(set(ids)) != len(ids) or any(not isinstance(x, str) or not re.fullmatch(r'[\w-]+', x) for x in ids):
        raise ValueError('A batch needs unique safe stable action IDs')
    for action in actions:
        if type(action.get('peakFrame')) is not int or not 0 < action['peakFrame'] < 239:
            raise ValueError('Each action needs an interior peak frame')
    if batch.get('skins', SKINS) != SKINS:
        raise ValueError('The approved production matrix has exactly five skins')
    return batch


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    sys.modules[name] = value
    spec.loader.exec_module(value)
    return value


def core_for(batch):
    if hashlib.sha256((CORE/'composite.py').read_bytes()).hexdigest() != CORE_SHA256:
        raise ValueError('The approved compositor core changed; use a new explicit tool revision')
    core = module('composite', CORE / 'composite.py')
    core.IDS = [a['id'] for a in batch['actions']]
    core.PEAKS = {a['id']: a['peakFrame'] for a in batch['actions']}
    return core


def preview_sheets(core, batch, argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True, type=Path)
    parser.add_argument('--ids', nargs='+', choices=core.IDS, default=core.IDS)
    args = parser.parse_args(argv)
    root = args.root
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 13)
    records = []
    for action in batch['actions']:
        aid = action['id']
        if aid not in args.ids:
            continue
        manifest = read(root/'qa/preview/realistic'/aid/'layer-manifest.json')
        frames = [f['frame'] for f in read(root/manifest['sequences']['body']['path'])['frames']]
        if not {0, 239, 240, action['peakFrame']} <= set(frames):
            raise ValueError(f'{aid}: missing actual start/peak/end/endpoint preview')
        recipe = core.framing(root, aid, SKINS, preview=True)
        temporal = Image.new('RGB', (110+180*len(frames), 30+210*5), '#e7e8eb')
        necks = Image.new('RGB', (110+180*len(frames), 30+210*5), '#e7e8eb')
        draw, neckdraw = ImageDraw.Draw(temporal), ImageDraw.Draw(necks)
        draw.text((6, 6), aid+' / actual preview frames', fill='black', font=font)
        neckdraw.text((6, 6), aid+' / head-neck-shoulder crops', fill='black', font=font)
        for row, skin in enumerate(SKINS):
            skin_manifest = read(root/'qa/preview'/skin/aid/'layer-manifest.json')
            metrics = {m['frame']: m for m in read(root/'qa/preview'/skin/aid/'metrics.json')}
            y = 30+row*210
            draw.text((4, y+75), core.LABELS[skin], fill='black', font=font)
            neckdraw.text((4, y+75), core.LABELS[skin], fill='black', font=font)
            for col, frame in enumerate(frames):
                images = core.read_layers(root, skin, aid, frame, preview=True)
                fixed = core.apply_framing(images, recipe)
                image, _ = core.compose(*fixed, core.THEMES['light'], True, core.COLORS[skin], .45)
                x = 110+col*180
                temporal.paste(image.resize((180, 180), Image.Resampling.LANCZOS), (x, y))
                # Project actual measured joints using Three's column-major matrices.
                metric = metrics[frame]
                camera = metric['camera']
                view = np.linalg.inv(np.array(camera['world']).reshape((4, 4), order='F'))
                projection = np.array(camera['projection']).reshape((4, 4), order='F')
                points = []
                for joint in ('head', 'neck', 'shoulderCenter', 'leftShoulder', 'rightShoulder'):
                    clip = projection @ view @ np.array([*metric['J'][joint], 1.])
                    if abs(clip[3]) > 1e-9:
                        ndc = clip[:2]/clip[3]
                        points.append(((ndc[0]+1)*540, (1-ndc[1])*540))
                if not points:
                    raise ValueError(f'{aid}/{frame}: cannot locate neck from measured camera')
                xs, ys = zip(*points)
                cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
                extent = max(120., max(xs)-min(xs)+70, max(ys)-min(ys)+70)
                crop = (round(cx-extent/2), round(cy-extent/2), round(cx+extent/2), round(cy+extent/2))
                body = Image.new('RGBA', images[0].size, '#25292f')
                body = Image.alpha_composite(body, images[0].convert('RGBA')).convert('RGB')
                necks.paste(body.crop(crop).resize((180, 180), Image.Resampling.LANCZOS), (x, y))
                for painter in (draw, neckdraw):
                    painter.text((x+4, y+184), f'f{frame:03d} / {frame/30:.2f}s', fill='black', font=font)
            if skin_manifest['sourceSha256'] != manifest['sourceSha256']:
                raise ValueError('Mixed preview sources')
        paths = []
        for suffix, sheet in [('temporal', temporal), ('neck', necks)]:
            dest = root/'qa/preview-sheets'/f'{aid}.{suffix}.png'
            dest.parent.mkdir(parents=True, exist_ok=True)
            sheet.save(dest)
            paths.append(core.ref(root, dest))
        records.append({'actionId': aid, 'sourceSha256': manifest['sourceSha256'],
                        'frames': frames, 'sheets': paths, 'reviewStatus': 'pending'})
        print(aid+' preview sheets ready', flush=True)
    target = root/'qa/preview-sheets/index.json'
    previous = read(target)['actions'] if target.exists() else []
    merged = {r['actionId']: r for r in previous if r['actionId'] in core.IDS and r['actionId'] not in args.ids}
    merged.update({r['actionId']: r for r in records})
    core.write_json(target, {'format': 'pose-hub-batch-preview-sheets@1',
                            'actions': [merged[aid] for aid in core.IDS if aid in merged],
                            'automaticApproval': False})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', required=True, type=Path)
    parser.add_argument('command', choices=['compose', 'preview-sheets', 'review-sheets', 'audit-metrics', 'scan-sequences'])
    args, rest = parser.parse_known_args()
    batch = load_batch(args.batch)
    core = core_for(batch)
    if args.command == 'preview-sheets':
        preview_sheets(core, batch, rest)
        return
    scripts = {'review-sheets': 'review_frames.py', 'audit-metrics': 'audit_metrics.py',
               'scan-sequences': 'qa_sequences.py'}
    target = core if args.command == 'compose' else module('batch_'+args.command.replace('-', '_'), CORE/scripts[args.command])
    sys.argv = [str(args.batch), *rest]
    target.main()


if __name__ == '__main__':
    main()
