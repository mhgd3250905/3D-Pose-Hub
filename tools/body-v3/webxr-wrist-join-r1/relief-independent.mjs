// CPU-only independent extraction of actual old/new JS kernels; no renderer.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import * as T from 'three';
const [captureDir,recipePath,output]=process.argv.slice(2);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const recipe=read(recipePath),manifest=read(captureDir+'/report.json');
const oldSource=fs.readFileSync(captureDir+'/source-runtime.js','utf8'),newSource=fs.readFileSync(new URL('./runtime.js',import.meta.url),'utf8');
function kernel(source){const start=source.indexOf('function arcState('),end=source.indexOf('function limbSkinWorld(',start);if(start<0||end<0)throw Error('Kernel boundaries missing');const c=vm.createContext({T,Y:new T.Vector3(0,1,0),smooth:x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}});vm.runInContext(source.slice(start,end),c);return c;}
const old=kernel(oldSource),candidate=kernel(newSource),rows=[];
for(const row of manifest.rows){if(Math.abs(row.command.flexDeg)>60)continue;const data=read(captureDir+'/'+row.file),sides={};
 for(const side of ['left','right']){const s=data.sides[side],nf=recipe.neutralFrames[side],br=recipe.bridge[side],nc=new T.Matrix4().fromArray(nf.canonicalToWorldRowMajor).transpose(),map=new T.Matrix4().fromArray(nf.webCanonicalToHandLocalRowMajor).transpose();const basis=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().fromArray(s.forearmMatrixWorld)).multiply(new T.Quaternion().fromArray(nf.forearmWorldQuaternion).invert()).multiply(new T.Quaternion().setFromRotationMatrix(nc));const hc=new T.Matrix4().fromArray(s.handMatrixWorld).multiply(map),q=basis.clone().invert().multiply(new T.Quaternion().setFromRotationMatrix(hc)).normalize(),os=old.arcState(q.clone()),ns=candidate.arcState(q.clone());const delta=br.vertices.flatMap(r=>candidate.target(new T.Vector3().fromArray(r.canonicalRest),ns).sub(old.target(new T.Vector3().fromArray(r.canonicalRest),os)).applyQuaternion(basis).toArray());sides[side]={delta};}
 rows.push({name:row.name,sides});
}
fs.writeFileSync(output,JSON.stringify({prediction:true,renderTime:false,candidateRuntimeSha256:crypto.createHash('sha256').update(newSource).digest('hex'),sourceRuntimeSha256:crypto.createHash('sha256').update(oldSource).digest('hex'),rows}),{flag:'wx'});
console.log(JSON.stringify({rows:rows.length,output}));
