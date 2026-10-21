// Focused hook regression: execute the real collar/v2plus/region scripts with empty geometry; no browser or render required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, 'drill-anim/page', name), 'utf8');
const Vertex = 'uniform sampler2D uV2pT;varying vec4 vV2p;';
const Region = 'uniform sampler2D uV2pR;';
function fixture() {
  const material = { uuid: 'neck-material', customProgramCacheKey: () => 'toon-drill1', onBeforeCompile(shader) {
    shader.uniforms.uCollar = { value: 1 };
  } };
  const attr = { count: 0 };
  const mesh = { name: 'Mesh001', uuid: 'neck', visible: true, isSkinnedMesh: true, material,
    geometry: { attributes: { position: attr, skinIndex: attr, skinWeight: attr }, drawRange: { count: 0 } },
    skeleton: { update() {}, bones: [] } };
  const Color = class { clone() { return new Color(); } };
  const context = { window: {}, flareInspector: { viewer: {
    coach: { traverse(fn) { fn(mesh); }, updateMatrixWorld() {} }, motion: { reset() {} },
  } } };
  Object.assign(context.window, { __toonT: { Vector3: class {}, Color, DataTexture: class {} },
    __setRelax() {}, __setHighlight() {}, __drill: { selectModelProfile() {}, pose() {} } });
  context.__toonT = context.window.__toonT;
  vm.createContext(context);
  vm.runInContext(read('training-collar.js'), context);
  const compile = () => {
    const shader = { uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader:
      'float d=hlMask(c2); vec3 alb=vec3(0.0); float fr=pow(1.0-clamp(dot(Nn,V),0.0,1.0),2.6); ' +
      'alb*=1.0-cav; shc*=1.0-cav; lit=mix(lit,cyl,d*0.94); #include <opaque_fragment>\n#include <dithering_fragment>' };
    material.onBeforeCompile(shader, {});
    assert.equal(shader.vertexShader.split(Vertex).length - 1, 1, 'v2plus injected exactly once');
    assert.equal(shader.fragmentShader.split('uniform float uV2pOn;').length - 1, 1, 'v2plus fragment injected exactly once');
    assert.ok(shader.uniforms.uV2pT, 'neck has v2plus rest texture');
    return shader;
  };
  return { context, material, compile };
}
for (const oldFirst of [false, true]) {
  const { context: c, material, compile } = fixture(); const W = c.window;
  if (oldFirst) W.__setTrainingCollar(true);
  // Only skip the unrelated finger rig/snap. V2P.load, material patching and collar wrapper run unmodified.
  vm.runInContext(read('human-v2plus.js').replace(/\}\)\(\);\s*$/, 'graftFingers = () => ({}); snap = () => []; })();'), c);
  W.__v2p.restTex = { neck: {} };
  assert.equal(W.__v2p.load({}).patched, 1, 'neck is included regardless of previous collar state');
  compile();
  const hooks = new Map();
  vm.runInContext(read('human-v2plus-regions.js'), c);
  assert.equal(W.__v2p.loadRegions({ count: 0, regions: [], base: [], groups: {} }).meshes, 1, 'neck participates in skin/regions');
  for (let iteration = 0; iteration < 4; iteration++) for (const collar of [false, true]) {
    W.__setTrainingCollar(collar);
    const key = material.customProgramCacheKey();
    assert.equal(key.split('|')[0], 'toon-drill1-v2p', 'v2plus program variant survives');
    assert.equal(key.split('|').includes('trainingNativeCollar1'), collar, 'collar and plain materials keep distinct keys');
    // Old-first restores pre-v2plus hooks; cached patched callbacks must be reused rather than nested repeatedly.
    if (oldFirst) { if (hooks.has(collar)) assert.equal(material.onBeforeCompile, hooks.get(collar)); else hooks.set(collar, material.onBeforeCompile); }
    W.__v2p.setRegions(true);
    const shader = compile();
    assert.equal(shader.vertexShader.split(Region).length - 1, 1, 'region shader injected exactly once');
    assert.ok(shader.uniforms.uV2pR, 'neck has current region holder');
    assert.equal(shader.uniforms.uCollar.value, collar ? 0 : 1, 'collar shader behavior survives wrapping');
  }
  console.log((oldFirst ? 'old-v2-first' : 'fresh-v2plus') + ': collar round trips, cache variants and region hooks passed');
}
