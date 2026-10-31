// h-band-shoulder-ir r2 (2026-10-31): frozen-fist D-handle (recipe fixedDHandle) and standing legs. On the v2/v3 body the source
// pelvis [0, 0.887, 0.025] left both knees bent to ~133 deg (a half-squat the cue never asks for). As in h-band-pallof the legs now
// carry reach 172 deg constraints and the solver frees pelvis height, so the athlete stands tall with soft knees (hand height
// 1.04 -> 1.11 m, now level with the 1.13 m band tie). The D-handle drops the dorsal bias (lean 1 -> 0, as in chest-C/chest-fly r2)
// so the loop points at the lateral post and the band leaves the outer side of the fist instead of crossing the forearm.
import source from './h-band-shoulder-ir.js';
const base = { ...source.pose.base,
  constraints: [{ type: 'reach', limb: 'leftLeg', angle: 172, weight: 1 }, { type: 'reach', limb: 'rightLeg', angle: 172, weight: 1 }],
  solve: { vars: ['py'], reg: { py: 0.2 } } };
const props = source.props.map(p => p.type === 'dHandle' ? { ...p, lean: 0 } : p);
export default { ...source, props, id: 'h-band-shoulder-ir-r2', revisionOf: source.id, pose: { ...source.pose, base } };
