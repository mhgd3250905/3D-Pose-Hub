// Production switch for joint corrections (shoulder-axilla r2). Used by render-masters-joint.mjs.
// Reads shoulder-axilla-production.json, checks that the base entry it was copied from and the module are the
// pinned versions (fail closed, never fall back), and installs the module after the skin/appearance install.
// Off = nothing installed, nothing evaluated in the page.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url)),REPO=path.resolve(HERE,'../..');
export const SWITCH_FILE='tools/joint-opt-r1/shoulder-axilla-production.json';
const fail=(ok,m)=>{if(!ok)throw Error(m);};
const shaLf=file=>crypto.createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')).digest('hex');
const inRepo=rel=>{const f=path.resolve(REPO,rel),x=path.relative(REPO,f);fail(!x.startsWith('..')&&!path.isAbsolute(x),'Path outside checkout: '+rel);return f;};

/** cli: undefined (use the switch file) | 'on' | 'off'. */
export function loadSwitch(cli){
  fail(cli===undefined||cli==='on'||cli==='off','--shoulder-axilla must be on or off');
  const file=inRepo(SWITCH_FILE),sw=JSON.parse(fs.readFileSync(file,'utf8'));
  fail(sw.format==='pose-hub-joint-production-switch@1'&&sw.id==='shoulder-axilla'&&typeof sw.enabled==='boolean','Bad joint production switch');
  fail(shaLf(inRepo(sw.baseEntry))===sw.baseEntrySha256Lf,'Base production entry changed since the joint entry was derived from it: '+sw.baseEntry+' (re-derive render-masters-joint.mjs; never render with a stale copy)');
  const enabled=cli===undefined?sw.enabled:cli==='on';
  const out={id:sw.id,enabled,source:cli===undefined?'switch-file':'cli',switchFile:SWITCH_FILE,switchSha256Lf:shaLf(file),switchDefault:sw.enabled,
    module:sw.module,moduleVersion:sw.moduleVersion,moduleGlobal:sw.moduleGlobal,options:sw.options??{},baseEntry:sw.baseEntry,reviewed:false,userAccepted:false};
  if(enabled)fail(shaLf(inRepo(sw.module))===sw.moduleSha256Lf,'Joint module changed: '+sw.module+' (new version needs a new switch entry)');
  return out;
}

/** After openScene + appearance install. Returns setup evidence; does nothing when off. */
export async function installJoint(page,j){
  if(!j.enabled)return {enabled:false,installed:false};
  const mod=await import(pathToFileURL(inRepo(j.module)).href);
  fail(mod.VERSION===j.moduleVersion,'Joint module version '+mod.VERSION+' != switch '+j.moduleVersion);
  const cfg=await mod.install(page,{...j.options,enabled:true});
  const live=await page.evaluate(g=>!!window[g]&&window[g].enabled===true,j.moduleGlobal);
  fail(live,'Joint module not enabled after install');
  return {enabled:true,installed:true,version:cfg.version,mesh:cfg.mesh,sides:cfg.sides,elevStartDeg:cfg.elevStartDeg,elevFullDeg:cfg.elevFullDeg,
    normalRepair:cfg.normalRepair,restReproductionErrorMm:cfg.restReproductionErrorMm,bonesChanged:cfg.bonesChanged,weightsAttributeChanged:cfg.weightsAttributeChanged,indexChanged:cfg.indexChanged};
}

/** Per-frame evidence of the last render (gates per side, vertices written). */
export async function frameDiag(page,j){
  if(!j.enabled)return null;
  return page.evaluate(g=>{const l=window[g]?.last;if(!l)return {written:0,sides:null};
    return {written:l.written,maxMoveMm:l.maxMoveMm==null?null:+l.maxMoveMm.toFixed(3),maxNormalChangeDeg:l.maxNormalChangeDeg==null?null:+l.maxNormalChangeDeg.toFixed(2),
      sides:l.sides?Object.fromEntries(Object.entries(l.sides).map(([s,x])=>[s,{gate:x.gate==null?null:+x.gate.toFixed(4),elevationDeg:x.elevationDeg==null?null:+(+x.elevationDeg).toFixed(2)}])):null};},j.moduleGlobal);
}

/** Strip --shoulder-axilla <on|off> from argv (the base parser rejects unknown flags). */
export function splitArgs(argv){
  const rest=[];let shoulder;
  for(let i=0;i<argv.length;i++){if(argv[i]==='--shoulder-axilla'){fail(shoulder===undefined,'--shoulder-axilla given twice');shoulder=argv[++i];fail(shoulder==='on'||shoulder==='off','--shoulder-axilla must be on or off');}else rest.push(argv[i]);}
  return {rest,shoulder};
}
