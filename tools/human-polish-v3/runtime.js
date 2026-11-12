// Appearance-only candidate for recipe-loaded armfix-r2 scenes.
(() => {
  if (window.__armfixR2?.profile !== 'training-human-v3-armfix' ||
      window.__armfixR2.version !== '0.1.0-r2') throw Error('Polish requires recipe-loaded armfix-r2');
  if (window.__bodyPolish) throw Error('Polish already installed');
  const viewer = flareInspector.viewer;
  const enabled = { value: 0 };
  const patched = new Set();
  const compiled = new Map();
  const errors = [];
  viewer.scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    for (const material of [mesh.material].flat().filter(Boolean)) {
      if (patched.has(material)) continue;
      const key = material.customProgramCacheKey?.() || '';
      const body = key.startsWith('toon-drill1');
      const fixedHand = key.startsWith('webxr-matched-body-skin-r2');
      if (!body && !fixedHand) continue;
      patched.add(material);
      const previous = material.onBeforeCompile;
      const cacheKey = material.customProgramCacheKey;
      material.onBeforeCompile = function (shader, renderer) {
        previous.call(this, shader, renderer);
        const needle = fixedHand ? 'vec3 jl=mix(jshade,jbase,jb);' : 'vec3 lit=mix(shc,alb,b);';
        if (!shader.fragmentShader.includes(needle)) {
          errors.push('Missing lighting hook on ' + mesh.name);
          return;
        }
        shader.uniforms.uBodyPolish = enabled;
        // Preserve the original b/jb used by approved highlight and skin logic.
        const replacement = fixedHand
          ? 'vec3 jl=mix(jshade,jbase,mix(jb,smoothstep(-0.25,0.85,jnl),uBodyPolish));'
          : 'vec3 lit=mix(shc,alb,mix(b,smoothstep(-0.25,0.85,nl),uBodyPolish));';
        shader.fragmentShader = 'uniform float uBodyPolish;\n' + shader.fragmentShader.replace(needle, replacement);
        compiled.set(material.uuid, { mesh: mesh.name, kind: fixedHand ? 'fixed-hand-and-wrist' : 'body' });
      };
      if (material.__v2prHook === previous) material.__v2prHook = material.onBeforeCompile;
      material.customProgramCacheKey = () => cacheKey.call(material) + '|default-polish-r1';
      material.needsUpdate = true;
    }
  });
  window.__bodyPolish = {
    enable(on) { enabled.value = on ? 1 : 0; },
    report() { return { materials: patched.size, compiled: [...compiled.values()], errors: [...errors] }; },
  };
})();
