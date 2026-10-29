// Read-only CPU ray queries against an actual-render geometry dump.
// Does not launch a renderer or change model/capture sources.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const mul=(a,s)=>a.map(x=>x*s);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a);if(n<1e-12)throw Error('Degenerate camera direction');return mul(a,1/n);};
const weighted=(a,w)=>a[0].map((_,j)=>a.reduce((s,p,i)=>s+p[j]*w[i],0));

export function pixelRay(camera,x,y,width=480,height=480){
  if(![x,y,width,height,camera.fov].every(Number.isFinite)||width<=0||height<=0||camera.fov<=0||camera.fov>=180)throw Error('Invalid pixel, dimensions or perspective FOV');
  if(x<0||x>=width||y<0||y>=height)throw Error('Pixel outside image');
  const forward=unit(sub(camera.target,camera.position));
  const right=unit(cross(forward,camera.up??[0,1,0]));
  const up=cross(right,forward),t=Math.tan(camera.fov*Math.PI/360);
  // Integer coordinates mean pixel centers; fractional coordinates are allowed.
  const sx=((x+.5)/width*2-1)*t*(camera.aspect??width/height);
  const sy=(1-(y+.5)/height*2)*t;
  return {origin:camera.position,direction:unit(add(forward,add(mul(right,sx),mul(up,sy))))};
}

export function locatePixel(geometry,camera,{x,y,width=480,height=480,includeBackfaces=false,limit=12}={}){
  const ray=pixelRay(camera,x,y,width,height),hits=[];
  for(const [mesh,m]of Object.entries(geometry.meshes)){
    const vertices=new Map(m.vertices.map(v=>[v.id,v]));
    for(const [faceIndex,ids]of m.facesOriginalIndices.entries()){
      const vs=ids.map(i=>vertices.get(i));if(vs.some(v=>!v))throw Error('Missing face vertex: '+mesh+'/'+faceIndex);
      const [a,b,c]=vs.map(v=>v.world),e1=sub(b,a),e2=sub(c,a),p=cross(ray.direction,e2),det=dot(e1,p);
      if(Math.abs(det)<1e-14)continue;
      const s=sub(ray.origin,a),u=dot(s,p)/det;if(u< -1e-9||u>1+1e-9)continue;
      const q=cross(s,e1),v=dot(ray.direction,q)/det;if(v< -1e-9||u+v>1+1e-9)continue;
      const distance=dot(e2,q)/det;if(distance<1e-8)continue;
      const frontFacing=det>0;
      // Arrays lack per-face group/material indices in the probe. Keep those
      // hits but mark visibility uncertain instead of inventing a material.
      const material=Array.isArray(m.material)?null:m.material;
      const side=material?.side;
      const culled=side===0?!frontFacing:side===1?frontFacing:false;
      if(culled&&!includeBackfaces)continue;
      const barycentric=[1-u-v,u,v],weights={};
      vs.forEach((vert,i)=>vert.weights.forEach(w=>weights[w.bone]=(weights[w.bone]??0)+barycentric[i]*w.weight));
      hits.push({mesh,faceIndex,vertexIds:ids,distanceMetres:distance,world:weighted([a,b,c],barycentric),barycentric,
        faceNormal:unit(cross(e1,e2)),frontFacing,materialSide:side??null,culledByMaterial:culled,
        materialVisibilityKnown:material!==null&&side!==undefined,
        interpolatedWeights:Object.entries(weights).map(([bone,weight])=>({bone,weight})).sort((a,b)=>b.weight-a.weight),
        vertices:vs.map(v=>({id:v.id,world:v.world,weights:v.weights}))});
    }
  }
  hits.sort((a,b)=>a.distanceMetres-b.distanceMetres);
  return {pixel:{x,y,width,height},ray,totalIntersections:hits.length,hits:hits.slice(0,limit),
    limitations:['CPU geometry excludes shader displacement, opacity, clipping and unsampled meshes.','Unknown material groups are not culled; inspect materialVisibilityKnown before calling the nearest hit visible.','Pixel centers and the recorded perspective position/target/FOV are used; custom camera up/aspect must be supplied when applicable.']};
}

export function main(argv=process.argv.slice(2)){
  const args={};for(let i=0;i<argv.length;i+=2){if(!argv[i]?.startsWith('--')||argv[i+1]===undefined)throw Error('Expected --name value pairs');args[argv[i].slice(2)]=argv[i+1];}
  for(const key of ['root','frame','view','x','y'])if(!(key in args))throw Error('Required --root DIR --frame 60 --view left-back --x 330 --y 157 [--width 480 --height 480 --limit 12 --include-backfaces true --out FILE]');
  const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
  const root=path.resolve(args.root),probe=read(path.join(root,'probe.json')),frame=Number(args.frame);
  const sample=probe.samples.find(s=>s.frame===frame);if(!sample)throw Error('Frame not present: '+frame);
  const camera=sample.views[args.view];if(!camera)throw Error('View not present: '+args.view);
  const result={source:{root,frame,view:args.view,image:camera.file,geometry:sample.geometry},...locatePixel(read(path.join(root,sample.geometry)),camera,
    {x:Number(args.x),y:Number(args.y),width:Number(args.width??480),height:Number(args.height??480),limit:Number(args.limit??12),includeBackfaces:args['include-backfaces']==='true'})};
  const json=JSON.stringify(result,null,2)+'\n';
  if(args.out)fs.writeFileSync(path.resolve(args.out),json,{flag:'wx'});
  console.log(json);return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main();
