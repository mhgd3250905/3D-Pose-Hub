"""Build P4 comparison sheets from two explicit fresh preview directories.

Usage: python compare-preview-r7-r1.py P5_PREVIEW R7_PREVIEW NEW_OUTPUT
Only layout, labels and resizing are applied; source pixels stay in the inputs.
"""
import hashlib
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

before, after, out = map(Path, sys.argv[1:])
if out.exists():
    raise FileExistsError(out)
reports = [json.loads((folder / 'report.json').read_text(encoding='utf-8'))
           for folder in (before, after)]
if (reports[0]['profile'], reports[0]['version']) != ('training-human-v3-shoulder-completed', '1.0.0-r3'):
    raise ValueError('Expected P5 baseline preview first')
if (reports[1]['profile'], reports[1]['version']) != ('training-human-v3-completed', '1.0.0-r7'):
    raise ValueError('Expected canonical R7 preview second')
if any(r['action'] != 'a-deep-squat-r3.js' or r['pageErrors'] for r in reports):
    raise ValueError('Expected successful squat previews')

def key(row):
    return row['time'], row['side'], row['view']

maps = [{key(row): row for row in report['frames']} for report in reports]
if maps[0].keys() != maps[1].keys() or any(len(m) != len(r['frames']) for m, r in zip(maps, reports)):
    raise ValueError('Frame sets differ or contain duplicates')
times = sorted({k[0] for k in maps[0]})
views = [('left', 'hip-rear-up'), ('right', 'hip-rear-up'),
         ('left', 'knee-front'), ('left', 'knee-outside'),
         ('right', 'knee-front'), ('right', 'knee-outside')]
for t in times:
    for side, view in views:
        a, b = (m[t, side, view] for m in maps)
        if any(abs(x - y) > 1e-8 for name in ('camera', 'target') for x, y in zip(a[name], b[name])):
            raise ValueError('Different cameras: ' + str((t, side, view)))

font = None
for name in ('DejaVuSans.ttf', 'C:/Windows/Fonts/arial.ttf'):
    try:
        font = ImageFont.truetype(name, 17)
        break
    except OSError:
        pass
if font is None:
    font = ImageFont.load_default()
out.mkdir(parents=True)
evidence = {'scope': 'P5 baseline versus canonical R7, matched cameras; not an automatic visual verdict', 'frames': []}
for t in times:
    sheet = Image.new('RGB', (1920, 700), 'white')
    draw = ImageDraw.Draw(sheet)
    for column, (side, view) in enumerate(views):
        pair = {'time': t, 'side': side, 'view': view}
        for row, (folder, mapping, label) in enumerate(zip((before, after), maps, ('P5 baseline', 'canonical R7'))):
            src = folder / mapping[t, side, view]['file']
            with Image.open(src) as image:
                if image.size != (480, 480):
                    raise ValueError('Unexpected source size: ' + str(src))
                sheet.paste(image.convert('RGB').resize((320, 320), Image.Resampling.LANCZOS), (column * 320, row * 350 + 30))
            draw.text((column * 320 + 3, row * 350 + 4), f't{t} {side} {view} {label}', font=font, fill='black')
            pair['before' if row == 0 else 'after'] = {'file': str(src.resolve()), 'sha256': hashlib.sha256(src.read_bytes()).hexdigest()}
        evidence['frames'].append(pair)
    sheet.save(out / f'p4-r7-t{t}-comparison.jpg', quality=94)
with (out / 'sources.json').open('x', encoding='utf-8') as stream:
    json.dump(evidence, stream, indent=2)
print(json.dumps({'times': times, 'pairedViews': len(evidence['frames']), 'output': str(out)}))
