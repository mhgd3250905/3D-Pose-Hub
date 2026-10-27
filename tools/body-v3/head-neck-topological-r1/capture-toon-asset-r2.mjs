// Capture the verified runtime P2 shader hooks and per-vertex data. The output
// is a new diagnostic asset; live theme and highlight uniforms remain external.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
if (process.argv.length !== 3) throw new Error('Usage: node capture-toon-asset-r1.mjs <new-output.json>');
const output = path.resolve(process.argv[2]);
if (fs.existsSync(output)) throw new Error('Output already exists');
const imp = f => import(pathToFileURL(path.join(repo, f)).href);
const { loadTheme } = await imp('drill-anim/lib/config.mjs');
const v3 = await imp('drill-anim/models/training-human-v3/loader.mjs');
const weld = await imp('drill-anim/models/head-neck-weld-r2/loader.mjs');
const { default: squat } = await imp('drill-anim/specs/h-squat.js');
const spec = { ...structuredClone(squat), modelProfile: 'training-human-v2plus-hands-native',
  nativeHands: { version: '1.0.0-r3' }, v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' } };
const { b, p } = await v3.boot({ size: 360, pr: 1, theme: loadTheme() });
try {
  await v3.applyV3(p, spec, {});
  await p.evaluate(s => { __drill.selectModelProfile(s); flareInspector.viewer.motion.reset(); }, spec);
  const ref = await weld.apply(p);
  const asset = await p.evaluate(() => {
    const T = window.__toonT, v = flareInspector.viewer, mesh = v.coach.getObjectByName('V3_Head_Neck_Topological_R1');
    if (!mesh || !Array.isArray(mesh.material) || mesh.material.length !== 2) throw new Error('Expected two reference materials');
    const defaults = new Set(Object.keys(T.ShaderLib.toon.uniforms));
    const groups = [['toon', window.__toonUni], ['muscle', window.__mmUni], ['v2p', window.__v2p.uni]];
    const b64 = data => { const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength); let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
    const encode = value => {
      if (value === undefined || value === null) return { type: 'null', value: null };
      if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return { type: 'scalar', value };
      if (value.isDataTexture) return { type: 'texture', width: value.image.width, height: value.image.height,
        arrayType: value.image.data.constructor.name, format: value.format, dataType: value.type, colorSpace: value.colorSpace,
        magFilter: value.magFilter, minFilter: value.minFilter, wrapS: value.wrapS, wrapT: value.wrapT, data: b64(value.image.data) };
      if (value.isColor) return { type: 'color', value: value.toArray() };
      if (value.isVector2 || value.isVector3 || value.isVector4 || value.isMatrix3 || value.isMatrix4)
        return { type: value.constructor.name, value: value.toArray() };
      if (Array.isArray(value)) return { type: 'array', value: value.map(encode) };
      throw new Error(`Unsupported static uniform value ${value.constructor?.name || typeof value}`);
    };
    const materials = mesh.material.map(material => {
      const shader = { uniforms: T.UniformsUtils.clone(T.ShaderLib.toon.uniforms),
        vertexShader: T.ShaderLib.toon.vertexShader, fragmentShader: T.ShaderLib.toon.fragmentShader };
      material.onBeforeCompile(shader, v.renderer);
      const dynamic = {}, constants = {};
      for (const [name, uniform] of Object.entries(shader.uniforms)) {
        if (defaults.has(name)) continue;
        const match = groups.find(([, set]) => set && set[name] === uniform);
        if (match) dynamic[name] = match[0]; else constants[name] = encode(uniform.value);
      }
      return { vertexShader: shader.vertexShader, fragmentShader: shader.fragmentShader, dynamic, constants,
        settings: { side: material.side, toneMapped: material.toneMapped, transparent: material.transparent,
          opacity: material.opacity, depthWrite: material.depthWrite, depthTest: material.depthTest,
          polygonOffset: material.polygonOffset, polygonOffsetFactor: material.polygonOffsetFactor,
          polygonOffsetUnits: material.polygonOffsetUnits, vertexColors: material.vertexColors } };
    });
    return { version: 1, sourceVertices: mesh.geometry.attributes.position.count, materials,
      note: 'Static shader/data from a P2 v3 reference; theme and highlight uniforms must be injected live.' };
  });
  fs.writeFileSync(output, JSON.stringify(asset), { flag: 'wx' });
  console.log(JSON.stringify({ reference: ref.version, vertices: asset.sourceVertices,
    materials: asset.materials.map(m => ({ dynamic: Object.keys(m.dynamic).length,
      constants: Object.keys(m.constants).length, textures: Object.values(m.constants).filter(v => v.type === 'texture').length })) }));
} finally { await b.close(); }
