import { defineConfig } from 'vite';
import { resolve } from 'node:path';
// Pose-Hub: the 3D scene the renderer boots lives in runtime/ (moved from the 3D-Body repo root).
// drill-anim/drill.py starts Vite from the repo root (app_dir ".."), so this file sets root to runtime/.
// cacheDir must stay INSIDE runtime/ so optimized deps are served as /node_modules/.vite/deps/three.js,
// which drill-anim/page/toon.js and posedlib.js import by that exact URL.
const runtime = resolve(import.meta.dirname, 'runtime');
export default defineConfig({
  root: runtime,
  cacheDir: resolve(runtime, 'node_modules/.vite'),
  server: { fs: { allow: [import.meta.dirname] } },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: { main: resolve(runtime, 'index.html') },
      output: { manualChunks(id) { if (id.includes('node_modules/three')) return 'three'; } },
    },
  },
});
