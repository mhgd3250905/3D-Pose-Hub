import { gripPose } from '../lib/grip.mjs';
// scapular-B 单杠肩胛引体 (scapular pull-up). Dead hang from a doorway pull-up bar, overhand grip a little wider than the
// shoulders, arms straight the whole time. 'dep' pulls the shoulder blades down and back (scapular depression +
// retraction): the body rises a few centimetres with the elbows still locked, holds 1 s, and sinks back to a passive hang.
// v2 (Hark self-QA): closed power grip round the bar (fist baked by P.bakeGrip #23, gripHand props + lib/grip.mjs gripPose #82),
// overhand: palms forward, thumbs toward the midline. The hands never move on the bar; legs hang straight and together. 2 reps / 8 s.
// Head points +Y, front faces +Z, body left = +X. Bar along X at height BH, z = BZ.
const BH = 2.2, BZ = 0.02, BX = 0.27;
// bar -> palm direction horizontal backward (-Z): the wrist hangs straight under the bar; grip axis toward the thumb = toward the midline (-sg X)
const hand = sg => ({ mode: 'free', frame: 'world', relax: 0, ...gripPose(sg < 0 ? 'right' : 'left', [sg * BX, BH, BZ], [-sg, 0, 0], [0, 0, -1]), poleUp: [sg * 0.6, 1.6, -0.3] });
const foot = sg => ({ mode: 'free', frame: 'hips', ankle: [sg * 0.075, 0.0893, 0.0], rot: [[[1, 0, 0], 22]], poleLow: [sg * 0.08, 0.5, 0.8] });
const rep = s => [[s + 0.4, 0], [s + 1.4, 1], [s + 2.4, 1], [s + 3.6, 0]];
export default {
  id: 'scapular-B', name: '单杠肩胛引体', nameEn: 'Scapular Pull-Up',
  timeline: { duration: 8, tracks: { dep: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0, 1.25, -0.03],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      shoulders: { shift: [0, 0.035, 0.0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1), left: foot(1) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178 }, { type: 'reach', limb: 'leftArm', angle: 178 },
      ],
      // v2: pz dropped from the solve: at the dead hang the arms are at full reach (clamped) and pz had two minima (cold start
      // 7 cm further back than warm start) -> visible jump at the loop seam and at chunk starts; the body now hangs at pz 0
      solve: { vars: ['py'], reg: { py: 0.02 } },
    },
    deltas: { dep: { shoulders: { shift: [0, -0.03, -0.015] } } },
  },
  highlight: { groups: ['scapular'], side: 'both', pulseTrack: 'dep', pulseBase: 0.3 },
  camera: { dir: [0.55, 0.05, -1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm'], pad: 0.25, k: 1.0, drift: 2, at: 1.9 },
  // v2: framed so the whole pull-up frame (posts down to the floor) stays in the picture
  frame: { mode: 'fit', width: 560, height: 760, cx: 540, cy: 440 },
  stillAt: 1.9,
  shadow: { joints: ['leftToe', 'rightToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 60, ry: 12, a: 0.35 }], bands: [] },
  props: [{ type: 'pullupBar', at: [0, 0, BZ], width: 0.86, height: BH }, { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' }],
  qaProps: [{ a: [-0.43, BH, BZ], b: [0.43, BH, BZ], r: 0.016 }],
  keyFrames: [0.4, 1.4, 1.9],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
