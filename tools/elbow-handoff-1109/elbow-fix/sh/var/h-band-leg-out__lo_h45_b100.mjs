import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/h-band-leg-out-et1-fa1.js';
import {fixSide,rollHand} from 'file:///workspace/work/elbow-fix/sh/xf.mjs';
const s=structuredClone(b);
rollHand(s,'right',45);fixSide(s,'right',0,100,0);
export default s;
