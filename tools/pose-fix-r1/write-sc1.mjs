// Write drill-anim/specs/<base>-sc1.js from a hand-push state, and repoint the production recipe.
//   node tools/pose-fix-r1/write-sc1.mjs <recipeId> <state.json>
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {allRecipes} from '../ground-audit-r1/ground-penetration-audit.mjs';
const [id,stateFile]=process.argv.slice(2);
const st=JSON.parse(fs.readFileSync(stateFile,'utf8'));if(!st.final)throw Error('state has no final pass');
const rf=allRecipes().find(f=>path.basename(f,'.json')===id);const r=JSON.parse(fs.readFileSync(rf,'utf8'));
const src=r.spec,stem=path.basename(src,'.js'),dst=`drill-anim/specs/${stem}-sc1.js`,newId=`${stem}-sc1`;
const off={};for(const [s,rows] of Object.entries(st.table)){if(rows.some(q=>Math.hypot(q[1],q[2],q[3])>0.0015))off[s]=rows.map(q=>q.map(x=>+x.toFixed(4)));}
const mm=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k,v.d10]));
const maxOff=Object.fromEntries(Object.entries(off).map(([s,rows])=>[s,+(1000*Math.max(...rows.map(q=>Math.hypot(q[1],q[2],q[3])))).toFixed(0)]));
const head=`// ${newId}: self-collision fix r1 (pose-fix r1, 2026-11-05) of ${stem}. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs ${st.radius?'place mode: palm = solved knee + along the real shin + (measured shin radius '+JSON.stringify(st.radius)+' m + gap) on its front/outer face':'push mode: out of the real solved surfaces + 4 mm'},
// max offset per side (mm): ${JSON.stringify(maxOff)}.
// Self-collision d10 before (mm): ${JSON.stringify(mm(st.baseline))}
// after (mm): ${JSON.stringify(mm(st.final.worst))}
`;
fs.writeFileSync(dst,`${head}import base from './${stem}.js';\nimport { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';\nconst OFF = ${JSON.stringify(off)};\nexport default withPalmOffsets(base, '${newId}', OFF);\n`);
execFileSync('python3',['tools/pose-fix-r1/recipe-edit.py','spec',id,dst,'self-collision: hand targets pushed out of the body (hand-push r1)'],{stdio:'inherit'});
console.log(dst,maxOff);
