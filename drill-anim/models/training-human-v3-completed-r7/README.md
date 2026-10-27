# Training human v3 completed r7

This model adds a local, posture-gated hip normal layer to the frozen knee-normal r1 model. It retains the prior P5 and earlier body-v3 layers through the recursively verified base. Geometry and skeleton are not modified. The hip layer is limited to a fixed source mask, preserves seam normals, and runs through the knee layer's single render extension.

The CPU normal calculation accounts for the existing shader breath and sink displacements. Missing or non-finite shader inputs disable the hip normal update until valid inputs return. The initial shader is compiled before the combined loader returns. Validation is limited to the recorded samples; this model is not a media release.
