// Fitness-app style muscle map drawn on the smooth CC0 body (Blender Studio
// base mesh). Each muscle is a soft, pillow-shaped panel; panels are separated
// by clean grooves. Everything is computed per PIXEL from the surface position
// (an anisotropic-ellipsoid Voronoi), so edges stay smooth at any zoom and on
// any phone — no realistic sculpted muscle geometry, no jagged mesh borders.
// It shows WHERE a muscle group sits, not how hard it works (not EMG).
// Units: metres, feet y=0, up +Y, front +Z, body's left +X. Mirrored in |x|.
// The body must be rendered in its own model space (rotate the camera, not
// the mesh), because panels are looked up from model-space positions.
import * as THREE from 'three';

// [id, name, family, centre, radius, tiltZ (rad, + leans top outward), tiltX (rad), flags]
// family: panels of one family are split by a fine inner line, not a groove.
// flags: m = mirror seam is a groove (midline), a = abdominal segments,
//        k = plain skin blocker, c = also shown through the shorts.
const RAW = [
  // skin (plain, never highlighted): head, hands, feet, knees, elbows
  ['skinHead', '', 'skin', [.000, 1.600, .010], [.105, .125, .125], 0, 0, 'k'],
  ['skinHand', '', 'skin', [.400, .780, .090], [.065, .105, .090], .35, 0, 'k'],
  ['skinFoot', '', 'skin', [.170, .030, .030], [.080, .085, .150], 0, 0, 'k'],
  ['skinKnee', '', 'skin', [.135, .470, .030], [.060, .040, .070], .05, 0, 'k'],
  ['skinShin', '', 'skin', [.128, .300, .010], [.026, .150, .030], -.05, 0, 'k'],
  ['neck', '胸锁乳突肌', 'neck', [.030, 1.470, .055], [.024, .065, .040], .25, -.45, ''],
  ['trapUpper', '斜方肌上部', 'trap', [.075, 1.430, -.030], [.100, .075, .075], -.30, .10, 'm'],
  ['deltFront', '三角肌前束', 'delt', [.180, 1.340, .050], [.048, .085, .048], .25, 0, ''],
  ['deltSide', '三角肌中束', 'delt', [.215, 1.330, .000], [.048, .090, .060], .30, 0, ''],
  ['deltRear', '三角肌后束', 'delt', [.180, 1.340, -.060], [.048, .085, .048], .25, 0, ''],
  ['pec', '胸大肌', 'pec', [.080, 1.290, .120], [.105, .080, .075], .10, 0, 'm'],
  ['biceps', '肱二头肌', 'biceps', [.245, 1.190, .035], [.040, .110, .045], .36, 0, ''],
  ['triceps', '肱三头肌', 'triceps', [.258, 1.200, -.045], [.045, .130, .050], .36, 0, ''],
  ['forearmFlex', '前臂屈肌群', 'forearm', [.335, .980, .050], [.040, .110, .040], .37, 0, ''],
  ['forearmExt', '前臂伸肌群', 'forearm', [.350, .980, .000], [.040, .110, .045], .37, 0, ''],
  ['serratus', '前锯肌', 'serratus', [.135, 1.180, .075], [.040, .060, .050], -.15, 0, ''],
  ['abs', '腹直肌', 'abs', [.036, 1.030, .140], [.048, .215, .060], 0, 0, 'ma'],
  ['oblique', '腹外斜肌', 'oblique', [.132, 1.020, .060], [.050, .120, .080], .08, 0, ''],
  ['infraspinatus', '冈下肌（肩袖）', 'infra', [.110, 1.290, -.095], [.055, .055, .045], 0, 0, ''],
  ['scapular', '菱形肌 / 斜方肌中下部', 'trap', [.040, 1.250, -.100], [.050, .130, .045], 0, 0, 'm'],
  ['lats', '背阔肌', 'lats', [.125, 1.130, -.065], [.070, .130, .070], -.15, 0, ''],
  ['erectors', '竖脊肌', 'erectors', [.035, .990, -.075], [.040, .130, .045], 0, 0, 'm'],
  ['gluteMed', '臀中肌', 'gluteMed', [.150, .910, -.030], [.055, .060, .065], 0, 0, 'c'],
  ['glutes', '臀大肌', 'glutes', [.085, .830, -.085], [.100, .090, .070], 0, 0, 'mc'],
  ['hipFlexor', '髂腰肌 / 阔筋膜张肌', 'hipFlexor', [.120, .870, .080], [.055, .065, .050], 0, 0, 'c'],
  ['quadRect', '股直肌', 'quads', [.105, .650, .100], [.045, .160, .050], .05, 0, 'c'],
  ['quadLat', '股外侧肌', 'quads', [.165, .640, .068], [.045, .160, .055], .05, 0, 'c'],
  ['quadMed', '股内侧肌', 'quads', [.085, .520, .075], [.040, .080, .045], .02, 0, ''],
  ['adductors', '内收肌群', 'adductors', [.050, .670, .010], [.045, .140, .060], .05, 0, 'c'],
  ['hamLat', '股二头肌', 'ham', [.162, .620, -.042], [.045, .170, .050], .04, 0, 'c'],
  ['hamMed', '半腱肌 / 半膜肌', 'ham', [.085, .620, -.055], [.045, .170, .050], .04, 0, 'c'],
  ['tibialis', '胫骨前肌', 'tibialis', [.178, .320, -.010], [.026, .120, .032], 0, 0, ''],
  ['calfMed', '腓肠肌内侧头', 'calf', [.130, .350, -.085], [.040, .100, .045], 0, 0, ''],
  ['calfLat', '腓肠肌外侧头', 'calf', [.180, .350, -.080], [.040, .100, .045], 0, 0, ''],
];
// Muscle ellipsoids are inflated so neighbours meet (the Voronoi decides the
// borders); skin blockers keep joints, head, hands and feet plain.
const INFLATE = 1.4;
export const MUSCLES = RAW.map(([id, name, family, centre, radius, tz, tx, flags], index) => {
  const skin = flags.includes('k');
  return { id, name, family, centre, radius: skin ? radius : radius.map(r => r * INFLATE), tz, tx, skin, mid: flags.includes('m'), abs: flags.includes('a'), cloth: flags.includes('c'), index };
});
export const MUSCLE_BY_ID = Object.fromEntries(MUSCLES.map(m => [m.id, m]));
const FAMILIES = ['skin', ...new Set(MUSCLES.map(m => m.family).filter(f => f !== 'skin'))];
const N = MUSCLES.length;

