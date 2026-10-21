import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {config} from '../../drill-anim/lib/config.mjs';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw new Error(message); };
export const normalizeArgs = args => Array.isArray(args) ? args : String(args ?? '--use-gl=swiftshader --enable-unsafe-swiftshader').split(/\s+/).filter(Boolean);
export function publicConfig(c = config()) {
  return {chromiumArgs: normalizeArgs(c.chromium_args), chromiumChannel: c.chromium_channel ?? null,
    playwrightModule: c.playwright_module, playwrightBrowsersPath: c.playwright_browsers_path ?? null, appUrl: c.app_url};
}
export function absoluteFileReference(file) {
  const bytes = fs.readFileSync(file);
  return {path: path.resolve(file), sha256: hash(bytes), bytes: bytes.length};
}
function verify(ref) {
  check(ref && path.isAbsolute(ref.path), 'Runtime references must name absolute local public files');
  const actual = absoluteFileReference(ref.path);
  check(actual.sha256 === ref.sha256 && actual.bytes === ref.bytes, `Runtime reference SHA/bytes changed: ${ref.path}`);
  return ref.path;
}
export function loadRuntime(file, options = {}) {
  check(file && path.isAbsolute(file), 'Pass an explicit absolute --runtime profile');
  const bytes = fs.readFileSync(file), profile = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  check(profile.format === 'pose-hub-render-runtime@1' && typeof profile.id === 'string', 'Invalid GPU runtime profile');
  check(Array.isArray(profile.chromiumArgs) && profile.chromiumArgs.every(a => typeof a === 'string' && !/\s/.test(a)), 'Runtime chromiumArgs must be separate whitespace-free arguments');
  check(typeof profile.browserVersion === 'string' && typeof profile.actualWebGLRenderer === 'string' && profile.actualWebGLRenderer.length > 10, 'Runtime browserVersion/actualWebGLRenderer required');
  check(!/swiftshader|llvmpipe|software|microsoft basic render/i.test(profile.actualWebGLRenderer), 'Software WebGL runtime is not approved for this production profile');
  check(profile.chromiumChannel === (profile.defaultConfig?.chromiumChannel ?? null), 'Runtime channel differs from the approved default channel');
  if (options.checkConfig !== false) check(isDeepStrictEqual(publicConfig(options.config ?? config()), profile.defaultConfig), 'Current public config/env differs from the approved runtime baseline');
  verify(profile.browserExecutable); verify(profile.playwrightModule); verify(profile.probe.script);
  check(path.resolve(profile.playwrightModule.path) === path.resolve(profile.defaultConfig.playwrightModule), 'Runtime Playwright module differs from approved config');
  check(Array.isArray(profile.probe.results) && profile.probe.results.length >= 2, 'Runtime requires two actual successful same-device probe results');
  for (const ref of profile.probe.results) {
    const probe = JSON.parse(fs.readFileSync(verify(ref), 'utf8').replace(/^\uFEFF/, ''));
    check(probe.success && probe.probeSourceSha256 === profile.probe.script.sha256, 'Runtime probe was unsuccessful or came from another script');
    check(probe.browserVersion === profile.browserVersion && probe.webgl?.unmaskedRenderer === profile.actualWebGLRenderer && !probe.webgl.contextLost, 'Runtime actual WebGL/browser differs from recorded probes');
    check(isDeepStrictEqual(probe.requestedArgs, profile.chromiumArgs) && (probe.chromiumChannel ?? null) === profile.chromiumChannel, 'Runtime launch arguments/channel differ from actual probes');
    check(path.resolve(probe.actualCommandLine?.arguments?.[0] ?? '') === path.resolve(profile.browserExecutable.path), 'Runtime browser executable differs from probed browser');
  }
  return {file: path.resolve(file), sha256: hash(bytes), id: profile.id, profile};
}
export function validateActualWebGL(profile, browserVersion, actual, args, channel = null) {
  check(browserVersion === profile.browserVersion, 'Actual browser version differs from runtime profile');
  check(isDeepStrictEqual(args, profile.chromiumArgs) && channel === profile.chromiumChannel, 'Actual launch arguments/channel differ from runtime profile');
  check(actual.unmaskedRenderer === profile.actualWebGLRenderer && !actual.contextLost, 'Actual WebGL device differs from runtime profile or the context was lost');
}
