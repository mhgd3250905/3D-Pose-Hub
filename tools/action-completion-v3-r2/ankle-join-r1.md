# Shared ankle connector candidate 0.1.0-r1

This is a common corrective component for the compatible armfix-r2 body, not an
action-specific foot-angle or lighting override. It follows the existing wrist
join's design: retain rigid end structures and reconstruct the connecting skin
between them. The experimental DQS comparison remains separate and is not the
geometry used by this component.

The foot and shin transforms independently carry the two endpoints. A cubic
Hermite centerline preserves their endpoint positions and tangent directions;
parallel transport and smooth axial twist orient intermediate cross-sections.
The default connector spans −12 to +165 mm along the neutral shin axis, from a
protected region inside the shoe opening to proximal lower-leg skin. Smooth end
windows retain original boundary skin. The lower ellipse is measured from the
actual open shoe-collar boundary with 4 mm clearance, and the upper ellipse from
the actual proximal skin. Interior sections replace the inherited notched rest
shape instead of wrapping an additional thin sleeve around it.

Existing dense body/limb topology, Foot/Shin weights, skeleton and rigid shoe/foot
structures outside the connector are preserved. Shared source vertices receive
the same world deformation. Posed triangle normals, UV-split copies and the 56
body/limb seam pairs are synchronized. Changes occur only during rendering and
are restored afterward, including exceptions; installation does not rewrite a
frozen model or mesh asset.

`window.__ankleJoinR1.last` reports displacement, source seam gap, measured radii,
bend/twist and a conservative curvature/radius Jacobian bound. A nonpositive or
small bound is a geometry stress signal, not permission to ignore that pose.
The component does not clamp bones or claim collision-free skin. Inspect the
shoe opening, inner/outer silhouettes, neutral stance and full motion in several
support conditions before accepting it as a shared production component.

Run `node --test tools/action-completion-v3-r2/ankle-join-r1.test.mjs` for endpoint,
transport, seam, rigid shoe/bone preservation and exact restoration checks.
