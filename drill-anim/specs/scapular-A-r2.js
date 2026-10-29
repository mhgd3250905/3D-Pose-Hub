// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './scapular-A.js';
import {native8} from './_draft-native8-r1.mjs';
export default native8(base, {
  "id": "scapular-A-r2",
  "segments": [
    [
      0.0,
      0.8,
      0.3,
      1.1
    ],
    [
      0.8,
      0.9666666666666667,
      1.1,
      1.2666666666666668
    ],
    [
      0.9666666666666667,
      2.6666666666666665,
      2.3,
      4
    ],
    [
      2.6666666666666665,
      3.466666666666667,
      4.3,
      5.1
    ],
    [
      3.466666666666667,
      3.6333333333333333,
      5.1,
      5.266666666666667
    ],
    [
      3.6333333333333333,
      5.333333333333333,
      6.3,
      8
    ],
    [
      5.333333333333333,
      6.133333333333333,
      8.3,
      9.1
    ],
    [
      6.133333333333333,
      6.3,
      9.1,
      9.266666666666666
    ],
    [
      6.3,
      8.0,
      10.3,
      12
    ]
  ],
  "peak": 0.883333,
  "keyFrames": [
    0.883333,
    3.55,
    6.216667
  ],
  "pulseAt": [
    0.883333,
    3.55,
    6.216667
  ],
  "phases": [
    {
      "id": "Y",
      "start": 0.0,
      "end": 2.6666666666666665,
      "phaseSeconds": {
        "lift": 0.8,
        "hold": 0.16666666666666666,
        "lower": 0.8,
        "slide-to-next-letter": 0.9
      }
    },
    {
      "id": "T",
      "start": 2.6666666666666665,
      "end": 5.333333333333333,
      "phaseSeconds": {
        "lift": 0.8,
        "hold": 0.16666666666666666,
        "lower": 0.8,
        "slide-to-next-letter": 0.9
      }
    },
    {
      "id": "W",
      "start": 5.333333333333333,
      "end": 8.0,
      "phaseSeconds": {
        "lift": 0.8,
        "hold": 0.16666666666666666,
        "lower": 0.8,
        "slide-to-next-letter": 0.9
      }
    }
  ],
  "semantics": "Retain Y,T,W and return-to-Y, all0.8s lift/lower and0.9s slide motion speeds. Remove0.3s neutral preparation per letter and shorten each1.2s hold to1/6s (5frames); no static-hold prescription is inferred. All coordinate/normal/pole and sa QA-marker channels share the same slices.",
  "method": "unit-rate-source-slices-and-explicit-dwell"
});
