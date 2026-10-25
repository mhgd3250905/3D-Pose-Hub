#!/usr/bin/env python3
"""Bind one completed RTX 4080 transparent capture to an alpha export plan.

No renderer or encoder runs here. Only a new plan and an immutable, full-frame
export-framing-r1.json are created; captured layers and the catalog stay intact.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import zlib

from prepare_smartfit_alpha import PlanError, check_file, read_json, relative_file, require, sha256


REPO = Path(__file__).resolve().parents[2]
LAYERS = {"body": "m", "highlight": "k", "shadow": "s"}
FRAMING = {
    "format": "pose-hub-export-framing@1",
    "preview": False,
    "sourceSize": [1080, 1080],
    "targetSize": [1080, 1080],
    "crop": [0, 0, 1080, 1080],
    "policy": "retain-completed-capture-camera-no-recrop",
}
HEX = re.compile(r"[0-9a-f]{64}")
SAFE_ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]*")


def finite_positive(value):
    return type(value) in (int, float) and math.isfinite(value) and value > 0


def digest(value):
    return hashlib.sha256(value).hexdigest()


def verify_spec_reference(raw_source, source_ref):
    """Accept exact raw or CRLF-to-LF-equivalent bytes, never a changed spec."""
    # Preserve the original UTF-8 requirement; no BOM removal, whitespace folding,
    # lone-CR conversion, or source rewrite is permitted by this compatibility.
    raw_source.decode("utf-8")
    lf_source = raw_source.replace(b"\r\n", b"\n")
    raw_sha, lf_sha = digest(raw_source), digest(lf_source)
    expected = source_ref.get("sha256")
    require(isinstance(expected, str) and HEX.fullmatch(expected) is not None
            and expected in (raw_sha, lf_sha), "Original spec raw or LF SHA differs from the catalog")
    matched_source = raw_source if expected == raw_sha else lf_source
    if "bytes" in source_ref:
        require(type(source_ref["bytes"]) is int and len(matched_source) == source_ref["bytes"],
                "Original spec matched-form byte length differs from the catalog")
    if "lfSha256" in source_ref:
        require(source_ref["lfSha256"] == lf_sha, "Original spec LF SHA differs from the catalog")
    return raw_sha, lf_sha


def same_ref(left, right):
    return all(left.get(key) == right.get(key) for key in ("path", "bytes", "sha256"))


def reference(root, path):
    return {"root": "capture", "path": path.relative_to(root).as_posix(),
            "bytes": path.stat().st_size, "sha256": sha256(path)}


def checked_artifact(root, ref, report_files, cache):
    require(isinstance(ref, dict), "Artifact reference must be an object")
    require(ref.get("path") in report_files and same_ref(ref, report_files[ref["path"]]),
            "Artifact is not bound to capture.json: " + str(ref.get("path")))
    if ref["path"] not in cache:
        cache[ref["path"]] = check_file(root, ref)
    return cache[ref["path"]]


def check_png_metadata(path):
    """Read fixed PNG metadata only; do not decompress 1080-square frame pixels."""
    with path.open("rb") as handle:
        header = handle.read(33)
        handle.seek(-12, 2)
        ending = handle.read(12)
    require(len(header) == 33 and header[:8] == b"\x89PNG\r\n\x1a\n"
            and header[8:16] == b"\0\0\0\rIHDR", "Invalid PNG header: " + str(path))
    width, height, depth, color, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", header[16:29])
    require((width, height, depth, color, compression, filtering) == (1080, 1080, 8, 6, 0, 0)
            and interlace in (0, 1), "Frame must be 1080-square 8-bit RGBA PNG: " + str(path))
    require(struct.unpack(">I", header[29:33])[0] == zlib.crc32(header[12:29]) & 0xffffffff,
            "PNG IHDR checksum mismatch: " + str(path))
    require(ending == b"\0\0\0\0IEND\xaeB`\x82", "PNG end marker missing: " + str(path))


def verify_capture(catalog_path, capture_root, repo=REPO):
    """Return a complete in-memory plan after checking all captured references."""
    catalog_path = Path(catalog_path).resolve(strict=True)
    root = Path(capture_root).resolve(strict=True)
    repo = Path(repo).resolve(strict=True)
    require(root.is_dir(), "Capture root must be a directory")
    catalog_hash = sha256(catalog_path)
    catalog = read_json(catalog_path)
    require(catalog.get("format") == "pose-hub-app-test-catalog@1"
            and catalog.get("id") == "app-test-pack-r1", "Expected the app-test-pack-r1 catalog")
    rows = catalog.get("actions")
    require(isinstance(rows, list) and len(rows) == 219, "Expected the full 219-action test catalog")
    ids = [row.get("id") for row in rows]
    require(all(isinstance(value, str) and SAFE_ID.fullmatch(value) for value in ids)
            and len(set(ids)) == 219, "Catalog action IDs must be safe and unique")

    capture_path = relative_file(root, "capture.json")
    capture_hash = sha256(capture_path)
    report = read_json(capture_path)
    require(report.get("complete") is True and report.get("mode") == "full" and not report.get("error"),
            "A completed full capture is required")
    runtime = report.get("runtime", {})
    renderer = runtime.get("unmaskedRenderer", "")
    require(isinstance(renderer, str) and re.search(r"RTX\s+4080", renderer, re.I)
            and not re.search(r"swiftshader|llvmpipe|software", renderer, re.I)
            and runtime.get("contextLost") is False, "Actual RTX 4080 capture proof is required")
    action_id = report.get("actionId")
    require(action_id in ids, "Captured action is absent from the test catalog")
    row = rows[ids.index(action_id)]
    revision = row.get("revision")
    require(isinstance(revision, str) and SAFE_ID.fullmatch(revision)
            and report.get("specId") == revision, "Capture specId differs from the selected catalog revision")
    source_ref = row["source"]["spec"]
    source_path = relative_file(repo, source_ref["path"])
    raw_source = source_path.read_bytes()
    raw_sha, lf_sha = verify_spec_reference(raw_source, source_ref)

    count, fps, duration, peak = (report.get(key) for key in
                                  ("frameCount", "fps", "durationSeconds", "peakFrame"))
    require(type(count) is int and count in (240, 300) and type(fps) is int and fps == 30
            and finite_positive(duration) and abs(count / fps - duration) <= .001,
            "Full capture must contain 240 or 300 frames at 30 fps without retiming")
    require(type(peak) is int and 0 <= peak < count, "Invalid captured peakFrame")
    require(report.get("size") == 1080, "Full capture must use the original 1080 canvas")
    captured_frames = report.get("frames")
    require(isinstance(captured_frames, list) and all(type(f) is int for f in captured_frames)
            and captured_frames == list(range(count + 1)), "Capture must include every frame and the loop endpoint")
    catalog_duration = row.get("rhythm", {}).get("durationSeconds")
    require(finite_positive(catalog_duration) and abs(catalog_duration - duration) <= .001,
            "Captured duration differs from the selected catalog motion")

    entries = report.get("files")
    require(isinstance(entries, list) and entries, "Capture artifact references are required")
    report_files = {}
    for item in entries:
        require(isinstance(item, dict) and isinstance(item.get("path"), str), "Invalid capture artifact reference")
        require(item["path"] not in report_files or same_ref(item, report_files[item["path"]]),
                "Conflicting capture artifact reference")
        report_files[item["path"]] = item
    prefix = f"masters/realistic/{action_id}"
    manifest_path = relative_file(root, prefix + "/layer-manifest.json")
    manifest_ref = reference(root, manifest_path)
    cache = {}
    checked_artifact(root, manifest_ref, report_files, cache)
    layer = read_json(manifest_path)
    require(layer.get("format") == "pose-hub-layer-render@2" and layer.get("complete") is True
            and layer.get("diagnosticOnly") is not True and layer.get("actionId") == action_id
            and layer.get("specId") == revision and layer.get("skin") == "realistic"
            and layer.get("alphaMode") == "straight" and layer.get("width") == layer.get("height") == 1080,
            "Layer manifest is not the selected full 1080 straight-RGBA capture")
    require(HEX.fullmatch(report.get("sourceSha256", "")) is not None
            and report["sourceSha256"] == layer.get("sourceSha256"), "Capture and layers have different frozen sources")
    require(layer.get("spec", {}).get("path") == source_ref["path"]
            and layer["spec"].get("sha256") == lf_sha,
            "Captured layer spec SHA must match the LF-normalized catalog-selected spec")
    require(layer.get("frameCount") == count and layer.get("fps") == fps
            and finite_positive(layer.get("durationSeconds"))
            and abs(layer["durationSeconds"] - duration) <= .001,
            "Layer timing differs from the completed capture")
    require(layer.get("runtime") == runtime, "Layer runtime differs from capture proof")

    for name, letter in LAYERS.items():
        sequence_ref = layer.get("sequences", {}).get(name)
        require(isinstance(sequence_ref, dict)
                and sequence_ref.get("path") == f"{prefix}/{name}/index.json"
                and same_ref(sequence_ref, report.get("sequences", {}).get(name, {})),
                "Layer sequence is not bound to the selected capture: " + name)
        index = read_json(checked_artifact(root, sequence_ref, report_files, cache))
        require(index.get("format") == "pose-hub-frame-sequence@2"
                and index.get("width") == index.get("height") == 1080
                and index.get("alpha") is True and index.get("alphaMode") == "straight"
                and index.get("frameCount") == count and index.get("fps") == fps
                and finite_positive(index.get("durationSeconds"))
                and abs(index["durationSeconds"] - duration) <= .001,
                "Sequence metadata differs from the full RGBA capture: " + name)
        records = index.get("frames")
        require(isinstance(records, list) and len(records) == count,
                "Missing or sparse captured sequence: " + name)
        for frame, ref in enumerate(records):
            require(isinstance(ref, dict) and type(ref.get("frame")) is int and ref["frame"] == frame
                    and ref.get("path") == f"{prefix}/{name}/{letter}-{frame:04d}.png",
                    "Missing, duplicate, reordered or cross-action frame: " + name)
            check_png_metadata(checked_artifact(root, ref, report_files, cache))
        endpoint = layer.get("qaEndpoint", {}).get(name)
        require(isinstance(endpoint, dict) and type(endpoint.get("frame")) is int
                and endpoint["frame"] == count
                and endpoint.get("path") == f"qa/endpoints/realistic/{action_id}/{name}/{letter}-{count:04d}.png",
                "Missing captured loop endpoint: " + name)
        check_png_metadata(checked_artifact(root, endpoint, report_files, cache))

    require(sha256(capture_path) == capture_hash and sha256(catalog_path) == catalog_hash
            and source_path.read_bytes() == raw_source, "Catalog, capture or selected spec changed during validation")
    return {
        "format": "pose-hub-stacked-alpha-plan@1",
        "sourceMediaVersion": "app-test-pack-r1",
        "skin": "realistic",
        "status": "test-unreviewed",
        "reviewed": False,
        "releaseEligible": False,
        "catalogSha256": catalog_hash,
        "consumer": {"id": "app-test-pack-r1", "catalogSha256": catalog_hash,
                     "eligibleActionIds": sorted(ids), "policy": "test-only-no-App-publication"},
        "bindings": {},
        "actions": [{"id": action_id, "nameZh": row["nameZh"], "fps": fps, "frames": count,
                     "durationSeconds": duration, "coverFrame": peak,
                     "coverSize": [720, 720], "thumbnailSize": [240, 240], "sourceRoot": "capture",
                     "layerManifest": manifest_ref,
                     "highlight": {"enabled": True, "color": "#f08a3c", "brightness": .45},
                     "baselineVideos": {}, "renderCapture": reference(root, capture_path),
                     "revision": revision, "specRawSha256": raw_sha, "specLfSha256": lf_sha,
                     "reviewed": False, "releaseEligible": False}],
    }


def write_new(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, ensure_ascii=False, allow_nan=False, indent=2)
        handle.write("\n")


def prepare(catalog, capture_root, output, production_root, repo=REPO):
    output = Path(output).resolve()
    require(not output.exists(), "Refusing to overwrite export plan: " + str(output))
    root = Path(capture_root).resolve(strict=True)
    production = Path(production_root).resolve(strict=True)
    require(production.is_dir() and root != production and root.is_relative_to(production),
            "Full capture root must be below the explicit production root")
    require(output.is_relative_to(production), "Export plan must stay below the production root")
    framing_path = root / "export-framing-r1.json"
    if framing_path.exists():
        require(framing_path.resolve().parent == root and read_json(framing_path) == FRAMING,
                "Existing export framing differs; choose a new capture revision")
    plan = verify_capture(catalog, root, repo)
    alias = "capture-" + plan["actions"][0]["id"]
    plan["bindings"] = {alias: {"parentBinding": "production",
                                 "relativeRoot": root.relative_to(production).as_posix()}}
    plan["actions"][0]["sourceRoot"] = alias
    for key in ("layerManifest", "renderCapture"):
        plan["actions"][0][key]["root"] = alias
    if not framing_path.exists():
        try:
            write_new(framing_path, FRAMING)
        except FileExistsError:
            require(framing_path.resolve().parent == root and read_json(framing_path) == FRAMING,
                    "Concurrent export framing differs")
    plan["actions"][0]["framing"] = reference(root, framing_path)
    plan["actions"][0]["framing"]["root"] = alias
    write_new(output, plan)
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", required=True, type=Path)
    parser.add_argument("--capture-root", required=True, type=Path)
    parser.add_argument("--production-root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        prepare(args.catalog, args.capture_root, args.output, args.production_root)
    except (OSError, PlanError, ValueError, TypeError, KeyError) as error:
        parser.error(str(error))
    print(args.output.resolve())


if __name__ == "__main__":
    main()
