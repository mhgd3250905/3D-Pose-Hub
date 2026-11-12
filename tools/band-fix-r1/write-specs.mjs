// Write <spec>-bf1.js for every recipe in a trim result with afterMax <= 2 mm (band end offsets only), repoint the recipe
// (spec + specSha256Lf). Usage: node tools/band-fix-r1/write-specs.mjs <scan-trim.json> [--dry]
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
const W=process.cwd(),res=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),dry=process.argv.includes('--dry');
const RD=W+'/catalog/production/remaining219-r1/recipes/';
const only=(process.argv.find(a=>a.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
for(const [id,r] of Object.entries(res)){if(only.length&&!only.includes(id))continue;
  if(r.error||r.afterMax==null||r.afterMax>2){console.log('skip',id,r.error||r.afterMax);continue;}
  const base=(await import(pathToFileURL(W+'/'+r.spec))).default;const bb=base.props.filter(p=>p.type==='band');
  if(bb.length!==r.bands.length)throw Error(id+' band count');
  const ch=[];bb.forEach((p,i)=>{for(const w of ['from','to']){const e=p[w],n=r.bands[i][w];if(e&&typeof e==='object'&&!Array.isArray(e)&&e.bone){
    if(n.bone!==e.bone)throw Error(id+' bone');const o0=e.offset||[0,0,0];if(o0.some((x,k)=>Math.abs(x-n.offset[k])>1e-4))ch.push([i,w,e.bone,o0,n.offset]);}}});
  const sp=r.spec.replace(/\.js$/,'-bf1.js'),nid=path.basename(sp,'.js'),bn=path.basename(r.spec);
  const mm=Math.max(...Object.values(r.before).map(e=>e.pen));
  const src=`// ${nid} (band-fix r1, 2026-11-07): the band ends sat inside the limb they hook on (bone-centre anchor), so the tube ran
// through the ankle/shin/foot skin (max ${mm} mm, tools/band-fix-r1/scan-band.mjs). Each bone-attached band end is moved back
// along its own strand to where the strand leaves the skin (clear >= tube radius on every sampled frame; after: ${r.afterMax} mm).
// Only band end offsets change; body pose, timing, other props, camera unchanged.
import base from './${bn}';
const s = structuredClone(base);
s.id = '${nid}';
const bands = s.props.filter(p => p.type === 'band');
for (const [i, w, offset] of ${JSON.stringify(ch.map(c=>[c[0],c[1],c[4]]))}) bands[i][w].offset = offset;
export default s;
`;
  const rf=fs.existsSync(RD+id+'.json')?RD+id+'.json':(await import(pathToFileURL(W+'/tools/ground-audit-r1/ground-penetration-audit.mjs'))).allRecipes().find(f=>path.basename(f,'.json')===id),rec=JSON.parse(fs.readFileSync(rf,'utf8'));if(rec.spec!==r.spec)throw Error(id+' recipe spec moved');
  console.log(id,'->',sp,ch.length,'ends',ch.map(c=>c[1]+c[0]+':'+c[3].map(x=>x.toFixed(3))+'→'+c[4].map(x=>x.toFixed(3))).join(' '));
  if(dry)continue;fs.writeFileSync(W+'/'+sp,src);
  rec.spec=sp;rec.specSha256Lf=crypto.createHash('sha256').update(Buffer.from(src.replace(/\r\n/g,'\n'))).digest('hex');
  const txt=fs.readFileSync(rf,'utf8');const nl=txt.endsWith('\n')?'\n':'';const ind=/\n {2}"/.test(txt)?2:1;
  fs.writeFileSync(rf,JSON.stringify(rec,null,ind)+nl);}
