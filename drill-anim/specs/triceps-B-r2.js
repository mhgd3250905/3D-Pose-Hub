// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './triceps-B.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "triceps-B-r2",
  "segments": [
    [
      0,
      7,
      0,
      7
    ],
    [
      7,
      8,
      0,
      0
    ]
  ],
  "peak": 3.5,
  "keyFrames": [
    1.2,
    3.5,
    5.1
  ],
  "pulseAt": null,
  "phases": [
    {
      "id": "original-complete-support-lift-and-return",
      "start": 0,
      "end": 7
    },
    {
      "id": "extra-low-rest",
      "start": 7,
      "end": 8
    }
  ],
  "semantics": "One complete7s original support lift and return plus1s low rest; preserve exact2.9s peak lift plateau (source comment rounds it to3s), depression/grip/props. This is a demonstration loop, not a7/8s static hold prescription.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
