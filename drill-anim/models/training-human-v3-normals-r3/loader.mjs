// Combined opt-in candidate. Base GLB normals are applied during boot;
// wrist colour and v2plus piece normals are applied during setup. Piece
// normal installation resets the motion to rest, so it is never triggered
// implicitly by a later profile selection.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { boot as bootNormals } from '../training-human-v3-normals-r1/loader.mjs';
import { applyV3 as applyWrist } from '../training-human-v3-wrist-r1/loader.mjs';

export { RESET_JOINTS, warpBase } from '../training-human-v3/loader.mjs';
export const PROFILE = 'training-human-v3-normals';
export const VERSION = '0.1.0-r3';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const models = path.resolve(here, '..');
const script = 'tools/body-v3/piece-normals-r1.js';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')).digest('hex');
const fullProfile = spec => spec?.v2plus?.torso === 'base' && spec?.v2plus?.limbs === 'base' && spec?.v2plus?.hands === 'base';

export function verify() {
  const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
  if (manifest.id !== PROFILE || manifest.version !== VERSION) throw new Error('Unsupported v3 normals r3 manifest');
  for (const [file, expected] of Object.entries(manifest.sourceSha256)) {
    if (hash(path.resolve(repo, file)) !== expected) throw new Error('v3 normals r3 source SHA mismatch: ' + file);
  }
  return manifest;
}

export async function boot(options) {
  verify();
  return bootNormals(options);
}

// Explicit late activation: selects the full profile and resets the motion to
// its rest pose while computing the piece normals. Call only during setup.
export async function activatePieceNormals(page, spec) {
  if (!fullProfile(spec)) throw new Error('v3 piece normals require torso, limbs and hands base profile');
  return page.evaluate(s => {
    const model = window.__v2p;
    if (model?.__pieceNormalsR1) return { already: true };
    if (!window.__bodyV3PieceSeamsR1 || !window.__drill?.selectModelProfile) throw new Error('v3 piece normals not prepared');
    window.__drill.selectModelProfile(s);
    return window.__fixBodyV3PieceNormalsR1(window.__bodyV3PieceSeamsR1);
  }, spec);
}

export async function applyV3(page, spec, options = {}) {
  verify();
  const result = await applyWrist(page, spec, options);
  const seams = Object.fromEntries([
    ['torso', 'training-human-v2plus-torso-base.json'],
    ['limbs', 'training-human-v2plus-limbs-base.json'],
    ['hands', 'hands-native-c1r2/hands-base.json'],
  ].map(([key, file]) => [key, JSON.parse(fs.readFileSync(path.join(models, file), 'utf8')).seam]));
  await page.addScriptTag({ content: fs.readFileSync(path.join(repo, script), 'utf8') });
  await page.evaluate(data => { window.__bodyV3PieceSeamsR1 = data; }, seams);
  const pieceNormals = fullProfile(spec) ? await activatePieceNormals(page, spec) : 'requires-explicit-activation';
  return { ...result, profile: PROFILE, version: VERSION, pieceNormals };
}
