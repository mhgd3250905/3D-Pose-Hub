import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/h-band-face-pull-rr1-kn1.js';
import {fixSide,rollHand} from 'file:///workspace/work/elbow-fix/sh/xf.mjs';
const s=structuredClone(b);
rollHand(s,'left',-90);rollHand(s,'right',90);fixSide(s,'left',0,0,0);fixSide(s,'right',0,0,0);
export default s;
