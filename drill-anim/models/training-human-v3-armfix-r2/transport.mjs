// Transport a corrective field between matching rest surfaces. Tangent edges are
// mapped exactly per triangle; unit surface-normal thickness is retained. This is
// a local surface transport, not a claim of pose acceptance or a new fit.
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>Math.hypot(...a);
export const unit=a=>{const n=norm(a);if(n<1e-12)throw Error('transport degenerate direction');return a.map(x=>x/n);};
export const mv=(a,v)=>[0,1,2].map(i=>dot(a.slice(i*3,i*3+3),v));
export const transpose=a=>[a[0],a[3],a[6],a[1],a[4],a[7],a[2],a[5],a[8]];
export const mm=(a,b)=>{const t=transpose(b);return a.flatMap((_,i)=>i%3?[]:[0,1,2].map(j=>dot(a.slice(i,i+3),t.slice(3*j,3*j+3))));};
export const det=a=>dot(a.slice(0,3),cross(a.slice(3,6),a.slice(6,9)));
export function inverse(a){const d=det(a);if(!Number.isFinite(d)||Math.abs(d)<1e-12)throw Error('transport singular matrix');return transpose([...cross(a.slice(3,6),a.slice(6,9)),...cross(a.slice(6,9),a.slice(0,3)),...cross(a.slice(0,3),a.slice(3,6))]).map(x=>x/d);}
const cols=(a,b,c)=>transpose([...a,...b,...c]);
const point=(a,i)=>a.slice(3*i,3*i+3);
export function surfaceMaps(oldMesh,newMesh){
 if(oldMesh.count!==newMesh.count||oldMesh.world.length!==newMesh.world.length||oldMesh.index.length!==newMesh.index.length||oldMesh.index.some((v,i)=>v!==newMesh.index[i]))throw Error('transport topology differs');
 if(oldMesh.joints.length!==newMesh.joints.length||oldMesh.joints.some((v,i)=>v!==newMesh.joints[i])||oldMesh.weights.some((v,i)=>Math.abs(v-newMesh.weights[i])>1e-7))throw Error('transport skin influences differ');
 const sums=Array.from({length:oldMesh.count},()=>new Float64Array(9)),weights=new Float64Array(oldMesh.count);let faces=0,degenerate=0;
 for(let k=0;k<oldMesh.index.length;k+=3){const ids=oldMesh.index.slice(k,k+3),a=ids.map(i=>point(oldMesh.world,i)),b=ids.map(i=>point(newMesh.world,i));
  const u=sub(a[1],a[0]),v=sub(a[2],a[0]),U=sub(b[1],b[0]),V=sub(b[2],b[0]),n=cross(u,v),N=cross(U,V),area=norm(n),areaNew=norm(N);
  if(area<1e-12||areaNew<1e-12){degenerate++;continue;}
  const F=mm(cols(U,V,unit(N)),inverse(cols(u,v,unit(n))));if(det(F)<=0)throw Error('transport inverted triangle');
  for(const id of ids){for(let j=0;j<9;j++)sums[id][j]+=F[j]*area;weights[id]+=area;}faces++;
 }
 let maxCondition=0,minDet=Infinity,maxDet=0,missing=0;
 const maps=sums.map((s,i)=>{if(!weights[i]){missing++;return null;}const F=Array.from(s,x=>x/weights[i]),D=det(F),I=inverse(F),condition=Math.hypot(...F)*Math.hypot(...I);if(D<=0||condition>30)throw Error('transport invalid averaged gradient '+i+' det '+D+' condition '+condition);maxCondition=Math.max(maxCondition,condition);minDet=Math.min(minDet,D);maxDet=Math.max(maxDet,D);return F;});
 return {maps,report:{faces,degenerate,missing,minDet,maxDet,maxCondition,method:'incident-area-weighted triangle tangent-edge maps; unit normal thickness; positive determinant; Frobenius condition <=30'}};
}
export function skinLinear(mesh,id){
 const a=new Array(9).fill(0);for(let k=0;k<4;k++){const w=mesh.weights[id*4+k],b=mesh.bones[mesh.joints[id*4+k]]?.matrix;if(!w)continue;if(!b)throw Error('transport missing bone');for(let r=0;r<3;r++)for(let c=0;c<3;c++)a[r*3+c]+=w*b[c*4+r];}
 // Current retained base and shared/garment bind matrices are identity. Reject
 // another binding rather than silently applying an incomplete conversion.
 const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];for(const key of['matrixWorld','bindMatrix','bindMatrixInverse'])if(mesh[key].some((v,i)=>Math.abs(v-identity[i])>1e-6))throw Error('transport unsupported nonidentity '+key);
 return a;
}
export function transportOffsets(data,oldMesh,newMesh,maps){
 const bytes=Buffer.from(data.bindOffsetsF32,'base64');if(bytes.length!==data.vertexIds.length*12)throw Error('transport offset byte length');const out=Buffer.alloc(bytes.length);let maxOldMm=0,maxNewMm=0,maxRatio=0;
 data.vertexIds.forEach((id,i)=>{const F=maps[id];if(!F)throw Error('transport unsupported corrective vertex '+id);const old=[0,1,2].map(j=>bytes.readFloatLE(12*i+4*j)),oldWorld=mv(skinLinear(oldMesh,id),old),newWorld=mv(F,oldWorld),next=mv(inverse(skinLinear(newMesh,id)),newWorld);if(!next.every(Number.isFinite))throw Error('transport nonfinite delta');next.forEach((v,j)=>out.writeFloatLE(v,12*i+4*j));maxOldMm=Math.max(maxOldMm,norm(oldWorld)*1000);maxNewMm=Math.max(maxNewMm,norm(newWorld)*1000);if(norm(oldWorld)>1e-9)maxRatio=Math.max(maxRatio,norm(newWorld)/norm(oldWorld));});
 return {data:{...data,version:'shoulder-corrective-armfix-r2',bindOffsetsF32:out.toString('base64')},report:{vertices:data.vertexIds.length,maxOldMm,maxNewMm,maxRatio}};
}
export function transportNormals(rows,maps){let maxDegrees=0;const result=rows.map(row=>{const[id,side,...normal]=row,F=maps[id];if(!F)throw Error('transport unsupported normal vertex '+id);const next=unit(mv(transpose(inverse(F)),normal));maxDegrees=Math.max(maxDegrees,Math.acos(Math.max(-1,Math.min(1,dot(next,normal))))*180/Math.PI);return[id,side,...next];});return {rows:result,report:{vertices:rows.length,maxDirectionChangeDegrees:maxDegrees}};}
