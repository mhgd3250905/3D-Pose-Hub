// CPU posed triangle normals. All matrices are column-major Three.js arrays.
// No Three.js objects or per-frame typed-array allocations are required.
export function buildTopology({positions,normals,indices,joints,weights,restWorld,seamFirst,leftKnee,rightKnee,drawStart=0,drawCount=Infinity}){
 const n=positions.length/3;if(!Number.isInteger(n)||normals.length!==3*n||restWorld.length!==3*n||joints.length!==4*n||weights.length!==4*n||!Number.isInteger(seamFirst)||seamFirst<0||seamFirst>n||leftKnee.length!==3||rightKnee.length!==3)throw Error('knee kernel: malformed input');
 const end=Math.min(indices.length,Number.isFinite(drawCount)?drawStart+drawCount:indices.length);if(drawStart<0||drawStart%3||end%3||end<drawStart)throw Error('knee kernel: invalid draw range');
 const spaceL=new Float32Array(n),spaceR=new Float32Array(n),isTarget=new Uint8Array(n),neighbors=Array.from({length:n},()=>[]),edges=new Map();
 function ease(d){if(d<=.10)return 1;if(d>=.14)return 0;const x=(.14-d)/.04;return x*x*(3-2*x);}
 for(let i=0;i<seamFirst;i++){const x=restWorld[3*i],y=restWorld[3*i+1],z=restWorld[3*i+2];spaceL[i]=ease(Math.hypot(x-leftKnee[0],y-leftKnee[1],z-leftKnee[2]));spaceR[i]=ease(Math.hypot(x-rightKnee[0],y-rightKnee[1],z-rightKnee[2]));}
 function edge(a,b){const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*n+hi;edges.set(key,(edges.get(key)||0)+1);neighbors[a].push(b);neighbors[b].push(a);}
 for(let j=drawStart;j<end;j+=3){const a=indices[j],b=indices[j+1],c=indices[j+2];if(a>=n||b>=n||c>=n)throw Error('knee kernel: invalid index');edge(a,b);edge(b,c);edge(c,a);}
 // Keep every open-topology boundary and the two adjacent vertex rings.
 const dist=new Int16Array(n).fill(-1),queue=[];for(const [key,count]of edges)if(count===1){const a=Math.floor(key/n),b=key%n;for(const i of [a,b])if(dist[i]===-1){dist[i]=0;queue.push(i);}}for(let j=0;j<queue.length;j++){const i=queue[j];if(dist[i]>=3)continue;for(const k of neighbors[i])if(dist[k]===-1){dist[k]=dist[i]+1;queue.push(k);}}
 for(let i=0;i<seamFirst;i++){const f=dist[i]===0?0:dist[i]===1?.25:dist[i]===2?.75:1;spaceL[i]*=f;spaceR[i]*=f;if(spaceL[i]||spaceR[i])isTarget[i]=1;}
 const faces=[],neededFlag=new Uint8Array(n),targets=[];for(let i=0;i<n;i++)if(isTarget[i])targets.push(i);
 for(let j=drawStart;j<end;j+=3){const a=indices[j],b=indices[j+1],c=indices[j+2];if(!isTarget[a]&&!isTarget[b]&&!isTarget[c])continue;faces.push(a,b,c);neededFlag[a]=neededFlag[b]=neededFlag[c]=1;}
 const needed=[];for(let i=0;i<n;i++)if(neededFlag[i])needed.push(i);
 return {n,positions,normals,joints,weights,restWorld,seamFirst,spaceL,spaceR,isTarget,targets:Uint32Array.from(targets),needed:Uint32Array.from(needed),faces:Uint32Array.from(faces),world:new Float64Array(3*n),sum:new Float64Array(3*n),normal:new Float32Array(3*n),mask:new Float32Array(n),stats:{vertices:n,targets:targets.length,needed:needed.length,faces:faces.length/3,boundary:queue.length}};
}

