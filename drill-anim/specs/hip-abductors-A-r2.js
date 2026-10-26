// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './hip-abductors-A.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "hip-abductors-A-r2",
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
  "peak": 1.6,
  "keyFrames": [
    0,
    1.6,
    5.6
  ],
  "pulseAt": [
    1.6,
    5.6
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
  "semantics": "Two complete right-leg lifts on left forearm support retained, no in-clip side change. Exact arc/lift tracks stay synchronized; insert1s low rest after each3s rep.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
