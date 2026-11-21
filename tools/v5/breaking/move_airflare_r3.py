#!/usr/bin/env python3
"""Air Flare r3 (breaking-airflare) = r2 (v3 rig fitted to clip01 precision 2D keypoints) + 开哥 r2 feedback:
 1. rigid lower back: rig.SPW spreads the trunk rotation 0.5/0.9/1.6 over spineLower/spineUpper/torso (r2 1/1/1, so the lumbar
    joints carried 2/3 of the bend); fit.py cfg 'r3' limits the whole trunk per axis in the pelvis frame (flex 50, ext 28, side 28,
    twist 38, total 55 deg; neck 58), a weighted pull toward a neutral back and spine/neck acceleration smoothing, so the 2D fit
    cannot bend the spine to reach points (the pelvis/hips take it).
 2. crotch: hip limits (abd 64, flex 128, ext 30, thigh swing 132 deg, weight 45) in the fit + a soft clamp in export.py
    (abd -> <=72, ext -> <=36) before the contact IK. Remaining crotch notches at ~160 deg front/back splits with hip angles
    inside normal range are the shared model's skinning, not changed here.
 3. export.py: planted palms may pivot on the floor (<=45 deg, long windows up to 110 deg) and the finger heading is chosen with
    the arm twist followed continuously through the window (no 360 wrap) + wrist dorsiflexion over the whole window; arm-twist
    smoothing sigma 5 frames @120 fps.
Commands (cwd = airflare_r3, PYTHONPATH=/workspace/work/pylib:., r2's stageC4.pkl as start):
  R3='{"asig":0.5,"r3":{"flex":50,"ext":28,"lat":28,"tw":38,"tot":55,"neck":58,"w":20,"reg":0.2,"sacc":0.05},
       "hip":{"ext":30,"flex":128,"abd":64,"swing":132,"w":45}}' python3 stageB.py stageC4.pkl stageR3.pkl 45 anchor
  python3 export.py stageR3.pkl anim.json r3.npz ; python3 ../check_move.py r3.npz ; python3 m3.py r3.npz stageR3.pkl r3 check.txt
  python3 showanim.py r3.npz cmp.jpg 10168,10179,10181,10183 ; mesh close-ups: camjobs.py + node shot.mjs (Pose Studio ps-b2000 headless)"""
import os, runpy, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'airflare_r3'))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'airflare_r3'))
runpy.run_path('export.py', run_name='__main__')