// skinWorld/local have 16 entries per bone. worldNormal and worldToLocal are
// 3x3 column-major; worldToLocal=transpose(mat3(meshWorld)). Normal arrays and
// mask are reused; caller owns marking their THREE.BufferAttributes dirty.
export function updateNormals(t,{skinWorld,skinLocal,worldNormal,worldToLocal,gateLeft,gateRight,breath=0,fieldOn=1,orientation=1}){
 if(!Number.isFinite(gateLeft)||!Number.isFinite(gateRight)||gateLeft<0||gateLeft>1||gateRight<0||gateRight>1||!Number.isFinite(breath)||![1,-1].includes(orientation))throw Error('knee kernel: invalid update state');
 const {positions:P,normals:N,joints:J,weights:W,restWorld:R,world:Q,sum:S,normal:O,mask:M}=t;
 for(const i of t.targets){const f=Math.max(t.spaceL[i]*gateLeft,t.spaceR[i]*gateRight);M[i]=f>0?1:0;S[3*i]=S[3*i+1]=S[3*i+2]=0;}
 if(gateLeft===0&&gateRight===0)return {normal:O,mask:M,active:0};
 for(const i of t.needed){let nx=0,ny=0,nz=0;for(let k=0;k<4;k++){const w=W[4*i+k],j=16*J[4*i+k];if(!w)continue;if(j+15>=skinLocal.length||j+15>=skinWorld.length)throw Error('knee kernel: missing bone matrix');const x=N[3*i],y=N[3*i+1],z=N[3*i+2];nx+=w*(skinLocal[j]*x+skinLocal[j+4]*y+skinLocal[j+8]*z);ny+=w*(skinLocal[j+1]*x+skinLocal[j+5]*y+skinLocal[j+9]*z);nz+=w*(skinLocal[j+2]*x+skinLocal[j+6]*y+skinLocal[j+10]*z);}
  const dx=(R[3*i]-.0)/.16,dy=(R[3*i+1]-1.24)/.12,dz=(R[3*i+2]-.06)/.10,bm=fieldOn>.5?Math.exp(-(dx*dx+dy*dy+dz*dz)*1.6):0,x=P[3*i]+nx*breath*bm,y=P[3*i+1]+ny*breath*bm,z=P[3*i+2]+nz*breath*bm;let qx=0,qy=0,qz=0;
  for(let k=0;k<4;k++){const w=W[4*i+k],j=16*J[4*i+k];if(!w)continue;qx+=w*(skinWorld[j]*x+skinWorld[j+4]*y+skinWorld[j+8]*z+skinWorld[j+12]);qy+=w*(skinWorld[j+1]*x+skinWorld[j+5]*y+skinWorld[j+9]*z+skinWorld[j+13]);qz+=w*(skinWorld[j+2]*x+skinWorld[j+6]*y+skinWorld[j+10]*z+skinWorld[j+14]);}Q[3*i]=qx;Q[3*i+1]=qy;Q[3*i+2]=qz;
 }
 for(let j=0;j<t.faces.length;j+=3){const a=t.faces[j],b=t.faces[j+1],c=t.faces[j+2],ux=Q[3*b]-Q[3*a],uy=Q[3*b+1]-Q[3*a+1],uz=Q[3*b+2]-Q[3*a+2],vx=Q[3*c]-Q[3*a],vy=Q[3*c+1]-Q[3*a+1],vz=Q[3*c+2]-Q[3*a+2],x=(uy*vz-uz*vy)*orientation,y=(uz*vx-ux*vz)*orientation,z=(ux*vy-uy*vx)*orientation;if(t.isTarget[a]){S[3*a]+=x;S[3*a+1]+=y;S[3*a+2]+=z;}if(t.isTarget[b]){S[3*b]+=x;S[3*b+1]+=y;S[3*b+2]+=z;}if(t.isTarget[c]){S[3*c]+=x;S[3*c+1]+=y;S[3*c+2]+=z;}}
 let active=0;for(const i of t.targets){const f=Math.max(t.spaceL[i]*gateLeft,t.spaceR[i]*gateRight);if(f<=0)continue;let x=0,y=0,z=0;for(let k=0;k<4;k++){const w=W[4*i+k],j=16*J[4*i+k];if(!w)continue;const nx=N[3*i],ny=N[3*i+1],nz=N[3*i+2];x+=w*(skinLocal[j]*nx+skinLocal[j+4]*ny+skinLocal[j+8]*nz);y+=w*(skinLocal[j+1]*nx+skinLocal[j+5]*ny+skinLocal[j+9]*nz);z+=w*(skinLocal[j+2]*nx+skinLocal[j+6]*ny+skinLocal[j+10]*nz);}
  let u=worldNormal[0]*x+worldNormal[3]*y+worldNormal[6]*z,v=worldNormal[1]*x+worldNormal[4]*y+worldNormal[7]*z,w=worldNormal[2]*x+worldNormal[5]*y+worldNormal[8]*z,l=Math.hypot(u,v,w);if(l<1e-20)throw Error('knee kernel: singular authored normal');u/=l;v/=l;w/=l;let gx=S[3*i],gy=S[3*i+1],gz=S[3*i+2],gl=Math.hypot(gx,gy,gz);if(gl<1e-20){M[i]=0;continue;}gx/=gl;gy/=gl;gz/=gl;u=u*(1-f)+gx*f;v=v*(1-f)+gy*f;w=w*(1-f)+gz*f;l=Math.hypot(u,v,w);if(l<1e-20){M[i]=0;continue;}u/=l;v/=l;w/=l;x=worldToLocal[0]*u+worldToLocal[3]*v+worldToLocal[6]*w;y=worldToLocal[1]*u+worldToLocal[4]*v+worldToLocal[7]*w;z=worldToLocal[2]*u+worldToLocal[5]*v+worldToLocal[8]*w;l=Math.hypot(x,y,z);if(l<1e-20)throw Error('knee kernel: singular world transform');O[3*i]=x/l;O[3*i+1]=y/l;O[3*i+2]=z/l;active++;
 }return {normal:O,mask:M,active};
}
