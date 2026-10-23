// Orthographic mesh inspection, using ordinary smooth lighting without animation.
import fs from 'node:fs';
import path from 'node:path';
import {boot} from '../../../drill-anim/lib/boot.mjs';
import {loadTheme} from '../../../drill-anim/lib/config.mjs';
const [restFile,assetFile,out]=process.argv.slice(2);
if(!restFile||!assetFile||!out)throw Error('Usage: inspect.mjs rest.json hands-base.json new-output-directory');
if(fs.existsSync(out))throw Error('Output exists; choose a new inspection directory');
fs.mkdirSync(out,{recursive:true});const rest=JSON.parse(fs.readFileSync(restFile)),data=JSON.parse(fs.readFileSync(assetFile));
const {b,p}=await boot({size:1080,pr:1,theme:loadTheme()});
try{
 await p.evaluate(([data,hand])=>{
  const T=__toonT,decode=(s,C)=>{const b=atob(s),u=Uint8Array.from(b,c=>c.charCodeAt(0));return new C(u.buffer);};
  const pq=decode(data.pos.u16,Uint16Array),f=decode(data.index.u16,Uint16Array),pos=[],idx=[],h=new T.Matrix4().compose(new T.Vector3(...hand.p),new T.Quaternion(...hand.q),new T.Vector3(1,1,1)),inv=h.invert(),v=new T.Vector3();
  for(let i=0;i<data.n;i++){v.set(...data.pos.lo.map((x,c)=>x+pq[i*3+c]*data.pos.scale[c])).applyMatrix4(inv);pos.push(...v.toArray());}
  for(let i=0;i<f.length;i+=3)if([f[i],f[i+1],f[i+2]].every(j=>data.pos.lo[0]+pq[j*3]*data.pos.scale[0]>0))idx.push(f[i],f[i+1],f[i+2]);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setIndex(idx);geometry.computeVertexNormals();
  window.inspection={geometry};
 },[data,rest.bones.leftHand]);
 for(const view of ['back','palm','radial','oblique']){
  const shot=await p.evaluate(view=>{
   const T=__toonT,v=flareInspector.viewer,scene=new T.Scene();scene.background=new T.Color('#222831');
   scene.add(new T.Mesh(inspection.geometry,new T.MeshStandardMaterial({color:0xb2b7bd,roughness:.8,metalness:0,side:T.DoubleSide})));
   scene.add(new T.HemisphereLight(0xffffff,0x42444a,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(.1,view==='palm'?-.35:.35,.3);scene.add(light);
   const camera=new T.OrthographicCamera(-.155,.155,.155,-.155,.001,3),target=new T.Vector3(.085,0,0);
   const dir={back:[0,1,0],palm:[0,-1,0],radial:[0,0,1],oblique:[.15,.8,.65]}[view];camera.position.copy(target).add(new T.Vector3(...dir).normalize().multiplyScalar(.55));camera.up.set(1,0,0);camera.lookAt(target);camera.updateMatrixWorld();
   v.renderer.render(scene,camera);return v.renderer.domElement.toDataURL('image/png');
  },view);fs.writeFileSync(path.join(out,view+'.png'),Buffer.from(shot.split(',')[1],'base64'));
 }
 console.log(out);
}finally{await b.close();}
