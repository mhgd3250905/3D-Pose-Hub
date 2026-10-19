// Dump skinning matrices (tee skeleton, world space A_k = matrixWorld * bindInv * boneMatrix_k * bind) at rest and at given
// drill frames, plus CPU-skinned Coach_Body / kept-tee positions, so torso weights can be checked offline (tools/human-v2plus/torso).
//   tools/human-v2plus/run.sh tools/human-v2plus/probe-pose.mjs <out.json>
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { boot } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/boot.mjs')).href);
const { loadTheme } = await import(pathToFileURL(path.join(REPO, 'drill-anim/lib/config.mjs')).href);
const OUT = path.resolve(process.argv[2]); const theme = loadTheme(null);
const R = f => JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models', f), 'utf8'));
const { b, p } = await boot({ size: 300, pr: 1, theme, bakeHands: [] });
await p.addScriptTag({ content: fs.readFileSync(path.join(REPO, 'drill-anim/page/human-v2plus.js'), 'utf8') });
await p.evaluate(([m, o]) => __v2p.load(m, o), [R('training-human-v2plus-hands.json'), R('training-human-v2plus-outfit.json')]);
const FR = [['rest', null, 0], ['triceps-A', 'triceps-A', 2.1], ['scapular-B', 'scapular-B', 0.4], ['scapular-B-1.9', 'scapular-B', 1.9], ['h-squat', 'h-squat', 1.2]];
const out = {};
for (const [tag, id, t] of FR) {
  const spec = id ? (await import(pathToFileURL(path.join(REPO, 'drill-anim/specs', id + '.js')).href)).default : null;
  out[tag] = await p.evaluate(([spec, t]) => { const v = flareInspector.viewer, T = window.__toonT;
    if (spec) { const s = Object.assign({}, spec, { modelProfile: 'training-human-v2plus', v2plus: Object.assign({}, spec.v2plus || {}, { outfit: 'compression' }) }); __drill.selectModelProfile(s); __drill.applyAt(s, t, null); }
    else { v.motion.reset(); }
    v.coach.updateMatrixWorld(true); v.coach.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
    const tee = v.coach.getObjectByName('Mesh005'), A = []; const M = new T.Matrix4(), B = new T.Matrix4();
    tee.skeleton.bones.forEach((bn, k) => { B.fromArray(tee.skeleton.boneMatrices, k * 16); M.copy(tee.matrixWorld).multiply(tee.bindMatrixInverse).multiply(B).multiply(tee.bindMatrix); A.push(Array.from(M.elements)); });
    const body = v.coach.getObjectByName('Coach_Body'), q = new T.Vector3(), P = [];
    for (let i = 0; i < body.geometry.attributes.position.count; i++) { body.getVertexPosition(i, q); q.applyMatrix4(body.matrixWorld); P.push(+q.x.toFixed(5), +q.y.toFixed(5), +q.z.toFixed(5)); }
    return { bones: tee.skeleton.bones.map(b => b.name), A, body: P }; }, [spec, t]);
  console.log('ok', tag);
}
fs.writeFileSync(OUT, JSON.stringify(out)); await b.close();
