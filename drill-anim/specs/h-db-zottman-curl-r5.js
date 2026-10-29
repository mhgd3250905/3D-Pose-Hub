// Fix the render-time half-twist branch discontinuity for this explicit grip action.
// Full axial sharing makes +/-pi equivalent at the forearm, preserving the hand's
// world orientation without the 180-degree jump caused by half-sharing that branch.
// This is a per-action setting, not a change to the frozen model or global runtime.
import source from './h-db-zottman-curl-r4.js';
export default {
  ...source,id:'h-db-zottman-curl-r5',revisionOf:'h-db-zottman-curl-r4',
  nativeHands:{twistShare:1},
  timeline:{...source.timeline,tracks:{...source.timeline.tracks,
    effort:[[0,.28],[.5,.28],[1,.82],[2.3,1],[3.5,.9],[4,.68],[6,.45],[7.5,.28]]}},
  highlight:{...source.highlight,pulseTrack:'effort',pulseBase:0},
  reviewed:false,releaseEligible:false,
};
