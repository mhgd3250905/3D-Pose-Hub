// Node --import preload: observe the renderer's existing browser/context only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadRuntime,validateActualWebGL} from './runtime-profile.mjs';
const runtime = loadRuntime(process.env.POSE_HUB_RENDER_RUNTIME, {checkConfig: false});
const root = process.env.POSE_HUB_RENDER_ROOT, action = process.env.POSE_HUB_RENDER_ACTION, stage = process.env.POSE_HUB_RENDER_STAGE;
if (!root || !/^[\w-]+$/.test(action ?? '') || !['preview','full'].includes(stage)) throw new Error('Runtime guard requires root/action/stage bindings');
const profile = runtime.profile;
if (profile.defaultConfig.playwrightBrowsersPath) process.env.PLAYWRIGHT_BROWSERS_PATH = profile.defaultConfig.playwrightBrowsersPath;
const {chromium} = await import(pathToFileURL(profile.playwrightModule.path));
const launch = chromium.launch.bind(chromium); let browserCount = 0;
chromium.launch = async options => {
  if (++browserCount !== 1) throw new Error('One action may launch exactly one render browser');
  const b = await launch(options);
  try {
    if (b.version() !== profile.browserVersion) throw new Error('Actual browser version differs from runtime profile');
    const newPage = b.newPage.bind(b); let pageCount = 0;
    b.newPage = async (...args) => {
      if (++pageCount !== 1) throw new Error('Runtime guard expects one renderer page');
      const p = await newPage(...args), wait = p.waitForFunction.bind(p); let validated = false;
      p.waitForFunction = async (...waitArgs) => {
        const handle = await wait(...waitArgs);
        if (!validated) {
          const actual = await p.evaluate(() => {
            const gl = flareInspector.viewer.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
            return {unmaskedVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
              unmaskedRenderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
              contextLost: gl.isContextLost(), version: gl.getParameter(gl.VERSION), contextAttributes: gl.getContextAttributes()};
          });
          validateActualWebGL(profile, b.version(), actual, options.args, options.channel ?? null);
          const file = path.join(root, 'qa/runtime', stage, `${action}.json`); fs.mkdirSync(path.dirname(file), {recursive: true});
          const proof = {format: 'pose-hub-actual-render-runtime@1', actionId: action, stage, runtimeSha256: runtime.sha256,
            guardSha256: crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
            browserVersion: b.version(), args: options.args, channel: options.channel ?? null, actualWebGL: actual,
            browserCount, checkedAt: new Date().toISOString()};
          fs.writeFileSync(file, JSON.stringify(proof, null, 2) + '\n', {flag: 'wx'}); validated = true;
          console.log(JSON.stringify({event: 'runtime-verified', actionId: action, runtimeSha256: runtime.sha256, renderer: actual.unmaskedRenderer}));
        }
        return handle;
      };
      return p;
    };
    return b;
  } catch (error) { await b.close(); throw error; }
};
