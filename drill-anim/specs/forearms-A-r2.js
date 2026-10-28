// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './forearms-A.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "forearms-A-r2",
  "segments": [
    [
      0,
      0.35,
      0,
      0.5
    ],
    [
      0.35,
      0.7,
      0.5,
      1
    ],
    [
      0.7,
      1.1,
      1,
      1.9
    ],
    [
      1.1,
      1.25,
      1.9,
      2.2
    ],
    [
      1.25,
      1.65,
      2.2,
      3.2
    ],
    [
      1.65,
      1.8,
      3.2,
      3.5
    ],
    [
      1.8,
      2,
      3.5,
      4
    ],
    [
      2,
      2.35,
      4,
      4.5
    ],
    [
      2.35,
      2.7,
      4.5,
      5
    ],
    [
      2.7,
      3.1,
      5,
      5.9
    ],
    [
      3.1,
      3.25,
      5.9,
      6.2
    ],
    [
      3.25,
      3.65,
      6.2,
      7.2
    ],
    [
      3.65,
      3.8,
      7.2,
      7.5
    ],
    [
      3.8,
      4,
      7.5,
      8
    ],
    [
      4,
      4.35,
      8,
      8.5
    ],
    [
      4.35,
      4.7,
      8.5,
      9
    ],
    [
      4.7,
      5.1,
      9,
      9.9
    ],
    [
      5.1,
      5.25,
      9.9,
      10.2
    ],
    [
      5.25,
      5.65,
      10.2,
      11.2
    ],
    [
      5.65,
      5.8,
      11.2,
      11.5
    ],
    [
      5.8,
      6,
      11.5,
      12
    ],
    [
      6,
      6.35,
      12,
      12.5
    ],
    [
      6.35,
      6.7,
      12.5,
      13
    ],
    [
      6.7,
      7.1,
      13,
      13.9
    ],
    [
      7.1,
      7.25,
      13.9,
      14.2
    ],
    [
      7.25,
      7.65,
      14.2,
      15.2
    ],
    [
      7.65,
      7.8,
      15.2,
      15.5
    ],
    [
      7.8,
      8,
      15.5,
      16
    ]
  ],
  "peak": 1.175,
  "keyFrames": [
    1.175,
    3.175,
    5.175,
    7.175
  ],
  "pulseAt": [
    1.175,
    3.175,
    5.175,
    7.175
  ],
  "phases": [
    {
      "id": "fingers-forward",
      "start": 0,
      "end": 2,
      "phaseSeconds": {
        "change-right": 0.35,
        "change-left": 0.35,
        "forward": 0.4,
        "hold-forward": 0.15,
        "back": 0.4,
        "hold-back": 0.15,
        "reset": 0.2
      }
    },
    {
      "id": "fingers-out",
      "start": 2,
      "end": 4,
      "phaseSeconds": {
        "change-right": 0.35,
        "change-left": 0.35,
        "forward": 0.4,
        "hold-forward": 0.15,
        "back": 0.4,
        "hold-back": 0.15,
        "reset": 0.2
      }
    },
    {
      "id": "fingers-back",
      "start": 4,
      "end": 6,
      "phaseSeconds": {
        "change-right": 0.35,
        "change-left": 0.35,
        "forward": 0.4,
        "hold-forward": 0.15,
        "back": 0.4,
        "hold-back": 0.15,
        "reset": 0.2
      }
    },
    {
      "id": "dorsal-hand",
      "start": 6,
      "end": 8,
      "phaseSeconds": {
        "change-right": 0.35,
        "change-left": 0.35,
        "forward": 0.4,
        "hold-forward": 0.15,
        "back": 0.4,
        "hold-back": 0.15,
        "reset": 0.2
      }
    }
  ],
  "semantics": "All four original wrist orientations and the two sequential hand changes per block are retained; each block now2s instead of4s. Explicit local durations: changes0.35s each, forward/back0.4s each, holds0.15s each, reset0.2s. This is faster first-pass demonstration cadence, not a timed stretching prescription; contact/keepReach/knuckle clearance are unreviewed.",
  "method": "independently-authored-local-phase-slices"
});
