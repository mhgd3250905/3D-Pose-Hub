// Fresh-page preview of the seven-repair entry, without archived QA inputs.
// Produces selected PNGs only; image generation is not visual acceptance.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2), out = args.shift();
let caseName = 'squat', frameValues, modelName = 'r7';
const seenFlags = new Set();
while (args.length) {
  const flag = args.shift(), value = args.shift();
  if (!['--case', '--frames', '--model'].includes(flag) || !value || value.startsWith('--') || seenFlags.has(flag)) {
    throw Error('Expected unique --case, --frames or --model options with values');
  }
  seenFlags.add(flag);
  if (flag === '--case') caseName = value;
  else if (flag === '--model') modelName = value;
  else frameValues = value;
}
const cases = {
  squat: {spec: 'a-deep-squat-r3.js', frames: [1, 3, 5], duration: 6},
  bear: {spec: 'h-bear-plank.js', frames: [0.1, 0.65, 2, 3.6], duration: 8},
};
const models = {
  r7: {directory: 'training-human-v3-completed-r7', profile: 'training-human-v3-completed', version: '1.0.0-r7'},
  p5: {directory: 'training-human-v3-shoulder-completed-r3', profile: 'training-human-v3-shoulder-completed', version: '1.0.0-r3'},
};
if (!out || fs.existsSync(out) || !cases[caseName] || !models[modelName]) {
  throw Error('Usage: node preview-r7.mjs <NEW output directory> [--model r7|p5] [--case squat|bear] [--frames 1,3,5]');
}
const setting = cases[caseName];
const frames = frameValues ? frameValues.split(',').map(Number) : setting.frames;
if (!frames.length || new Set(frames).size !== frames.length ||
    frames.some(t => !Number.isFinite(t) || t < 0 || t >= setting.duration)) {
  throw Error('Frame times must be unique seconds within the selected action');
}
const imp = f => import(pathToFileURL(path.join(repo, f)).href);
const selectedModel = models[modelName];
const model = await imp('drill-anim/models/' + selectedModel.directory + '/loader.mjs');
const {loadTheme} = await imp('drill-anim/lib/config.mjs');
const spec = {
  ...structuredClone((await imp('drill-anim/specs/' + setting.spec)).default),
  modelProfile: 'training-human-v2plus-hands-native',
  nativeHands: {version: '1.0.0-r3'},
  v2plus: {outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'},
};
async function stage(name, run) {
  if (os.freemem() < 3.5 * 1024 ** 3) throw Error('Free memory below 3.5 GiB before ' + name);
  console.log(name);
  let timer;
  try {
    return await Promise.race([run(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error('Phase timeout: ' + name)), 90000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}
fs.mkdirSync(out, {recursive: true});
const {b, p} = await stage('boot', () => model.boot({size: 480, pr: 1, theme: loadTheme()}));
const errors = [];
p.on('pageerror', e => errors.push(String(e)));
p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  const setup = await stage('apply ' + modelName + ' entry', () => model.applyV3(p, spec));
  if (setup.profile !== selectedModel.profile || setup.version !== selectedModel.version) {
    throw Error('Unexpected profile or version');
  }
  const report = {
    profile: setup.profile, version: setup.version, action: setting.spec,
    scope: 'Selected-frame preview only; no comparison or visual acceptance inferred',
    frames: [], pageErrors: errors,
  };
  for (const t of frames) {
    await stage('pose ' + t, () => p.evaluate(([s, time]) => {
      __drill.selectModelProfile(s);
      __drill.applyAt(s, time, null);
      __setHighlight(s.highlight || {groups: [], side: 'both'});
      __glowU.value = 0;
      __rimU.value = 1;
      flareInspector.viewer.coach.updateMatrixWorld(true);
    }, [spec, t]));
    for (const side of ['left', 'right']) {
      const views = caseName === 'squat' ? ['knee-front', 'knee-outside', 'hip-rear-up'] : ['shoulder-front', 'shoulder-outer', 'shoulder-back'];
      for (const view of views) {
        const file = `${caseName}-t${String(t).replace('.', '_')}-${side}-${view}.png`;
        const data = await stage(file, () => p.evaluate(([side, view]) => {
          const T = __toonT, v = flareInspector.viewer;
          const point = name => v.coach.getObjectByName(name).getWorldPosition(new T.Vector3());
          let camera, target;
          if (view.startsWith('shoulder')) {
            target = point(side + 'UpperArm');
            const torso = point('torso'), pelvis = point('pelvis');
            const outward = target.clone().sub(torso).normalize();
            const up = torso.clone().sub(pelvis);
            up.addScaledVector(outward, -up.dot(outward)).normalize();
            const tangent = new T.Vector3().crossVectors(up, outward).normalize();
            camera = new T.PerspectiveCamera(30, 1, .02, 20);
            camera.position.copy(target).addScaledVector(outward, .65).addScaledVector(tangent, view.endsWith('front') ? .28 : view.endsWith('back') ? -.28 : 0);
            camera.up.copy(up);
          } else {
            camera = new T.PerspectiveCamera(22, 1, .02, 20);
            if (view === 'hip-rear-up') {
              const center = point(side + 'Thigh');
              target = center.clone().add(new T.Vector3(0, .03, 0));
              camera.position.copy(center).add(new T.Vector3(side === 'left' ? .48 : -.48, .20, -.34));
            } else {
              target = point(side + 'Shin');
              const forward = new T.Vector3(0, 0, 1).applyQuaternion(v.coach.getObjectByName('pelvis').getWorldQuaternion(new T.Quaternion()));
              forward.y = 0;
              forward.normalize();
              const direction = view === 'knee-front' ? forward : new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), forward).multiplyScalar(side === 'left' ? 1 : -1);
              camera.position.copy(target).addScaledVector(direction, .68).add(new T.Vector3(0, .04, 0));
            }
          }
          camera.lookAt(target);
          camera.updateProjectionMatrix();
          v.renderer.setClearColor(0x101318, 1);
          v.renderer.render(v.scene, camera);
          return {image: v.renderer.domElement.toDataURL('image/png'), camera: camera.position.toArray(), target: target.toArray()};
        }, [side, view]));
        fs.writeFileSync(path.join(out, file), Buffer.from(data.image.split(',')[1], 'base64'), {flag: 'wx'});
        report.frames.push({time: t, side, view, file, camera: data.camera, target: data.target});
      }
    }
  }
  if (errors.length) throw Error('Page errors: ' + JSON.stringify(errors));
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
} finally {
  await b.close();
}
