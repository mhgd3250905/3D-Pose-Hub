"""r21 clip configuration (env CLIP=A or B). Clip A is mirrored at the data level (image flip u->W-u + anatomical L/R swap),
so after loading, both clips have the RIGHT palm as the lower pivot hand."""
import os
CLIP = os.environ.get('CLIP', 'A')
R = '/workspace/work/b2000/ref2/'
if CLIP == 'A':
    P = R + 'clipA01/precision/'; F0, F1 = 384, 612; FPS0 = 30000 / 1001; IW, IH = 604, 1080
    F_PX = 1237.42; CX, CY = 302.0, 540.0; MIRROR = True
    # labels.txt (anatomical, ORIGINAL sides) -> swapped below because of the mirror
    WIN_ORIG = {'rightHand': [(465, 500)], 'leftHand': [(484, 585)],
                'rightFoot': [(384, 390), (406, 411), (423, 427), (430, 471), (584, 600), (608, 612)],
                'leftFoot': [(384, 388), (429, 444), (580, 600), (608, 612)]}   # stepping windows: labels.txt cross-checked with still 2D ankles (autofeet.py)
    GRIP_ORIG = ('rightHand', 'leftHand', 508, 568)      # (grip hand, pivot hand, from, to)
    FACING = {517: 1, 525: -1, 532: 1, 533: 1, 541: -1, 543: -1, 545: -1, 552: 1, 553: 1}   # +1 chest to camera, -1 back
    SPIN = (509, 565)
    GV_BAD = {511: 510, 512: 510, 513: 514}   # GVHMR wrist identity swap / 0.56 m jump -> init copied from neighbour
else:
    P = R + 'clipB/precision/'; F0, F1 = 0, 91; FPS0 = 30.0; IW, IH = 1080, 1080
    F_PX = 1527.35; CX, CY = 540.0, 540.0; MIRROR = False
    WIN_ORIG = {'rightHand': [(17, 68)], 'leftHand': [(35, 39), (70, 77)],
                'rightFoot': [(0, 20), (79, 91)], 'leftFoot': [(0, 2), (86, 91)]}
    GRIP_ORIG = ('leftHand', 'rightHand', 47, 59)
    FACING = {44: 1, 52: -1, 53: -1, 59: 1}
    SPIN = (47, 59)
    GV_BAD = {20: 19, 21: 22}   # 0.375 m left-foot jump (fast swing; init only)
SW = lambda b: b.replace('left', 'TMP').replace('right', 'left').replace('TMP', 'right') if MIRROR else b
WIN = {SW(k): v for k, v in WIN_ORIG.items()}
GRIP = (SW(GRIP_ORIG[0]), SW(GRIP_ORIG[1]), GRIP_ORIG[2], GRIP_ORIG[3])
FR = list(range(F0, F1 + 1)); N = len(FR)
# COCO-WholeBody L/R swap permutation (133 + 2 palms)
PERM = list(range(135))
for a, b in [(1, 2), (3, 4), (5, 6), (7, 8), (9, 10), (11, 12), (13, 14), (15, 16), (17, 20), (18, 21), (19, 22), (133, 134)] + [(91 + k, 112 + k) for k in range(21)]:
    PERM[a], PERM[b] = b, a
