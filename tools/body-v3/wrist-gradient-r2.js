// Optional v3 hand material candidate. Install after applyV3() has loaded the
// hands. Uses the rest-space wrist plane supplied by human-v3. The first 6 mm
// beyond the plane stays cuff-coloured because the seam is not planar; then
// the top colour and its cuff shading fade to skin over 25 mm.
(function () {
  const KEY = '|bodyV3WristGradientR2';
  const anchor = 'vec3 alb=vec3(0.0)';
  const blend = `
    if (uV2pOn > 0.5 && uV2pOut > 0.5 && uV2pSleeve < 0.5) {
      vec4 wristPlane = vV2p.x > 0.0 ? uV2pWristL : uV2pWristR;
      float alongHand = dot(vV2p.xyz, wristPlane.xyz) - wristPlane.w;
      float skinMix = smoothstep(0.006, 0.031, alongHand);
      W4 = mix(vec4(0.0, 1.0, 0.0, 0.0), vec4(1.0, 0.0, 0.0, 0.0), skinMix);
      v2cuff = max(v2cuff, 1.0 - skinMix);
    }
    `;

  window.__installBodyV3WristGradientR2 = function () {
    const mesh = window.__v2p?.hands?.mesh;
    if (!mesh || !mesh.material) throw new Error('body-v3 wrist gradient: load v3 hands first');
    const mat = mesh.material;
    if (mat.userData.bodyV3WristGradientR2) return { already: true, mesh: mesh.name };
    if (mat.userData.bodyV3WristGradientR1) throw new Error('body-v3 wrist gradient: use one candidate per page');
    const originalHook = mat.onBeforeCompile;
    const previousKey = mat.customProgramCacheKey;
    mat.onBeforeCompile = function (shader, renderer) {
      originalHook.call(this, shader, renderer);
      if (!shader.fragmentShader.includes(anchor)) throw new Error('body-v3 wrist gradient: missing toon albedo block');
      if (!shader.fragmentShader.includes('uniform float uV2pOut;') || !shader.fragmentShader.includes('float v2cuff=0.0;')) throw new Error('body-v3 wrist gradient: missing v2plus shader inputs');
      shader.fragmentShader = shader.fragmentShader.replace(anchor, blend + anchor);
    };
    mat.customProgramCacheKey = function () { return previousKey.call(this) + KEY; };
    mat.userData.bodyV3WristGradientR2 = true;
    mat.needsUpdate = true;
    return { mesh: mesh.name, startMm: 6, transitionMm: 25 };
  };
})();
