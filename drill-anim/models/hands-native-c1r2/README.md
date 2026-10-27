# hands-native-c1r2

c1 (MakeHuman hm08, CC0 1.0) fixed at the wrist. Diagnosis: the wrist seam sits at hand-local x -38..-22 mm (behind the hand bone), while the c1 root blend only covered x 0..28 mm. So the MakeHuman forearm stub between the forearm ring and the hand kept its own cross-section, which fit_hand had snapped up to 21 mm onto the ring. The result was a ridge and notch on the radial/ulnar edges.
Fix (`tools/body-v3/hands-c/build_c1r2.py 0.010`):
- one Loop subdivision; seam verts and seam-seam edges stay fixed, so the weld is exact;
- per angle, radius and centre are rebuilt as a smoothstep from the forearm ring to the hand section at x=10 mm (monotone);
- Taubin smoothing out to x=22 mm;
- area-weighted normals are recomputed; seam normals are shared with the limbs piece (limbsNrm).
Rig/finger mapping, poses and r5 twist are unchanged. v3 loader default (handScale 1.18). Not reviewed, not release-eligible.
