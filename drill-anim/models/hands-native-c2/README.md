# hands-native-c2

Candidate hand from the MakeHuman hm08 base mesh (CC0 1.0; base.obj header: "explicitly released as CC0 in september 2020"; https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md section C, LICENSE.ASSETS.md).
Left hand extracted, re-posed into the v2 leftHand frame, refit with `tools/human-v2plus/hands-native/fit_hand.py --weight-end 0.028`, then sized with `build_c.py` (uniform 0.851 -> 157.8 mm length, 70 mm palm width, 28 mm thickness = r8 dims); palm width x0.93, wrist ring x0.92; 28 mm hand-root blend from the forearm end ring; seam unchanged; r5 wrist-twist runtime.
Poses: open/palm-floor identity (flat), relaxed 7/10/5 deg, grip-bar 35/50/35. Use with v3 via `applyV3(p,spec,{handDir:'hands-native-c2',handScale:1.18})`. Not reviewed, not release-eligible.
