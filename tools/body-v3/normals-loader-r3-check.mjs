// Node-side setup lifecycle test; no browser or visual acceptance implied.
import { applyV3, activatePieceNormals, verify } from '../../drill-anim/models/training-human-v3-normals-r3/loader.mjs';
const manifest = verify();
if (manifest.reviewed !== false || manifest.releaseEligible !== false) throw new Error('unexpected release status');
function fake() {
  let installs = 0, selections = 0, evaluations = 0;
  const model = { torso: { on: false }, limbs: { on: false }, hands: { on: false } };
  const engine = { selectModelProfile() { selections++; model.torso.on = model.limbs.on = model.hands.on = true; } };
  globalThis.window = { __drill: engine, __v2p: model,
    __installBodyV3WristGradientR2() { return { mesh: 'V2P_Base_Hands', transitionMm: 25 }; },
    __fixBodyV3PieceNormalsR1(seams) {
      if (!seams.torso.vid.length || !seams.limbs.vid.length || !seams.hands.vid.length) throw new Error('missing seam metadata');
      installs++; model.__pieceNormalsR1 = { installed: true }; return { joined: 1 };
    } };
  const page = { async addScriptTag() {}, async evaluate(fn, arg) {
    evaluations++;
    const source = fn.toString();
    if (source.includes('__bodyV3PieceSeamsR1') || source.includes('__installBodyV3WristGradientR2')) return fn(arg);
  } };
  return { page, engine, get installs() { return installs; }, get selections() { return selections; }, get evaluations() { return evaluations; } };
}
const full = { v2plus: { torso: 'base', limbs: 'base', hands: 'base' } };
try {
  const a = fake(), result = await applyV3(a.page, full);
  if (result.version !== '0.1.0-r3' || result.wrist?.transitionMm !== 25 || result.pieceNormals.joined !== 1 || a.installs !== 1) throw new Error('full setup failed');
  const previous = a.installs; a.engine.selectModelProfile(full);
  if (a.installs !== previous) throw new Error('later profile selection unexpectedly reset/recomputed');
  const b = fake(), pending = await applyV3(b.page, {});
  if (pending.pieceNormals !== 'requires-explicit-activation' || b.selections || b.installs) throw new Error('partial profile was activated implicitly');
  const count = b.evaluations; let rejected = false;
  try { await activatePieceNormals(b.page, {}); } catch (error) { rejected = /require torso/.test(error.message); }
  if (!rejected || b.evaluations !== count) throw new Error('partial explicit activation was not rejected before page mutation');
  await activatePieceNormals(b.page, full);
  await activatePieceNormals(b.page, full);
  if (b.installs !== 1 || b.selections !== 1) throw new Error('explicit activation is not idempotent');
  console.log('normals-r3 manifest, wrist composition, setup-only activation and idempotency passed');
} finally { delete globalThis.window; }
