"""Create temporal review sheets from completed masters, without granting approval."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from composite import IDS, SKINS, LABELS, PEAKS, THEMES, COLORS, apply_framing, compose, framing, read_layers, ref, write_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--ids', nargs='+', choices=IDS, default=IDS)
    args = parser.parse_args()
    root = args.root
    records = []
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 14)
    for action in args.ids:
        frames = sorted(set([0, 30, 60, 90, 120, 150, 180, 210, 239, 240, PEAKS[action]]))
        recipe_path = root/'manifests/framing'/f'{action}.json'
        recipe = json.loads(recipe_path.read_text(encoding='utf-8')) if recipe_path.exists() else framing(root, action, SKINS)
        cell, label, row_label = 180, 30, 110
        sheet = Image.new('RGB', (row_label+len(frames)*cell, 30+len(SKINS)*(cell+label)), '#e7e8eb')
        draw = ImageDraw.Draw(sheet)
        draw.text((8, 8), action+' / temporal samples / HI ON', fill='black', font=font)
        for row, skin in enumerate(SKINS):
            y = 30+row*(cell+label)
            draw.text((6, y+75), LABELS[skin], fill='black', font=font)
            for col, frame in enumerate(frames):
                if frame == 240:
                    manifest = json.loads((root/'masters'/skin/action/'layer-manifest.json').read_text(encoding='utf-8'))
                    images = []
                    for layer in ('body', 'highlight', 'shadow'):
                        with Image.open(root/manifest['qaEndpoint'][layer]['path']) as image:
                            images.append(image.copy())
                else:
                    images = read_layers(root, skin, action, frame)
                body, mask, shadow = apply_framing(images, recipe)
                image, _ = compose(body, mask, shadow, THEMES['light'], True, COLORS[skin], .45)
                x = row_label+col*cell
                sheet.paste(image.resize((cell, cell), Image.Resampling.LANCZOS), (x, y))
                draw.text((x+4, y+cell+5), f'f{frame:03d} / {frame/30:.2f}s', fill='black', font=font)
        path = root/'qa/review-sheets'/f'{action}.png'
        path.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(path)
        records.append({'actionId': action, 'skins': SKINS, 'frames': frames, 'asset': ref(root, path),
                        'reviewStatus': 'pending', 'note': 'Sheet creation is not a visual approval. Frame 240 is external seam evidence, never a production frame.'})
        print(path, flush=True)
    target = root/'qa/review-sheets/index.json'
    previous = json.loads(target.read_text(encoding='utf-8')).get('sheets', []) if target.exists() else []
    write_json(target, {'format': 'pose-hub-temporal-review-sheets@2',
                       'sheets': [r for r in previous if r['actionId'] not in args.ids]+records})


if __name__ == '__main__':
    main()
