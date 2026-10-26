// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './quadriceps-C.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "quadriceps-C-r2",
  "segments": [
    [
      0,
      5,
      0,
      5
    ],
    [
      5,
      8,
      5,
      5
    ]
  ],
  "peak": 2.6,
  "keyFrames": [
    0.4,
    2.6,
    4.3
  ],
  "pulseAt": null,
  "phases": [
    {
      "id": "prepare",
      "start": 0,
      "end": 0.4
    },
    {
      "id": "extend",
      "start": 0.4,
      "end": 1.6
    },
    {
      "id": "required-lockout-hold",
      "start": 1.6,
      "end": 3.6
    },
    {
      "id": "lower",
      "start": 3.6,
      "end": 5
    },
    {
      "id": "bottom-rest",
      "start": 5,
      "end": 8
    }
  ],
  "semantics": "One complete5s source rep instead of two, plus3s bottom rest. Preserve the named2s lockout plateau and every moving arc/roller coordinate; do not shorten the hold to fit two reps. Demo rep count changes, default dose unchanged.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
