// Explicit handled-band variant; fixed 32 mm grip and original motion are retained.
import source from './h-band-biceps-curl-r5.js';
const spec=structuredClone(source);
spec.id='h-band-biceps-curl-r6';spec.revisionOf=source.id;
spec.name='站姿踩带弹力带弯举（带握柄）';spec.nameEn='Standing Handled Resistance-Band Curl';
for(const prop of spec.props){
  const sign=prop.from.bone==='leftHand'?1:-1;
  prop.from.offset=[sign*.07612368052316226,.0575082223763424,0];
}
spec.fixedBandHandles={profile:'fixed-band-handles-r1',version:'0.1.0-r1',required:true,
  handleDiameterMm:32,bandDiameterMm:16,sourceGripUnchanged:true,
  installer:'tools/action-completion-v3-r2/fixed-band-handles-r1.mjs',
  status:'candidate-awaiting-actual-render-and-user-review'};
spec.actionCorrective={id:'fixed-band-handles-r1',version:'0.1.0-r1',required:true};
export default spec;
