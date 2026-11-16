#!/usr/bin/env python3
"""V5 托马斯: body+fx passes over the light/dark theme colours (two-background matte) + fx shadow pass -> one straight-alpha master per frame, + layer-manifest.json for compose.py.
The fx.js hard shadow is drawn opaque in Pose Studio (two tones #d9cbbd far / #c3b2a5 near-contact, on the #f4efe6 page). Here each
tone becomes warm near-black #2a1a12 at the alpha that reproduces that tone over #f4efe6 (0.134 / 0.243), so on the light theme it
reads like the app and on the dark theme it does not glow. Body/fx pixels go over the shadow (they are nearer the camera)."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image

FAR, NEAR = np.array([217, 203, 189], np.float32), np.array([195, 178, 165], np.float32)
INK, A_FAR, A_NEAR = np.array([42, 26, 18], np.float32), 0.134, 0.243


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def matte(work, k, BL, BD):
    """Straight-alpha RGBA in 0..1 from the body+fx pass rendered over the opaque light (BL) and dark (BD) theme colours.
    Opaque body pixels: L == D -> alpha 1. The fx glow is premultiplied-additive (rgb > alpha), so a transparent render loses it on
    readback; here alpha = 1 - (L - D) / (BL - BD) (channel mean) and the colour is solved over the light theme, so the light mp4
    reproduces the opaque render and the dark one keeps the glow (dimmer than true additive, which a straight matte cannot hold)."""
    L = np.asarray(Image.open(work / f'bodyL-{k:04d}.png').convert('RGB'), np.float32) / 255
    D = np.asarray(Image.open(work / f'bodyD-{k:04d}.png').convert('RGB'), np.float32) / 255
    a = np.clip(1 - ((L - D) / (BL - BD)).mean(-1), 0, 1)
    a[a < 1.5 / 255] = 0
    c = (L - BL * (1 - a)[..., None]) / np.maximum(a, 1e-6)[..., None]   # colour exact over the light theme (= Pose Studio page)
    c[a == 0] = 0
    return np.dstack([np.clip(c, 0, 1), a])


def main():
    ap = argparse.ArgumentParser()
    for k in ('--work', '--root', '--id', '--frames', '--size', '--bg-light', '--bg-dark'):
        ap.add_argument(k, required=True)
    a = ap.parse_args()
    BL, BD = hexrgb(a.bg_light), hexrgb(a.bg_dark)
    work, root, n, size = Path(a.work), Path(a.root), int(a.frames), int(a.size)
    mdir = root / 'masters' / a.id
    bdir = mdir / 'v5-toon' / 'body'; bdir.mkdir(parents=True, exist_ok=True)
    frames, pulses = [], []
    pose = json.loads((work / 'pose.json').read_text())
    for k in range(n + 1):
        A = matte(work, k, BL, BD)
        B = np.asarray(Image.open(work / f'shadow-{k:04d}.png').convert('RGBA'), np.float32)
        near = np.linalg.norm(B[..., :3] - NEAR, axis=-1) < np.linalg.norm(B[..., :3] - FAR, axis=-1)
        sa = B[..., 3] / 255 * np.where(near, A_NEAR, A_FAR)
        aa = A[..., 3]
        oa = aa + sa * (1 - aa)
        rgb = (A[..., :3] * aa[..., None] + (INK / 255) * (sa * (1 - aa))[..., None]) / np.maximum(oa, 1e-6)[..., None]
        out = np.dstack([rgb, oa])
        f = bdir / f'm-{k:04d}.png'
        Image.fromarray(np.clip(np.rint(out * 255), 0, 255).astype(np.uint8), 'RGBA').save(f)
        q = pose['frames'][k]
        frames.append({'frame': k, 'time': k / 30, 'endpoint': k == n, 'pulse': 0.0,
                       'files': {'v5-toon/body': {'path': f.relative_to(root).as_posix(), 'sha256': hashlib.sha256(f.read_bytes()).hexdigest(), 'bytes': f.stat().st_size}}})
    # peak = the frame with the widest leg split (feet apart), a showcase frame for cover/thumbnail
    spread = json.loads((work / 'spread.json').read_text()) if (work / 'spread.json').exists() else None
    if spread:
        for fr, s in zip(frames, spread):
            fr['pulse'] = s
    man = {'format': 'pose-hub-package-masters@1', 'actionId': a.id, 'recipe': {'path': 'tools/v5/runtime/anim/flare-arm8legs-v3r3.json'},
           'authoringModel': 'pose-studio-v3r7 flare-arm8legs', 'productionModel': 'coach-v3r3-wristfix@v5-toon + hair spiky + fx.js',
           'profile': {'id': 'v5'}, 'size': size, 'fps': 30, 'durationSeconds': n / 30, 'loopFrames': n, 'complete': True, 'qaEndpointFrame': n,
           'skins': [{'id': 'v5-toon'}], 'layers': ['body'], 'alphaMode': 'straight', 'camera': 'fixed (anim.cams.v0)',
           'v5': {'look': 'Pose Studio v3r7 default entry (spiky hair, fx on) + v3r8b wristfix; app default 0.5x playback',
                  'shadow': {'ink': '#2a1a12', 'alphaFar': A_FAR, 'alphaNear': A_NEAR}, 'matte': {'light': a.bg_light, 'dark': a.bg_dark}},
           'frames': frames, 'flags': {'sampledOnly': False, 'fullCycleValidated': False, 'userAccepted': False, 'releaseEligible': False}}
    (mdir / 'v5-pose.json').write_text((work / 'pose.json').read_text())
    (mdir / 'layer-manifest.json').write_text(json.dumps(man, indent=1, ensure_ascii=False) + '\n')   # last: marks masters complete


if __name__ == '__main__':
    main()
