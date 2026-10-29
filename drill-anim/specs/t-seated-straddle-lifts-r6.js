import source from './t-seated-straddle-lifts-r4.js';
import calibration from './_t-seated-straddle-lifts-r6-reach-data.mjs';
import {reachableThomas} from './_thomas-reachable-r1.mjs';
export default reachableThomas(source,calibration);
