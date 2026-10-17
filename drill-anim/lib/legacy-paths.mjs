// Pose-Hub migration (2026-10-17): repository paths moved out of 3D-Body.
// Frozen batch records (plan.json, source-sha256.json, ...) keep the 3D-Body layout;
// these helpers translate between the two so old records can still be checked.
// File contents and SHA-256 values are unchanged by the move.
export const PATH_MAP = [
  ['tools/drill-anim/', 'drill-anim/'],
  ['src/', 'runtime/src/'],
  ['public/', 'runtime/public/'],
  ['app/assets/licenses/Drill-media-ATTRIBUTION.md', 'licenses/Drill-media-ATTRIBUTION.md'],
];
const swap = (value, from, to) => {
  if (typeof value !== 'string') return value;
  for (const pair of PATH_MAP) {
    const a = pair[from], b = pair[to];
    if (a.endsWith('/') ? value.startsWith(a) : value === a) return b + value.slice(a.length);
  }
  return value;
};
/** 3D-Body repository-relative path -> Pose-Hub path (unknown paths are returned unchanged). */
export const toCurrentRepoPath = value => swap(value, 0, 1);
/** Pose-Hub repository-relative path -> original 3D-Body path. */
export const toLegacyRepoPath = value => swap(value, 1, 0);
/** Deep copy of a model manifest with every repository path written in the 3D-Body layout. */
export function legacyModel(model) {
  if (Array.isArray(model)) return model.map(legacyModel);
  if (model && typeof model === 'object') return Object.fromEntries(Object.entries(model).map(([k, v]) => [toLegacyRepoPath(k), legacyModel(v)]));
  return toLegacyRepoPath(model);
}
