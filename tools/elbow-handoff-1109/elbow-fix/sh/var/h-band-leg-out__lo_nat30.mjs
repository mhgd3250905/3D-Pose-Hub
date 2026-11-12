import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/h-band-leg-out-et1-fa1.js';
import fs from 'node:fs';
import {fixSide,setHandNatural} from 'file:///workspace/work/elbow-fix/sh/xf.mjs';
const s=structuredClone(b);
setHandNatural(s,'right',JSON.parse(fs.readFileSync('/workspace/work/elbow-fix/sh/var/legout-J.json','utf8')),30);fixSide(s,'right',0,100,0);
export default s;
