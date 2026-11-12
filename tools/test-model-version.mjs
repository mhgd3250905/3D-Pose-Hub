import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseArgs, recipeFile, inspectModelVersion, writeReport, REPO } from './model-version.mjs';

assert.throws(() => parseArgs([]), /explicit --recipe/);
assert.throws(() => parseArgs(['--recipe', 'a.json', '--recipe', 'b.json']), /Expected/);
assert.throws(() => recipeFile('drill-anim/specs/h-squat.js'), /raw action spec/);
const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'posehub-version-'));
fs.mkdirSync(path.join(REPO, 'output'), { recursive: true });
const fixtures = fs.mkdtempSync(path.join(REPO, 'output', 'model-version-test-'));
try {
  fs.writeFileSync(path.join(outside, 'recipe.json'), '{}');
  assert.throws(() => recipeFile(path.join(outside, 'recipe.json')), /inside this checkout/);
  const recipe = 'catalog/production/remaining219-r1/recipes/h-squat.json';
  const report = await inspectModelVersion(recipe);
  assert.equal(report.model.profile, 'training-human-v3-armfix');
  assert.equal(report.model.version, '0.1.0-r2');
  assert.deepEqual(report.hands.modes, { left: 'relaxed', right: 'relaxed' });
  assert.equal(report.hands.adapter, 'symmetric-native');
  assert.match(report.checkout.commit, /^[0-9a-f]{40}$/);
  assert.match(report.sourceFingerprint.sha256, /^[0-9a-f]{64}$/);
  assert.ok(report.sourceFingerprint.sourceCount > 0);
  const changed = JSON.parse(fs.readFileSync(path.join(REPO, recipe), 'utf8'));
  changed.specSha256Lf = '0'.repeat(64);
  const driftFile = path.join(fixtures, 'drift.json');
  fs.writeFileSync(driftFile, JSON.stringify(changed));
  await assert.rejects(inspectModelVersion(driftFile), /Recipe source spec LF SHA changed/);
  changed.spec = 'drill-anim/specs/missing-model-version-test.js';
  fs.writeFileSync(driftFile, JSON.stringify(changed));
  await assert.rejects(inspectModelVersion(driftFile), /ENOENT/);
  const output = path.join(outside, 'result.json');
  writeReport(output, report);
  assert.throws(() => writeReport(output, { replaced: true }), /EEXIST/);
  assert.equal(JSON.parse(fs.readFileSync(output)).model.profile, report.model.profile);
  console.log('model-version: explicit recipe, source hashes, model/hand routing, missing source and overwrite guards passed');
} finally {
  // Both exact paths were created by mkdtemp above and contain test artifacts only.
  fs.rmSync(fixtures, { recursive: true });
  fs.rmSync(outside, { recursive: true });
}
