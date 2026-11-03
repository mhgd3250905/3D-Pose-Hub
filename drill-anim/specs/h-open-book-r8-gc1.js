// h-open-book-r8-gc1: ground-contact fix r1·M2 (2026-11-04) of h-open-book-r8.js. 只改头枕道具：
// 头枕近端原在 x=0.12，切进颈/肩与上臂（躯干 −198 mm、头 −47.8 mm）。按整循环蒙皮顶点剖面，x≥0.20 处头部最低 222 mm、
// 0.18–0.20 仍有肩/上臂，故头枕整体沿 +X 移 82 mm（近端 0.202），并降 2.9 mm（顶 219.1 mm，高度同步减）：复测静止段头陷枕 ≤2.3 mm、
// 开肩保持段（头转向手）头离枕 ≤4.9 mm（只移时为 0.6–1.5 / 7.8 mm）。身体不动。
import base from './h-open-book-r8.js';
export default { ...base, id: 'h-open-book-r8-gc1',
  props: base.props.map(p => p.required && p.at[1] === 0.222 ? { ...p, at: [0.352, 0.2191, 0.0], size: [p.size[0], p.size[1], 0.2191] } : p) };
