# Wrist + head–neck composition: browser check

On 2026-10-27 the head–neck-r2-only reference and the independent
wrist-head-neck-r1 composition were run serially in the same setup. Each
covered long and short sleeves, left and right hands, and synthetic neck
flexion 40°, extension 35° and rotation 65°. The combined run used the r2
diagnostic script, whose SHA is recorded in the composition manifest.

All four cases kept the original head and neck hidden, the new fragment and
hands visible, 162 shared head–neck seam vertex IDs, and the correct sleeve
uniform. No page errors were recorded. Reference and combined neck images
were pixel-identical in all four cases; short-sleeve left and right hand images
were pixel-identical. In long-sleeve flexion, 17,079 left and 17,504 right
pixels differed by more than 4/255. The compared images show the intended
sleeve-to-skin blend on both sides. These results compare composition against
the existing head–neck candidate; they do not repeat the original P2 gap
measurement or cover all motions and devices.

Duplicate combination installation was rejected. Detaching the head–neck
fragment restored its original profile wrapper, removed the fragment mesh,
preserved bone objects and matrices, and left the wrist hook in place.
Reapplying the combination on that partially detached page was rejected.

The first `renderer.render` took 59.55 seconds on Intel UHD D3D11 and the
program count increased from 12 to 17. Later renders took roughly 2–4 ms and
PNG readback 7–22 ms. These logs identify the slow stage and concurrent new
program creation, but do not prove how much time shader compilation consumed.
The previous 60-second timeout did not yield a combined image.

Evidence under `E:/AII-3D/codex-output/body-v3-fixes-20261027/`:

- `wrist-head-neck-reference-r1/` and `wrist-head-neck-combined-r2/`: 12 PNGs
  and a report each.
- `wrist-head-neck-comparison-r1.json`: SHA-256
  `e22ce7126d8f5368d0edfd68ed2330881b1ac74fbc5ffc5522ddab782cb1a6d7`.
- `wrist-head-neck-combined-r2/report.json`: SHA-256
  `31fba6a3b299623dfdd13ffa8a41d6d684976ff07b5b49d8c1f60433bae668a6`.
- `wrist-head-neck-combined-r2.log`: SHA-256
  `f83fac59dc4a8b1bb2e318aa1e4d05d5628b7133ae22a11698e72569187a6d5e`.
