// Opt-in numerical/visual candidate for normals of the warped base GLB.
// The extra v2plus torso, limbs, and hands have not been corrected here.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { boot as bootBase } from '../training-human-v3/loader.mjs';

export { applyV3, RESET_JOINTS, warpBase } from '../training-human-v3/loader.mjs';
export const PROFILE = 'training-human-v3-normals';
export const VERSION = '0.1.0-r1';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const script = 'tools/body-v3/arm-normals-r1.js';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')).digest('hex');

export function verify() {
  const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
  if (manifest.id !== PROFILE || manifest.version !== VERSION) throw new Error('Unsupported v3 normals candidate manifest');
  for (const [file, expected] of Object.entries(manifest.sourceSha256)) {
    if (hash(path.resolve(repo, file)) !== expected) throw new Error('v3 normals candidate source SHA mismatch: ' + file);
  }
  return manifest;
}

export async function boot(options) {
  verify();
  const session = await bootBase(options);
  try {
    await session.p.addScriptTag({ content: fs.readFileSync(path.join(repo, script), 'utf8') });
    session.info.armNormals = await session.p.evaluate(() => window.__fixBodyV3ArmNormalsR1());
    return session;
  } catch (error) {
    await session.b.close().catch(() => {});
    throw error;
  }
}
