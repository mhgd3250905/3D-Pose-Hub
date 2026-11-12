// List recipes whose prepared spec carries band-like props (read-only, no browser).
import path from 'node:path';import {pathToFileURL} from 'node:url';
const W=process.cwd();
const {loadRecipe}=await import(pathToFileURL(W+'/tools/action-package-v3/recipe-scene.mjs'));
const {allRecipes}=await import(pathToFileURL(W+'/tools/ground-audit-r1/ground-penetration-audit.mjs'));
for(const f of allRecipes()){try{const l=await loadRecipe(f);const ps=(l.source.props||[]).filter(p=>/band|strap|loop|cable/i.test(p.type));
 if(ps.length)console.log([path.basename(f,'.json'),l.prepared.recipe.nameZh,l.prepared.recipe.spec,ps.map(p=>p.type+':'+(typeof p.from==='object'&&!Array.isArray(p.from)?p.from.bone:Array.isArray(p.from)?'W':p.from)+'>'+(typeof p.to==='object'&&!Array.isArray(p.to)?p.to.bone:Array.isArray(p.to)?'W':p.to)).join(',')].join('\t'));}catch(e){console.log(path.basename(f),'ERR',String(e).slice(0,120));}}
