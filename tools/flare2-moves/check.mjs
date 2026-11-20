// Flare 2.0 new moves r1 (2026-11-20): copy of tools/thomas-sup/check.mjs (plan = tools/flare2-moves/actions.json) plus per-region
// clearance to box props (chair seats, blocks: __props.list userData.qaPrims boxes / machine boxes) and wall faces ('fm' per sample).
// Original header (Thomas supplement r1, 2026-11-19): sandbox self-check + low-res V5 preview stills for one recipe. Not a production renderer.
//   node tools/thomas-sup/check.mjs --recipe <recipe.json> [--stride 3 | --frames 0,60]  [--mesh-clip forearmR:thighR,...] [--gap forearmR:thighR:up,handL:handR] [--render 0,60,120] [--views name:dir[:up];...] [--size 360] [--png-dir <dir>] [--out <json>]
// One browser: the hub recipe scene (stageAt: applyAt + props + fixed recipe camera, as tools/v5/render-masters-v5.mjs) with the
// V5 model installed exactly as render-masters-v5.mjs does (same modules, same pose transfer). Every <stride>-th frame is solved and
// measured on the V5 body that the render machine will draw:
//   - elbow / knee angles (V5 bones, degrees);
//   - contact drift: world position of each V5 hand / foot bone over the time windows the action's check plan says are planted (mm);
//   - floor: lowest skinned V5 vertex per region (hand, forearm, foot, shin, knee, pelvis/torso, head) relative to the floor the body
//     stands on (mat top when the recipe has a mat, else y=0), in mm (< -2 mm = through the floor, drill-anim/lib/qa.py FLOOR_TOL);
//   - props: lowest signed distance of V5 body vertices (hands excluded) to the props' QA capsules (dip bars) / the pull-up bar tube;
//   - self-clip: capsule hulls on the V5 joints with drill-anim/lib/qa.py radii (adjacent and allowed pairs skipped), overlap in mm.
// Stills in --render are rendered at --size (<= 480) into --png-dir as <frame>.png. Nothing here writes into the repository.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt,fail,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {loadTheme} from '../../drill-anim/lib/config.mjs';

const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),REPO=path.resolve(HERE,'../..');
const RT=path.join(REPO,'tools/v5/runtime');
const MODULES=['vendor/meshopt_decoder.module.js','wristfix-r2.js','toon-r6.js','v5-hub.js'];
const MODEL='model/coach-v3r3-wristfix.glb';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d;};
const recipeFile=path.resolve(opt('--recipe')),stride=+opt('--stride',3),size=+opt('--size',360);
fail(size>=128&&size<=480,'preview size must be 128..480');
const renderFrames=(opt('--render','')||'').split(',').filter(Boolean).map(Number);
const pngDir=opt('--png-dir');
// --mesh-clip 'forearmR:thighR,thighR:forearmR' = mesh-level self-clip pairs (A inside B), regions as in __tsMeasure
const meshPairs=(opt('--mesh-clip','')||'').split(',').filter(Boolean).map(p=>p.split(':'));
// --gap 'forearmR:thighR:up,handL:handR' = surface gap of region A over region B (r4, 2026-11-19; see __tsGap)
let gapPairs=(opt('--gap','')||'').split(',').filter(Boolean).map(p=>p.split(':'));const outFile=opt('--out');
// --views 'side:0,0.1,1;front:-1,0.15,0;top:0,1,0.001:-1,0,0' = name:dir[:up] (world; camera looks at the body centre from dir)
// r3 (2026-11-19): optional 4th part 'bone,radiusM' = close-up on that V5 bone (a hub grasp fist: on the fist's centre), e.g. 'hr:1,0.2,0.3:0,1,0:rightHand,0.1'
const views=(opt('--views','')||'').split(';').filter(Boolean).map(v=>{const [name,d,u,f]=v.split(':');const fo=f?f.split(','):null;return {name,dir:d.split(',').map(Number),up:u?u.split(',').map(Number):[0,1,0],...(fo?{focus:{bone:fo[0],r:+(fo[1]??0.12)}}:{})};});
// V5 opt-in head flexion (spec v5.headFlexDeg), same rule as tools/v5/render-masters-v5.mjs
const v5HeadFlex=s=>{const d=s.v5?.headFlexDeg;if(d===undefined||d===0)return 0;if(!(Number.isFinite(d)&&Math.abs(d)<=30))throw Error('bad v5.headFlexDeg (|deg| <= 30)');return d;};
// V5 opt-in grip (spec v5.grip = { side, dumbbell, ... }), same rule as tools/v5/render-masters-v5.mjs
const v5Grip=s=>{const g=s.v5?.grip;if(g===undefined||g===null)return null;if(typeof g!=='object'||!['left','right'].includes(g.side))throw Error('bad v5.grip ({side:left|right,...})');return g;};
// Hub grasp hands (spec v5.hubGraspHands = ['left'|'right',...], opt-in per action; Thomas supplement r3 2026-11-19): the hub's accepted fixed
// grasp fist (recipe hands bar-grasp / dumbbell-grasp / fixed-grasp) drawn in the V5 look instead of the V5 open hand on those sides,
// see tools/v5/runtime/v5-hub.js header. Every action without that spec field installs V5 exactly as before.
const v5HubGrasp=s=>{const h=s.v5?.hubGraspHands;if(h===undefined||h===null)return null;if(!Array.isArray(h)||!h.length||h.some(x=>!['left','right'].includes(x))||new Set(h).size!==h.length)throw Error('bad v5.hubGraspHands ([left|right,...])');return h;};
const PLAN=JSON.parse(fs.readFileSync(path.join(HERE,'actions.json'),'utf8'));

