// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './t-seated-straddle-lift-1leg.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "t-seated-straddle-lift-1leg-r2",
  "segments": [
    [
      0,
      1.6,
      0,
      1.6
    ],
    [
      1.6,
      2.2,
      1.6,
      1.6
    ],
    [
      2.2,
      4,
      3.2,
      5
    ],
    [
      4,
      5.6,
      5,
      6.6
    ],
    [
      5.6,
      6.2,
      6.6,
      6.6
    ],
    [
      6.2,
      8,
      8.2,
      10
    ]
  ],
  "peak": 0.6,
  "keyFrames": [
    0.6,
    3.1,
    4.6,
    7.1
  ],
  "pulseAt": [
    0.6,
    4.6
  ],
  "phases": [
    {
      "id": "left-lift",
      "start": 0,
      "end": 1.6
    },
    {
      "id": "left-settled-rest",
      "start": 1.6,
      "end": 2.2
    },
    {
      "id": "hands-up-turn-right-replant",
      "start": 2.2,
      "end": 4
    },
    {
      "id": "right-lift",
      "start": 4,
      "end": 5.6
    },
    {
      "id": "right-settled-rest",
      "start": 5.6,
      "end": 6.2
    },
    {
      "id": "hands-up-return-left-replant",
      "start": 6.2,
      "end": 8
    }
  ],
  "semantics": "One left and one right complete1.6s lift instead of two per side; retain both full1.8s hands-up/turn/replant transitions unchanged and insert0.6s settled rest per side. Left first; switch at4s. Hand changes remain separate from leg lifts. Default dose unchanged.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