// App groups (movement-surface-regions ids + a few common extras) -> map
// panels. `deep` groups lie under the panel shown, so they are drawn hatched.
export const GROUP_MUSCLES = {
  deltoids: { label: '三角肌', muscles: ['deltFront', 'deltSide', 'deltRear'] },
  'rotator-cuff': { label: '肩袖肌群', muscles: ['infraspinatus'], deep: true },
  triceps: { label: '肱三头肌', muscles: ['triceps'] },
  serratus: { label: '前锯肌', muscles: ['serratus'] },
  scapular: { label: '肩胛稳定肌群', muscles: ['scapular'] },
  obliques: { label: '腹斜肌', muscles: ['oblique'] },
  erectors: { label: '竖脊肌', muscles: ['erectors'] },
  'hip-flexors': { label: '髋屈肌', muscles: ['hipFlexor'], deep: true },
  quadriceps: { label: '股四头肌', muscles: ['quadRect', 'quadLat', 'quadMed'] },
  glutes: { label: '臀肌', muscles: ['glutes', 'gluteMed'] },
  'hip-rotators': { label: '髋外旋肌群', muscles: ['glutes'], deep: true },
  adductors: { label: '内收肌群', muscles: ['adductors'] },
  hamstrings: { label: '腘绳肌', muscles: ['hamLat', 'hamMed'] },
  // extras for the standalone page / future cards
  chest: { label: '胸大肌', muscles: ['pec'] }, pectorals: { label: '胸肌', muscles: ['pec'] }, abs: { label: '腹直肌', muscles: ['abs'] },
  biceps: { label: '肱二头肌', muscles: ['biceps'] }, forearms: { label: '前臂肌群', muscles: ['forearm'] },
  traps: { label: '斜方肌', muscles: ['trapUpper', 'scapular'] }, lats: { label: '背阔肌', muscles: ['lats'] },
  calves: { label: '小腿三头肌', muscles: ['calfMed', 'calfLat'] }, tibialis: { label: '胫骨前肌', muscles: ['tibialis'] },
  neck: { label: '颈部肌群', muscles: ['neck'] },
};
/** Resolve a group id (or a raw panel id) to { label, muscles, deep }. */
export function resolveGroup(id) {
  if (GROUP_MUSCLES[id]) return GROUP_MUSCLES[id];
  const m = MUSCLE_BY_ID[id];return m ? { label: m.name, muscles: [m.id] } : null;
}

