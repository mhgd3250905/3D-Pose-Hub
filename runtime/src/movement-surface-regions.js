// Envelopes locate regions on this character's own surface. They are not
// segmented anatomy, muscle boundaries, force values or measured activation.
// Metres; feet y=0, up +Y, front +Z, anatomical left +X.
const REGIONS = {
  deltoids: { centre: [.208, 1.345, .010], radius: [.078, .102, .097], tilt: .30 },
  'rotator-cuff': { centre: [.181, 1.346, -.025], radius: [.093, .105, .116], deep: true },
  triceps: { centre: [.276, 1.208, -.029], radius: [.058, .152, .068], tilt: .35, facing: 'back' },
  serratus: { centre: [.142, 1.179, .028], radius: [.068, .137, .096], facing: 'front' },
  scapular: { centre: [.087, 1.288, -.066], radius: [.111, .178, .078], facing: 'back' },
  obliques: { centre: [.097, 1.035, .034], radius: [.071, .177, .104], facing: 'front' },
  erectors: { centre: [.043, 1.105, -.071], radius: [.046, .230, .069], facing: 'back' },
  'hip-flexors': { centre: [.093, .872, .065], radius: [.088, .139, .117], facing: 'front', deep: true },
  quadriceps: { centre: [.116, .638, .043], radius: [.094, .234, .110], facing: 'front' },
  glutes: { centre: [.095, .883, -.068], radius: [.107, .145, .109], facing: 'back' },
  'hip-rotators': { centre: [.133, .866, -.033], radius: [.093, .120, .110], deep: true },
  adductors: { centre: [.055, .661, .003], radius: [.074, .217, .105], inner: true },
  hamstrings: { centre: [.124, .642, -.044], radius: [.094, .234, .116], facing: 'back' },
};
const smooth = (a, b, value) => { const t = Math.max(0, Math.min(1, (value - a) / (b - a)));return t * t * (3 - 2 * t); };
export function surfaceRegionsFor(groupId, sides, height = 1.69) {
  const definition = REGIONS[groupId];if (!definition) return [];
  const scale = height / 1.69;
  return [...new Set(sides)].filter(side => side === 'left' || side === 'right').map(side => ({ ...definition, side,
    sign: side === 'left' ? 1 : -1, centre: definition.centre.map(value => value * scale), radius: definition.radius.map(value => value * scale) }));
}
export function surfaceRegionWeight(region, point, nx, ny, nz) {
  if (point.x * region.sign < 0) return 0;
  const dx = point.x * region.sign - region.centre[0], dy = point.y - region.centre[1], dz = point.z - region.centre[2];
  const angle = region.tilt ?? 0, c = Math.cos(angle), s = Math.sin(angle);
  const x = (dx * c + dy * s) / region.radius[0], y = (dy * c - dx * s) / region.radius[1], z = dz / region.radius[2];
  let weight = 1 - smooth(.25, 1, x * x + y * y + z * z);
  if (region.facing === 'front') weight *= smooth(-.20, .45, nz);
  if (region.facing === 'back') weight *= smooth(-.20, .45, -nz);
  if (region.inner) weight *= 1 - smooth(.25, .80, nx * region.sign);
  return weight;
}
export const isDeepSurfaceGroup = groupId => Boolean(REGIONS[groupId]?.deep);
