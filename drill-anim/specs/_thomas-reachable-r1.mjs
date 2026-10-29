// Apply an explicitly calibrated, independently audited root path to a frozen template.
// This changes requested geometry; renderer safety checks and warnings remain intact.
const set = (o, key, value) => {
  const parts=key.split('.').map(x=>/^\d+$/.test(x)?+x:x);let q=o;
  parts.forEach((k,i)=>{if(i===parts.length-1)q[k]=value;else q=q[k]??=(typeof parts[i+1]==='number'?[]:{});});
};
const fill = o => {
  if(Array.isArray(o))return Array.from({length:o.length},(_,i)=>o[i]===undefined?{}:fill(o[i]));
  if(o&&typeof o==='object')return Object.fromEntries(Object.entries(o).map(([k,v])=>[k,fill(v)]));
  return o;
};
export function reachableThomas(source,calibration) {
  if(source.id!==calibration.sourceId)throw Error('Thomas calibration/source identity mismatch');
  const spec=structuredClone(source);
  spec.id=calibration.id; spec.revisionOf=source.id; spec.solveShoulders=true;
  // Ankle and pole positions in these frozen templates are absolute bind-frame points.
  // Translate their shared old hip origin to the live armfix hip origin; preserve directions.
  for(const pose of [spec.pose.base,...Object.values(spec.pose.deltas)])for(const side of ['left','right']){
    const feet=pose.feet?.[side];if(!feet)continue;
    for(const key of ['ankle','poleLow'])if(Array.isArray(feet[key]))
      feet[key]=feet[key].map((v,i)=>typeof v==='number'?v+calibration.hipOriginDelta[side][i]:v);
  }
  for(const [key,values] of Object.entries(calibration.absoluteTracks)){
    const d={};set(spec.pose.base,key,values[0][1]);set(d,key,values[0][1]+1);
    spec.pose.deltas[key]=fill(d);
    spec.timeline.tracks[key]=values.map(([t,v])=>[t,v-values[0][1],'linear']);
  }
  // No warm-start root search remains: calibrated poses carry their own reachable root.
  spec.pose.base.solve={vars:[],reg:{},iters:1};
  spec.templateAdaptation={...spec.templateAdaptation,source:source.id,
    reachability:{method:'Calibrated live hip origins and baked deterministic support roots',
      calibration:calibration.calibrationIdentity,armMarginMetres:calibration.armMarginMetres,
      sourceChecks:calibration.summary,safetyClampsUnchanged:true},
    status:'cpu-reachable-awaiting-gpu-review',reviewed:false,releaseEligible:false};
  return spec;
}