const loaded=await loadRecipe(recipeFile);
const {prepared,source}=loaded,id=prepared.recipe.id,fps=30,N=Math.round(source.timeline.duration*fps);
const plan=PLAN.actions.find(a=>a.id===id)??{checks:{}};
if(!gapPairs.length&&plan.gap)gapPairs=plan.gap.split(',').map(p=>p.split(':'));   // actions.json "gap" = default --gap
const report={pageErrors:[]};
const scene=await openScene(loaded,{size,theme:loadTheme(),report});const page=scene.page;
const res={id,recipe:path.relative(REPO,recipeFile),spec:prepared.recipe.spec,frames:N,stride,size,samples:[]};
try{
  const mods=Object.fromEntries(MODULES.map(m=>[m,fs.readFileSync(path.join(RT,m),'utf8')]));
  const glb=fs.readFileSync(path.join(RT,MODEL)).toString('base64');
  await page.evaluate(async ({mods,glb,scapulaShift,headFlexDeg,noShadow,grip,hubGrasp})=>{
    const src=await (await fetch('/src/viewer.js')).text(),v=src.match(/three\.js\?v=(\w+)/)[1],O=location.origin;
    const map={'three':O+'/node_modules/.vite/deps/three.js?v='+v,'three/addons/loaders/GLTFLoader.js':O+'/node_modules/.vite/deps/three_addons_loaders_GLTFLoader__js.js?v='+v,
      'three/addons/GLTFLoader.js':O+'/node_modules/.vite/deps/three_addons_loaders_GLTFLoader__js.js?v='+v};
    const url={};
    for(const [name,code] of Object.entries(mods)){
      const fixed=code.replace(/(from\s*|import\s*\(\s*)(['"])([^'"]+)\2/g,(m,pre,q,spec)=>{if(map[spec])return pre+q+map[spec]+q;const rel=spec.replace(/^\.\//,'');if(url[rel])return pre+q+url[rel]+q;throw Error('unknown import '+spec);});
      url[name]=URL.createObjectURL(new Blob([fixed],{type:'text/javascript'}));
    }
    const bin=Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer;
    const m=await import(url['v5-hub.js']);return await m.installV5(scapulaShift||headFlexDeg||noShadow||grip||hubGrasp?{glb:bin,...(scapulaShift?{scapulaShift}:{}),...(headFlexDeg?{headFlexDeg}:{}),...(noShadow?{groundShadow:false}:{}),...(grip?{grip}:{}),...(hubGrasp?{hubGraspHands:hubGrasp}:{})}:{glb:bin});
  },{mods,glb,scapulaShift:source.v5?.scapulaShift===true,headFlexDeg:v5HeadFlex(source),noShadow:source.v5?.groundShadow===false,grip:v5Grip(source),hubGrasp:v5HubGrasp(source)});
  // in-page measurement on the V5 body
  await page.evaluate(()=>{
    const T=window.__toonT,V=window.__v5,v=flareInspector.viewer;
    const region=b=>{if(!b)return 'other';if(/Hand|WristBend/.test(b))return /^left/.test(b)?'handL':'handR';if(/Forearm/.test(b))return /^left/.test(b)?'forearmL':'forearmR';
      if(/UpperArm/.test(b))return /^left/.test(b)?'upperArmL':'upperArmR';if(/Foot/.test(b))return /^left/.test(b)?'footL':'footR';if(/Shin|Patella/.test(b))return /^left/.test(b)?'shinL':'shinR';
      if(/Thigh/.test(b))return /^left/.test(b)?'thighL':'thighR';if(/head|neck/.test(b))return 'head';return 'torso';};
    const meshes=[];V.root.traverse(o=>{if(o.isSkinnedMesh&&o.visible!==false&&!o.userData.__outline&&!o.userData.__eye)meshes.push(o);});
    const per=meshes.map(o=>{const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,n=g.attributes.position.count,reg=new Array(n);
      for(let i=0;i<n;i++){let bw=-1,bi=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}reg[i]=region(o.skeleton.bones[bi]?.name);}return {o,reg,n};});
    const _v=new T.Vector3();
    window.__tsMeasure=(floorY,caps)=>{
      const minY={},minP={},prop={};
      for(const {o,reg,n} of per){o.skeleton.update();
        for(let i=0;i<n;i++){o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);const r=reg[i];
          if(minY[r]===undefined||_v.y<minY[r]){minY[r]=_v.y;minP[r]=[_v.x,_v.y,_v.z];}
          if(caps.length&&!/^hand/.test(r)){for(const c of caps){const a=c.a,b=c.b,ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ap=[_v.x-a[0],_v.y-a[1],_v.z-a[2]];
            const L=ab[0]**2+ab[1]**2+ab[2]**2;let t=(ab[0]*ap[0]+ab[1]*ap[1]+ab[2]*ap[2])/L;t=Math.max(0,Math.min(1,t));
            const d=Math.hypot(ap[0]-ab[0]*t,ap[1]-ab[1]*t,ap[2]-ab[2]*t)-c.r;if(prop[r]===undefined||d<prop[r])prop[r]=d;}}}}
      // contact patch of each foot: centroid of the skinned vertices within 3 mm of that foot's lowest vertex (the single lowest
      // vertex jumps between toe vertices when the toes lie flat; the patch centroid does not)
      const patch={};for(const {o,reg,n} of per)for(let i=0;i<n;i++){const r=reg[i];if(r!=='footL'&&r!=='footR')continue;o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);
        if(_v.y<=minY[r]+0.003){const c=patch[r]||(patch[r]=[0,0,0,0]);c[0]+=_v.x;c[1]+=_v.y;c[2]+=_v.z;c[3]++;}}
      for(const k in patch){const c=patch[k];minP[k+'Patch']=[c[0]/c[3],c[1]/c[3],c[2]/c[3]];}
      const B=V.bones,wp=n=>B[n].getWorldPosition(new T.Vector3()).toArray();
      const J={};for(const n of ['pelvis','spineLower','spineUpper','torso','neck','head','leftScapula','rightScapula','leftUpperArm','leftForearm','leftHand','rightUpperArm','rightForearm','rightHand','leftThigh','leftShin','leftFoot','rightThigh','rightShin','rightFoot'])J[n]=wp(n);
      for(const k in minY)minY[k]=+((minY[k]-floorY)*1000).toFixed(1);for(const k in prop)prop[k]=+(prop[k]*1000).toFixed(1);
      const Q={};for(const n of ['pelvis','spineUpper','torso','head','leftHand','rightHand','leftForearm','rightForearm','leftFoot','rightFoot','leftShin','rightShin','leftThigh','rightThigh'])Q[n]=B[n].getWorldQuaternion(new T.Quaternion()).toArray();
      let grip=null;
      if(V.grip?.mesh){   // grip (v5.grip): signed distance of body vertices (gripping hand excluded) to the dumbbell handle / head cylinders, mm
        const Gm=V.grip.mesh;Gm.updateMatrixWorld(true);const inv=Gm.matrixWorld.clone().invert(),h=V.grip.handle,hand=V.grip.bone==='rightHand'?'handR':'handL';
        let best=1e9,at=null;const lv=new T.Vector3();
        for(const {o,reg,n} of per)for(let i=0;i<n;i++){const r=reg[i];if(r===hand)continue;o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);lv.copy(_v).applyMatrix4(inv);
          const rad=Math.hypot(lv.x,lv.y);const cyl=(r0,z0,z1)=>{const dr=rad-r0,dz=Math.max(z0-lv.z,lv.z-z1);return dr>0&&dz>0?Math.hypot(dr,dz):Math.max(dr,dz);};
          const d=Math.min(cyl(h.r,h.z0,h.z1),cyl(h.head.r,h.head.z0,h.head.z1));if(d<best){best=d;at=r;}}
        grip={clearMm:+(best*1000).toFixed(1),region:at,handlePenMm:V.grip.info.handlePenMm,contact:V.grip.info.contact};
      }
      let hubGrasp=null;
      if(V.hubGrasp){   // v5.hubGraspHands (r3): hub fist vs bar capsule / its fixed dumbbell, dumbbell vs the V5 body, wrist seam (mm)
        const G=V.hubGrasp,B=V.bones;hubGrasp={seam:G.seam(B)};
        const segD=(p,c)=>{const ab=[c.b[0]-c.a[0],c.b[1]-c.a[1],c.b[2]-c.a[2]],ap=[p.x-c.a[0],p.y-c.a[1],p.z-c.a[2]],L=ab[0]**2+ab[1]**2+ab[2]**2;let t=(ab[0]*ap[0]+ab[1]*ap[1]+ab[2]*ap[2])/L;t=Math.max(0,Math.min(1,t));
          const q=[ap[0]-ab[0]*t,ap[1]-ab[1]*t,ap[2]-ab[2]*t];return {d:Math.hypot(...q)-c.r,q,ab};};
        for(const s of G.sides){const hm=G.J.meshes.hands[s];hm.updateMatrixWorld(true);const M=G.posedMatrix(hm,B),P=hm.geometry.attributes.position,pts=[];
          for(let i=0;i<P.count;i++)pts.push(new T.Vector3().fromBufferAttribute(P,i).applyMatrix4(M));
          const out=hubGrasp[s]={fistVerts:pts.length};
          if(caps.length){let best=null;for(const c of caps){let mn=1e9;for(const p of pts)mn=Math.min(mn,segD(p,c).d);if(!best||mn<best.mn)best={c,mn};}
            const c=best.c,ax=new T.Vector3(...[c.b[0]-c.a[0],c.b[1]-c.a[1],c.b[2]-c.a[2]]).normalize(),e1=new T.Vector3(0,1,0);if(Math.abs(e1.dot(ax))>0.9)e1.set(1,0,0);e1.sub(ax.clone().multiplyScalar(e1.dot(ax))).normalize();const e2=ax.clone().cross(e1);
            const bins=new Set();let n2=0;for(const p of pts){const r=segD(p,c);if(r.d<0.002)n2++;if(r.d<0.004){const q=new T.Vector3(...r.q);bins.add(Math.floor((Math.atan2(q.dot(e2),q.dot(e1))+Math.PI)/(Math.PI/18)));}}
            out.bar={minMm:+(best.mn*1000).toFixed(2),contact2mm:n2,wrapDeg:bins.size*10,barR:c.r};}
          const inv=hm.matrixWorld.clone().invert(),db=[],names=[];hm.parent.traverse(o=>{if(o.isMesh&&o!==hm&&!o.userData.__outline&&o.visible&&/^wrist_join_/.test(o.name)){names.push(o.name);o.updateMatrixWorld(true);
            const Q=o.geometry.attributes.position;for(let i=0;i<Q.count;i++)db.push(new T.Vector3().fromBufferAttribute(Q,i).applyMatrix4(o.matrixWorld).applyMatrix4(inv).applyMatrix4(M));}});
          if(db.length){
            // the fixed dumbbell's handle ('shaft' part) as a cylinder (axis = principal direction of its vertices, radius = their largest
            // distance from it); fist vertices along the handle: signed distance to its surface (- = into the handle), contact and wrap
            const sh=[];hm.parent.traverse(o=>{if(o.isMesh&&o.visible&&/_shaft$/.test(o.name)){const Q=o.geometry.attributes.position;for(let i=0;i<Q.count;i++)sh.push(new T.Vector3().fromBufferAttribute(Q,i).applyMatrix4(o.matrixWorld).applyMatrix4(inv).applyMatrix4(M));}});
            let handle=null;
            if(sh.length){const c=sh.reduce((a,q)=>a.add(q),new T.Vector3()).multiplyScalar(1/sh.length);let ax=new T.Vector3(1,0.3,0.2).normalize();
              for(let k=0;k<60;k++){const nn=new T.Vector3();for(const q of sh){const d=q.clone().sub(c);nn.addScaledVector(d,d.dot(ax));}ax=nn.normalize();}
              const rad=q=>{const d=q.clone().sub(c);return d.sub(ax.clone().multiplyScalar(d.dot(ax))).length();},R=Math.max(...sh.map(rad)),L=Math.max(...sh.map(q=>Math.abs(q.clone().sub(c).dot(ax))));
              const e1=new T.Vector3(0,1,0);if(Math.abs(e1.dot(ax))>0.9)e1.set(1,0,0);e1.sub(ax.clone().multiplyScalar(e1.dot(ax))).normalize();const e2=ax.clone().cross(e1);
              let mn=1e9,n2=0;const bins=new Set();for(const p of pts){const d=p.clone().sub(c),h=d.dot(ax);if(Math.abs(h)>L)continue;const r=d.sub(ax.clone().multiplyScalar(h)),g=r.length()-R;mn=Math.min(mn,g);if(g<0.002)n2++;if(g<0.004)bins.add(Math.floor((Math.atan2(r.dot(e2),r.dot(e1))+Math.PI)/(Math.PI/18)));}
              handle={rMm:+(R*1000).toFixed(2),halfLenMm:+(L*1000).toFixed(1),minMm:+(mn*1000).toFixed(2),contact2mm:n2,wrapDeg:bins.size*10};}
            const cen=db.reduce((a,q)=>a.add(q),new T.Vector3()).multiplyScalar(1/db.length),rad=Math.max(...db.map(q=>q.distanceTo(cen)))+0.01,hand=s==='right'?'handR':'handL';
            let clr=1e9,at=null;for(const {o,reg,n} of per)for(let i=0;i<n;i++){if(reg[i]===hand)continue;o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);if(_v.distanceTo(cen)>rad)continue;for(const q of db){const d=_v.distanceTo(q);if(d<clr){clr=d;at=reg[i];}}}
            out.dumbbell={parts:names,verts:db.length,handle,bodyClearMm:clr<1e8?+(clr*1000).toFixed(1):null,bodyRegion:at};}
        }
      }
      return {minY,minP,prop,J,Q,...(grip?{grip}:{}),...(hubGrasp?{hubGrasp}:{})};
    };
    // Flare 2.0 r1 (2026-11-20): per-region signed clearance (mm, < 0 = inside) of the V5 skinned body to box props (chair seat slabs
    // from userData.qaPrims; 'machine' boxes = blocks / books) and to wall faces (props type 'wall': face plane through at, normal = yaw
    // rotation of +Z). Hands are measured too (a palm on a block top is a contact, ~0 mm).
    window.__fmProps=()=>{const boxes=[],walls=[];
      for(const o of (window.__props?.list||[])){o.updateMatrixWorld(true);const sp=o.userData.spec||{};
        if(sp.type==='wall'){const n=new T.Vector3(0,0,1).applyQuaternion(o.getWorldQuaternion(new T.Quaternion()));walls.push({p:o.getWorldPosition(new T.Vector3()),n});continue;}
        let prims=o.userData.qaPrims||[];if(sp.type==='machine'){const [w,h,d]=sp.size||[0.8,1.6,0.8];prims=[{c:[0,h/2,0],ax:[[1,0,0],[0,1,0],[0,0,1]],h:[w/2,h/2,d/2]}];}
        for(const q of prims){if(!q.h)continue;const M=o.matrixWorld,R=new T.Matrix3().setFromMatrix4(M);
          boxes.push({c:new T.Vector3(...q.c).applyMatrix4(M),ax:q.ax.map(a=>new T.Vector3(...a).applyMatrix3(R).normalize()),h:q.h,type:sp.type});}}
      if(!boxes.length&&!walls.length)return null;
      const box={},wall={},d=new T.Vector3();
      for(const {o,reg,n} of per)for(let i=0;i<n;i++){o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);const r=reg[i];
        for(const b of boxes){d.copy(_v).sub(b.c);const q=b.ax.map((a,k)=>Math.abs(d.dot(a))-b.h[k]);const out=Math.hypot(...q.map(x=>Math.max(x,0))),inn=Math.min(Math.max(...q),0);const sd=out+inn;
          if(box[r]===undefined||sd<box[r])box[r]=sd;}
        for(const w of walls){const sd=d.copy(_v).sub(w.p).dot(w.n);if(wall[r]===undefined||sd<wall[r])wall[r]=sd;}}
      for(const k in box)box[k]=+(box[k]*1000).toFixed(1);for(const k in wall)wall[k]=+(wall[k]*1000).toFixed(1);
      return {box,wall};};
    // mesh-level self-clip (r2, 2026-11-19): how deep the skinned vertices of region A sit inside the skinned surface of region B.
    // B's surface = per (axial 15 mm, angular 12 deg) bin around B's bone axis, the largest radius of B's vertices in that bin;
    // an A vertex whose radius from B's axis is smaller than its bin's surface radius is inside B by the difference (mm, >0 = inside).
    const AX={upperArmL:['leftUpperArm','leftForearm'],upperArmR:['rightUpperArm','rightForearm'],forearmL:['leftForearm','leftHand'],forearmR:['rightForearm','rightHand'],
      thighL:['leftThigh','leftShin'],thighR:['rightThigh','rightShin'],shinL:['leftShin','leftFoot'],shinR:['rightShin','rightFoot']};
    window.__tsMeshClip=pairs=>{const out={};const pos={};
      for(const {o,reg,n} of per){o.skeleton.update();for(let i=0;i<n;i++){const r=reg[i];if(!AX[r])continue;o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);(pos[r]||(pos[r]=[])).push(_v.x,_v.y,_v.z);}}
      const B=V.bones,wp=n=>B[n].getWorldPosition(new T.Vector3());
      for(const [a,b] of pairs){const P=wp(AX[b][0]),Qp=wp(AX[b][1]),ax=Qp.clone().sub(P),L=ax.length();ax.normalize();
        const e1=new T.Vector3(1,0,0);if(Math.abs(e1.dot(ax))>0.9)e1.set(0,0,1);e1.sub(ax.clone().multiplyScalar(e1.dot(ax))).normalize();const e2=ax.clone().cross(e1);
        const polar=(x,y,z)=>{const d=new T.Vector3(x-P.x,y-P.y,z-P.z),h=d.dot(ax),r=d.sub(ax.clone().multiplyScalar(h));const an=Math.atan2(r.dot(e2),r.dot(e1));
          return [Math.floor(h/0.015),Math.floor((an+Math.PI)/(Math.PI/15)),r.length(),h];};
        const bin=new Map(),pb=pos[b]??[],pa=pos[a]??[];
        for(let i=0;i<pb.length;i+=3){const [hb,ab,r]=polar(pb[i],pb[i+1],pb[i+2]);const k=hb*100+ab;if(!(bin.get(k)>=r))bin.set(k,r);}
        let worst=-1e9,at=null;
        for(let i=0;i<pa.length;i+=3){const [hb,ab,r,h]=polar(pa[i],pa[i+1],pa[i+2]);if(h<0||h>L)continue;const R=bin.get(hb*100+ab);if(R===undefined)continue;
          if(R-r>worst){worst=R-r;at=[+(h/L).toFixed(2),pa[i],pa[i+1],pa[i+2]];}}
        out[a+'>'+b]={mm:+(worst*1000).toFixed(1),tB:at?.[0]};}
      return out;};
    // surface gap (r4, 2026-11-19): resting contacts (forearm on the thigh, palm on the other hand). Direction d = world up ('up') or
    // the B->A vertex-centroid direction ('auto'); in the plane normal to d, 8 mm cells; per cell B's top = max height of B's
    // skinned vertices along d, A's bottom = min height of A's; gap = A bottom - B top over the cells both cover (mm; < 0 = A sunk
    // into B), contact = cells with gap < 4 mm.
    window.__tsGap=pairs=>{const out={};const pos={};
      for(const {o,reg,n} of per){o.skeleton.update();for(let i=0;i<n;i++){const r=reg[i];o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);(pos[r]||(pos[r]=[])).push(_v.x,_v.y,_v.z);}}
      const cen=a=>{const c=[0,0,0];for(let i=0;i<a.length;i+=3){c[0]+=a[i];c[1]+=a[i+1];c[2]+=a[i+2];}return c.map(x=>x/(a.length/3));};
      for(const [a,b,m] of pairs){const pa=pos[a]??[],pb=pos[b]??[];if(!pa.length||!pb.length){out[a+'>'+b]=null;continue;}
        let d;if(m==='up')d=new T.Vector3(0,1,0);else{const ca=cen(pa),cb=cen(pb);d=new T.Vector3(ca[0]-cb[0],ca[1]-cb[1],ca[2]-cb[2]).normalize();}
        const e1=new T.Vector3(1,0,0);if(Math.abs(e1.dot(d))>0.9)e1.set(0,0,1);e1.sub(d.clone().multiplyScalar(e1.dot(d))).normalize();const e2=d.clone().cross(e1);
        const key=(x,y,z)=>Math.floor((x*e1.x+y*e1.y+z*e1.z)/0.008)*100000+Math.floor((x*e2.x+y*e2.y+z*e2.z)/0.008),h=(x,y,z)=>x*d.x+y*d.y+z*d.z;
        const top=new Map();for(let i=0;i<pb.length;i+=3){const k=key(pb[i],pb[i+1],pb[i+2]),v=h(pb[i],pb[i+1],pb[i+2]);if(!(top.get(k)>=v))top.set(k,v);}
        const bot=new Map(),bi=new Map();for(let i=0;i<pa.length;i+=3){const k=key(pa[i],pa[i+1],pa[i+2]),v=h(pa[i],pa[i+1],pa[i+2]);if(!(bot.get(k)<=v)){bot.set(k,v);bi.set(k,i);}}
        let mn=1e9,cnt=0,both=0,at=null;for(const [k,v] of bot){const t=top.get(k);if(t===undefined)continue;both++;const g=v-t;if(g<mn){mn=g;const i=bi.get(k);at=[pa[i],pa[i+1],pa[i+2]].map(x=>+x.toFixed(3));}if(g<0.004)cnt++;}
        out[a+'>'+b]={mm:both?+(mn*1000).toFixed(1):null,contactCells:cnt,overlapCells:both,at};}
      return out;};
    // arm twist (r4, 2026-11-19, t-seated-forearm-rotation 肘部「拧着」): the elbow is a hinge, so the forearm bone may differ from the
    // upper-arm bone only by a swing (flexion); any roll about the forearm axis there twists the elbow skin. Per side:
    //   elbowTwistDeg = twist of (upper arm)^-1 * (forearm) world rotation about the forearm rest axis (0 = pure hinge);
    //   elbowPitDeg   = angle about the upper-arm axis between the elbow pit (rest anterior +Z carried by the upper arm) and the actual
    //                   bend direction (forearm minus its upper-arm component); 0 = the forearm folds toward the elbow pit;
    //   handTwistDeg  = hand vs forearm twist about the forearm axis (what tools/v5/runtime/wristfix-r2.js spreads along the forearm);
    //   uaT           = upper-arm world rotation in the thorax frame (precision.py: upper-arm inward/outward rotation over the cycle);
    //   mesh          = per station along the arm (fraction of the forearm from the elbow, < 0 = upper arm), mean azimuth (deg) of the
    //                   skinned vertices about the segment axis vs a pure-hinge frame (upper arm; forearm with its elbow twist removed),
    //                   and mean radius vs rest (pinch, 1 = rest). Fist / V5 hand vertices excluded.
    {
      const ST=[[-0.4,-0.2],[-0.2,-0.08],[-0.08,0.04],[0.04,0.15],[0.15,0.3],[0.3,0.5],[0.5,0.7],[0.7,0.9]];
      const arm={};
      for(const s of ['left','right']){const ua=V.bones[s+'UpperArm'],fa=V.bones[s+'Forearm'],h=V.bones[s+'Hand'];
        const rU=s==='left'?'upperArmL':'upperArmR',rF=s==='left'?'forearmL':'forearmR',L=[];
        for(const {o,reg,n} of per){const sk=o.skeleton,iF=sk.bones.indexOf(fa);if(iF<0)continue;const eB=new T.Vector3().setFromMatrixPosition(sk.boneInverses[iF].clone().invert());
          const P=o.geometry.attributes.position;for(let i=0;i<n;i++)if(reg[i]===rU||reg[i]===rF){const r=new T.Vector3().fromBufferAttribute(P,i).applyMatrix4(o.bindMatrix).sub(eB);L.push([o,i,r]);}}
        arm[s]={L,aU:fa.position.clone().normalize(),aF:h.position.clone().normalize(),lenU:fa.position.length(),lenF:h.position.length()};}
      const tw=(q,a)=>{let p=q.x*a.x+q.y*a.y+q.z*a.z,w=q.w;if(w<0){w=-w;p=-p;}let t=2*Math.atan2(p,w);if(t>Math.PI)t-=2*Math.PI;return t*180/Math.PI;};
      const az=(a,b,ax)=>{const pa=a.clone().sub(ax.clone().multiplyScalar(a.dot(ax))),pb=b.clone().sub(ax.clone().multiplyScalar(b.dot(ax)));return Math.atan2(ax.dot(pb.clone().cross(pa)),pb.dot(pa))*180/Math.PI;};
      const _p=new T.Vector3();
      window.__tsArm=()=>{const out={},B=V.bones,W=b=>b.getWorldQuaternion(new T.Quaternion()),Pw=b=>b.getWorldPosition(new T.Vector3());
        for(const s of ['left','right']){const A=arm[s],ua=B[s+'UpperArm'],fa=B[s+'Forearm'],h=B[s+'Hand'];
          const qu=W(ua),qf=W(fa),qh=W(h),qt=W(B.torso),R=qu.clone().invert().multiply(qf);
          const et=tw(R,A.aF),tq=new T.Quaternion().setFromAxisAngle(A.aF,et*Math.PI/180),sw=R.clone().multiply(tq.clone().invert()),qI=qu.clone().multiply(sw);
          const uW=A.aU.clone().applyQuaternion(qu),fW=A.aF.clone().applyQuaternion(qf),pit=new T.Vector3(0,0,1).sub(A.aU.clone().multiplyScalar(A.aU.z)).normalize().applyQuaternion(qu);
          const bend=fW.clone().sub(uW.clone().multiplyScalar(fW.dot(uW)));
          const pitDeg=bend.length()<1e-3?null:Math.atan2(uW.dot(pit.clone().cross(bend.normalize())),pit.dot(bend))*180/Math.PI;
          const iu=qu.clone().invert(),iI=qI.clone().invert(),E=Pw(fa),sc=E.distanceTo(Pw(h))/A.lenF;
          const acc=ST.map(()=>[0,0,0]);   // sum azimuth, sum radius ratio, count
          for(const [o,i,r] of A.L){const hf=r.dot(A.aF)/A.lenF,fore=hf>=0,x=fore?hf:r.dot(A.aU)/A.lenF;const k=ST.findIndex(([a,b])=>x>=a&&x<b);if(k<0)continue;
            const ax=fore?A.aF:A.aU,rr=r.clone().sub(ax.clone().multiplyScalar(r.dot(ax))).length();if(rr<0.12*A.lenF)continue;
            o.getVertexPosition(i,_p);_p.applyMatrix4(o.matrixWorld);const loc=_p.sub(E).multiplyScalar(1/sc).applyQuaternion(fore?iI:iu);
            const pr=loc.clone().sub(ax.clone().multiplyScalar(loc.dot(ax))).length();acc[k][0]+=az(loc,r,ax);acc[k][1]+=pr/rr;acc[k][2]++;}
          const r2=x=>+x.toFixed(2);
          out[s]={elbowTwistDeg:r2(et),elbowPitDeg:pitDeg===null?null:r2(pitDeg),handTwistDeg:r2(tw(qf.clone().invert().multiply(qh),A.aF)),
            uaT:qt.clone().invert().multiply(qu).toArray().map(x=>+x.toFixed(6)),aU:A.aU.toArray().map(x=>+x.toFixed(6)),
            helpers:[1,2,3,4,5,6].filter(k=>B[s+'ForearmTwist'+k]).map(k=>r2(tw(B[s+'ForearmTwist'+k].quaternion,A.aF))),
            mesh:ST.map(([a,b],k)=>({at:[a,b],azDeg:acc[k][2]?r2(acc[k][0]/acc[k][2]):null,radius:acc[k][2]?+(acc[k][1]/acc[k][2]).toFixed(3):null,n:acc[k][2]}))};}
        return out;};
    }
  });
  const props=source.props??[];
  const matTop=props.some(p=>p.type==='mat')?Math.max(...props.filter(p=>p.type==='mat').map(p=>(p.at?.[1]??0)+(p.size?.[2]??0.006))):0;
  const caps=await page.evaluate(()=>{const out=[];try{const q=__props.qaPrims?.()??[];for(const c of q)if(c.a&&c.b&&c.r)out.push({a:c.a,b:c.b,r:c.r});}catch{}return out;});
  for(const p of props)if(p.type==='pullupBar'&&p.capsule)caps.push(p.capsule);
  // r3 (2026-11-19): a pull-up bar without an explicit capsule = its drawn bar (drill-anim/page/props.js pullupBar: radius 16 mm, along X)
  for(const p of props)if(p.type==='pullupBar'&&!p.capsule&&!p.yaw){const W=p.width||1.0,H=p.height||2.2,a=p.at||[0,0,0];caps.push({a:[a[0]-W/2,a[1]+H,a[2]],b:[a[0]+W/2,a[1]+H,a[2]],r:0.016});}
  res.floorY=matTop;res.propCapsules=caps.length;
  const want=new Set(renderFrames);let warm=null;
  const only=opt('--frames');const frames=[];if(only)frames.push(...only.split(',').map(Number));else for(let f=0;f<N;f+=stride)frames.push(f);for(const f of renderFrames)if(!frames.includes(f))frames.push(f);frames.sort((a,b)=>a-b);
  if(pngDir)fs.mkdirSync(pngDir,{recursive:true});
  for(const f of frames){
    fail(freeGiB()>=.5,'Low free memory');
    const st=await stageAt(page,source,f/fps,warm);warm=st.x;
    const r=await page.evaluate(([fl,caps,render,mc,gp])=>{const d=window.__v5.pose();const m=window.__tsMeasure(fl,caps);if(mc.length)m.meshClip=window.__tsMeshClip(mc);if(gp.length)m.gap=window.__tsGap(gp);m.arm=window.__tsArm();m.fm=window.__fmProps();const url=render?window.__v5.render():null;return {d,m,url};},[matTop,caps,want.has(f),meshPairs,gapPairs]);
    if(r.url&&pngDir)fs.writeFileSync(path.join(pngDir,`${String(f).padStart(4,'0')}.png`),Buffer.from(r.url.split(',')[1],'base64'));
    // review views (r2, 2026-11-19): the same V5 frame from fixed directions around the body (camera restored by the next stageAt)
    if(want.has(f)&&pngDir&&views.length)for(const vw of views){
      const url=await page.evaluate(([d,up,fc])=>{const T=window.__toonT,V=window.__v5,c=flareInspector.viewer.camera;const P=[];
        for(const n of ['pelvis','torso','head','leftHand','rightHand','leftFoot','rightFoot','leftShin','rightShin','leftForearm','rightForearm'])P.push(V.bones[n].getWorldPosition(new T.Vector3()));
        let box=new T.Box3().setFromPoints(P),cen=box.getCenter(new T.Vector3()),rad=box.getSize(new T.Vector3()).length()/2+0.22;
        if(fc){const G=V.hubGrasp,s=/^(left|right)Hand$/.exec(fc.bone)?.[1];rad=fc.r;
          if(G&&G.sides.includes(s)){const hm=G.J.meshes.hands[s];hm.updateMatrixWorld(true);hm.geometry.computeBoundingBox();cen=hm.geometry.boundingBox.getCenter(new T.Vector3()).applyMatrix4(G.posedMatrix(hm,V.bones));}
          else cen=V.bones[fc.bone].getWorldPosition(new T.Vector3());}
        const dir=new T.Vector3(...d).normalize(),dist=rad/Math.tan(c.fov*Math.PI/360);
        c.up.set(...up);c.position.copy(cen).addScaledVector(dir,dist);c.lookAt(cen);c.updateMatrixWorld();const u=V.render();c.up.set(0,1,0);return u;},[vw.dir,vw.up,vw.focus??null]);
      fs.writeFileSync(path.join(pngDir,`${String(f).padStart(4,'0')}-${vw.name}.png`),Buffer.from(url.split(',')[1],'base64'));
    }
    res.samples.push({...(r.m.grip?{grip:r.m.grip}:{}),...(r.m.hubGrasp?{hubGrasp:r.m.hubGrasp}:{}),f,t:+(f/fps).toFixed(3),spine:r.d.spine,warn:st.warn?.length??0,warnText:(st.warn??[]).slice(0,3).map(w=>typeof w==='string'?w:JSON.stringify(w)).join(' | ').slice(0,300),ang:r.d.angV5,angHub:r.d.angHub,posErr:r.d.posErr,posErrBone:r.d.posErrBone,H:Object.fromEntries(['leftPalm','rightPalm','leftWrist','rightWrist','leftToe','rightToe','leftAnkle','rightAnkle','leftKnee','rightKnee','leftShoulder','rightShoulder','leftElbow','rightElbow','pelvis','head','leftHip','rightHip','neck','shoulderCenter','waist','leftHeel','rightHeel','leftFingertip','rightFingertip'].map(n=>[n,st.joints[n]])),minY:r.m.minY,minP:r.m.minP,prop:r.m.prop,J:r.m.J,Q:r.m.Q,...(r.m.meshClip?{meshClip:r.m.meshClip}:{}),...(r.m.gap?{gap:r.m.gap}:{}),arm:r.m.arm,wrist:r.d.wrist,...(r.m.fm?{fm:r.m.fm}:{})});
  }
  res.pageErrors=report.pageErrors;
}finally{await scene.browser.close();}
// ---- summary
const S=res.samples,inWin=(t,w)=>w.some(([a,b])=>t>=a-1e-6&&t<=b+1e-6);
const sum={};
const c=plan.checks??{};
const elb=S.filter(s=>!c.lockElbows||inWin(s.t,c.lockElbows));
sum.elbowMin={left:+Math.min(...elb.map(s=>s.ang.leftElbow)).toFixed(1),right:+Math.min(...elb.map(s=>s.ang.rightElbow)).toFixed(1),window:c.lockElbows??'all'};
sum.elbowMax={left:+Math.max(...S.map(s=>s.ang.leftElbow)).toFixed(1),right:+Math.max(...S.map(s=>s.ang.rightElbow)).toFixed(1)};
sum.kneeMin={left:+Math.min(...S.map(s=>s.ang.leftKnee)).toFixed(1),right:+Math.min(...S.map(s=>s.ang.rightKnee)).toFixed(1)};
sum.kneeMax={left:+Math.max(...S.map(s=>s.ang.leftKnee)).toFixed(1),right:+Math.max(...S.map(s=>s.ang.rightKnee)).toFixed(1)};
sum.pins={};
for(const p of c.pins??[]){const act=S.filter(s=>inWin(s.t,p.when));if(!act.length)continue;
  const P=act.map(s=>s.J[p.bone]),mean=[0,1,2].map(i=>P.reduce((a,x)=>a+x[i],0)/P.length);
  sum.pins[p.bone+(p.label?':'+p.label:'')]={frames:act.length,driftMm:+(Math.max(...P.map(x=>Math.hypot(x[0]-mean[0],x[1]-mean[1],x[2]-mean[2])))*1000).toFixed(1)};}
