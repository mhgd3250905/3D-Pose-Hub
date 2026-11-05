// t-vsit-r7-sc1: self-collision fix (pose-fix r4, 2026-11-05) of t-vsit-r7. On the current model the calibrated hold put the
// thighs ~24 deg from vertical against a torso only ~15 deg back (hip angle ~40 deg), so both thighs sank ~8 cm into the belly
// (self-collision d10 79 mm). Both legs swing down about the live hip joint (hips frame) by SWING deg; knee angle, foot-to-shin
// angle, spread, pelvis root, trunk, hands/arms, timing and camera are the source's.
import base from './t-vsit-r7.js';
import { swingLegs } from '../lib/leg-swing-sc1.mjs';
const SWING = 32;
const HIP = { left: [0.081543, 0.915541, 0.003696], right: [-0.081543, 0.915541, 0.003696] };
export default swingLegs(base, 't-vsit-r7-sc1', SWING, HIP);
