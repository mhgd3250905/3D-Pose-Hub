// Verify both existing candidate manifests and the locked wrist dependency.
// No assets are changed and no release eligibility is implied.
import {verify as base} from '../../drill-anim/models/training-human-v3-normals-r1/loader.mjs';
import {verify as combined} from '../../drill-anim/models/training-human-v3-normals-r3/loader.mjs';
import {verify as wrist} from '../../drill-anim/models/training-human-v3-wrist-r1/loader.mjs';
const a=base(),b=combined(),c=wrist();
if(a.version!=='0.1.0-r1'||b.version!=='0.1.0-r3'||c.version!=='0.1.0-r1')throw Error('unexpected candidate versions');
if(a.reviewed!==false||a.releaseEligible!==false||b.reviewed!==false||b.releaseEligible!==false||c.reviewed!==false||c.releaseEligible!==false)throw Error('candidate status changed');
console.log(JSON.stringify({base:a.version,combined:b.version,wrist:c.version,manifestHashesVerified:true,releaseEligible:false}));
