import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// One fixed hand + project-sized dumbbell. No tracking or per-frame finger fitting.
// The returned group's origin is the source wrist joint, in metres. The caller
// must align this frame to its body's wrist frame once; wrist seam acceptance is
// separate from loading this standalone template.
export async function loadDumbbellHandTemplate(side='right',loader=new GLTFLoader()){
 if(!['left','right'].includes(side))throw new Error('Template side must be left or right');
 const url=new URL(side+'-hand-with-dumbbell.glb',import.meta.url).href;
 const gltf=await loader.loadAsync(url),root=gltf.scene.getObjectByName('wrist_anchor');
 if(!root||!root.getObjectByName(side+'_hand_fixed'))throw new Error('Missing fixed hand or wrist anchor');
 const dumbbell=root.getObjectByName('fixed_project_dumbbell');
 if(!dumbbell||['shaft','plate_minus','plate_plus'].some(n=>!dumbbell.getObjectByName(n)))throw new Error('Incomplete dumbbell template');
 if(gltf.animations.length||root.position.length()>1e-8||Math.abs(root.quaternion.w-1)>1e-8||root.scale.toArray().some(x=>Math.abs(x-1)>1e-8))throw new Error('Expected static unit-scale wrist anchor');
 root.removeFromParent();root.userData.templateId='webxr-dumbbell32-fixed-r1';root.userData.side=side;root.userData.units='metres';root.userData.fixedAssembly=true;
 return root;
}
