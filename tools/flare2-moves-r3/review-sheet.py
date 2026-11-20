#!/usr/bin/env python3
"""Flare 2.0 r3 batch 2a (2026-11-21): copy of tools/flare2-moves-r2/review-sheet.py with r3 paths. r1 (2026-11-20): copy of tools/thomas-sup/review-sheet.py (keys/views from tools/flare2-moves/actions.json). Original: Thomas supplement r2 (2026-11-19): review sheet = keyframes (rows) x side / front / top V5 views (cols), 480 px wide, with the
measured numbers of each keyframe printed under it (tools/flare2-moves/precision.py metrics). Sandbox preview only, never committed.
   python3 tools/thomas-sup/review-sheet.py <id> <views-dir from check.mjs --views> <check-output.json> <out.png>"""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
aid, vdir, chk, out = sys.argv[1:5]
plan = next(a for a in json.load(open(os.path.join(ROOT, 'tools/flare2-moves-r3/actions.json')))['actions'] if a['id'] == aid)
KEYS = [tuple(k) for k in plan['reviewKeys']]   # flare2: [metric, label, unit] per action in actions.json
std = {'checks': [], 'series': [k for k, _, _ in KEYS]}
tf = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False); json.dump(std, tf); tf.close()
of = tf.name + '.out'
subprocess.run(['python3', os.path.join(ROOT, 'tools/flare2-moves-r3/precision.py'), chk, '--std', tf.name, '--out', of], capture_output=True)
M = json.load(open(of)); os.unlink(tf.name); os.unlink(of)
font = None
for f in ('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'):
    if os.path.exists(f): font = ImageFont.truetype(f, 11); break
font = font or ImageFont.load_default()
frames = plan['reviewFrames']; views = [v.split(':')[0] for v in plan['reviewViews'].split(';')]; TW = 160; TXT = 30
sheet = Image.new('RGB', (480, len(frames) * (TW + TXT) + 18), 'white'); d = ImageDraw.Draw(sheet)
d.text((4, 2), f"{aid}  flare2 r3   " + " / ".join(views) + "   (V5, sandbox)", fill='black', font=font)
for r, fr in enumerate(frames):
    y0 = 18 + r * (TW + TXT)
    for c, v in enumerate(views):
        im = Image.open(os.path.join(vdir, f'{fr:04d}-{v}.png')).convert('RGBA'); bg = Image.new('RGBA', im.size, (246, 246, 246, 255)); bg.alpha_composite(im)
        sheet.paste(bg.convert('RGB').resize((TW, TW), Image.LANCZOS), (c * TW, y0))
        d.rectangle([c * TW, y0, c * TW + TW - 1, y0 + TW - 1], outline=(200, 200, 200))
    i = min(range(len(M['t'])), key=lambda k: abs(M['t'][k] - fr / 30))
    vals = [f"{lab} {M['series'][k][i]:.1f}{u}" if isinstance(M['series'][k][i], (int, float)) else f"{lab}-" for k, lab, u in KEYS]
    line = f"t={fr / 30:.2f}s  " + '  '.join(vals)
    d.text((3, y0 + TW + 1), line[:70], fill='black', font=font); d.text((3, y0 + TW + 15), line[70:140], fill='black', font=font)
sheet.save(out); print(out, sheet.size)
