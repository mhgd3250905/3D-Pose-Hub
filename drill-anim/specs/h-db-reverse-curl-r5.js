// First user-review template. r4 motion is retained; effort cue is phase-authored.
import source from './h-db-reverse-curl-r4.js';
export default {
  ...source,id:'h-db-reverse-curl-r5',revisionOf:'h-db-reverse-curl-r4',
  timeline:{...source.timeline,tracks:{...source.timeline.tracks,
    effort:[[0,.28],[.3,.28],[.8,.82],[1.6,1],[2,1],[2.3,.68],[3.6,.35],
      [4.3,.28],[4.8,.82],[5.6,1],[6,1],[6.3,.68],[7.6,.35]]}},
  highlight:{...source.highlight,pulseTrack:'effort',pulseBase:0},
  reviewed:false,releaseEligible:false,
};
