"""Compose actual preview PNGs; no image synthesis or geometric reshaping."""
import argparse, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p=argparse.ArgumentParser()
p.add_argument('--before',type=Path,required=True)
p.add_argument('--after',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
a=p.parse_args()
if a.output.exists(): raise SystemExit('Output exists; use a new path')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
canvas=Image.new('RGB',(1280,1440),'white');d=ImageDraw.Draw(canvas)
for col,(directory,prefix,label) in enumerate([(a.before,'r7-r5','Before: elongated arms / hand scale 1.18'),(a.after,'armfix-r1','Candidate: restored arm lengths / hand scale 1.00')]):
 report=json.loads((directory/'report.json').read_text(encoding='utf-8'))
 row=next(x for x in report['models'] if x['model']==prefix)
 for r,view in enumerate(['front','side']):
  item=next(x for x in row['frames'] if x['pose']=='arms-down' and x['view']==view)
  img=Image.open(directory/item['file']).convert('RGB')
  if img.size!=(640,640): raise SystemExit('Preview size must be 640x640')
  x,y=640*col,720*r;d.text((x+12,y+8),label,font=font,fill='#18212a')
  canvas.paste(img,(x,y+40));s=item['sides']['left']
  d.text((x+12,y+685),f"{view} | upper {s['upperArmMm']:.1f} mm + forearm {s['forearmMm']:.1f} mm",font=small,fill='#18212a')
canvas.save(a.output)
