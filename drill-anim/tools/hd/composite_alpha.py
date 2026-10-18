"""Place the original main pass on straight-alpha RGBA without dark compositing.

CLI: composite_alpha.py <frame dir> <spec.json> <theme.json> <outdir> [a:b|still]

Placement and glow-pass edge QA derive exactly from the frozen
tools/drill-anim/lib/comp.py. The main pass deliberately uses an unmasked
RGBA paste: supplying its own alpha as a paste mask would square its alpha.
Background, floor shadow, outline and bloom are omitted; source foreground
RGB and alpha are retained apart from the original placement/resampling.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys
import time

import numpy as np
from PIL import Image


def placement(frame_dir, spec, out_dir):
    width = spec.get("size", 1080)
    scale_unit = width / 1024
    path = out_dir / "place.json"
    if path.exists():
        saved = json.loads(path.read_text(encoding="utf-8"))
        return saved["s"], saved["ox"], saved["oy"]
    frame = spec.get("frame", {"mode": "v7", "width": 750, "left": 165, "top": 300})
    with Image.open(frame_dir / "g-still.png") as image:
        alpha = np.array(image)[..., 3]
    ys, xs = np.nonzero(alpha > 10)
    if not len(xs):
        raise ValueError("g-still.png has no body alpha above the original bbox threshold (10)")
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    # Keep expression order identical to the original compositor, including
    # its exclusive bbox spans, Python round(), and 1024-based frame units.
    if frame["mode"] == "canvas":
        scale = width / alpha.shape[1]
        ox, oy = 0, 0
    elif frame["mode"] == "v7":
        scale = frame["width"] * scale_unit / (x1 - x0)
        ox = frame["left"] * scale_unit - x0 * scale
        oy = frame["top"] * scale_unit - y0 * scale
    else:
        scale = min(frame["width"] * scale_unit / (x1 - x0), frame.get("height", 9999) * scale_unit / (y1 - y0))
        ox = frame.get("cx", 512) * scale_unit - (x0 + x1) / 2 * scale
        oy = frame.get("cy", 512) * scale_unit - (y0 + y1) / 2 * scale
    path.write_text(json.dumps({"s": scale, "ox": ox, "oy": oy}), encoding="utf-8")
    return scale, ox, oy


def place(image, size, scale, ox, oy, *, legacy_mask=False):
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if legacy_mask:
        canvas.paste(image, (round(ox), round(oy)), image)
    else:
        canvas.paste(image, (round(ox), round(oy)))
    return canvas


def composite_frame(frame_dir, name, out_dir, size, transform):
    scale, ox, oy = transform
    with Image.open(frame_dir / ("m-" + name + ".png")) as image:
        main = place(image.convert("RGBA"), size, scale, ox, oy)
    main.save(out_dir / (name + ".png"))
    # QA intentionally retains the original glow pass's masked paste. Its
    # alpha is not the deliverable's alpha; it preserves existing edge results.
    with Image.open(frame_dir / ("g-" + name + ".png")) as image:
        glow = place(image.convert("RGBA"), size, scale, ox, oy, legacy_mask=True)
    alpha = np.array(glow)[..., 3].astype(float) / 255
    return float(alpha[:2].max() + alpha[-2:].max() + alpha[:, :2].max() + alpha[:, -2:].max())


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("frames", type=Path)
    ap.add_argument("spec", type=Path)
    ap.add_argument("theme", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("range", nargs="?")
    argv = sys.argv[1:]
    # The original positional CLI accepts '-1:0' verbatim. argparse otherwise
    # treats that range as an option; preserve the original zero-frame meaning.
    if len(argv) == 5 and re.fullmatch(r"-\d+:-?\d+", argv[-1]):
        argv = [*argv[:-1], "--", argv[-1]]
    a = ap.parse_args(argv)
    started = time.perf_counter()
    spec = json.loads(a.spec.read_text(encoding="utf-8-sig"))
    # Validate the compatible input without applying any theme compositing.
    json.loads(a.theme.read_text(encoding="utf-8-sig"))
    a.output.mkdir(parents=True, exist_ok=True)
    transform = placement(a.frames, spec, a.output)
    metadata = {}
    for path in a.frames.glob("met-*.json"):
        for row in json.loads(path.read_text(encoding="utf-8")):
            metadata["still" if row["f"] < 0 else "%04d" % row["f"]] = row
    names = sorted(metadata)
    if a.range == "still":
        names = ["still"]
    elif a.range:
        start, stop = map(int, a.range.split(":"))
        names = [name for name in names if name != "still" and start <= int(name) < stop]
    edges = {name: composite_frame(a.frames, name, a.output, spec.get("size", 1080), transform) for name in names}
    edge_path = a.output / ("edge-" + (a.range or "all").replace(":", "-") + ".json")
    edge_path.write_text(json.dumps(edges), encoding="utf-8")
    print("done", len(names), "straight-alpha frames", "%.3fs" % (time.perf_counter() - started))


if __name__ == "__main__":
    main()
