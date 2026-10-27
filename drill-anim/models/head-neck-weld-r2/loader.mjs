// Experimental v3 head/neck weld: paired skinning followed by one mesh with
// shared seam indices. The manifest deliberately marks GLB delivery pending.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));

export function verify() {
  for (const [relative, expected] of Object.entries(manifest.sha256)) {
    const absolute = path.resolve(repo, relative);
    if (!absolute.startsWith(repo + path.sep)) throw new Error(`head-neck-weld-r2: invalid path ${relative}`);
    const bytes = fs.readFileSync(absolute);
    const canonical = relative.endsWith('.glb') ? bytes : Buffer.from(new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/\r\n/g, '\n'), 'utf8');
    const actual = crypto.createHash('sha256').update(canonical).digest('hex');
    if (actual !== expected) throw new Error(`head-neck-weld-r2: SHA mismatch for ${relative}`);
  }
  return { version: manifest.version, status: manifest.status, files: Object.keys(manifest.sha256).length };
}

export async function apply(page) {
  const result = verify();
  const paired = JSON.parse(fs.readFileSync(path.join(here, 'paired-topology.json'), 'utf8'));
  const topology = JSON.parse(fs.readFileSync(path.join(here, 'topological-weld.json'), 'utf8'));
  const pairedModule = await import(pathToFileURL(path.join(repo, 'tools/body-v3/neck-weld-r1/apply_candidate-r4.mjs')).href);
  const weldModule = await import(pathToFileURL(path.join(repo, 'tools/body-v3/head-neck-topological-r1/apply_candidate.mjs')).href);
  const skin = await pairedModule.applyNeckWeld(page, paired);
  const weld = await weldModule.applyTopologicalWeld(page, topology);
  return { ...result, skin, weld };
}
