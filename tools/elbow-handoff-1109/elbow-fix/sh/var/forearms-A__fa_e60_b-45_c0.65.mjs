import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/forearms-A-r2-gc1-ht2.js';
import {fixSide,rollHand} from 'file:///workspace/work/elbow-fix/sh/xf.mjs';
const s=structuredClone(b);
fixSide(s,'left',-60,-45,0.65);fixSide(s,'right',60,45,0.65);
export default s;
