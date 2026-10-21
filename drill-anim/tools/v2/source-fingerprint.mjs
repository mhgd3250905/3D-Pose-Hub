import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function sourceFingerprint(repo,specPath){
  const names=new Set(), add=f=>names.add(path.resolve(f));
  const tree=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())tree(f);else if(/\.(js|mjs|json)$/.test(f))add(f);}};
  for(const d of ['drill-anim/lib','drill-anim/page','drill-anim/assets','runtime/src','drill-anim/tools/v2'])tree(path.join(repo,d));
  for(const mf of ['training-human-v2.json','training-human-v2plus.json','current-production.json']){
    const f=path.join(repo,'drill-anim/models',mf);add(f);const m=JSON.parse(fs.readFileSync(f));for(const p of Object.keys(m.sourceSha256||{}))add(path.join(repo,p));
  }
  add(path.join(repo,'drill-anim/theme.json'));add(path.join(repo,'package-lock.json'));
  const visit=f=>{if(names.has(f))return;add(f);for(const m of fs.readFileSync(f,'utf8').matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))visit(path.resolve(path.dirname(f),m[1]));};visit(specPath);
  const sources=[...names].sort().map(f=>{const b=fs.readFileSync(f);return {path:path.relative(repo,f).replaceAll('\\','/'),bytes:b.length,sha256:sha(b)};});
  return {format:'pose-hub-render-source-manifest@2',sha256:sha(JSON.stringify(sources)),sources};
}
