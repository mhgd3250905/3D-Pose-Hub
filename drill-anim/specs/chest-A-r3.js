// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './chest-A-r2.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "chest-A-r3",
  "segments": [
    [
      0,
      2.7,
      0.3,
      3
    ],
    [
      2.7,
      3,
      3,
      3.3
    ],
    [
      3,
      4,
      4,
      5
    ],
    [
      4,
      6.7,
      6.3,
      9
    ],
    [
      6.7,
      7,
      9,
      9.3
    ],
    [
      7,
      8,
      10,
      11
    ]
  ],
  "peak": 2.85,
  "keyFrames": [
    0.85,
    2.85,
    6.85
  ],
  "pulseAt": [
    0.85,
    2.85,
    4.85,
    6.85
  ],
  "phases": [
    {
      "side": "right-arm-up/left-support",
      "start": 0,
      "end": 4,
      "phaseSeconds": {
        "down": 0.85,
        "up": 0.85,
        "turn": 1,
        "hold": 0.3,
        "return": 1
      }
    },
    {
      "side": "left-arm-up/right-support",
      "start": 4,
      "end": 8,
      "phaseSeconds": {
        "down": 0.85,
        "up": 0.85,
        "turn": 1,
        "hold": 0.3,
        "return": 1
      }
    }
  ],
  "semantics": "Two push-up/side-plank sequences retained, right arm up first then left. Preserve all moving source durations. Remove old neutral preparation/reset and shorten each side-plank plateau from1.0s to0.3s; no hold-dose claim.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
