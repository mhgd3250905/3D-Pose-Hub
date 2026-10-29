import source from './t-straddle-hold-r4.js';
import calibration from './_t-straddle-hold-r5-reach-data.mjs';
import {reachableThomas} from './_thomas-reachable-r1.mjs';
export default reachableThomas(source,calibration);
