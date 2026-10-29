import source from './t-tuck-planche-r5.js';
import calibration from './_t-tuck-planche-r6-reach-data.mjs';
import {reachableThomas} from './_thomas-reachable-r1.mjs';
export default reachableThomas(source,calibration);
