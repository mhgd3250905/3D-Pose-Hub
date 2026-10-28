# hands-native-c1r2-symmetric-r1

Independent candidate, version `1.0.0-c1r2-symmetric-r1`; `reviewed:false`, `releaseEligible:false`.

The historical `build_c.py` put `P2[:,0]*=sgn; Y[sel]=P2` in the same one-line `if sgn==1` suite. The left mesh received scale 0.851 while the right remained unscaled; the finger rig was scaled for both.

`symmetric-rebuild.py` reconstructs the missing right scale from pinned c1 source and the existing scaled rig, then runs the pinned c1r2 Loop subdivision, wrist rebuild and smoothing algorithm. Rounded historical joints require a measured frame reconstruction: the distal affine residual is 0.0113 mm. Verified shared interior topology supplies a final mirror correspondence correction with smoothstep weight from hand-local 0 to 35 mm. The original asymmetric seam zipper is preserved; this is not a claim that the entire wrist collar is mirror-identical. The old quantizer and left/seam coordinates are preserved exactly. Right normals are recomputed, including limb-shared seam normals. The original rig file is byte-identical, retaining every joint, pose and bone name.

CPU results: 13398 vertices, 26726 faces, 52 bones, 66 unchanged seam vertices; unchanged indices, skin weights and bone indices; no nonmanifold edges or zero-area triangles. Left/right tip distances from the hand origin are 159.0049 / 159.0047 mm (old right 186.5396 mm). Beyond 35 mm, mirrored surface nearest-point maximum is 0.0026 mm. The retained wrist transition has a full-mesh mirror maximum of 3.3444 mm. This is recorded rather than hidden.

Build: `python tools/body-v3/armfix-r2/symmetric-rebuild.py --rest <original-v2-rest.json> --out <fresh-output-directory>`.
Audit: `python tools/body-v3/armfix-r2/symmetric-audit.py --rest <original-v2-rest.json> --output <report.json>`.
The original-v2 capture path and hash and all historical Git source hashes are in `build-provenance.json`. No workstation configuration or credentials are required. The original MakeHuman hm08 source retains CC0 attribution from c1/c1r2.

CPU checks do not certify GPU appearance, grasp, support, self-collision, motion or user acceptance. The consuming candidate must load this source before creating finger bones. Default handScale is 1; no application-wide production recipe was changed.