sum.hubPins={};
for(const p of c.pins??[]){const hb=p.hub;if(!hb)continue;const act=S.filter(s=>inWin(s.t,p.when));if(!act.length)continue;
  const P=act.map(s=>s.H[hb]),mean=[0,1,2].map(i=>P.reduce((a,x)=>a+x[i],0)/P.length);
  sum.hubPins[hb+(p.label?':'+p.label:'')]={frames:act.length,driftMm:+(Math.max(...P.map(x=>Math.hypot(x[0]-mean[0],x[1]-mean[1],x[2]-mean[2])))*1000).toFixed(1)};}
sum.hubElbowMin={left:+Math.min(...elb.map(s=>s.angHub.leftElbow)).toFixed(1),right:+Math.min(...elb.map(s=>s.angHub.rightElbow)).toFixed(1)};
{const w=S.reduce((a,s)=>s.posErr>a.posErr?s:a,S[0]);sum.posErrWorst={mm:+(w.posErr*1000).toFixed(1),bone:w.posErrBone,f:w.f};}
const regs=[...new Set(S.flatMap(s=>Object.keys(s.minY)))];
sum.floorMinMm=Object.fromEntries(regs.map(k=>[k,Math.min(...S.map(s=>s.minY[k]??1e9))]));
sum.floorWorst=Object.entries(sum.floorMinMm).sort((a,b)=>a[1]-b[1])[0];
const pr=[...new Set(S.flatMap(s=>Object.keys(s.prop)))];
if(pr.length)sum.propMinMm=Object.fromEntries(pr.map(k=>[k,Math.min(...S.map(s=>s.prop[k]??1e9))]));
// self-clip capsules (qa.py radii, mm)
const segs={torso:['pelvis','neck',115],upperArmL:['leftUpperArm','leftForearm',42],upperArmR:['rightUpperArm','rightForearm',42],forearmL:['leftForearm','leftHand',34],forearmR:['rightForearm','rightHand',34],
  thighL:['leftThigh','leftShin',68],thighR:['rightThigh','rightShin',68],shinL:['leftShin','leftFoot',48],shinR:['rightShin','rightFoot',48]};
