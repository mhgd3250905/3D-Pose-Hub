"""Threaded placement of unchanged alpha frames, with original edge QA.

Compatible CLI: <frame dir> <spec.json> <theme.json> <outdir> [a:b|still]
Optional --workers {1,2,4} controls CPU frame concurrency, not 3D rendering.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time

from PIL import Image

from composite_alpha import composite_frame, placement


# Actual 24-frame s-pigeon timing under the two-slot production workload:
# serial 7.929 s, two threads 4.162 s, four threads 2.610 s (2026-10-17).
DEFAULT_WORKERS = 4


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("frames", type=Path)
    ap.add_argument("spec", type=Path)
    ap.add_argument("theme", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("range", nargs="?")
    ap.add_argument("--workers", type=int, choices=(1, 2, 4), default=DEFAULT_WORKERS)
    argv = sys.argv[1:]
    if argv and re.fullmatch(r"-\d+:-?\d+", argv[-1]) and "--" not in argv:
        argv = [*argv[:-1], "--", argv[-1]]
    a = ap.parse_args(argv)
    started = time.perf_counter()
    spec = json.loads(a.spec.read_text(encoding="utf-8-sig"))
    json.loads(a.theme.read_text(encoding="utf-8-sig"))
    a.output.mkdir(parents=True, exist_ok=True)
    # Calculate/reuse placement once before threads start. All pixel operations
    # use the original implementation; each task owns its image buffers/files.
    transform = placement(a.frames, spec, a.output)
    bound_paths = {
        "producer_sha256": Path(__file__).resolve(),
        "delegate_sha256": Path(__file__).with_name("composite_alpha.py").resolve(),
        "spec_sha256": a.spec.resolve(),
        "placement_sha256": a.output / "place.json",
    }
    bound_hashes = {name: sha256(path) for name, path in bound_paths.items()}
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

    def process(name):
        raw = a.frames / ("m-" + name + ".png")
        raw_hash = sha256(raw)
        edge = composite_frame(a.frames, name, a.output, spec.get("size", 1080), transform)
        if sha256(raw) != raw_hash:
            raise RuntimeError("Main raw frame changed during compositing: " + str(raw))
        output = a.output / (name + ".png")
        with Image.open(output) as image:
            width, height = image.size
            mode = image.mode
        record = {"name": name, "raw_sha256": raw_hash, "output_sha256": sha256(output),
                  "width": width, "height": height, "mode": mode}
        return edge, record

    # map yields in input order, preserving even edge JSON key order/bytes.
    with ThreadPoolExecutor(max_workers=a.workers, thread_name_prefix="hiplab-alpha") as executor:
        results = list(executor.map(process, names))
    edges = {name: result[0] for name, result in zip(names, results)}
    path = a.output / ("edge-" + (a.range or "all").replace(":", "-") + ".json")
    path.write_text(json.dumps(edges), encoding="utf-8")
    if any(sha256(path) != bound_hashes[name] for name, path in bound_paths.items()):
        raise RuntimeError("Compositor, source spec or placement changed during compositing")
    manifest = {"schema": 1, **bound_hashes, "range": a.range or "all",
                "producer_path": str(bound_paths["producer_sha256"]),
                "delegate_path": str(bound_paths["delegate_sha256"]),
                "spec_path": str(a.spec.resolve()), "frame_dir": str(a.frames.resolve()),
                "output_dir": str(a.output.resolve()), "frames": [result[1] for result in results]}
    manifest_path = a.output / ("cache-manifest-" + (a.range or "all").replace(":", "-") + ".json")
    temporary = manifest_path.with_name(manifest_path.name + "." + str(os.getpid()) + ".tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(manifest_path)
    print("done", len(names), "straight-alpha frames", "workers", a.workers,
          "%.3fs" % (time.perf_counter() - started))


if __name__ == "__main__":
    main()
