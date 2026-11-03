// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './deltoids-B.js';
import {native8} from './_draft-native8-r1.mjs';
const track = (a,b,c,d) => [[0,0],[a,0],[b,1],[c,1],[d,0]];
const tracks = {elb:track(.3,1.5,6.5,7.7),sit:track(1.5,2.6,5.4,6.5),brg:track(2.6,3.7,4.3,5.4),arc:[[0,0],[2.6,0],[3.15,1],[3.7,0],[4.3,0],[4.85,1],[5.4,0]]};
export default native8(base, {
  "id": "deltoids-B-r2",
  "segments": null,
  "peak": 4,
  "keyFrames": [
    1.5,
    2.6,
    4
  ],
  "pulseAt": null,
  "phases": [
    {
      "id": "prepare",
      "start": 0,
      "end": 0.3
    },
    {
      "id": "elbow-rise",
      "start": 0.3,
      "end": 1.5
    },
    {
      "id": "sit-rise",
      "start": 1.5,
      "end": 2.6
    },
    {
      "id": "bridge-rise",
      "start": 2.6,
      "end": 3.7
    },
    {
      "id": "bridge-hold",
      "start": 3.7,
      "end": 4.3
    },
    {
      "id": "bridge-lower",
      "start": 4.3,
      "end": 5.4
    },
    {
      "id": "sit-lower",
      "start": 5.4,
      "end": 6.5
    },
    {
      "id": "elbow-lower",
      "start": 6.5,
      "end": 7.7
    },
    {
      "id": "reset",
      "start": 7.7,
      "end": 8
    }
  ],
  "semantics": "One full supine-to-elbow-to-sit-to-high-bridge and reverse sequence, right dumbbell/left support unchanged. Independently authored rise/lower durations1.2/1.1/1.1s and0.6s high-bridge plateau. Source moving time8.8s alone cannot fit8s unchanged; new cadence requires review. This is the half get-up, not a standing get-up.",
  "method": "independently-authored-local-phase-tracks",
  "tracks": tracks
});
