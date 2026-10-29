// Diagnostic control: rebuild posed elbow normals without moving vertices.
import {install as installElbow} from './elbow-dqs-r1.mjs';
export async function install(page){return installElbow(page,{mode:'normals-only'});}
