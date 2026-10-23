"""Build local review videos from the PR15 repair's body/highlight masters.

These previews omit the floor-shadow layer and are not release assets.
Usage: python tools/action-package-v2/review_contact_repairs.py --root <batch>
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from composite import compose, framing, apply_framing, probe_video

IDS = ['h-bent-knee-calf-raise-rr4', 'h-chair-single-leg-hip-thrust-rr5']


def build(root, ids):
    target = root / 'review'
    if target.exists():
        raise FileExistsError(f'Existing review preserved: {target}')
    for action in ids:
        folder = root / 'masters' / 'realistic' / action
        for frame in range(240):
            for layer, prefix in [('body', 'm'), ('highlight', 'k')]:
                if not (folder / layer / f'{prefix}-{frame:04}.png').is_file():
                    raise FileNotFoundError(f'Missing {action}/{layer}/{frame}')
    target.mkdir()
    report = {'reviewedByUser': False, 'releaseEligible': False,
              'note': 'Review only; fixed all-frame crop, original skin, no floor shadow.', 'actions': []}
    for action in ids:
        folder = root / 'masters' / 'realistic' / action
        recipe = framing(root, action, ['realistic'])
        rows = json.loads((folder / 'metrics.json').read_text(encoding='utf-8'))
        camera = json.loads((folder/'occlusion-audit.json').read_text(encoding='utf-8'))['camera']
        projection = np.array(camera['projection']).reshape((4,4), order='F')
        view = np.linalg.inv(np.array(camera['world']).reshape((4,4), order='F'))
        start, end = [next(row for row in rows if row['frame'] == f) for f in (0, 240)]
        joint_error = max(float(np.linalg.norm(np.array(start['J'][j])-end['J'][j]))
                          for j in start['J'] if isinstance(start['J'][j], list)) * 1000
        video = target / f'{action}.mp4'
        proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-nostdin', '-f', 'rawvideo',
            '-pix_fmt', 'rgb24', '-s', '720x720', '-r', '30', '-i', 'pipe:0', '-an',
            '-c:v', 'libx264', '-threads', '2', '-preset', 'medium', '-crf', '18',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-n', str(video)],
            stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            for f in range(240):
                with Image.open(folder/'body'/f'm-{f:04}.png') as b, Image.open(folder/'highlight'/f'k-{f:04}.png') as k:
                    body, mask = apply_framing([b, k], recipe)
                image, _ = compose(body, mask, None, '#101013')
                image = image.resize((720, 720), Image.Resampling.LANCZOS)
                proc.stdin.write(image.tobytes())
                if f in (0, 60, 120, 180, 239):
                    image.save(target / f'{action}-{f:03}.png')
                if f == 120:
                    metric = next(row for row in rows if row['frame'] == f)
                    crop = recipe['crop']
                    for side in ('left', 'right'):
                        clip = projection @ view @ np.array([*metric['J'][side+'Palm'], 1])
                        point = ((clip[:2]/clip[3])*np.array([1,-1])+1)*540
                        cx = (point[0] - crop[0]) * 720 / (crop[2] - crop[0])
                        cy = (point[1] - crop[1]) * 720 / (crop[3] - crop[1])
                        image.crop((round(cx-100),round(cy-100),round(cx+100),round(cy+100))).resize(
                            (600,600), Image.Resampling.LANCZOS).save(target/f'{action}-{side}-hand.png')
            proc.stdin.close()
            errors = proc.stderr.read().decode(errors='replace')
            if proc.wait() != 0:
                raise RuntimeError(errors)
        finally:
            if proc.poll() is None:
                proc.terminate()
                proc.wait()
        stream = probe_video(video)
        report['actions'].append({'id': action, 'video': video.name, 'stream': stream,
            'sha256': hashlib.sha256(video.read_bytes()).hexdigest(), 'framing': recipe,
            'sampledFrames': len(rows), 'solverWarningFrames': sum(bool(r['warn']) for r in rows),
            'minCapsuleGapMm': min(r['clip']['worstGapMm'] for r in rows),
            'minSurfaceY': min(r['minY'] for r in rows), 'loopJointErrorMm': joint_error,
            'limits': 'Capsule clearance is a diagnostic, not exhaustive triangle intersection QA.'})
        print(action, 'complete', flush=True)
    (target/'qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--ids', nargs='+', default=IDS)
    args = parser.parse_args()
    if any(not action.replace('-', '').replace('_', '').isalnum() for action in args.ids):
        parser.error('Action IDs must be simple file names')
    build(args.root, args.ids)
