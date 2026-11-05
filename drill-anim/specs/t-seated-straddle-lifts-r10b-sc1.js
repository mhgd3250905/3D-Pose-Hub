import source from './t-seated-straddle-lifts-r10b.js';
import calibration from './_t-seated-straddle-lifts-r10b-sc1-reach-data.mjs';
import {reachableThomas} from './_thomas-reachable-r1.mjs';
export default reachableThomas(source,calibration);
