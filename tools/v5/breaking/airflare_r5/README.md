# Air Flare r5 — right (bent) leg 0.77–1.30 s

开哥 feedback (2026-11-20): around video frames 28–30 (0.93–1.00 s, source 10146–10148) the right foot is wrong.

Source check (kp2d + mask + depth + frames, 10140–10155): the leg is the performer's **right** leg (it was the planted foot
until 10140, toe-off 10141). From 10142 it swings up **in front of the body (camera side)**: at 10145 the foot is in front
of the face, at 10146–10148 at chest height on the camera side, **sole toward the camera, toes pointing image left/down**
(see src_10147-10149_toes.jpg, src_depth_10144-10147.jpg; depth: foot nearer than the trunk by +2.5k…+9k units at 10142–10147).
r3/r4 had the foot sole facing *away* from the camera (cos −0.6…−1.0 at 10144–10151) and the ankle behind the knee
(knee folded 120–136°), 2D error knee 52–71 px / ankle 74–104 px at 10145–10146.
Also: kp2d at 10145 put the right ankle/heel on the support hand (flagged_estimate) — replaced by hand-read positions.

Fix (refit_leg.py, cwd = airflare_r3 copy, PYTHONPATH=/workspace/work/pylib:.):
- only rightThigh/rightShin/rightFoot params of stageR3.pkl, frames 10139–10155 (3 fixed neighbours each side); pelvis,
  spine, arms, left leg untouched;
- 2D knee/ankle/toe/heel (6 px sigma) + Fitter.limits (r3 hip/trunk limits) + sole·to-camera ≥ 0.45 (10144–10150),
  ankle nearer than knee (10145–10147), ankle nearer than the right hip (10142–10148), no foot/shin within 0.20 m of the
  trunk axis or 0.19 m of the head, position/rotation acceleration smoothing, weak pull to r3;
- init: geometric construction 10144–10150 (knee/ankle on their 2D rays at bone length, near branch; foot ⟂ shin, toe
  on its 2D ray) — plain multistart from r3 stays in the sole-away minimum.
  `INIT=1 SEEDS=4 python3 refit_leg.py stageR3.pkl stageR5c.pkl; python3 export.py stageR5c.pkl anim_r5.json r5.npz`
Result: leg 2D median 10139–10155 11.5 → 7.6 px (body median 7.5); 10145–10148 max 22/12/8/9 px; sole faces the camera
10143–10150 (cos +0.72…+0.97); foot ≥0.6 m from trunk axis/head; check_move groups 6 → 6 (same as r3); m3 metrics equal r3.
Note: with both thigh and shin pointing at the camera the 2D+bone-length solution is a near-straight forward kick
(knee 11–22° at 10145–10151); the 2D look of a "bent" leg is foreshortening.
