// Shader/material lifecycle regression. This exercises generated browser code,
// real Three materials/cloning and the frozen head/neck shaders without WebGL.
// Geometry baking and rendered appearance remain the preview matrix's job.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { portedSource, regionTable } from './port.mjs';

const asset = JSON.parse(fs.readFileSync(new URL('../../drill-anim/models/head-neck-toon-r4/asset.json', import.meta.url)));
const generated = portedSource();
const skins = ['tech-white', 'neon-night', 'neon-night-b', 'hologram', null];

function material(part, key) {
  const m = new THREE.MeshToonMaterial();
  m.customProgramCacheKey = () => key;
  m.onBeforeCompile = shader => {
    shader.vertexShader = asset.materials[part].vertexShader;
    shader.fragmentShader = asset.materials[part].fragmentShader;
  };
  return m;
}

function fixture() {
  const materials = [
    material(0, 'head-neck-toon-r4-0-collar-shared-r27-neck'),
    material(1, 'head-neck-toon-r4-1-collar-shared-r27-head'),
    // The test uses the authentic compatible neck shader for the torso slot;
    // no synthetic replacement shader substitutes for the region compiler.
    material(0, 'toon-drill1-v2p-collar-shared-r27-torso'),
    new THREE.MeshStandardMaterial(),
  ];
  const mesh = new THREE.SkinnedMesh(new THREE.BufferGeometry(), materials);
  mesh.name = 'V3_Head_Neck_Torso_Shared_R26';
  const coach = new THREE.Group(); coach.add(mesh);
  const V = { on: true };
  const context = {
    __v2p: V, __toonT: THREE,
    __toonUni: { uHiC: { value: new THREE.Color(.5, .3, .1) }, uHiShade: { value: [.2, .1, .05] } },
    __drill: { selectModelProfile() {} }, __setHighlight() {},
    flareInspector: { viewer: { coach } },
  };
  context.window = context;
  vm.runInNewContext(generated.code, context, { filename: 'skin-coverage-r1.generated.js' });
  V.loadRegions(regionTable().table);
  // Supply an already-baked unchanged geometry state, isolating the material
  // lifecycle. Normal-only eye clones retain vertex IDs and need no rebake.
  V.regions.key = '|';
  V.regions.bakeInfo = { tex: new Map(), channels: [], maxDeg: 0, present: 0, verts: 0 };
  return { V, mesh, materials };
}

function eyeLikeClone(original, prefixVertex = false) {
  const clone = original.clone();
  // Three does not copy onBeforeCompile: the approved eye runtime explicitly
  // retains the previous callback and cache key in exactly this way.
  const compile = original.onBeforeCompile, key = original.customProgramCacheKey;
  clone.onBeforeCompile = function(shader, renderer) {
    compile.call(this, shader, renderer);
    if (prefixVertex) shader.vertexShader = 'uniform float outerWrapperValue;\n' + shader.vertexShader;
  };
  clone.customProgramCacheKey = () => key.call(original) + '|test-eye-clone';
  return clone;
}

function compile(m) {
  const shader = { uniforms: {}, vertexShader: '', fragmentShader: '' };
  m.onBeforeCompile(shader, {});
  return shader;
}

function assertSingleRegionShader(shader) {
  assert.equal((shader.vertexShader.match(/uniform\s+sampler2D\s+uV2pR\s*;/g) || []).length, 1,
    'region sampler must be declared once through inherited compiler chains');
  assert.equal((shader.fragmentShader.match(/uniform\s+float\s+uV2pRon\s*;/g) || []).length, 1,
    'region fragment declarations must not be injected twice');
}

test('all matching shared-mesh slots bind one live holder; unrelated material stays untouched', () => {
  const { V, mesh, materials } = fixture();
  const unrelated = materials[3], previous = unrelated.onBeforeCompile;
  V.setSkin('tech-white');
  const holder = V.regions.patched.get(mesh);
  assert.deepEqual(Array.from(mesh.__v2prMats), materials.slice(0, 3));
  for (const m of materials.slice(0, 3)) {
    const shader = compile(m);
    assertSingleRegionShader(shader);
    assert.equal(shader.uniforms.uV2pR, holder);
    assert.equal(shader.uniforms.uV2pRm, holder.m);
    assert.equal(shader.uniforms.uV2pRGrey, V.regions.uni.uV2pRGrey);
  }
  assert.equal(unrelated.onBeforeCompile, previous);
  assert.equal(unrelated.__v2prHook, undefined);
});