function rotateLocal(m, x, y, z) {
  let dx = x - m.centre[0], dy = y - m.centre[1], dz = z - m.centre[2];
  const cz = Math.cos(m.tz), sz = Math.sin(m.tz);[dx, dy] = [dx * cz + dy * sz, dy * cz - dx * sz];
  const cx = Math.cos(m.tx), sx = Math.sin(m.tx);[dy, dz] = [dy * cx + dz * sx, dz * cx - dy * sx];
  return [dx, dy, dz];
}
// CPU twin of the shader scoring (picking, focus, label anchors).
export function muscleAt(point, height = 1.69) {
  const s = 1.69 / height, x = Math.abs(point.x) * s, y = point.y * s, z = point.z * s;
  let best = -1, second = -1, id = null;
  for (const m of MUSCLES) {
    const [dx, dy, dz] = rotateLocal(m, x, y, z);
    const score = 1 - Math.hypot(dx / m.radius[0], dy / m.radius[1], dz / m.radius[2]);
    if (score > best) { second = best;best = score;id = m.id; } else if (score > second) second = score;
  }
  return best > 0.02 && !MUSCLE_BY_ID[id].skin ? { id, name: MUSCLE_BY_ID[id].name, side: point.x >= 0 ? 'left' : 'right', score: best, margin: best - Math.max(second, 0) } : null;
}

/** Uniforms shared by every body material. sel[i]: 0 none, 1 primary,
 * .6 secondary, -1 deep (hatched). side: 1 left only, -1 right only, 0 both. */
export function createMuscleUniforms() {
  return {
    mmC: { value: MUSCLES.map(m => new THREE.Vector3(...m.centre)) },
    mmR: { value: MUSCLES.map(m => new THREE.Vector3(...m.radius)) },
    mmT: { value: MUSCLES.map(m => new THREE.Vector4(Math.cos(m.tz), Math.sin(m.tz), Math.cos(m.tx), Math.sin(m.tx))) },
    mmF: { value: MUSCLES.map(m => new THREE.Vector4(FAMILIES.indexOf(m.family), m.mid ? 1 : 0, m.abs ? 1 : 0, m.cloth ? 1 : 0)) },
    mmSel: { value: new Array(N).fill(0) }, mmSide: { value: new Array(N).fill(0) }, mmFoc: { value: new Array(N).fill(0) },
    mmScale: { value: 1 }, mmTime: { value: 0 }, mmReveal: { value: 1 }, mmDebug: { value: 0 },
    mmAccent: { value: new THREE.Color('#ff5a36') }, mmAccent2: { value: new THREE.Color('#ffae5c') },
    mmBase: { value: new THREE.Color('#939dab') }, mmSkin: { value: new THREE.Color('#7f8896') }, mmGroove: { value: new THREE.Color('#3f4859') },
    mmFabric: { value: new THREE.Color('#1a2130') },
  };
}

