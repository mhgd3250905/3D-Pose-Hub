# Completed v3 r6: isolated collar texture uniforms

Experimental candidate. It has the same P1/P2/P3/L1/L2 setup and geometry as
completed-r5, but calls collar-weld-r27. The r27 remap creates an independent
uniform wrapper for each remapped per-vertex texture. It preserves the live
theme/highlight uniform references and leaves the frozen r26 data unchanged.
The r5 recursive verification remains required; r6 additionally locks its own
source, the r27 loader and the r5 manifest using LF-normalized text SHA-256.

Lifecycle is still partial: after `detachGeometryLayers`, ankle, normal and
wrist hooks remain for the lifetime of the page. Use a fresh page after an
error or for another initialization. This source-level fix is pending its own
real-render, theme/highlight, off/on and P5 integration comparison; it is not
a release or all-action acceptance.
