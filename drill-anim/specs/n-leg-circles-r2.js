// Native8 first-pass draft: independent revision; old source and dose metadata remain unchanged.
// All source/visual/editorial/medical QA remain pending. This is not a release approval.
import base from './n-leg-circles.js';
import {native8} from './_draft-native8-r1.mjs';
import {build, keys, r4} from '../lib/home-anim.mjs';
import {leg, footRotW, restToWorld} from '../lib/ss-geo.mjs';
const hips = base.pose.base.hips;
const ease = u => (1-Math.cos(Math.PI*u))/2;
const crossF=keys([[0,76],[1.2,45],[2.4,45],[3,45],[3.6,45]],4.4);
const crossA=keys([[0,12],[1.2,2],[2.4,-24],[3,-24],[3.6,0]],4.4);
const angles=t=>t<3.6?[62+14*Math.cos(2*Math.PI*ease(t/3.6)),12+14*Math.sin(2*Math.PI*ease(t/3.6))]:[crossF(t-3.6),crossA(t-3.6)];
const LR=t=>leg('right',angles(t)[0],2,[[[0,1,0],-angles(t)[1]]]);
const P=build(8,{...base.pose.base,feet:{...base.pose.base.feet,right:{mode:'free',frame:'hips',ankle:t=>LR(t).ankle,
  rot:[[restToWorld(hips,[1,0,0]),t=>-angles(t)[0]+8],[restToWorld(hips,[0,1,0]),t=>-angles(t)[1]]],
  poleLow:t=>{const k=LR(t).knee;return r4([k[0]-.1,k[1]+.5,k[2]+.05]);}}}},
  {work:t=>t<3.6?.6+.4*Math.sin(Math.PI*t/3.6):.5+.5*Math.max(0,-angles(t)[1])/24});
const adapted={...base,pose:{base:P.base,deltas:P.deltas}};
export default native8(adapted, {
  "id": "n-leg-circles-r2",
  "segments": null,
  "peak": 6.3,
  "keyFrames": [
    1.8,
    4.8,
    6.3
  ],
  "pulseAt": null,
  "phases": [
    {
      "id": "one-smooth-complete-circle",
      "start": 0,
      "end": 3.6
    },
    {
      "id": "lower-to-cross",
      "start": 3.6,
      "end": 4.8
    },
    {
      "id": "cross-left",
      "start": 4.8,
      "end": 6
    },
    {
      "id": "cross-plateau",
      "start": 6,
      "end": 6.6
    },
    {
      "id": "uncross",
      "start": 6.6,
      "end": 7.2
    },
    {
      "id": "return-raised",
      "start": 7.2,
      "end": 8
    }
  ],
  "semantics": "Right leg only, one fully eased circle instead of two, plus complete cross-over and return. Circle3.6s is newly eased from zero endpoint angular velocity (not source0..3.6 cropping); cross-over moving durations1.2/1.2/0.6/0.8s retained and plateau1s shortened to0.6s. Default dose unchanged.",
  "method": "independently-authored-one-circle-and-cross-over",
  "tracks": P.tracks
});
