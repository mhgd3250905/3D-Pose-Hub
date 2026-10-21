// Native8 draft authoring helper r1. Pure source math; no model, solver, runtime or media mutation.
// Explicit source slices / local phases only. There is deliberately no global duration-scale option.
const clamp = x => Math.max(0, Math.min(1, x));
const ease = {
  cos: u => (1 - Math.cos(Math.PI * clamp(u))) / 2,
  linear: clamp, hold: () => 0,
  smooth: u => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); },
};
// Same key/easing precedence as frozen page/engine.js E.sample; duration is a periodic boundary.
export function sampleTrack(keys, duration, time) {
  const t = ((time % duration) + duration) % duration;
  let v = keys[0][1];
  for (let i = 0; i < keys.length; i++) {
    const [a, va] = keys[i], next = keys[i + 1] || [duration, keys[0][1]], [b, vb] = next;
    if (t >= a && t < b) {
      const e = ease[next[2] || keys[i][2] || 'cos'] || ease.cos;
      return va + (vb - va) * e((t - a) / Math.max(b - a, 1e-6));
    }
    if (t >= b) v = vb;
  }
  return v;
}
export function sourceTimeAt(segments, time) {
  const t = ((time % 8) + 8) % 8;
  const segment = segments.find(([a, b]) => t >= a - 1e-10 && t < b - 1e-10) || segments.at(-1);
  const [a, b, from, to] = segment;
  return from + (to - from) * clamp((t - a) / (b - a));
}
export function compileSlices(base, segments) {
  if (!segments.length || Math.abs(segments[0][0]) > 1e-9 || Math.abs(segments.at(-1)[1] - 8) > 1e-9) throw Error('Explicit native8 slices must cover 0..8');
  for (let i = 0; i < segments.length; i++) {
    const [a, b, from, to] = segments[i];
    if (!(b > a) || from < 0 || to < from || to > base.timeline.duration + 1e-9 || (i && Math.abs(a - segments[i - 1][1]) > 1e-9)) throw Error('Invalid or noncontiguous source slice');
  }
  return Object.fromEntries(Object.entries(base.timeline.tracks).map(([key, values]) => [key,
    Array.from({length: 240}, (_, frame) => [+(frame / 30).toFixed(6),
      +sampleTrack(values, base.timeline.duration, sourceTimeAt(segments, frame / 30)).toFixed(8), 'linear'])]));
}
export function native8(base, options) {
  const {id, segments, tracks, peak, keyFrames, pulseAt, phases, semantics, method} = options;
  const result = {
    ...base, id, modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
    v2plus: {outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'},
    timeline: {duration: 8, tracks: tracks || compileSlices(base, segments)},
    highlight: {...base.highlight, ...(pulseAt ? {pulseAt} : {})},
    camera: {...base.camera, driftPeriod: 8, at: peak},
    stillAt: peak, keyFrames,
    draftNative8: {version: 1, originalSpecId: base.id, originalDuration: base.timeline.duration,
      method, sourceSlices: segments || null, phases, semantics,
      globalTimeStretch: false, sourceQA: 'pending', visualQA: 'pending', editorialReview: 'pending', releaseEligible: false},
  };
  if (result.timeline.duration !== 8 || Object.values(result.timeline.tracks).some(k => !k.length || k.some(([t,v]) => !Number.isFinite(t) || !Number.isFinite(v) || t < 0 || t >= 8))) throw Error('Invalid native8 result');
  return result;
}
