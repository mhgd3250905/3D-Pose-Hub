// Additive skin coverage for the frozen WebXR hand/wrist adapter. Geometry and
// its render-time deformation stay owned by that adapter; only a rest-Y attribute
// is added. Disabled by default so baseline/candidate captures share one scene.
(() => {
  'use strict';
  if (window.__skinCoverage) throw Error('Skin coverage r1 already installed');
  const T = window.__toonT, V = window.__v2p;
  const adapter = window.__webxrWristJoin, input = window.__webxrWristJoinOptions;
  if (!T || !V) throw Error('Skin coverage r1 needs an initialized model');
  let enabled = false;
  const entries = [], enabledUniform = { get value() { return enabled ? 1 : 0; } };
  const mappings = {
    joinRegionBase: 'uV2pRGrey', joinRegionShade: 'uV2pRShade',
    joinTint: 'uV2pRTint', joinRim: 'uV2pRRim',
    joinRegionSkin: 'uV2pRSk', joinRegionOn: 'uV2pRon',
  };
  function replaceOnce(source, needle, replacement, label) {
    const count = source.split(needle).length - 1;
    if (count !== 1) throw Error('Skin coverage ' + label + ': expected one match, got ' + count);
    return source.replace(needle, replacement);
  }
  function painted() {
    const R = V.regions?.uni;
    return enabled && R?.uV2pRSk?.value > .5 && R?.uV2pRon?.value > .5 && V.uni?.uV2pOn?.value > .5;
  }
  function liveRegion(name, fallback) {
    return { get value() { return V.regions?.uni?.[name]?.value ?? fallback; } };
  }
  function fingerprint(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  const plans = [];
  if (adapter && !adapter.detached) {
    if (!input?.recipe) throw Error('Skin coverage: fixed hand recipe missing');
    for (const side of ['left', 'right']) {
      const nf = input.recipe.neutralFrames[side];
      const neutral = new T.Matrix4().fromArray(nf.handMatrixWorld)
        .multiply(new T.Matrix4().fromArray(nf.webCanonicalToHandLocalRowMajor).transpose());
      for (const kind of ['hands', 'bridges']) {
        const mesh = adapter.meshes[kind][side];
        const records = kind === 'hands' ? input.recipe.meshes.hands[side].vertices : input.recipe.bridge[side].vertices;
        const material = mesh.material, geometry = mesh.geometry;
        const key = material.customProgramCacheKey?.() || '';
        if (!/^webxr-matched-body-skin-r2(?:\||$)/.test(key)) throw Error('Skin coverage: unexpected fixed material ' + key);
        if (geometry.attributes.position.count !== records.length) throw Error('Skin coverage: rest vertex count mismatch');
        if (geometry.attributes.aSkinCoverageRestY) throw Error('Skin coverage: rest-Y attribute already exists');
        if (plans.some(p => p.material === material || p.geometry === geometry)) throw Error('Skin coverage: unexpected shared fixed material/geometry');
        const rest = new Float32Array(records.length), point = new T.Vector3();
        let min = Infinity, max = -Infinity;
        records.forEach((r, i) => {
          const y = point.fromArray(r.canonicalRest).applyMatrix4(neutral).y;
          if (!Number.isFinite(y)) throw Error('Skin coverage: invalid body rest Y');
          rest[i] = y; min = Math.min(min, y); max = Math.max(max, y);
        });
        plans.push({ mesh, material, geometry, key, rest, side, kind, min, max });
      }
    }
  }
  for (const p of plans) {
    const { mesh, material, geometry } = p;
    geometry.setAttribute('aSkinCoverageRestY', new T.BufferAttribute(p.rest, 1));
    const previous = material.onBeforeCompile, previousKey = material.customProgramCacheKey;
    const evidence = { mesh: mesh.name, materialUuid: material.uuid, side: p.side, kind: p.kind,
      sourceKey: p.key, vertices: p.rest.length, restYRange: [p.min, p.max],
      restYSource: 'neutral handMatrixWorld * row-major canonical-to-hand map * canonicalRest',
      compileCount: 0, compiled: false };
    entries.push(evidence);
    material.onBeforeCompile = function(shader, renderer) {
      previous.call(this, shader, renderer);
      for (const [join, region] of Object.entries(mappings)) {
        const original = shader.uniforms[join];
        if (!original) throw Error('Skin coverage: missing original uniform ' + join);
        // Preserve the frozen shader exactly for realistic and disabled captures.
        // Resolve uniform objects at render time, including late V2 installation.
        shader.uniforms[join] = { get value() {
          return painted() ? V.regions.uni[region].value : original.value;
        } };
      }
      const originalOn = shader.uniforms.joinV2pOn;
      if (!originalOn) throw Error('Skin coverage: missing joinV2pOn');
      shader.uniforms.joinV2pOn = { get value() { return painted() ? V.uni.uV2pOn.value : originalOn.value; } };
      shader.uniforms.uSkinCoverageEnabled = enabledUniform;
      shader.uniforms.uSkinCoverageHolo = liveRegion('uV2pRHolo', [0, 0, 0, 0]);
      shader.uniforms.uSkinCoverageHi = liveRegion('uV2pRHi', [.94, 1, 251.3]);
      shader.vertexShader = 'attribute float aSkinCoverageRestY; varying float vSkinCoverageRestY;\n' +
        replaceOnce(shader.vertexShader, '#include <begin_vertex>',
          '#include <begin_vertex>\n vSkinCoverageRestY=aSkinCoverageRestY;', 'rest-Y vertex assignment');
      // jf is the frozen fixed shader's Fresnel term; it uses the same 2.6 power
      // as body fr. Fixed hands have no region line or selected muscle mask, so
      // the body's v2rLine*uV2pRLa and .6*d contributions are both zero here.
      if (shader.fragmentShader.split('float jf=pow(').length !== 2) throw Error('Skin coverage: fixed Fresnel signature changed');
      shader.fragmentShader = 'uniform float uSkinCoverageEnabled; uniform vec4 uSkinCoverageHolo; uniform vec3 uSkinCoverageHi; varying float vSkinCoverageRestY;\n' +
        replaceOnce(shader.fragmentShader, '#include <dithering_fragment>', `#include <dithering_fragment>
 if(uSkinCoverageEnabled>.5 && jp && uSkinCoverageHolo.x>.5 && joinGlow<.5){
   float sc=.5+.5*sin(vSkinCoverageRestY*uSkinCoverageHi.z);
   float aS=clamp(fwidth(vSkinCoverageRestY*uSkinCoverageHi.z)*.5,0.0,1.0);
   sc=mix(sc,.5,aS);
   float ha=clamp(uSkinCoverageHolo.y*(1.0-uSkinCoverageHolo.w+uSkinCoverageHolo.w*sc)
     +uSkinCoverageHolo.z*smoothstep(.15,.95,jf),0.0,1.0);
   gl_FragColor=vec4(gl_FragColor.rgb*ha,ha);
 }`, 'hologram output');
      Object.assign(evidence, { compiled: true, compileCount: evidence.compileCount + 1,
        liveUniforms: [...Object.keys(mappings), 'joinV2pOn', 'uSkinCoverageHolo', 'uSkinCoverageHi'],
        hologramAlpha: true, bodyRestScan: true,
        vertexShaderFNV1a32: fingerprint(shader.vertexShader), fragmentShaderFNV1a32: fingerprint(shader.fragmentShader),
        alphaContract: 'premultiplied canvas colour; original opaque/depth-write material retained' });
    };
    material.customProgramCacheKey = function() { return previousKey.call(this) + '|skin-coverage-r1'; };
    material.needsUpdate = true;
  }
  window.__skinCoverage = {
    version: 'skin-coverage-r1',
    enable(value) {
      if (typeof value !== 'boolean') throw Error('Skin coverage enable expects a boolean');
      enabled = value;
      return this.report();
    },
    report() {
      return { version: this.version, enabled, painted: !!painted(), materialCount: entries.length,
        skin: V.skinOverride ?? null, materials: entries.map(e => ({ ...e,
          liveRegionAvailable: !!V.regions?.uni?.uV2pRHolo })),
        geometryChanges: 'added immutable rest-Y attribute only; position/normal/index untouched',
        propsChanged: false };
    },
  };
})();
