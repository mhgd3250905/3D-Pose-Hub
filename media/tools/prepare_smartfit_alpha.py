#!/usr/bin/env python3
"""Bind a small transparent-media export to SmartFit's actual offline videos.

Reads existing consumer, release and production artifacts; does not render,
change approval states, or edit the consumer. Creates a new plan exclusively.
Only Python's standard library is required.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys


class PlanError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise PlanError(message)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"), object_pairs_hook=unique_object)


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def relative_file(root, name):
    require(isinstance(name, str) and name and "\\" not in name and ":" not in name,
            f"Invalid relative path: {name!r}")
    relative = PurePosixPath(name)
    require(not relative.is_absolute() and all(p not in ("..", ".") for p in name.split("/")),
            f"Path must stay below its bound root: {name!r}")
    root = root.resolve(strict=True)
    target = (root / name).resolve(strict=True)
    require(target.is_relative_to(root) and target.is_file(), f"Not a source file below root: {name}")
    return target


def fingerprint(path):
    return {"bytes": path.stat().st_size, "sha256": sha256(path)}


def check_file(root, descriptor, key="path"):
    path = relative_file(root, descriptor[key])
    actual = fingerprint(path)
    require(isinstance(descriptor.get("bytes"), int) and not isinstance(descriptor["bytes"], bool),
            f"Missing byte length: {descriptor[key]}")
    require(re.fullmatch(r"[0-9a-f]{64}", descriptor.get("sha256", "")) is not None,
            f"Invalid SHA-256: {descriptor[key]}")
    require(actual == {"bytes": descriptor["bytes"], "sha256": descriptor["sha256"]},
            f"Source byte/hash mismatch: {descriptor[key]}")
    return path


def reference(root_name, name, path):
    return {"root": root_name, "path": name, **fingerprint(path)}


def id_set(values, label):
    require(isinstance(values, list) and values, f"Empty or invalid {label}")
    require(all(isinstance(v, str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", v) for v in values),
            f"Invalid ID in {label}")
    require(len(values) == len(set(values)), f"Duplicate IDs in {label}")
    return set(values)


def indexed(items, label):
    require(isinstance(items, list), f"Invalid {label}")
    id_set([item["id"] for item in items], label)
    return {item["id"]: item for item in items}


def parse_bindings(values):
    result = {}
    for value in values:
        key, separator, path = value.partition("=")
        require(separator and key in ("pilot", "production") and key not in result,
                f"Expected unique --bind pilot=... or production=...: {value}")
        result[key] = Path(path).resolve(strict=True)
        require(result[key].is_dir(), f"Binding is not a directory: {key}")
    return result


def only(items, label):
    require(len(items) == 1, f"Expected exactly one {label}, found {len(items)}")
    return items[0]


def prepare(args):
    require(not args.output.exists(), f"Refusing to overwrite: {args.output}")
    consumer_root = args.consumer_root.resolve(strict=True)
    release_root = args.release_root.resolve(strict=True)
    source_bindings = parse_bindings(args.bind)
    asset_index_path = relative_file(consumer_root, "assets/training_media/v0.3.0-app/assets-index.json")
    app_manifest_path = relative_file(consumer_root, "assets/training_media/v0.3.0-app/app-manifest.json")
    release_manifest_path = relative_file(release_root, "manifest.json")
    local = read_json(asset_index_path)
    authorization = read_json(args.authorization)
    release = read_json(release_manifest_path)
    snapshot = read_json(args.snapshot)
    require(local.get("format") == "smartfit-offline-media@1", "Unsupported consumer index")
    require(local.get("version") == release.get("version") == "0.3.0", "Media version must remain 0.3.0")
    require(local.get("sourceAppManifestSha256") == sha256(app_manifest_path),
            "Consumer source app manifest changed")
    require(authorization.get("baselineManifestSha256") == local["sourceAppManifestSha256"],
            "Authorization belongs to a different consumer manifest")
    eligible = sorted(local["actions"])
    eligible_ids = id_set(eligible, "consumer roster")
    require(len(eligible_ids) == 93, "Expected the current SmartFit 93-action roster")
    require(eligible_ids == id_set(authorization["actionIds"], "authorized roster"),
            "SmartFit index and explicit authorization must have identical action IDs")
    selected = id_set(args.ids, "selected actions")
    require(selected <= eligible_ids, "Selected IDs are outside SmartFit's current roster")
    release_actions = indexed(release["actions"], "release actions")
    snapshot_actions = indexed(snapshot["actions"], "snapshot actions")
    require(eligible_ids <= release_actions.keys() and eligible_ids <= snapshot_actions.keys(),
            "Full SmartFit roster must exist in the release and snapshot")
    sets = indexed(snapshot["mediaSets"], "snapshot media sets")
    membership = {}
    for alias, media_set in sets.items():
        for aid in id_set(media_set["actionIds"], f"media set {alias}"):
            require(aid not in membership, f"Ambiguous snapshot media-set membership: {aid}")
            membership[aid] = alias
    require(set(membership) == set(snapshot_actions), "Snapshot actions/media-set rosters differ")
    for aid, entry in snapshot_actions.items():
        require(entry["mediaSet"] == membership[aid], f"Snapshot media-set binding differs: {aid}")

    commit = subprocess.check_output(["git", "-C", str(consumer_root), "rev-parse", "HEAD"], text=True).strip()
    require(re.fullmatch(r"[0-9a-f]{40}", commit) is not None, "Invalid consumer Git commit")
    plan = {
        "format": "pose-hub-stacked-alpha-plan@1",
        "consumer": {"commit": commit, "assetIndexSha256": sha256(asset_index_path),
                     "authorizationSha256": sha256(args.authorization),
                     "sourceAppManifestSha256": local["sourceAppManifestSha256"],
                     "eligibleActionIds": eligible},
        "sourceMediaVersion": "0.3.0", "skin": "realistic",
        "snapshotSha256": sha256(args.snapshot),
        "releaseManifestSha256": sha256(release_manifest_path),
        "bindings": {}, "actions": [],
    }
    cached_derivatives = {}
    for aid in args.ids:
        snapshot_action = snapshot_actions[aid]
        alias = snapshot_action["mediaSet"]
        media_set = sets[alias]
        parent_alias = media_set["binding"]
        require(parent_alias in source_bindings, f"Missing --bind {parent_alias}=...")
        relative_root = media_set["relativeRoot"]
        # Validate the directory through a known file before resolving it.
        known = relative_file(source_bindings[parent_alias], f"{relative_root}/manifests/derivatives.json")
        batch_root = known.parent.parent
        plan["bindings"][alias] = {"parentBinding": parent_alias, "relativeRoot": relative_root}
        derivative_ref = media_set["derivativeManifest"]
        require(derivative_ref["root"] == parent_alias, f"Unexpected derivative binding: {alias}")
        derivative_path = check_file(source_bindings[parent_alias], derivative_ref)
        require(derivative_path == known, f"Unexpected derivative manifest path: {alias}")
        if alias not in cached_derivatives:
            cached_derivatives[alias] = read_json(derivative_path)
        derivatives = cached_derivatives[alias]
        variants = {
            theme: only([v for v in derivatives["variants"]
                         if v["actionId"] == aid and v["skin"] == "realistic" and v["theme"] == theme],
                        f"{aid}/realistic/{theme} derivative")
            for theme in ("dark", "light")
        }
        baseline = {}
        release_action = release_actions[aid]
        for theme, variant in variants.items():
            current = local["actions"][aid][theme]["video"]
            video = release_action["files"]["skins"]["realistic"][theme]["video"]
            expected_path = f"realistic/{theme}/{aid}.mp4"
            require(video["path"] == expected_path, f"Unexpected release path: {aid}/{theme}")
            require(current["asset"] == f"assets/training_media/v0.3.0/{expected_path}",
                    f"Unexpected consumer video path: {aid}/{theme}")
            for descriptor in (current, variant["video"]):
                require((descriptor["bytes"], descriptor["sha256"]) == (video["bytes"], video["sha256"]),
                        f"Consumer/release/derivative video identity differs: {aid}/{theme}")
            check_file(consumer_root, current, key="asset")
            check_file(release_root, video)
            check_file(batch_root, variant["video"])
            baseline[theme] = {"root": "release", **video}
            require(variant.get("mirrored") is False, f"Mirrored derivative is not supported: {aid}/{theme}")

        dark, light = variants["dark"], variants["light"]
        require(dark["highlight"] == light["highlight"], f"Theme-specific highlight recipe: {aid}")
        require(dark["framing"] == light["framing"], f"Theme-specific framing: {aid}")
        highlight = dark["highlight"]
        require(type(highlight.get("enabled")) is bool and
                re.fullmatch(r"#[0-9a-fA-F]{6}", highlight.get("color", "")) is not None and
                isinstance(highlight.get("brightness"), (int, float)) and
                not isinstance(highlight["brightness"], bool) and 0 <= highlight["brightness"] <= 1,
                f"Invalid highlight recipe: {aid}")
        framing_path = check_file(batch_root, dark["framing"])
        framing_name = f"manifests/framing/{aid}.json"
        require(dark["framing"]["path"] == framing_name, f"Unexpected framing path: {aid}")
        layer_name = f"masters/realistic/{aid}/layer-manifest.json"
        layer_path = relative_file(batch_root, layer_name)
        layer = read_json(layer_path)
        require(layer.get("actionId") == aid and layer.get("skin") == "realistic" and
                layer.get("complete") is True and layer.get("diagnosticOnly") is False,
                f"Invalid or incomplete layer master: {aid}")
        require(layer.get("sourceSha256") == snapshot_action["sourceFingerprint"],
                f"Layer source fingerprint differs from snapshot: {aid}")
        source = snapshot_action["sourceManifest"]
        require(source["root"] == parent_alias, f"Unexpected source manifest binding: {aid}")
        check_file(source_bindings[parent_alias], source)
        for theme, variant in variants.items():
            video = variant["video"]
            require((video["fps"], video["frames"], video["durationSeconds"]) ==
                    (layer["fps"], layer["frameCount"], layer["durationSeconds"]),
                    f"Layer/video timing differs: {aid}/{theme}")
            require(variant.get("sourceSha256", layer["sourceSha256"]) == layer["sourceSha256"],
                    f"Derivative source differs from layer master: {aid}/{theme}")
            require(variant.get("modelVersion") == layer["model"]["modelVersion"],
                    f"Derivative model version differs from layer master: {aid}/{theme}")
        peaks = [only([k["asset"]["frame"] for k in v["keyframes"] if k["phase"] == "peak"],
                      f"{aid} peak frame") for v in variants.values()]
        require(peaks[0] == peaks[1] and type(peaks[0]) is int and 0 <= peaks[0] < layer["frameCount"],
                f"Invalid or theme-specific cover frame: {aid}")
        plan["actions"].append({
            "id": aid, "nameZh": release_action["nameZh"],
            "fps": layer["fps"], "frames": layer["frameCount"],
            "durationSeconds": layer["durationSeconds"], "coverFrame": peaks[0],
            "coverSize": [720, 720], "thumbnailSize": [240, 240], "sourceRoot": alias,
            "layerManifest": reference(alias, layer_name, layer_path),
            "framing": reference(alias, framing_name, framing_path),
            "highlight": {key: highlight[key] for key in ("enabled", "color", "brightness")},
            "baselineVideos": baseline,
            "derivativeManifest": reference(alias, "manifests/derivatives.json", derivative_path),
        })
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(plan, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write("\n")
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--consumer-root", type=Path, required=True)
    parser.add_argument("--authorization", type=Path, required=True)
    parser.add_argument("--release-root", type=Path, required=True)
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--bind", action="append", default=[], metavar="NAME=PATH")
    parser.add_argument("--ids", nargs="+", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        plan = prepare(args)
    except (PlanError, OSError, ValueError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"format": plan["format"], "eligibleActions": len(plan["consumer"]["eligibleActionIds"]),
                      "sampleIds": [a["id"] for a in plan["actions"]],
                      "planSha256": sha256(args.output)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
