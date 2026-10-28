# Independent arm proportion candidate r1

`training-human-v3-armfix / 0.1.0-r1` restores the original Snow shoulder–elbow and elbow–wrist lengths and uses the unscaled c1r2 hand. The original v3 leg and shortened-trunk recipe remains unchanged. This is a proportion candidate, not a replacement production default or the complete r7 repair stack.

The independent viewer loads `runtime/public/coach-v3-armfix-r1/coach-rig.json` before `createCoachMotion`. The independent base loader derives the replacement JSON surfaces from that same recipe. Hand scale is fixed at 1; asking for 1.18 or another hand asset is rejected. No post-pose mesh-only resizing or manual `E.L` overwrite is used.

```js
import {boot, applyV3, verify} from './loader.mjs';
await verify();
const {b, p} = await boot({size:640, pr:1, theme});
try {
  const setup = await applyV3(p, explicitNativeSpec);
  // Inspect live world bone lengths and actual skinned surfaces before acceptance.
} finally {
  await b.close();
}
```

The descriptor requires `modelProfile:'training-human-v2plus-hands-native'` and `v2plus.torso/limbs/hands:'base'`. The API's default hand scale is 1. The historical `nativeHands.version` field is not used to silently choose the old r3 loader.

Retained code/data: c1r2 wrist topology; the P2 shared head-neck fragment, guarded against influences from changed forearm/hand/finger pivots; the L1 wrist color gradient computed from the current wrist planes. These retained layers still require visual checks on this candidate.

Not migrated: r7 P1 ankle correction, P3 collar refinement, P4 hip/knee normal correction, P5 shoulder corrective, L2 arm/piece normal recomputation, and r5 contact/palm-floor and neck-channel calibration. Their previous QA does not validate this candidate. Old absolute action targets also require retargeting or explicit per-action review.

The manifest uses LF-normalized text and raw binary SHA-256. `verify()` checks the candidate recipe and all listed sources. Frozen original files remain unchanged.

```powershell
node --test drill-anim/models/training-human-v3-armfix-r1/armfix.test.mjs
```

CPU checks cover source preservation, original arm lengths, the independent initialization chain, finite derived meshes and unscaled c1r2 dimensions. They do not certify IK playback, visible contacts, collisions, shading or a public release. After failure discard the page; initialize this candidate only once per page.
