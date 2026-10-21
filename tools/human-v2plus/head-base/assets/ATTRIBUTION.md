# Head model attribution

**"Free Mannequin Head"** by **SPLiNER** — Printables model 1257615
<https://www.printables.com/model/1257615-free-mannequin-head>
License: **Creative Commons Attribution 4.0 International (CC BY 4.0)** — <https://creativecommons.org/licenses/by/4.0/>

Files here:
- `spliner-mannequin-head-light.stl` — the author's lightweight STL, unmodified.
- `spliner-head-pts.npz` — derived from the author's high-resolution STL (128,157 vertices): vertex positions (uint16-quantized, mm)
  and area-weighted vertex normals, written by `../prep_ready.py`. No other change.

Changes made in this repository (M10f, `HD_FACE=ready`, `../head_e.py`): the model is used as a signed distance field — re-oriented
(up +y, face +z), uniformly scaled to ~0.18 m head width, mirrored to exact left/right symmetry, its neck stub faded out below the chin
and smooth-unioned with the body's own neck, then re-meshed on a symmetric grid and skinned to the head / neck bones of the training
figure (`drill-anim/models/training-human-v2plus-head-base.json`).
