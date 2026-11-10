// Resolve an explicit action recipe through the same model/hand route as production.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadRecipe } from './action-package-v3/recipe-scene.mjs';

const self = fileURLToPath(import.meta.url);
export const REPO = path.resolve(path.dirname(self), '..');

export function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!['--recipe', '--out'].includes(key) || !args[i + 1] || args[i + 1].startsWith('--') || options[key]) {
      throw new Error('Expected --recipe <recipe.json> [--out <new-file.json>]');
    }
    options[key] = args[i + 1];
  }
  if (!options['--recipe']) throw new Error('An explicit --recipe is required; global current-production.json is not an action recipe');
  return { recipe: options['--recipe'], out: options['--out'] };
}

export function recipeFile(input) {
  if (typeof input !== 'string' || !input.endsWith('.json')) throw new Error('Provide an explicit recipe JSON, not a raw action spec');
  const file = fs.realpathSync(path.resolve(REPO, input));
  const relative = path.relative(fs.realpathSync(REPO), file);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw new Error('Recipe must be inside this checkout');
  }
  if (!fs.statSync(file).isFile()) throw new Error('Recipe must be a file');
  return file;
}

export async function inspectModelVersion(input) {
  const file = recipeFile(input);
  const loaded = await loadRecipe(file);
  const { prepared, source, adapter, pinned } = loaded;
  const model = await import(pathToFileURL(path.join(REPO, adapter.loader)));
  await model.verify();
  model.checkSpec(source);
  // Native rest/support presets are installed separately by openScene.
  if (prepared.handSetup.adapter === 'symmetric-native') {
    const presets = await import('../drill-anim/models/fixed-hand-presets-r1/loader.mjs');
    await presets.verify();
  }
  const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
  const relative = absolute => path.relative(REPO, absolute).replaceAll('\\', '/');
  const globalDefault = JSON.parse(fs.readFileSync(path.join(REPO, 'drill-anim/models/current-production.json'), 'utf8'));
  const routingFiles = ['tools/model-version.mjs', 'tools/action-package-v3/recipe-scene.mjs', 'tools/action-package-v3/model-adapters.mjs', 'tools/action-package-v3/models.json'];
  const routingSha256Lf = Object.fromEntries(routingFiles.map(file => [file,
    createHash('sha256').update(fs.readFileSync(path.join(REPO, file), 'utf8').replace(/\r\n/g, '\n')).digest('hex'),
  ]));
  return {
    format: 'pose-hub-model-version-report@1',
    scope: 'local-recipe-source-verification',
    checkout: {
      commit: git('rev-parse', 'HEAD'),
      branch: git('branch', '--show-current'),
      hasWorkingTreeChanges: !!git('status', '--porcelain'),
    },
    actionId: prepared.recipe.id,
    recipe: { path: relative(file), sha256: prepared.recipeSha256 },
    spec: { path: relative(prepared.specFile), id: source.id, sha256Lf: prepared.recipe.specSha256Lf },
    model: { profile: adapter.profile, version: adapter.version, loader: adapter.loader, authoring: adapter.authoring },
    hands: structuredClone(prepared.handSetup),
    jointCorrections: prepared.recipe.jointCorrections ?? [],
    actionCorrective: loaded.corrective?.id ?? null,
    sourceFingerprint: { sha256: pinned.sha256, sourceCount: pinned.sources.length },
    routingSha256Lf,
    legacyGlobalDefault: {
      profile: globalDefault.modelProfile,
      version: globalDefault.modelVersion,
      note: 'Historical global default. This action is selected by the explicit recipe above.',
    },
    validation: {
      recipeAndSpec: 'verified',
      modelSources: 'verified',
      runtimeHandSelection: 'requires actual render evidence',
      publicationStatus: 'not inferred from a local recipe',
    },
  };
}

export function writeReport(file, report) {
  const output = path.resolve(file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}

if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  try {
    const { recipe, out } = parseArgs(process.argv.slice(2));
    const report = await inspectModelVersion(recipe);
    if (out) writeReport(out, report);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Model version check failed: ' + error.message);
    process.exitCode = 1;
  }
}
