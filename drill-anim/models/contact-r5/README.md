# Independent wrist bridge profile
Explicit opt-in training-human-v2plus-contact-wrist/1.0.0-r5.1, realistic only, layered on contact-r4. Not current production and not a model-wide certification.

This profile changes only 637 mixed rightHand/rightForearm material vertices using virtual-rest dual-quaternion compensation and inverse actual skin transforms. Pure fingers, seam vertices, weights, bones, face indices, original assets, and original production files remain unchanged. Geometry is cloned and restored on profile exit. The rest matrices are canonical model coordinates, not raw GLTF bone matrices. A separate manifest-checked loader is required; original rendering entry points are not patched.

The normal correction follows the same virtual map without global normal recomputation. Visual and geometric QA are required. Runtime throws for unexpected mask, singular inverse, or nonfinite result. Default and restored production snapshots of bones, geometry positions/normals/weights/indices must match exactly.

Action 067 keeps its existing trajectories and four fixed material contact patches. The method is not permission to ignore any nonadjacent self intersection, change teaching goals, or borrow floor tolerance for human anatomy intersections.