test('late eye clone is discovered; outer vertex wrapper does not duplicate shader code', () => {
  const { V, mesh, materials } = fixture();
  const before = materials.map(m => m.onBeforeCompile);
  const clonedHead = eyeLikeClone(materials[1], true);
  mesh.material = [...materials]; mesh.material[1] = clonedHead;
  V.setSkin('neon-night');
  assert.equal(mesh.__v2prMats[1], clonedHead, 'coverage must inspect the visible head slot');
  assert.equal(materials[0].onBeforeCompile, before[0], 'neck must not be needlessly rewrapped');
  assert.equal(materials[2].onBeforeCompile, before[2], 'torso must not be needlessly rewrapped');
  assert.equal(materials[1].onBeforeCompile, before[1], 'hidden old head must not be patched instead');
  const shader = compile(clonedHead);
  assertSingleRegionShader(shader);
  assert.match(shader.vertexShader, /outerWrapperValue/);
  assert.equal(shader.uniforms.uV2pR, V.regions.patched.get(mesh));
  const hook = clonedHead.onBeforeCompile, key = clonedHead.customProgramCacheKey();
  for (let round = 0; round < 3; round++) for (const skin of skins) V.setSkin(skin);
  assert.equal(clonedHead.onBeforeCompile, hook, 'repeated skin switches must not grow the hook chain');
  assert.equal(clonedHead.customProgramCacheKey(), key);
  assertSingleRegionShader(compile(clonedHead));
});

test('enable/disable and in-place head replacement follow current slots and holder identity', () => {
  const { V, mesh, materials } = fixture();
  const next = [...materials], clonedHead = eyeLikeClone(materials[1]); next[1] = clonedHead;
  for (const current of [next, materials, next]) {
    mesh.material = current; V.setSkin('tech-white');
    assert.equal(mesh.__v2prMats[1], current[1]);
    assert.equal(compile(current[1]).uniforms.uV2pR, V.regions.patched.get(mesh));
  }
  next[1] = eyeLikeClone(clonedHead, true); V.setSkin('hologram');
  assert.equal(mesh.__v2prMats[1], next[1], 'replacing a slot in the same array must also refresh');
  const newHolder = { value: V.regions.dummy, m: { value: 1 } };
  V.regions.patched.set(mesh, newHolder); V.setSkin('neon-night-b');
  const shader = compile(next[1]);
  assert.equal(shader.uniforms.uV2pR, newHolder, 'inherited holder must not win over the current mesh binding');
  assert.equal(shader.uniforms.uV2pRm, newHolder.m);
  assertSingleRegionShader(shader);
});

test('compiled visible head follows all skin uniforms and restores native appearance controls', () => {
  const { V, mesh, materials } = fixture();
  mesh.material = [...materials]; mesh.material[1] = eyeLikeClone(materials[1]);
  V.setSkin('tech-white');
  const shader = compile(mesh.material[1]), U = shader.uniforms;
  for (const skin of skins) {
    V.setSkin(skin);
    assert.equal(U.uV2pRSk.value, skin ? 1 : 0);
    assert.equal(U.uV2pRon.value, skin ? 1 : 0);
    assert.equal(U.uV2pRHolo.value[0], skin === 'hologram' ? 1 : 0);
    if (skin) assert.deepEqual(U.uV2pRGrey.value.toArray(), Array.from(V.SKINS[skin].grey));
    assert.equal(U.uV2pR, V.regions.patched.get(mesh), 'switches must retain the compiled live uniform binding');
  }
  assert.deepEqual(Array.from(U.uV2pRTint.value), [1, 1, 1]);
  assert.deepEqual(Array.from(U.uV2pRHolo.value), [0, 0, 0, 0]);
});
