import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const profiles = ['contact-r4', 'contact-r5', 'barefoot-r4', 'barefoot-r5', 'grip-r6'];
const sources = new Set();

for (const profile of profiles) {
  const directory = path.join(root, 'drill-anim/models', profile);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  for (const source of Object.keys(manifest.sourceSha256)) {
    sources.add(path.relative(root, path.resolve(directory, source)).split(path.sep).join('/'));
  }
  test(`${profile}: checked-out source bytes match the frozen manifest`, () => {
    for (const [source, expected] of Object.entries(manifest.sourceSha256)) {
      const bytes = fs.readFileSync(path.resolve(directory, source));
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, source);
    }
  });
}

test('Git preserves pinned source bytes even with core.autocrlf=true', () => {
  for (const source of sources) {
    const output = execFileSync('git', [
      '-c', 'core.autocrlf=true', 'check-attr', '-z', 'text', 'eol', '--', source,
    ], { cwd: root, encoding: 'utf8' }).split('\0');
    const attributes = new Map();
    for (let i = 0; i + 2 < output.length; i += 3) attributes.set(output[i + 1], output[i + 2]);
    if (source.endsWith('.json')) {
      assert.equal(attributes.get('text'), 'unset', source);
    } else {
      assert.equal(attributes.get('text'), 'set', source);
      assert.equal(attributes.get('eol'), 'lf', source);
    }
  }
});
