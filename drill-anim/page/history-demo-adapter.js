// Explicit adapter for the five historical src/training-motion.js demos.
// Not loaded by default: batch workers opt in after the normal drill boot.
// Each browser retains one real source clip; no similar drill substitutes it.
(function () {
  const E = window.__drill;
  if (!E) throw new Error('Historical demos require the drill engine first');
  const originalApplyAt = E.applyAt, originalSetupCamera = E.setupCamera;
  let installed = null;

  const requireClip = spec => {
    if (!installed || installed.clip.id !== spec.legacyClipId) throw new Error('Install this historical clip before sampling: ' + spec.legacyClipId);
    return installed.clip;
  };

  window.__installHistoricalDemo = async function (spec) {
    if (!spec?.legacyClipId) throw new Error('Historical demo spec requires legacyClipId');
    if (installed) {
      if (installed.clip.id !== spec.legacyClipId) throw new Error('Use a separate browser for each historical clip');
      return installed.info;
    }
    const sourceUrl = '/src/training-motion.js', rigUrl = '/coach/coach-rig.json';
    const [module, response] = await Promise.all([import(sourceUrl), fetch(rigUrl)]);
    if (!response.ok) throw new Error('Historical rig unavailable: ' + response.status);
    if (!module.TRAINING_CLIP_IDS.includes(spec.legacyClipId)) throw new Error('Unknown historical clip: ' + spec.legacyClipId);
    const rigData = await response.json(), viewer = flareInspector.viewer;
    E.selectModelProfile(spec);
    E.init();
    const clip = module.createTrainingClip(spec.legacyClipId, { rigData, motion: viewer.motion });
    if (spec.timeline?.duration !== clip.period) throw new Error('Historical duration differs from its original source');
    const seated = ['straddleLift', 'hipOpening'].includes(clip.id);
    const info = {
      legacyId: clip.id, duration: clip.period, label: clip.label,
      sourceUrl, rigUrl, sourceFramingBounds: structuredClone(clip.framingBounds),
      cameraDirection: seated ? [0.4, 0.65, 1] : [1, 0.58, 0.85],
      cameraPadding: 0.05, cameraScale: 1.2, cameraAt: 0,
      applyOptions: { ...clip.applyOptions }, groundLockPreserved: true,
      description: clip.describe(0),
      qaScope: 'Original source has no authored drill-anim QA. Retain its warnings and measured contacts; do not alter motion to satisfy new thresholds.',
    };
    installed = { clip, info };
    window.__historicalDemoInfo = info;
    return info;
  };

  E.applyAt = function (spec, time, warm) {
    if (!spec.legacyClipId) return originalApplyAt(spec, time, warm);
    const clip = requireClip(spec), viewer = flareInspector.viewer;
    E.selectModelProfile(spec);
    E.init();
    const pose = clip.sample(time);
    // This is the exact original display call, including its groundLock and
    // applyOptions. No descriptor solver, custom shoulder offset or leg re-fit.
    viewer.motion.applyPose(pose, clip.applyOptions);
    viewer.coach.updateMatrixWorld(true);
    E._jo = null; E.poseTargets = null;
    E.currentDescriptor = { hands: { left: { mode: 'floor' }, right: { mode: 'floor' } } };
    window.__setRelax(0, 0); window.__toonUni.uRelax.value = [0, 0];
    const description = clip.describe(time), warnings = viewer.motion.getMetrics().warnings || [];
    return {
      params: { legacyProgress: description.progress }, x: {}, warn: [...warnings], touch: {},
      locked: Object.fromEntries(['left', 'right'].map(side => [side, pose.limbs[side].handLocked])),
    };
  };

  E.setupCamera = function (spec, size) {
    if (!spec.legacyClipId) return originalSetupCamera(spec, size);
    const clip = requireClip(spec), viewer = flareInspector.viewer, T = __toonT;
    E.applyAt(spec, 0, null);
    // Match training-preview.js::frameClip: real t=0 human bounds plus the
    // source's conservative clip envelope. Browser UI insets are not exported.
    const bounds = viewer.motion.getMetrics().bounds;
    const box = new T.Box3(new T.Vector3(...bounds.min), new T.Vector3(...bounds.max));
    box.union(new T.Box3(new T.Vector3(...clip.framingBounds.min), new T.Vector3(...clip.framingBounds.max)));
    box.expandByScalar(0.05);
    viewer.fitBounds(box, new T.Vector3(...installed.info.cameraDirection), 1.2);
    viewer.camera.aspect = 1; viewer.camera.updateProjectionMatrix();
    E.cam0 = { pos: viewer.camera.position.clone(), tgt: viewer.controls.target.clone() };
    viewer.playing = false;
    window.__historicalDemoInfo.cameraBounds = { min: box.min.toArray(), max: box.max.toArray() };
    return true;
  };
})();
