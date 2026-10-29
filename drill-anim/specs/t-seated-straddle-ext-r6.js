import source from './t-seated-straddle-ext-r5.js';
import calibration from './_t-seated-straddle-ext-r6-reach-data.mjs';
import {reachableThomas} from './_thomas-reachable-r1.mjs';
export default reachableThomas(source,calibration);
