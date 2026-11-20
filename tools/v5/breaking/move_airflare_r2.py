#!/usr/bin/env python3
"""Air Flare r2 (breaking-airflare) = v3 rig fitted to the video's own 2D keypoints (clip01 precision pack, source frames
10118-10273, 30 fps), replacing r1's GVHMR-driven retarget (r1 reprojected 46 px median / 71 px in the flare; r2 7 px).

Pipeline (modules in ./airflare_r2, data in /workspace/work/airflare/precision = git archive of
ref/airflare-video/clip01/precision @61b66acd; each step is sized to finish in < 2 min on the 2-core sandbox):
 1. load.py      kp2d (COCO-WholeBody) -> reference-frame pixels via labels/background_tracking.csv frame_to_ref (~48 px drift).
 2. init_gv.py   GVHMR/SMPL-X camera-frame pose -> v3 rig base rotations (initial value only; structure, not trusted).
 3. stageA.py    per-frame least squares on the rig (root, pelvis, spine, neck/head, arms, legs; 42 dof) against the 2D
                 keypoints (fixed camera f=2202.9 px), soft joint limits, + 8 global marker offsets (hip/shoulder/head).
 4. ground.py    ground plane fitted to the labelled hand/foot contacts of the stage-A body (camera ~0.44 m high).
 5. stageB.py    whole-sequence solve: reprojection + temporal acceleration + floor clearance (head/torso/elbows) + hands/feet
                 locked (zero velocity, on the ground) inside labels.txt windows + chest-up at the labelled peaks
                 10179/10209/10239; 'anchor' keeps the chosen depth branch.
 6. tmpl.py      round 1 (10166-10192) had converged to the mirrored depth branch (chest down at its chest-up peak, hip yaw
                 reversing). Re-initialised from round 2 time-aligned by the labelled phases and turned 180 deg about the
                 ground normal (round 1 is seen from behind), then refitted to round 1's own 2D (3 px vs 12 px), then stageB.
    normsp.py    re-expresses spine/neck rotvecs (a wrapped 124 deg/bone spine twist made the 120 fps slerp spin the torso).
 7. export.py    world = ground y 0, camera v0 = the video camera; 30 -> 120 fps slerp; feet/hands IK-locked to the window
                 mean point with 0.12 s ramps; planted palm flat, finger heading chosen per window by arm-twist feasibility
                 with the 2D wrist->knuckle direction as prior; arm twist (elbow swing about shoulder-wrist line + forearm
                 roll) solved by DP over the clip so humerus rotation / pronation / hand twist stay in range.
Commands (cwd = airflare_r2, PYTHONPATH=/workspace/work/pylib:.):
  python3 stageA.py ; python3 stageB.py stageA2.pkl stageB2.pkl 45 ; python3 tmpl.py stageB2.pkl tmplA.pkl 10166 10192 180 1 2
  python3 stageB.py tmplA.pkl stageC1.pkl 40 anchor ; ... ; python3 normsp.py stageC2.pkl stageC2n.pkl ; (stageB again)
  python3 export.py stageC4.pkl anim.json dump.npz ; python3 ../check_move.py dump.npz
  python3 showanim.py dump.npz cmp.jpg 10168,10179,10181,10183
This file only documents/forwards to export.py so the move has a single entry point name like r1."""
import os, runpy, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'airflare_r2'))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'airflare_r2'))
runpy.run_path('export.py', run_name='__main__')
