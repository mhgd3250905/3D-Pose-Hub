import fs from 'node:fs';
const R='/workspace/work/elbow-scan-wt/';
const {loadRecipe,openScene,stageAt}=await import(R+'tools/action-package-v3/recipe-scene.mjs');
const RP=JSON.parse(fs.readFileSync('/workspace/work/elbow-fix/recipes.json','utf8'));
const {loadTheme}=await import(R+'drill-anim/lib/config.mjs');
const loaded=await loadRecipe(RP['forearms-A']);
const o=await openScene(loaded,{size:96,theme:loadTheme(),report:{pageErrors:[]}});
try{await stageAt(o.page,loaded.source,0,null);
const r=await o.page.evaluate(()=>{const v=flareInspector.viewer;const out={meshes:[],chain:[]};
 const ua=v.coach.getObjectByName('leftUpperArm');let p=ua;while(p){out.chain.push(p.name+(p.isBone?'*':''));p=p.parent;}
 out.uaChildren=ua.children.map(c=>c.name);
 v.coach.traverse(m=>{if(!m.isSkinnedMesh)return;const g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;const bs=m.skeleton.bones;
  const ix=bs.indexOf(ua);let n=0,n3=0;const names={};
  for(let i=0;i<si.count;i++){let w=0;for(let k=0;k<4;k++){if(si.getComponent(i,k)===ix)w+=sw.getComponent(i,k);}if(w>0.05)n++;if(w>0.3){n3++;for(let k=0;k<4;k++){const b=bs[si.getComponent(i,k)]?.name;if(sw.getComponent(i,k)>0.05)names[b]=(names[b]||0)+1;}}}
  out.meshes.push({name:m.name,vis:m.visible,count:si.count,index:!!g.index,ua05:n,ua3:n3,co:names});});
 return out;});
console.log(JSON.stringify(r,null,1));}finally{o.browser.process()?.kill('SIGKILL');}
