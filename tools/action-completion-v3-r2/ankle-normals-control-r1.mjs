// Diagnostic control: isolate posed normal repair from DQS position changes.
import {install as installDqs} from './ankle-dqs-r1.mjs';
export const install=page=>installDqs(page,{mode:'normals-only'});
