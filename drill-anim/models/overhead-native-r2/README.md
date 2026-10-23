# Overhead native R2: neutral wrists

Scoped composition for overhead triceps extension rr4: accepted native-r3 hand
mesh and rig, fitted grip targets from grip-native-r1, and the rr2 fixed-elbow
trajectory. The left hand retains the original relaxed pose. The right dumbbell
uses the fitted rod center/axis mirrored across hand-local X; its dimensions,
body/wrist position targets, elbow trajectory, support and timing remain unchanged.

The first native candidate is retained as R1/rr3; its inherited hand orientation
twisted the new wrists and was rejected. R2 derives each hand's world orientation
from the actual forearm world quaternion and the neutral rest relative quaternion.
`neutral-orientation.json` records all 241 samples and the rest relation; the
generator is `../overhead-native-r1/build-orientation.mjs`. Only finger/normal
orientation tracks change. This does not move the wrist or the fixed elbow.

Source verification follows both frozen native-hand and fitted-grip chains.
No shared assets, previous specification, model loader or production default is
modified. Independent actual pose, grip, wrist and body/prop verification is
required; this combination is not automatically approved for publication.
