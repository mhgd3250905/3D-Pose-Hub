// dev helper: node tools/probe.mjs <spec.js> <js-expression-file> [--theme t.json]  -> boots, sets up the spec, evaluates the file's code in the page, prints JSON
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {boot} from '../lib/boot.mjs';import {loadTheme} from '../lib/config.mjs';
const [specP,codeP]=process.argv.slice(2);const i=process.argv.indexOf('--theme');const theme=loadTheme(i>0?process.argv[i+1]:null);
const spec=(await import(pathToFileURL(path.resolve(specP)).href)).default;const {b,p}=await boot({size:1080,pr:1,theme,bakeHands:spec.bakeHands||[]});
await p.evaluate(([spec,th])=>{__setHighlight(spec.highlight);for(const pr of spec.props||[])__props.add(th,pr);__drill.setupCamera(spec,1080);},[spec,theme]);
for(const a of process.argv.filter(x=>x.startsWith('--js=')))await p.addScriptTag({content:fs.readFileSync(a.slice(5),'utf8')});
for(const a of process.argv.filter(x=>x.startsWith('--json=')).map(x=>x.slice(7).split(':')))await p.addScriptTag({content:'window.'+a[0]+'='+fs.readFileSync(a[1],'utf8')});
const code=fs.readFileSync(codeP,'utf8');const r=await p.evaluate(new Function('spec','return (async()=>{'+code+'})()'),spec).catch(e=>({err:String(e)}));
// a returned {png:{name:dataURL}} is saved next to the code file
if(r&&r.png){for(const [k,v] of Object.entries(r.png))fs.writeFileSync(path.join(path.dirname(codeP),k),Buffer.from(v.split(',')[1],'base64'));delete r.png;}
console.log(JSON.stringify(r,null,1));await b.close();
