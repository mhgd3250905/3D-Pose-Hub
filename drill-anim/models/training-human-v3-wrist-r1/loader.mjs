// Explicit v3 wrist-colour candidate. The v3 base loader and all frozen
// model sources remain unchanged; this wrapper only installs the r2 material
// patch on the c1r2 hands after the base candidate is loaded.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { applyV3 as applyBaseV3 } from '../training-human-v3/loader.mjs';

export { boot, RESET_JOINTS, warpBase } from '../training-human-v3/loader.mjs';
export const PROFILE = 'training-human-v3-wrist';
export const VERSION = '0.1.0-r1';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const patch = 'tools/body-v3/wrist-gradient-r2.js';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')).digest('hex');

export function verify() {
  const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
  if (manifest.id !== PROFILE || manifest.version !== VERSION) throw new Error('Unsupported v3 wrist candidate manifest');
  for (const [file, expected] of Object.entries(manifest.sourceSha256)) {
    if (hash(path.resolve(repo, file)) !== expected) throw new Error('v3 wrist candidate source SHA mismatch: ' + file);
  }
  return manifest;
}

export async function applyV3(page, spec, options = {}) {
  verify();
  const handDir = options.handDir ?? 'hands-native-c1r2';
  if (handDir !== 'hands-native-c1r2') throw new Error('v3 wrist candidate requires hands-native-c1r2');
  const result = await applyBaseV3(page, spec, { ...options, handDir });
  await page.addScriptTag({ content: fs.readFileSync(path.join(repo, patch), 'utf8') });
  const wrist = await page.evaluate(() => window.__installBodyV3WristGradientR2());
  return { ...result, profile: PROFILE, version: VERSION, wrist };
}
