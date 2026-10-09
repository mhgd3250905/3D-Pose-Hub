import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  build:{rollupOptions:{
    input:{main:resolve(import.meta.dirname,'index.html'),muscleViewer:resolve(import.meta.dirname,'muscle-viewer.html')},
    output:{manualChunks(id){if(id.includes('node_modules/three'))return 'three';}}}}
});