const adj=new Set(['torso|upperArmL','torso|upperArmR','upperArmL|forearmL','upperArmR|forearmR','torso|thighL','torso|thighR','thighL|shinL','thighR|shinR','thighL|thighR'].map(x=>x.split('|').sort().join('|')));
const allow=new Set((c.allowContact??[]).map(x=>x.split('|').sort().join('|')));
function segDist(p1,q1,p2,q2){const d1=q1.map((v,i)=>v-p1[i]),d2=q2.map((v,i)=>v-p2[i]),r=p1.map((v,i)=>v-p2[i]);const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const a=dot(d1,d1),e=dot(d2,d2),f=dot(d2,r),cc=dot(d1,r),b=dot(d1,d2),den=a*e-b*b;let s=den>1e-12?Math.max(0,Math.min(1,(b*f-cc*e)/den)):0;let t=(b*s+f)/e;
  if(t<0){t=0;s=Math.max(0,Math.min(1,-cc/a));}else if(t>1){t=1;s=Math.max(0,Math.min(1,(b-cc)/a));}
  const c1=p1.map((v,i)=>v+d1[i]*s),c2=p2.map((v,i)=>v+d2[i]*t);return Math.hypot(c1[0]-c2[0],c1[1]-c2[1],c1[2]-c2[2]);}
