import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function config(){const c=JSON.parse(fs.readFileSync(path.join(ROOT,'config.json'),'utf8'));for(const k of Object.keys(c)){const e=process.env[k.toUpperCase()];if(e)c[k]=e;}
  for(const k of ['app_dir','playwright_module','font','ref_dir','drills_json','out_dir','work_dir'])if(c[k]&&!path.isAbsolute(c[k]))c[k]=path.join(ROOT,c[k]);return c;}
export function loadTheme(p){const f=p?path.resolve(p):path.join(ROOT,'theme.json');const th=JSON.parse(fs.readFileSync(f,'utf8'));
  // inherit missing keys from the default theme
  const def=JSON.parse(fs.readFileSync(path.join(ROOT,'theme.json'),'utf8'));const merge=(a,b)=>{for(const k of Object.keys(b)){if(a[k]===undefined)a[k]=b[k];else if(a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])&&b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k]))merge(a[k],b[k]);}return a;};
  merge(th,def);th.__dir=path.dirname(f);return th;}
