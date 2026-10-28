// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './serratus-A.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "serratus-A-r2",
  "segments": [
    [
      0,
      3,
      0,
      3
    ],
    [
      3,
      4,
      3,
      3
    ],
    [
      4,
      7,
      3,
      6
    ],
    [
      7,
      8,
      0,
      0
    ]
  ],
  "peak": 2.45,
  "keyFrames": [
    1.3,
    2.45,
    6.45
  ],
  "pulseAt": [
    2.45,
    6.45
  ],
  "phases": [
    {
      "id": "rep1",
      "start": 0,
      "end": 3
    },
    {
      "id": "neutral-dwell1",
      "start": 3,
      "end": 4
    },
    {
      "id": "rep2",
      "start": 4,
      "end": 7
    },
    {
      "id": "neutral-dwell2",
      "start": 7,
      "end": 8
    }
  ],
  "semantics": "Two complete straight-arm scapular retraction/protraction/return reps retained; insert1s neutral rest after each3s rep. No push-up elbow-bending is added.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
