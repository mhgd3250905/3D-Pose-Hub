import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs,sampleTimes,validateSetup} from './remote-keyframes-r1.mjs';
import {prepareRecipe} from './recipe.mjs';
test('bounded CLI and sampling reject bad requests',()=>{
 assert.equal(parseArgs(['--recipe','a','--out','b']).size,256);
 for(const args of [['--recipe','a'],['--recipe','a','--out','b','--size','480'],['--recipe','a','--out','b','--count','241'],['--recipe','a','--out','b','--bad','x']])assert.throws(()=>parseArgs(args));
 assert.deepEqual(sampleTimes(6,4),[0,2,4,6]);
 for(const times of [[0,1],[0,1,1],[0,1,7],[0,NaN,6]])assert.throws(()=>sampleTimes(6,4,times));
});
test('all 32 current recipes select a supported explicit installation chain',async()=>{
 const root=path.resolve('catalog/production/remaining32-r4/groups');let count=0,fixed=0,native=0;
 for(const group of fs.readdirSync(root))for(const name of fs.readdirSync(path.join(root,group)).filter(n=>n.endsWith('.json'))){
  const p=await prepareRecipe(path.join(root,group,name));validateSetup(p);count++;
  if(p.handSetup.adapter==='symmetric-native')native++;else fixed++;
 }
 assert.deepEqual({count,native,fixed},{count:32,native:25,fixed:7});
});
test('unsupported/partial stacks and action profiles fail closed',()=>{
 const base={handSetup:{adapter:'symmetric-native'},recipe:{jointCorrections:[]},spec:{}};
 assert.throws(()=>validateSetup({...base,handSetup:{adapter:'unknown'}}));
 assert.throws(()=>validateSetup({...base,spec:{actionCorrective:{id:'unknown',required:true}}}));
 assert.throws(()=>validateSetup({...base,recipe:{jointCorrections:[{profile:'ankle-join-r1'}]}}));
 assert.throws(()=>validateSetup({...base,handSetup:{adapter:'webxr-dumbbell-wrist-r1'}}));
});
