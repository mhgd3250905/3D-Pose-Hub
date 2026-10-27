// Verify UTF-8 text after CRLF -> LF normalization; GLB bytes remain unchanged.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../..');
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
if (manifest.hashPolicy !== 'utf8-crlf-to-lf-text; binary-raw') throw new Error('Unsupported hash policy');
for (const [relative, expected] of Object.entries(manifest.sha256)) {
  const file = path.resolve(repo, relative);
  if (!file.startsWith(repo + path.sep)) throw new Error(`invalid path ${relative}`);
  const bytes = fs.readFileSync(file);
  const canonical = relative.endsWith('.glb') ? bytes : Buffer.from(new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/\r\n/g, '\n'), 'utf8');
  const actual = crypto.createHash('sha256').update(canonical).digest('hex');
  if (actual !== expected) throw new Error(`SHA mismatch for ${relative}`);
}
for (const dependency of manifest.verifyDependencies || []) {
  const file = path.resolve(repo, dependency);
  if (!file.startsWith(repo + path.sep)) throw new Error(`invalid dependency ${dependency}`);
  await import(pathToFileURL(file).href);
}
console.log(JSON.stringify({ version: manifest.version, status: manifest.status, files: Object.keys(manifest.sha256).length }));
