// Native (realistic) skin highlight style "pump-r1": the user-approved probe-real uRM=2 shader (2026-10-31, variant "r2-warm"):
// volume gradient by core, translucent 0.55-0.82, pulsing inner fresnel glow, its own thin deep contour. It replaces the flat
// paint highlight `lit=mix(lit,cyl,d*X);` (X = 0.94 native, the V2-port expression, or the translucent material's opacity) only
// while window.__pkgPumpU.value >= 0.5; browser-package-layers.js sets it per skin from look.highlightStyle, so other skins render
// exactly as before. Install AFTER __pkgLayers.patch() so the layer pass gating (pkgMask=d; body pass d=0) still runs first.
export const PUMP_VERSION = 'pump-r1';
export async function installPumpHighlight(page) {
  return page.evaluate(() => {
    const v = flareInspector.viewer, U = { uRM: { value: 0 } }; window.__pkgPumpU = U.uRM; window.__pkgPumpErr = [];
    const RE = /lit=mix\(lit,cyl,d\*(.*?)\);/g, seen = new Set(); let n = 0;
    v.coach.traverse(o => { for (const m of [o.material].flat().filter(Boolean)) { if (seen.has(m) || !m.isMeshToonMaterial) continue; seen.add(m);
      const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
      m.onBeforeCompile = function(sh, r) { prev?.call(this, sh, r); const f = sh.fragmentShader; if (!f.includes('lit=mix(lit,cyl,d*') || f.includes('uniform float uRM;')) return;
        const hits = f.match(RE) || []; if (hits.length !== 1) { window.__pkgPumpErr.push('pump-r1: highlight statement matched ' + hits.length + ' times in ' + (m.name || m.uuid)); return; }
        Object.assign(sh.uniforms, U);
        sh.fragmentShader = 'uniform float uRM;\n' + f.replace(RE, (s0) => `if(uRM<0.5){ ${s0} } else {
      float cr=smoothstep(0.0,1.0,core); float pu=clamp(uPulse,0.0,1.0);
      vec3 deep=uHiC*vec3(0.62,0.34,0.30); vec3 belly=min(uHiC*1.12+vec3(0.04,0.02,0.0),vec3(1.0));
      vec3 hc=mix(deep,belly,cr)*(0.70+0.40*b);
      lit=mix(lit,hc,d*mix(0.55,0.82,cr));
      lit+=uHiC*d*(0.10+0.35*fr)*(0.7+0.6*pu);
      if(uRM>1.5){ float ed=d*(1.0-smoothstep(0.0,0.22,core)); lit=mix(lit,deep*0.75,ed*0.65); } }`); };
      if (m.__v2prHook === prev) m.__v2prHook = m.onBeforeCompile; // keep the V2 port's re-wrap check quiet (same as the layer patch)
      m.customProgramCacheKey = () => (key ? key.call(m) : '') + '|pkg-pump-r1'; m.needsUpdate = true; n++; } });
    return { version: 'pump-r1', materials: n };
  });
}
