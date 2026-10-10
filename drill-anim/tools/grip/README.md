# tools/grip — baked power-grip data for `P.bakeGrip`

- `assets/grip-right.json` was generated **offline, once** by `grip.py` / `fit.py` / `tangent.py` / `thumb.py` / `export2.py`.
  Those scripts read intermediate files (`hand2.json`, `ax.npy`, `close.json`) that are not in the repo, so they are kept for
  reference and are not reproducible as-is.
- `assets/grip-left.json` is derived from the right one with `mirror.py` (the mannequin is left/right symmetric to ~0.1 mm):
  dump rest-world positions of the hand-region vertices with `tools/probe.mjs` (motion.reset(), a spec with no `bakeHands`),
  then `python3 tools/grip/mirror.py rest.json`.
- `lib/boot.mjs` injects every `assets/grip-<side>.json` into the page as `window.__gripData[side]`; `P.bakeGrip(side)` reads that
  first and only falls back to an XHR to the app server (which works only when `app_dir` is this repo's root).
