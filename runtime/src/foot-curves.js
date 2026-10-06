const SIDES = ['left', 'right'];
const KINDS = ['step', 'point'];
const clone = value => structuredClone(value);

function vector(value, label, limit = Infinity) {
  if (!Array.isArray(value) || value.length !== 3 || Array.from(value).some(number =>
    typeof number !== 'number' || !Number.isFinite(number) || Math.abs(number) > limit)) {
    throw new TypeError(`${label} must contain three finite numbers${limit === Infinity ? '' : ` within ±${limit}`}.`);
  }
}

function validAnchor(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && KINDS.includes(value.kind)
    && typeof value.id === 'string' && Boolean(value.id.trim());
}

/** Extract a saved anchor's identity without retaining its pose or time. */
export function anchorIdentity(anchor) {
  if (!validAnchor(anchor)) throw new TypeError('A foot curve anchor needs kind step or point and a non-empty string id.');
  return { kind: anchor.kind, id: anchor.id };
}

export function anchorKey(anchor) {
  const { kind, id } = anchorIdentity(anchor);
  return JSON.stringify([kind, id]);
}

export function sameAnchor(first, second) {
  return Boolean(validAnchor(first) && validAnchor(second) && first.kind === second.kind && first.id === second.id);
}

/** Curves are directional: a wrap from B to A is distinct from A to B. */
export function footCurveMatches(curve, span, side = curve?.side) {
  return Boolean(SIDES.includes(side) && curve?.side === side && sameAnchor(curve.from, span?.from) && sameAnchor(curve.to, span?.to));
}

/** Validate the entire document before copying it. Missing/inactive references
 * remain valid data; only the current adjacent anchor pair can activate them.
 */
export function validateFootCurves(curves) {
  if (!Array.isArray(curves) || curves.length > 200) throw new TypeError('Foot curves must be an array with at most 200 entries.');
  const ids = new Set(), pairs = new Set();
  for (const [index, curve] of curves.entries()) {
    const label = `Foot curve ${index + 1}`;
    if (!curve || typeof curve !== 'object' || Array.isArray(curve)) throw new TypeError(`${label} must be an object.`);
    if (typeof curve.id !== 'string' || !curve.id.trim()) throw new TypeError(`${label} needs a non-empty string id.`);
    if (ids.has(curve.id)) throw new TypeError(`${label} repeats a curve id.`);
    ids.add(curve.id);
    if (!SIDES.includes(curve.side)) throw new TypeError(`${label} side must be left or right.`);
    const from = anchorIdentity(curve.from), to = anchorIdentity(curve.to);
    if (sameAnchor(from, to)) throw new TypeError(`${label} must connect two different anchors.`);
    const pair = JSON.stringify([curve.side, from.kind, from.id, to.kind, to.id]);
    if (pairs.has(pair)) throw new TypeError(`${label} repeats a side and directed anchor pair.`);
    pairs.add(pair);
    vector(curve.bend, `${label} bend`, 10000);
  }
  return clone(curves);
}

/** bend is the actual midpoint's displacement from the endpoint average. */
export function evaluateFootCurve(start, end, bend, blend) {
  vector(start, 'Foot curve start');vector(end, 'Foot curve end');vector(bend, 'Foot curve bend', 10000);
  if (typeof blend !== 'number' || !Number.isFinite(blend) || blend < 0 || blend > 1) {
    throw new TypeError('Foot curve blend must be finite and between 0 and 1.');
  }
  if (blend === 0) return clone(start);
  if (blend === 1) return clone(end);
  const curveWeight = 4 * blend * (1 - blend);
  return start.map((value, index) => value * (1 - blend) + end[index] * blend + curveWeight * bend[index]);
}
