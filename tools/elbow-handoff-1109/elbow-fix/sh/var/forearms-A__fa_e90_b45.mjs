import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/forearms-A-r2-gc1-ht2.js';
import {fixSide,rollHand} from 'file:///workspace/work/elbow-fix/sh/xf.mjs';
const s=structuredClone(b);
fixSide(s,'left',-90,45,0);fixSide(s,'right',90,-45,0);
export default s;
