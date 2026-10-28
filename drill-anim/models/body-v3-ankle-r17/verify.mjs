import {PROFILE, VERSION, verify} from './loader.mjs';
const manifest=verify();
console.log(JSON.stringify({profile:PROFILE,version:VERSION,sourceCount:Object.keys(manifest.sourceSha256).length,status:manifest.status}));
