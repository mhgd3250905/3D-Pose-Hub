// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './triceps-A.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "triceps-A-r2",
  "segments": [
    [
      0,
      3.6,
      0,
      3.6
    ],
    [
      3.6,
      4,
      3.6,
      3.6
    ],
    [
      4,
      7.6,
      3.6,
      7.2
    ],
    [
      7.6,
      8,
      0,
      0
    ]
  ],
  "peak": 3.3,
  "keyFrames": [
    2.1,
    3.3,
    7.3
  ],
  "pulseAt": [
    3.1,
    7.1
  ],
  "phases": [
    {
      "id": "rep1",
      "start": 0,
      "end": 3.6
    },
    {
      "id": "extra-lockout1",
      "start": 3.6,
      "end": 4
    },
    {
      "id": "rep2",
      "start": 4,
      "end": 7.6
    },
    {
      "id": "extra-lockout2",
      "start": 7.6,
      "end": 8
    }
  ],
  "semantics": "Two complete3.6s close-grip reps retain moving speed; insert0.4s top lockout dwell after each. Existing lockout dwell is lengthened, never shortened. Default dose unchanged.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
