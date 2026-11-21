// Pose Studio (ps-b2000 build) headless mesh close-ups. usage: node shot.mjs <anim.json> <outPrefix> <jobs.json>
// jobs.json: [{"f":frame,"p":[x,y,z],"t":[x,y,z],"fov":30,"name":"x"}]  (world coords of the anim)
import { chromium } from '/workspace/work/pw148/node_modules/playwright-core/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const DIST = '/workspace/work/ps-b2000', [animF, outP, jobsF] = process.argv.slice(2), jobs = JSON.parse(fs.readFileSync(jobsF, 'utf8'));
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  let f = p.startsWith('/anim/afshot') ? animF : path.join(DIST, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(8873);
process.env.LD_LIBRARY_PATH = '/workspace/work/pw148/libs:' + (process.env.LD_LIBRARY_PATH || '');
const b = await chromium.launch({ executablePath: '/workspace/work/pw148/browsers/chromium-1140/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1'] });
const errs = [];
try {
  const p = await (await b.newContext({ viewport: { width: 1300, height: 1100 }, serviceWorkers: 'block' })).newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8873/?anim=afshot&clean=1&fx=0', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__poseStudio?.ready && window.__poseStudio.anim, null, { timeout: 170000 });
  for (const j of jobs) {
    await p.evaluate(j => { const S = window.__poseStudio; S.goFrame(j.f); S.setCam({ p: j.p, t: j.t, f: j.fov || 30 }); }, j);
    await p.waitForTimeout(700);
    await p.locator('#stage canvas').first().screenshot({ path: `${outP}-${j.name}.png` });
  }
  console.log(JSON.stringify({ ok: true, n: jobs.length, errs }));
} finally { await b.close(); srv.close(); }
