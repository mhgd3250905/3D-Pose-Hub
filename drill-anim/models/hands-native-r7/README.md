# hands-native r7

Candidate. r6a dimensions (r3 x0.82, extra width 0.85, palm thickness 0.7, wrist-band narrowing 0.87) plus:
- hand-root cross-section blend over 0-28 mm from the wrist joint: exact forearm end-ring shape at the seam (seam vertices unchanged), smoothstep to the hand's own section;
- free-hand poses `open`/`relaxed` = r3 relaxed curl x2.2 (slightly curled); `palm-floor`, `grip-bar`, `band-grip` unchanged;
- r5 `wrist-twist.js` (twist share, default 0.5).
Built by `docs/hand-scale-r4/build_r7.py` (`OUT=... PALM=0.7 WIDTH=0.85 XBLEND=0.028 python3 build_r7.py 0.82 0.035 0.87`) + pose step. Select `nativeHands.version: '1.0.0-r7'`. Wrist colour fade NOT included: a runtime shader patch had no effect on hand pixels / broke compilation; needs a change in the frozen page/human-v2plus.js paint (separate approval). Not reviewed, not release-eligible.
