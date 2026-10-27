# Wrist + head–neck composition r2: browser retest

The independent `training-human-v3-wrist-head-neck-r2` entry was run on
2026-10-27 using `verify-wrist-head-neck-r3.mjs`. The earlier head–neck-only
reference was reused. The four cases cover long and short sleeves, both wrists,
40° neck flexion, 35° extension and 65° rotation. The two runs produced no
page errors. In every case the head–neck fragment and hands were visible, the
old head and neck hidden, the sleeve uniform correct and 162 fragment seam
vertex IDs shared. These are topology and coexistence checks, not new P2 gap
measurements.

All four head/neck screenshots were pixel-identical to the reference, as were
both short-sleeve wrist screenshots. In long-sleeve flexion, 17,079 left and
17,504 right wrist pixels differed by more than 4/255, out of 176,400 pixels
per image. Visual inspection confirmed a smoother colour transition on both
wrists. Duplicate installation and reinstallation after partial detach were
rejected. Fragment detach preserved the original profile function, bone objects
and bone matrices; as documented, it left the wrist hook installed.

The first render took approximately 51 seconds on Intel UHD D3D11 while program
count increased from 12 to 17; later captures completed quickly. Logs alone do
not isolate shader compilation cost. The browser was closed after the run.

Evidence under `E:/AII-3D/codex-output/body-v3-fixes-20261027/`:

- `wrist-head-neck-reference-r1/` and `wrist-head-neck-combined-loader-r2/`:
  12 screenshots and a report per run.
- `wrist-head-neck-comparison-loader-r2.json`, SHA-256
  `e22ce7126d8f5368d0edfd68ed2330881b1ac74fbc5ffc5522ddab782cb1a6d7`.
- `wrist-head-neck-combined-loader-r2/report.json`, SHA-256
  `d524895e0169c14538e317a3404bdb60cce588bdd0dd111643d3bb4196e699bc`.
- `wrist-head-neck-combined-loader-r2.log`, SHA-256
  `ffb410d2bc2d656b3203f37ac248078d36bfba52706eef73a1803eb1ff2e2e0e`.

The frozen r2 manifest records its state before this run and is not rewritten.
The result covers these poses and views only; it is not full action, device or
release acceptance.
