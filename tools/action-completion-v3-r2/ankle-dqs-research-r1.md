# Local ankle correction experiment

The reviewed armfix model already contains P1: static shoe-collar fitting and Foot/Shin
weight adjustment, synchronized 56 source seam pairs, plus ankle/shoe material fixes.
It has no pose-dependent ankle geometry correction. Neither a closed source seam nor
a continuous foot quaternion proves that the visible ankle volume and normals remain
acceptable under a new action.

Before implementing the experiment, the maintained [libigl project](https://github.com/libigl/libigl)
and its [DQS tutorial](https://libigl.github.io/tutorial/#dual-quaternion-skinning),
[implementation interface](https://github.com/libigl/libigl/blob/main/include/igl/dqs.cpp),
[MPL-2.0 license](https://github.com/libigl/libigl/blob/main/LICENSE.MPL2), and
[release notes](https://github.com/libigl/libigl/releases) were checked. The release
notes include a quaternion hemisphere correction (#2390), explicitly covered here.

The existing Three.js pipeline uses linear matrix blending; this can shrink the
mixed-weight joint cross-section. Libigl represents rigid transforms as normalized
dual-quaternion blends, retaining rotation volume, but its C++/Eigen dependency is
unnecessary for this browser preview. The small implementation here derives the
same mathematical construction independently and copies no libigl source.

`ankle-dqs-r1.mjs` applies that construction only to existing Foot/Shin skin vertices
near the ankle. Pure-bone endpoints, shoes, bones, weights and topology stay intact.
World-space triangle normals are recomputed with coincident/seam averaging, then
inverted through Three.js's actual skinnormal transform. Render hooks restore the
original buffers even on failure. `ankle-normals-control-r1.mjs` performs only the
normal step, separating shading improvement from geometry improvement.

DQS is not a collision solver: it can increase joint volume, expose an existing
shoe intersection, or leave a bad rest shape unchanged. Compare both controls in
the actual bridge and bear poses, inspect shoe-opening views and the full loop,
and retain pending user acceptance until the visible result is confirmed.