const GLSL_HEAD = `
#define MM_N ${N}
uniform vec3 mmC[MM_N]; uniform vec3 mmR[MM_N]; uniform vec4 mmT[MM_N]; uniform vec4 mmF[MM_N];
uniform float mmSel[MM_N]; uniform float mmSide[MM_N]; uniform float mmFoc[MM_N];
uniform float mmScale; uniform float mmTime; uniform float mmReveal; uniform float mmDebug;
uniform vec3 mmAccent; uniform vec3 mmAccent2; uniform vec3 mmBase; uniform vec3 mmSkin; uniform vec3 mmGroove; uniform vec3 mmFabric;
varying vec3 vMmPos;
float mmS1; float mmEdge; float mmCloth; float mmRevealT; float mmSelV; float mmGrooveV; float mmIsMuscle; float mmFocusV; float mmCore; float mmShown; float mmIdx;
vec3 mmHue(float i){ return 0.55 + 0.45 * cos(6.2831 * (i * 0.137 + vec3(0.0, 0.33, 0.67))); }
void mmEval(){
  vec3 p = vec3(abs(vMmPos.x), vMmPos.y, vMmPos.z) * mmScale; float sd = vMmPos.x >= 0.0 ? 1.0 : -1.0;
  float b1 = -9.0, b2 = -9.0; int i1 = 0, i2 = 0;
  for (int i = 0; i < MM_N; i++) {
    vec3 d = p - mmC[i]; vec4 t = mmT[i];
    d.xy = vec2(d.x * t.x + d.y * t.y, d.y * t.x - d.x * t.y);
    d.yz = vec2(d.y * t.z + d.z * t.w, d.z * t.z - d.y * t.w);
    float s = 1.0 - length(d / mmR[i]);
    if (s > b1) { b2 = b1; i2 = i1; b1 = s; i1 = i; } else if (s > b2) { b2 = s; i2 = i; }
  }
  float on = (mmSide[i1] == 0.0 || mmSide[i1] == sd) ? 1.0 : 0.0;
  mmCloth = mmF[i1].w; mmS1 = b1; mmSelV = mmSel[i1] * on; mmFocusV = mmFoc[i1] * on; mmIdx = float(i1);
  float s2 = max(b2, 0.0);
  float gap = b1 - s2; float g = length(vec2(dFdx(gap), dFdy(gap))) + 1e-6; float px = gap / g;
  bool sameFamily = b2 > 0.0 && mmF[i1].x == mmF[i2].x;
  mmEdge = smoothstep(0.0, sameFamily ? 0.07 : 0.16, gap);
  // grooves: a soft channel between muscles, a fine line inside one family.
  // Widths are metric (score units) with a pixel floor, AA'd in pixel space.
  float wpx = max((sameFamily ? 0.008 : 0.022) / g, sameFamily ? 0.6 : 1.05);
  mmGrooveV = (1.0 - smoothstep(wpx - 0.65, wpx + 0.65, px)) * (sameFamily ? 0.55 : 1.0);
  // midline seam (linea alba, spine) for mirrored central panels
  if (mmF[i1].y > 0.5) {
    float ax = abs(vMmPos.x) * mmScale; float ag = length(vec2(dFdx(ax), dFdy(ax))) + 1e-7;
    float mw = max(0.0022 / ag, 0.7);
    mmGrooveV = max(mmGrooveV, 1.0 - smoothstep(mw - 0.65, mw + 0.65, ax / ag));
  }
  // tendinous intersections of the rectus abdominis: fine horizontal lines
  if (mmF[i1].z > 0.5) {
    float yy = (p.y - 0.985) / 0.068; float fy = abs(fract(yy) - 0.5) * 0.068;
    float yg = length(vec2(dFdx(p.y), dFdy(p.y))) + 1e-7; float lw = max(0.0016 / yg, 0.55);
    float line = (1.0 - smoothstep(lw - 0.6, lw + 0.6, fy / yg)) * step(0.0, yy) * step(yy, 2.99);
    mmGrooveV = max(mmGrooveV, line * 0.6);
  }
  float bg = length(vec2(dFdx(b1), dFdy(b1))) + 1e-6;
  mmIsMuscle = smoothstep(-0.5, 0.7, b1 / bg) * (mmF[i1].x < 0.5 ? 0.0 : 1.0);
  if (mmF[i1].x < 0.5) { mmSelV = 0.0; mmFocusV = 0.0; mmGrooveV *= 0.6; }
  mmCore = smoothstep(0.0, 0.5, b1);
  // reveal: highlighted panels fill from their centre outwards
  mmRevealT = 1.32 - 1.38 * mmReveal;
  mmShown = smoothstep(mmRevealT - 0.05, mmRevealT + 0.01, b1 / 0.85 + 0.12);
}`;

