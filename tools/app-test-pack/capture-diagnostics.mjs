// Isolated opt-in adapter. Never writes or replaces frozen source files.
import {createHash} from 'node:crypto';
export const VERSION='capture-technical-diagnostics/1.0.0-r1';
export const BASE_PINS={
 engineLfSha256:'6492c88f4d3fce2526fedac9a09507dddd769dcaa4e0987e612dfef10c7e72ee',
 layersLfSha256:'5280e502a51ca8e7aa978f08cfdff01546eab76589e08d97b84b3ccf3f3949b1',
};
const hash=s=>createHash('sha256').update(s).digest('hex');
const lf=s=>s.replaceAll('\r\n','\n');
const METRICS='const M = E.metrics(spec, opts.full); const J = M.joints;';
const CONTACT="const hc = E.handClip(['left', 'right'], { exclude: spec.qa?.handClipExclude }); M.handClip = { left: hc.left.minMm, right: hc.right.minMm, leftBone: hc.left.bone || null, rightBone: hc.right.bone || null }; M.touch = r.touch || {};";
const SURFACE='const metrics=pose(spec,t,f,warm,f%30===0);metrics.visibleSurface=visibleSurface();patch();';
const MATRIX='v.coach.updateMatrixWorld(true);v.coach.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});';
const LIGHT_METRICS="const J0 = Object.assign({}, v.motion.getMetrics().joints, E._jo || {}); const M = {joints:J0,minY:Math.min(...Object.values(J0).filter(Array.isArray).map(p=>p[1])),minYMeaning:'joint-marker minimum only; surface diagnostics omitted',poseDiagnosticsRun:false}; const J = M.joints;";
const LIGHT_CONTACT='v.coach.updateMatrixWorld(true); const diagnosticCache = E.meshCache(); for(const layer of diagnosticCache) layer.o.skeleton.update(); M.handClip = null; M.touch = r.touch || {};';
const LIGHT_SURFACE="const metrics=pose(spec,t,f,warm,f%30===0);"+MATRIX+"metrics.visibleSurface={method:'not measured: production technical capture',diagnosticsRun:false,matrixWorldAndSkeletonsUpdated:true};patch();";
function once(text,needle,replacement){
 if(text.split(needle).length!==2)throw Error('Capture diagnostic source needle changed: '+needle.slice(0,60));
 return text.replace(needle,replacement);
}

export function buildTechnicalCaptureSources(engineSource,layersSource){
 const engine=lf(engineSource),layers=lf(layersSource);
 if(hash(engine)!==BASE_PINS.engineLfSha256||hash(layers)!==BASE_PINS.layersLfSha256)throw Error('Capture diagnostic source SHA changed');
 const marker='E.frame = function(spec, t, f, warm, opts) {';
 if(engine.split(marker).length!==2)throw Error('Expected one frozen frame function');
 const start=engine.indexOf(marker)+'E.frame = '.length,end=engine.indexOf('\n};\n})();',start);
 if(end<start)throw Error('Frozen frame function boundary changed');
 const expectedFrame=engine.slice(start,end+2);
 const technicalFrame=once(once(expectedFrame,METRICS,LIGHT_METRICS),CONTACT,LIGHT_CONTACT);
 // This equality pins every motion solver, warm start, camera, uniform, prop,
 // projection and render statement around the two explicitly omitted queries.
 if(once(once(technicalFrame,LIGHT_METRICS,METRICS),LIGHT_CONTACT,CONTACT)!==expectedFrame)throw Error('Frame transform touched non-diagnostic statements');
 if(layers.split(MATRIX).length!==2)throw Error('Original matrix/skeleton update statement changed');
 const technicalLayers=once(layers,SURFACE,LIGHT_SURFACE);
 if(once(technicalLayers,LIGHT_SURFACE,SURFACE)!==layers)throw Error('Layer transform touched render statements');
 return {expectedFrame,technicalFrame,layersSource:technicalLayers,evidence:{
  mode:'technical-diagnostics-only',adapter:VERSION,...BASE_PINS,
  expectedFrameSha256:hash(expectedFrame),injectedFrameSha256:hash(technicalFrame),
  injectedLayersSha256:hash(technicalLayers),
  retained:['original applyAt and warm x','original handClip including all actual touch solvers','original handClip mesh-cache initialization and skeleton updates',
   'camera/uniforms/props','updateMatrixWorld and skeleton.update','unchanged three layer and source-vertex shadow rendering',
   'complete-cycle alpha/framing/decode QA'],
  omitted:['post-pose metrics mesh scan and angle/capsule statistics','post-pose diagnostic handClip call','visibleSurface CPU vertex scan'],
  limit:'Static transform and VM state equivalence are not a real-GPU pixel equivalence result.'}};
}

export async function installTechnicalFrame(page,built){
 return page.evaluate(({expectedFrame,technicalFrame,evidence})=>{
  const E=window.__drill,T=window.__toonT;
  if(Function.prototype.toString.call(E.frame).replaceAll('\r\n','\n')!==expectedFrame)throw Error('Active frame is not the pinned frozen driver; technical diagnostics adapter refused');
  const applyAt=E.applyAt,handClip=E.handClip;
  E.frame=new Function('E','V','return ('+technicalFrame+');')(E,a=>new T.Vector3(...a));
  if(E.applyAt!==applyAt||E.handClip!==handClip)throw Error('Motion or actual contact solver changed');
  return evidence;
 },{expectedFrame:built.expectedFrame,technicalFrame:built.technicalFrame,evidence:built.evidence});
}