let worst={mm:1e9};const names=Object.keys(segs);
for(const s of S)for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){const k=[names[i],names[j]].sort().join('|');if(adj.has(k)||allow.has(k))continue;
  const A=segs[names[i]],B=segs[names[j]],d=segDist(s.J[A[0]],s.J[A[1]],s.J[B[0]],s.J[B[1]])*1000-A[2]-B[2];if(d<worst.mm)worst={mm:+d.toFixed(1),pair:k,f:s.f};}
sum.selfClipWorst=worst;
if(meshPairs.length){const mw={};for(const s of S)for(const [k,v] of Object.entries(s.meshClip??{}))if(!mw[k]||v.mm>mw[k].mm)mw[k]={mm:v.mm,f:s.f,tB:v.tB};sum.meshClipWorst=mw;}
if(gapPairs.length){const gw={};for(const s of S)for(const [k,v] of Object.entries(s.gap??{})){if(!v||v.mm===null)continue;const g=gw[k]||(gw[k]={min:1e9,max:-1e9,minContactCells:1e9});if(v.mm<g.min){g.min=v.mm;g.fMin=s.f;}if(v.mm>g.max){g.max=v.mm;g.fMax=s.f;}g.minContactCells=Math.min(g.minContactCells,v.contactCells);}sum.gap=gw;}
{const fb={},fw={};for(const s of S){for(const [k,v] of Object.entries(s.fm?.box??{}))fb[k]=Math.min(fb[k]??1e9,v);for(const [k,v] of Object.entries(s.fm?.wall??{}))fw[k]=Math.min(fw[k]??1e9,v);}if(Object.keys(fb).length)sum.boxMinMm=fb;if(Object.keys(fw).length)sum.wallMinMm=fw;}
sum.maxPosErrMm=+(Math.max(...S.map(s=>s.posErr))*1000).toFixed(2);
sum.solverWarnFrames=S.filter(s=>s.warn>0).length;
sum.pageErrors=res.pageErrors.length;
res.summary=sum;
if(outFile){fs.mkdirSync(path.dirname(path.resolve(outFile)),{recursive:true});fs.writeFileSync(outFile,JSON.stringify(res));}
console.log(JSON.stringify({id,summary:sum}));
