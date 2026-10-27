// Compare the verified v3 runtime head/neck with a GLB-restored copy using the
// same live toon uniforms, real action captures, and per-vertex source IDs.
// Start the configured Vite server first. Writes only to a new output directory.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
if (process.argv.length !== 4) throw new Error('Usage: node verify-toon-actions-r1.mjs <sample.glb> <new-output-directory>');
const glb = path.resolve(process.argv[2]), output = path.resolve(process.argv[3]);
if (!fs.existsSync(glb) || fs.existsSync(output)) throw new Error('Input missing or output exists');
fs.mkdirSync(output);
const imp = f => import(pathToFileURL(path.join(repo, f)).href);
const { loadTheme } = await imp('drill-anim/lib/config.mjs');
const v3 = await imp('drill-anim/models/training-human-v3/loader.mjs');
const weld = await imp('drill-anim/models/head-neck-weld-r2/loader.mjs');
const specFor = async file => {
  const { default: source } = await imp(`drill-anim/specs/${file}`);
  return { ...structuredClone(source), modelProfile: 'training-human-v2plus-hands-native',
    nativeHands: { version: '1.0.0-r3' }, v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic', ...(source.v2plus || {}) } };
};
const squat = await specFor('a-deep-squat-r3.js'), bear = await specFor('h-bear-plank.js');
const { b, p } = await v3.boot({ size: 480, pr: 1, theme: loadTheme() });
try {
  await v3.applyV3(p, squat, {});
  await p.evaluate(s => { __drill.selectModelProfile(s); flareInspector.viewer.motion.reset(); }, squat);
  const referenceInfo = await weld.apply(p);
  const url = file => '/@fs/' + path.join(repo, file).replaceAll('\\', '/');
  const toonAsset = JSON.parse(fs.readFileSync(path.join(repo, 'drill-anim/models/head-neck-toon-r4/asset.json'), 'utf8'));
  const init = await p.evaluate(async ([base64, entryUrl, toonAsset]) => {
    const v = flareInspector.viewer, T = window.__toonT;
    const { attachHeadNeckFragment } = await import(entryUrl);
    const raw = atob(base64), data = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) data[i] = raw.charCodeAt(i);
    const reference = v.coach.getObjectByName('V3_Head_Neck_Topological_R1');
    const skeleton = v.coach.getObjectByName('Coach_Body').skeleton;
    const snapshot = () => skeleton.bones.map(b => ({ name: b.name, parent: b.parent?.name, matrix: b.matrix.toArray(), world: b.matrixWorld.toArray() }));
    v.coach.updateMatrixWorld(true); const before = JSON.stringify(snapshot());
    const fragment = await attachHeadNeckFragment({ binary: data.buffer, parent: reference.parent, skeleton, toonAsset,
      uniforms: { toon: window.__toonUni, muscle: window.__mmUni, v2p: window.__v2p.uni } });
    const sameBoneObjects = fragment.mesh.skeleton.bones.every(b => skeleton.bones.includes(b));
    v.coach.updateMatrixWorld(true); const bonesUnchanged = before === JSON.stringify(snapshot());
    fragment.mesh.visible = false;
    const uniformChecks = fragment.mesh.material.map((material, i) => {
      const make = () => ({ uniforms: T.UniformsUtils.clone(T.ShaderLib.toon.uniforms), vertexShader: T.ShaderLib.toon.vertexShader, fragmentShader: T.ShaderLib.toon.fragmentShader });
      const a = make(), b = make(); reference.material[i].onBeforeCompile(a, v.renderer); material.onBeforeCompile(b, v.renderer);
      const names = Object.keys(toonAsset.materials[i].dynamic), failed = names.filter(name =>
        !a.uniforms[name] || !b.uniforms[name] || a.uniforms[name] !== b.uniforms[name]);
      return { checked: names.length, failed };
    });
    window.__p2ActionProbe = { fragment, restored: fragment.mesh, reference };
    if (!sameBoneObjects || !bonesUnchanged) throw new Error('Target v3 skeleton changed or bone identity differs');
    return { bones: fragment.bones, seamEdges: fragment.seamEdges, sameBoneObjects, bonesUnchanged,
      vertices: fragment.mesh.geometry.attributes.position.count, materials: fragment.materials, uniformChecks };
  }, [fs.readFileSync(glb).toString('base64'), url('drill-anim/models/head-neck-fragment-r3/loader.mjs'), toonAsset]);
  const cases = [
    ['squat-low', squat, 15, squat.highlight],
    ['squat-neck-highlight', squat, 15, { groups: ['neck'], side: 'both' }],
    ['squat-traps-highlight', squat, 15, { groups: ['traps-upper'], side: 'both' }],
    ['squat-skin-theme', squat, 15, squat.highlight, 'theme'],
    ['squat-half', squat, 75, squat.highlight],
    ['bear-hold', bear, 24, bear.highlight],
  ];
  const report = { referenceInfo, init, cases: [], limitations: 'Independent toon asset requires injected v3 theme/muscle/v2plus uniform groups; fragment directly uses the existing v3 skeleton; host provides the action solver and live uniform groups.' };
  for (const [name, spec, frame, highlight, variant] of cases) {
    await p.evaluate(async ([s, frame, highlight]) => {
      __drill.selectModelProfile(s); __setHighlight(highlight); __drill.setupCamera(s, 480);
      __drill.applyAt(s, frame / 15, null);
      const duration = s.timeline.duration;
      __toonUni.uBreath.value = (s.breath ?? .0018) * Math.sin(2 * Math.PI * (frame / 15) / (duration / 2));
      __toonUni.uPulse.value = __drill.pulseAt(highlight, s.timeline, frame / 15);
      __setHighlight(highlight);
      const state = window.__p2ActionProbe, v = flareInspector.viewer, T = window.__toonT;
      v.coach.updateMatrixWorld(true);
      state.restored.skeleton.update(); state.reference.skeleton.update();
    }, [spec, frame, highlight]);
    if (variant === 'theme') await p.evaluate(() => {
      const u = window.__toonUni; window.__p2ThemeBackup = [u.uBase.value[0].clone(), u.uShadeC.value[0].clone()];
      u.uBase.value[0].set('#36b678'); u.uShadeC.value[0].set('#167342');
    });
    const result = await p.evaluate(() => {
      const v = flareInspector.viewer, T = window.__toonT, state = window.__p2ActionProbe;
      state.reference.updateMatrixWorld(true); state.restored.updateMatrixWorld(true);
      const marker = state.restored.geometry.attributes._phvertexid, src = state.reference.geometry.attributes.position;
      const a = new T.Vector3(), b = new T.Vector3(), distances = [];
      for (let i = 0; i < marker.count; i++) {
        const id = marker.getX(i); if (!Number.isInteger(id) || id < 0 || id >= src.count) throw new Error('Invalid source ID');
        state.reference.getVertexPosition(id, a); a.applyMatrix4(state.reference.matrixWorld);
        state.restored.getVertexPosition(i, b); b.applyMatrix4(state.restored.matrixWorld); distances.push(a.distanceTo(b) * 1000);
      }
      distances.sort((a, b) => a - b);
      const center = v.coach.getObjectByName('head').getWorldPosition(new T.Vector3()), pictures = {};
      for (const [side, direction] of [['side', [1, 0, 0]], ['back', [0, 0, -1]]]) {
        const camera = new T.PerspectiveCamera(35, 1, .02, 20);
        camera.position.copy(center).add(new T.Vector3(...direction).multiplyScalar(.8)); camera.lookAt(center);
        for (const [kind, visible] of [['reference', true], ['restored', false]]) {
          state.reference.visible = visible; state.restored.visible = !visible;
          const savedReferenceMaterial = state.reference.material;
          if (!visible) state.reference.material = null; // target must not depend on reference materials
          v.renderer.setClearColor(0x101318, 1); v.renderer.render(v.scene, camera);
          pictures[`${kind}-${side}`] = v.renderer.domElement.toDataURL('image/png');
          state.reference.material = savedReferenceMaterial;
        }
      }
      state.reference.visible = true; state.restored.visible = false;
      return { vertices: distances.length, p95Mm: distances[Math.floor(distances.length * .95)], maxMm: distances.at(-1), pictures };
    });
    for (const [kind, image] of Object.entries(result.pictures))
      fs.writeFileSync(path.join(output, `${name}-${kind}.png`), Buffer.from(image.split(',')[1], 'base64'), { flag: 'wx' });
    delete result.pictures; report.cases.push({ name, frame, highlight, ...result }); console.log(JSON.stringify({ name, ...result }));
    if (variant === 'theme') await p.evaluate(() => {
      const u = window.__toonUni; u.uBase.value[0].copy(window.__p2ThemeBackup[0]); u.uShadeC.value[0].copy(window.__p2ThemeBackup[1]); delete window.__p2ThemeBackup;
    });
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
} finally { await b.close(); }
