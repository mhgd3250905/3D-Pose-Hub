// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './chest-B.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "chest-B-r2",
  "segments": [
    [
      0,
      3.5,
      0,
      3.5
    ],
    [
      3.5,
      4,
      3.5,
      3.5
    ],
    [
      4,
      7.5,
      3.5,
      7
    ],
    [
      7.5,
      8,
      0,
      0
    ]
  ],
  "peak": 2.1,
  "keyFrames": [
    0,
    2.1,
    6.1
  ],
  "pulseAt": [
    2.1,
    6.1
  ],
  "phases": [
    {
      "id": "rep1",
      "start": 0,
      "end": 3.5
    },
    {
      "id": "extra-top-dwell1",
      "start": 3.5,
      "end": 4
    },
    {
      "id": "rep2",
      "start": 4,
      "end": 7.5
    },
    {
      "id": "extra-top-dwell2",
      "start": 7.5,
      "end": 8
    }
  ],
  "semantics": "Two complete3.5s source reps retain moving speed and grip/protraction behavior; insert0.5s top dwell after each. Default dose is not changed.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