export function applyMuscleMap(material, uniforms, { clothing = false } = {}) {
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec3 vMmPos;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvMmPos = transformed;');
    shader.fragmentShader = GLSL_HEAD + '\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'void main() {\n mmEval();')
      // pillow relief: height rises toward each panel's centre and dips into the grooves
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float h = ${clothing ? '0.0' : 'mmEdge * mmIsMuscle'};
          vec3 vSigmaX = dFdx(-vViewPosition), vSigmaY = dFdy(-vViewPosition);
          vec3 R1 = cross(vSigmaY, normal), R2 = cross(normal, vSigmaX); float fDet = dot(vSigmaX, R1);
          vec2 dH = vec2(dFdx(h), dFdy(h)) * 0.004;
          vec3 grad = sign(fDet) * (dH.x * R1 + dH.y * R2);
          normal = normalize(abs(fDet) * normal - grad);
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float primary = step(0.9, mmSelV), secondary = step(0.3, mmSelV) * (1.0 - primary), deep = step(mmSelV, -0.5);
          float sh = mmShown * mmIsMuscle;
          vec3 hot = mix(mmAccent2, mmAccent, 0.55 + 0.45 * smoothstep(0.0, 0.5, mmS1)) * mix(0.78, 1.0, mmEdge);
          float hA = max(fwidth(vMmPos.y) * 140.0, 0.02);
          float hatch = smoothstep(0.5 - hA, 0.5 + hA, abs(fract((vMmPos.x * 0.6 + vMmPos.y - vMmPos.z * 0.5) * 70.0) - 0.5) * 2.0);
          ${clothing ? `
          vec3 col = mmFabric; sh *= mmCloth;
          col = mix(col, mix(mmFabric, mmAccent * mix(0.86, 1.0, mmEdge), 0.86), primary * sh);
          col = mix(col, mix(mmFabric, mmAccent, 0.42), secondary * sh);
          col = mix(col, mix(mmFabric, mmAccent, 0.70), deep * sh * mix(0.25, 1.0, hatch));
          col = mix(col, col * 0.6, mmGrooveV * mmIsMuscle * (primary + secondary + deep) * sh * 0.6);
          ` : `
          vec3 base = mix(mmSkin, mmBase * mix(0.80, 1.04, mmEdge), mmIsMuscle);
          vec3 col = base;
          col = mix(col, hot, primary * sh);
          col = mix(col, mix(mmBase, mmAccent, 0.52) * mix(0.85, 1.0, mmEdge), secondary * sh);
          col = mix(col, mix(mmBase, mmAccent, 0.80), deep * sh * mix(0.18, 1.0, hatch));
          if (mmDebug > 0.5) col = mix(mmSkin, mmHue(mmIdx), mmIsMuscle);
          col = mix(col, mmGroove, mmGrooveV * mix(0.40, 0.82, mmIsMuscle));
          `}
          diffuseColor.rgb = col;
          ${clothing ? `{
            float ax = abs(vMmPos.x);
            float cut = 0.778 + 1.05 * max(ax - 0.028, 0.0);
            float e = vMmPos.y - cut; float ea = max(fwidth(e), 1e-5);
            diffuseColor.a = smoothstep(-ea, ea, e);
            if (diffuseColor.a < 0.01) discard;
            col = mix(col, col * 1.5 + 0.03, (1.0 - smoothstep(0.0, 0.010, abs(vMmPos.y - 0.968))) * 0.6);
            diffuseColor.rgb = col;
          }` : ''}
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float lit = (step(0.3, mmSelV) + step(mmSelV, -0.5) * 0.6) * mmIsMuscle * (1.0 - mmGrooveV) * mmShown;
          float pulse = 0.5 + 0.5 * sin(mmTime * 2.4);
          float front = smoothstep(0.0, 0.08, mmS1) * (1.0 - smoothstep(0.0, 0.10, abs(mmS1 / 0.85 + 0.12 - mmRevealT))) * step(mmReveal, 0.985);
          ${clothing ? 'lit *= mmCloth; front *= mmCloth;' : ''}
          totalEmissiveRadiance += mmAccent * (lit * (0.10 + 0.08 * pulse + 0.40 * mmFocusV * pulse) + front * 0.6 * step(0.3, abs(mmSelV)));
          float rim = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 3.0);
          totalEmissiveRadiance += vec3(0.50, 0.60, 0.80) * rim * ${clothing ? '0.18' : '0.32'};
        }`);
  };
  material.customProgramCacheKey = () => 'muscle-map-v2' + (clothing ? '-c' : '');
  material.needsUpdate = true;
}

/** Set which panels are highlighted. items: [{ muscle, level: 'primary'|'secondary'|'deep', side: 'left'|'right'|'both' }] */
export function setMuscleSelection(uniforms, items) {
  const sel = uniforms.mmSel.value, side = uniforms.mmSide.value, seen = new Set();sel.fill(0);side.fill(0);
  for (const item of items) {
    const m = MUSCLE_BY_ID[item.muscle];if (!m) continue;
    const level = item.level === 'deep' ? -1 : item.level === 'secondary' ? .6 : 1;
    const rank = value => value === 1 ? 3 : value === -1 ? 2 : value ? 1 : 0;
    if (rank(level) > rank(sel[m.index])) sel[m.index] = level;
    const sd = item.side === 'left' ? 1 : item.side === 'right' ? -1 : 0;
    side[m.index] = seen.has(m.index) && side[m.index] !== sd ? 0 : sd;seen.add(m.index);
  }
}
/** Pulse-highlight a set of panels (ids). */
export function setMuscleFocus(uniforms, ids = []) {
  const foc = uniforms.mmFoc.value;foc.fill(0);
  for (const id of ids) { const m = MUSCLE_BY_ID[id];if (m) foc[m.index] = 1; }
}
/** Panel centre in model space for one side. */
export function muscleCentre(id, side = 'left', height = 1.69) {
  const m = MUSCLE_BY_ID[id];if (!m) return null;const k = height / 1.69;
  return new THREE.Vector3(m.centre[0] * (side === 'right' ? -1 : 1) * k, m.centre[1] * k, m.centre[2] * k);
}
