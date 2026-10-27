# Body proportion audit — training-human-v2plus (current) vs norms — 2026-10-27 (UTC+8)

**Source of the measurements**
- Bind/rest pose, joint centres:
  - `runtime/public/coach/coach-rig.json` landmarks (T-pose), plus a 0.009 m floor offset;
  - browser probe of the v2plus bind pose.
- Stature H = 1.729 m (floor to vertex, no hair).

**Norms**
- Drillis & Contini 1966, as reproduced in Winter, *Biomechanics and Motor Control of Human Movement*: segment lengths as fractions of H.
- Pheasant, *Bodyspace*, UK adult male 50th percentile (H 1740 mm) for widths, hand and foot.

Joint-centre landmarks are compared with joint-centre norms wherever possible; where a norm is bony or surface-based, that is noted.

| Segment | Current | ×H | Norm ×H (source) | Norm @1.729 | Deviation | Note |
|---|---|---|---|---|---|---|
| Head, chin to vertex | 0.232 m | 0.134 | 0.130 (D&C) | 0.225 | +3% | OK |
| Face, chin to hairline | 0.196 m | 0.113 | ≈0.11 | 0.19 | +3% | OK |
| Neck (C7 to chin, approx.) | ≈0.13 m | — | — | — | — | not measured precisely |
| Shoulder joint height | 1.370 m | 0.792 | ≈0.80 joint (acromion 0.818, D&C) | 1.383 | −1% | OK as a joint centre (acromion is about 3 cm higher) |
| Shoulder joint-centre width | 0.376 m | 0.217 | biacromial 365/1740 = 0.210 (Pheasant) | 0.363 | +4% | borderline; bony width ≈ joint width |
| **Upper arm** (shoulder to elbow) | 0.256 m | 0.148 | 0.186 (D&C) | 0.322 | **−20%** | fix |
| **Forearm** (elbow to wrist) | 0.228 m | 0.132 | 0.146 (D&C) | 0.253 | **−10%** | fix |
| Hand r8 (wrist to middle fingertip) | 0.158 m | 0.091 | 0.108 (D&C) / 189/1740 (Pheasant) | 0.187 | −15% | 开 chose r8; see open issue |
| Torso (hip joint to shoulder joint) | 0.518 m | 0.300 | 0.288 (D&C, 0.818−0.530) | 0.498 | +4% | borderline (follows from the short thigh) |
| Pelvis, hip joint-centre width | 0.163 m | 0.094 | ≈0.09–0.10 (joint centres) | ≈0.16 | ≈0% | OK |
| **Thigh** (hip to knee) | 0.353 m | 0.204 | 0.245 (D&C) | 0.424 | **−17%** | short; hip joint low (0.493H against ≈0.53H) |
| Shank (knee to ankle) | 0.409 m | 0.236 | 0.246 (D&C) | 0.425 | −4% | borderline |
| Foot length | not measured (shoe mesh) | — | 0.152 (D&C) | 0.263 | — | todo |

**Standing check** (arms down, r8 hand):
- Fingertip is at about 0.73 m, against a norm fingertip height of about 0.376H = 0.65 m (Pheasant, 655/1740). That is 8 cm too high.
- With v3 arms (0.322 / 0.253) the fingertip comes to about 0.644 m, within 1 cm of the norm.
- Mid-thigh is 0.675 m now, raised by the short thigh, so v3's fingertips end slightly below this body's mid-thigh but at the normal absolute height.

**Highlights**
1. The arms are clearly short: upper arm −20%, forearm −10%. This is the main cause of the "big hand" impression.
2. The thigh is also short (−17%), with the torso correspondingly long (+4%).
3. Shoulder height and width, head and pelvis are within about 4%. The earlier "low shoulders" reading came from comparing a joint centre with the acromion; as a joint centre it is OK.
