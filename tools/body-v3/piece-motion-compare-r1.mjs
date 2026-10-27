// Compare current v2plus motion views with and without the combined piece
// normal candidate. Before and after both use the same base-GLB normals and
// wrist candidate; only the after mode installs piece normals.
// Usage: node piece-motion-compare-r1.mjs before|after NEW_OUTPUT_DIRECTORY
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../..'), drill = path.join(repo, 'drill-anim');
const [mode, outArg] = process.argv.slice(2);
if (!['before', 'after'].includes(mode) || !outArg || fs.existsSync(outArg)) throw new Error('expected before|after and a new output directory');
const out = path.resolve(outArg); fs.mkdirSync(out);
const imp = file => import(pathToFileURL(path.join(drill, file)).href);
const { loadTheme } = await imp('lib/config.mjs');
const loader = await imp(mode === 'before' ? 'models/training-human-v3-wrist-r1/loader.mjs' : 'models/training-human-v3-normals-r3/loader.mjs');
const { boot } = mode === 'before' ? await imp('models/training-human-v3-normals-r1/loader.mjs') : loader;
const VP = { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' };
async function spec(file, handPose) {
  const data = structuredClone((await imp('specs/' + file)).default);
  return { ...data, modelProfile: 'training-human-v2plus-hands-native', nativeHands: { version: '1.0.0-r3' },
    v2plus: { ...VP, ...data.v2plus, ...(handPose ? { handPose } : {}) } };
}
const open = { left: 'palm-floor', right: 'palm-floor' };
const cases = [
  { name: 'squat', spec: await spec('a-deep-squat-r3.js'), frame: 0, bones: ['leftUpperArm', 'leftForearm'] },
  { name: 'plank', spec: await spec('h-bear-plank.js', open), frame: 0, bones: ['leftUpperArm', 'leftForearm'] },
  { name: 'fold', spec: await spec('a-seated-fold.js'), frame: 0, bones: ['leftUpperArm', 'leftForearm'] },
  { name: 'grip', spec: await spec('chest-B.js'), frame: 0, bones: ['leftHand'] },
];
const readModel = file => JSON.parse(fs.readFileSync(path.join(drill, 'models', file), 'utf8'));
const seams = { torso: readModel('training-human-v2plus-torso-base.json').seam,
  limbs: readModel('training-human-v2plus-limbs-base.json').seam, hands: readModel('hands-native-c1r2/hands-base.json').seam };
const { b, p, info } = await boot({ size: 640, pr: 1, theme: loadTheme() });
const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const save = (name, data) => fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(data.split(',')[1], 'base64'), { flag: 'wx' });
const shots = `window.__pieceCompareShot=(bone)=>{const T=__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);const c=v.coach.getObjectByName(bone).getWorldPosition(new T.Vector3());const cam=new T.OrthographicCamera(-0.13,0.13,0.13,-0.13,0.01,20);cam.position.set(c.x+0.55,c.y+0.1,c.z+0.75);cam.lookAt(c);cam.updateProjectionMatrix();v.renderer.setClearColor(0x101318,1);v.renderer.render(v.scene,cam);return v.renderer.domElement.toDataURL('image/png');};`;
try {
  const setup = await loader.applyV3(p, cases[0].spec, { handScale: 1.18 });
  await p.evaluate(s => __drill.selectModelProfile(s), cases[0].spec);
  await p.addScriptTag({ content: fs.readFileSync(path.join(drill, 'tools/v2/browser-layers.js'), 'utf8') });
  await p.addScriptTag({ content: fs.readFileSync(path.join(here, 'piece-motion-snapshot-r1.js'), 'utf8') });
  await p.addScriptTag({ content: shots });
  const results = [];
  for (const item of cases) {
    await p.evaluate(([s, size]) => { __setHighlight(s.highlight); __drill.setupCamera(s, size); }, [item.spec, 640]);
    const capture = await p.evaluate(([s, frame]) => __v2Layers.capture(s, frame / 15, frame, null, ['body']), [item.spec, item.frame]);
    save(item.name + '-body', capture.body);
    const measurement = await p.evaluate(data => __measurePieceSeamsMotionR1(data), seams);
    for (const bone of item.bones) save(item.name + '-' + bone, await p.evaluate(name => __pieceCompareShot(name), bone));
    results.push({ name: item.name, frame: item.frame, seam: measurement });
    console.log(mode, item.name, JSON.stringify(measurement));
  }
  if (errors.length) throw new Error('page errors: ' + errors.join('; '));
  fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify({ mode, setup, baseNormals: info.armNormals, cases: results, pageErrors: errors }, null, 2), { flag: 'wx' });
} finally { await b.close(); }
