// hip-abductors-C r3 (2026-10-31): the knee pads floated ~8 cm outside both knees on the v3 armfix body (the props mesh scan
// over-measures the knee width), so the pads never pressed the knees. r3 places each pad from the hip-knee line (padFollow 'knee', immune to thigh twist) at a pinned knee half-width (padOut), so each pad sits on
// the outside of its knee all cycle. Everything else is r2 (camera drift 0 via the recipe).
import base from './hip-abductors-C-r2.js';
export default { ...base, id: 'hip-abductors-C-r3', revisionOf: 'hip-abductors-C', camera: { ...base.camera, drift: 0 },
  props: base.props.map(p => p.type === 'hipAbductor' ? { ...p, padOut: 0.06, padFollow: 'knee' } : p) };
