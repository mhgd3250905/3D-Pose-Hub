// spec_pulse.mjs --specs a.js,b.js [--fps 30]: per-frame highlight pulse of each spec, the same value the masters renderer
// records (drill-anim/page/engine.js E.pulseAt over the spec timeline). Used when masters are not on this machine.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? a.concat([[x.slice(2), all[i + 1]]]) : a), []));
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const ctx = { window: {}, Math, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(REPO, 'drill-anim/page/engine.js'), 'utf8'), ctx);
const E = ctx.window.__drill, fps = +(args.fps || 30), out = {};
for (const sp of args.specs.split(',')) {
  const spec = (await import(path.join(REPO, sp))).default;
  const D = spec.timeline.duration, n = Math.round(D * fps), frames = [];
  for (let f = 0; f <= n; f++) frames.push({ frame: f, endpoint: f === n, pulse: E.pulseAt(spec.highlight || {}, spec.timeline, f / fps) });
  out[sp] = { durationSeconds: D, fps, complete: true, frames };
}
process.stdout.write(JSON.stringify(out));
