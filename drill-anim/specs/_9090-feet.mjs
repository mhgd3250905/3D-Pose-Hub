// Shared feet for the 90/90 revisions (s-9090-r2, a-9090-r2, h-9090-liftoff-r2) · HipLab media fix 2026-10-17, issue 10.
// The originals placed both feet with a plain yaw (sole down, toes level), so each foot stood upright at the end of a shin
// that lies on the mat. Now each foot follows its shin, relaxed and plantar-flexed (front toes 45 deg, back toes 30 deg off the shin line):
//  - front (RIGHT) leg, hip in external rotation: shin across the front of the body (+X); the foot points on along the shin
//    toward the side and rests on its OUTER edge (right foot outer edge = rest -X -> down); sole faces the body.
//  - back (LEFT) leg, hip in internal rotation: shin points back (-Z); the foot points back along the shin and rests on
//    its INNER edge / instep (left foot inner edge = rest -X -> down); sole faces the body.
// Shin directions are the solved knee->ankle lines of s-9090 (knee R [-0.078,0.094,0.398], ankle R [0.33,0.085,0.36];
// knee L [0.391,0.097,0.075], ankle L [0.45,0.085,-0.33]). Ankles are lowered so the shoe edge rests on the mat.
import { footRot, tilt } from '../lib/foot-orient.mjs';
export const SHIN_R = [0.408, -0.009, -0.038], SHIN_L = [0.059, -0.012, -0.405];
export const TOE_R = tilt(SHIN_R, [0, 0, 1], 45), TOE_L = tilt(SHIN_L, [1, 0, 0], 30);
export const ROT_R = footRot(TOE_R, [0, -1, 0], [-1, 0, 0]);
export const ROT_L = footRot(TOE_L, [0, -1, 0], [-1, 0, 0]);
export const ANKLE_R = [0.33, 0.0687, 0.36], ANKLE_L = [0.45, 0.0646, -0.33];   // y lowered 16.3 / 20.4 mm (shoe edge on the mat)
