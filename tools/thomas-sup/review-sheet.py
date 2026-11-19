#!/usr/bin/env python3
"""Thomas supplement r2 (2026-11-19): review sheet = keyframes (rows) x side / front / top V5 views (cols), 480 px wide, with the
measured numbers of each keyframe printed under it (tools/thomas-sup/precision.py metrics). Sandbox preview only, never committed.
   python3 tools/thomas-sup/review-sheet.py <id> <views-dir from check.mjs --views> <check-output.json> <out.png>"""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
aid, vdir, chk, out = sys.argv[1:5]
plan = next(a for a in json.load(open(os.path.join(ROOT, 'tools/thomas-sup/actions.json')))['actions'] if a['id'] == aid)
KEYS = {'t-pushup-plus': [('elbowMin', 'elbow', '°'), ('chestHeightMm', 'chestY', 'mm'), ('scapFwd', 'scapFwd', 'mm'), ('trunkFlexDeg', 'trunkFlex', '°'), ('hipOffsetMm', 'hipOff', 'mm'), ('shoulderLeadCm', 'shLead', 'cm')],
        't-planche-lean': [('elbowMin', 'elbow', '°'), ('shoulderLeadCm', 'shLead', 'cm'), ('armFromVerticalDeg', 'armTilt', '°'), ('scapFwd', 'scapFwd', 'mm'), ('scapUp', 'scapUp', 'mm'), ('hipOffsetMm', 'hipOff', 'mm'), ('trunkFlexDeg', 'trunkFlex', '°')],
        't-frog-stand': [('elbowMin', 'elbow', '°'), ('shoulderLeadCm', 'shLead', 'cm'), ('comLeadCm', 'COM', 'cm'), ('kneeArmGapMin', 'kneeGap', 'mm'), ('kneeArmTmin', 'kneeT', ''), ('footClearMm', 'footUp', 'mm'), ('gazeBelowHorizDeg', 'gaze', '°')],
        't-kneeling-scap-pushup': [('elbowMin', 'elbow', '°'), ('chestHeightMm', 'chestY', 'mm'), ('scapFwd', 'scapFwd', 'mm'), ('trunkFlexDeg', 'trunkFlex', '°'), ('hipOffsetKneeMm', 'hipOff', 'mm'), ('shoulderLeadCm', 'shLead', 'cm'), ('kneeFloorMm', 'knee', 'mm')],
        't-seated-shoulder-ext-slide': [('elbowMin', 'elbow', '°'), ('shoulderExtMin', 'shExt', '°'), ('gazeBelowHorizDeg', 'gazeDown', '°'), ('headVsTrunkDeg', 'headFlex', '°'), ('scapUp', 'scapUp', 'mm'), ('trunkFlexDeg', 'trunkFlex', '°'), ('seatContactMm', 'seat', 'mm')],
        't-hanging-leg-raise': [('elbowMin', 'elbow', '°'), ('kneeMin', 'knee', '°'), ('legElevMin', 'legElev', '°'), ('comFwdCm', 'COMfwd', 'cm'), ('thoraxPitchDeg', 'thorax', '°'), ('scapUp', 'scapUp', 'mm'), ('anklesApartCm', 'ankles', 'cm')],
        't-straddle-planche': [('elbowMin', 'elbow', '°'), ('comLeadCm', 'COM', 'cm'), ('shoulderLeadCm', 'shLead', 'cm'), ('armFromVerticalDeg', 'armTilt', '°'), ('bodyTiltDeg', 'bodyTilt', '°'), ('straddleDeg', 'straddle', '°'), ('wristExtMax', 'wristExt', '°')],
        't-pbar-support-swing': [('elbowMin', 'elbow', '°'), ('bodySwingDeg', 'swing', '°'), ('bodyLineDeg', 'bodyLine', '°'), ('trunkFlexDeg', 'hollow', '°'), ('scapUp', 'scapUp', 'mm'), ('shoulderBarZcm', 'shOverHand', 'cm'), ('toeTopMm', 'toeTop', 'mm')],
        't-self-resisted-wrist-flexion': [('wristFlexR', 'wristFlex', '°'), ('wristDevR', 'dev', '°'), ('supR', 'palmUp', '°'), ('forearmPitchDeg', 'forearm', '°')],
        't-self-resisted-wrist-extension': [('wristFlexR', 'wristFlex', '°'), ('wristDevR', 'dev', '°'), ('supR', 'palmUp', '°'), ('forearmPitchDeg', 'forearm', '°')],
        't-seated-forearm-rotation': [('supR', 'rotation', '°'), ('wristFlexR', 'wristFlex', '°'), ('wristDevR', 'dev', '°'), ('forearmPitchDeg', 'forearm', '°')],
        't-straddle-active-lift': [('legLiftMm', 'lift', 'mm'), ('kneeMin', 'knee', '°'), ('kneeUpDegMax', 'kneeCap', '°'), ('toeUpDegMax', 'toes', '°'), ('elbowMin', 'elbow', '°'), ('pelvisPitchDeg', 'pelvis', '°'), ('seatContactMm', 'seat', 'mm')]}[aid]
std = {'checks': [], 'series': [k for k, _, _ in KEYS]}
tf = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False); json.dump(std, tf); tf.close()
of = tf.name + '.out'
subprocess.run(['python3', os.path.join(ROOT, 'tools/thomas-sup/precision.py'), chk, '--std', tf.name, '--out', of], capture_output=True)
M = json.load(open(of)); os.unlink(tf.name); os.unlink(of)
font = None
for f in ('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'):
    if os.path.exists(f): font = ImageFont.truetype(f, 11); break
font = font or ImageFont.load_default()
frames = plan['reviewFrames']; views = ['side', 'front', 'top']; TW = 160; TXT = 30
sheet = Image.new('RGB', (480, len(frames) * (TW + TXT) + 18), 'white'); d = ImageDraw.Draw(sheet)
d.text((4, 2), f"{aid}  r2   side / front / top   (V5, sandbox)", fill='black', font=font)
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
