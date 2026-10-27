// R8 control: exactly the R7 geometry and weights, with original GLB normals.
import {applyAnkleR7Shape} from '../body-v3-ankle-r7/ankle-r7-shape.mjs';

export async function applyAnkleR8(page) {
  const geometry = await applyAnkleR7Shape(page);
  return {geometry, normals: 'original'};
}
