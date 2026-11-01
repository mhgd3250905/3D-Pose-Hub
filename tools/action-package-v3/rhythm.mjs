// rhythm.mjs --recipes <dir> [--out file]: derive each action's rep rhythm from its spec's own main (pulse) track.
// Output per action: reps per loop, per-rep phases go/hold/back/rest (seconds), and the source comment's own "N reps / D s".
// Thresholds: bottom < 10 %, top > 90 % of the track's range; one rep = one rise through 50 %.
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? a.concat([[x.slice(2), all[i + 1]]]) : a), []));
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const dir = path.resolve(args.recipes);
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (r.format !== 'pose-hub-action-recipe@1') continue;
  const specPath = path.join(REPO, r.spec);
  const row = { spec: r.spec };
  try {
    const src = fs.readFileSync(specPath, 'utf8');
    const m = src.match(/(\d+)\s*reps?\s*\/\s*(\d+(?:\.\d+)?)\s*s/i) || src.match(/(\d+)\s*次\s*\/\s*(\d+(?:\.\d+)?)\s*s/);
    if (m) row.comment = { reps: +m[1], seconds: +m[2] };
    const hm = src.match(/hold[^\n]{0,40}?(\d+(?:\.\d+)?)\s*s/i);
    if (hm) row.commentHold = hm[0].slice(0, 60);
    const spec = (await import(specPath)).default;
    const tr = spec.timeline.tracks, D = spec.timeline.duration;
    const name = spec.highlight?.pulseTrack && tr[spec.highlight.pulseTrack] ? spec.highlight.pulseTrack : Object.keys(tr || {})[0];
    row.duration = D; row.track = name || null; row.highlightSide = spec.highlight?.side ?? null;
    row.tracks = Object.keys(tr || {});
    if (!name) { row.reps = 0; out[r.id] = row; continue; }
    const sampler = k => t => { if (typeof k === 'function') return k(t); if (!Array.isArray(k)) return 0; let a = k[0];
      for (const b of k) { if (b[0] >= t) { if (b === a) return b[1]; const u = (t - a[0]) / (b[0] - a[0] || 1); return a[1] + (b[1] - a[1]) * u; } a = b; } return a[1]; };
    const spread = k => { const f = sampler(k), v = []; for (let i = 0; i <= 240; i++) v.push(+f(i * D / 240) || 0); return Math.max(...v) - Math.min(...v); };
    if (spread(tr[name]) < 1e-3) {   // pulse track is flat: fall back to the most-moving track (Thomas specs)
      const best = Object.keys(tr).map(n => [n, spread(tr[n])]).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > 1e-3) { row.trackFallback = best[0]; }
    }
    const k = tr[row.trackFallback || name];
    const val = t => { if (typeof k === 'function') return k(t); let a = k[0];
      for (const b of k) { if (b[0] >= t) { if (b === a) return b[1]; const u = (t - a[0]) / (b[0] - a[0] || 1); return a[1] + (b[1] - a[1]) * u; } a = b; } return a[1]; };
    const dt = 1 / 30, S = [];
    for (let i = 0; i <= Math.round(D / dt); i++) S.push(val(i * dt));
    const lo = Math.min(...S), hi = Math.max(...S), rng = hi - lo;
    row.range = [+lo.toFixed(3), +hi.toFixed(3)];
    if (rng < 1e-3) { row.reps = 0; row.static = true; out[r.id] = row; continue; }
    const n = S.map(v => (v - lo) / rng);
    const state = n.map(v => (v > 0.9 ? 'T' : v < 0.1 ? 'B' : 'M'));
    let reps = 0; for (let i = 1; i < n.length; i++) if (n[i - 1] < 0.5 && n[i] >= 0.5) reps++;
    row.reps = reps;
    // segment run-lengths over the loop, starting at the first bottom
    const runs = []; for (let i = 0; i < state.length; i++) { const s = state[i]; if (runs.length && runs.at(-1).s === s) runs.at(-1).n++; else runs.push({ s, n: 1 }); }
    // fold mid runs into rising/falling by neighbours
    const segs = runs.map((x, i) => ({ ...x, kind: x.s === 'T' ? 'hold' : x.s === 'B' ? 'rest' : (runs[i + 1]?.s === 'T' || runs[i - 1]?.s === 'B' ? 'go' : 'back') }));
    const sum = kind => +(segs.filter(s => s.kind === kind).reduce((a, s) => a + s.n, 0) * dt / Math.max(reps, 1)).toFixed(2);
    row.phases = { go: sum('go'), hold: sum('hold'), back: sum('back'), rest: sum('rest') };
    row.repSeconds = +(D / Math.max(reps, 1)).toFixed(2);
  } catch (e) { row.error = String(e.message || e).slice(0, 200); }
  out[r.id] = row;
}
const text = JSON.stringify(out, null, 1);
if (args.out) fs.writeFileSync(args.out, text + '\n'); else console.log(text);
