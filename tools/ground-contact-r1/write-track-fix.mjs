// Write a -gc1 copy of a literal (JSON-style) spec with its pelvis-height / hip-pitch tracks offset.
//   node write-track-fix.mjs <src.js> <dst.js> <newId> <fixModule.mjs> "<header comment>"
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const [src,dst,id,fixMod,note]=process.argv.slice(2);
const spec=structuredClone((await import(pathToFileURL(path.resolve(src)))).default);
(await import(pathToFileURL(path.resolve(fixMod)))).fix(spec);spec.id=id;
for(const t of Object.values(spec.timeline.tracks))for(const p of t)p[1]=+p[1].toFixed(5);
fs.writeFileSync(dst,`// ${id}: ground-contact fix r1 (2026-11-03) of ${path.basename(src)}. ${note}\nexport default ${JSON.stringify(spec,null,2)};\n`);
