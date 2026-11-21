// Pose Studio headless clean snaps. usage: MODEL=<glb> node shot.mjs <anim.json> <outPrefix> <jobs.json> [W H]
// jobs: [{"f":frame,"p":[..],"t":[..],"fov":30,"name":"x"}]   (p omitted -> anim.cams.v0)
import { chromium } from '/workspace/work/pw148/node_modules/playwright-core/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const DIST = '/workspace/work/ps-b2000', [animF, outP, jobsF, W = '900', H = '900'] = process.argv.slice(2), jobs = JSON.parse(fs.readFileSync(jobsF, 'utf8'));
const MODEL = process.env.MODEL;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  let f = p.startsWith('/anim/afshot') ? animF : (MODEL && p === '/model/coach-v3r3.glb') ? MODEL : path.join(DIST, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(8874);
process.env.LD_LIBRARY_PATH = '/workspace/work/pw148/libs:' + (process.env.LD_LIBRARY_PATH || '');
const b = await chromium.launch({ executablePath: '/workspace/work/pw148/browsers/chromium-1140/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1'] });
const errs = [];
try {
  const p = await (await b.newContext({ viewport: { width: 1200, height: 800 }, serviceWorkers: 'block' })).newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8874/?anim=afshot&clean=1&fx=0', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__poseStudio?.ready && window.__poseStudio.anim, null, { timeout: 170000 });
  let i = 0;
  for (const j of jobs) { if (process.env.SKIP && fs.existsSync(`${outP}-${j.name}.png`)) continue;
    const u = await p.evaluate(([j, w, h]) => { const S = window.__poseStudio; S.goFrame(j.f, { play: true });
      S.setCam(j.p ? { p: j.p, t: j.t, f: j.fov || 30 } : S.anim.cams.v0); return S.snap(w, h); }, [j, +W, +H]);
    fs.writeFileSync(`${outP}-${j.name}.png`, Buffer.from(u.split(',')[1], 'base64'));
    if (++i % 20 === 0) console.log(i);
  }
  console.log(JSON.stringify({ ok: true, n: jobs.length, errs }));
} finally { await b.close(); srv.close(); }
