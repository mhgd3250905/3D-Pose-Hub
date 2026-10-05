import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const COLORS = { left: 0x87cfdf, right: 0xeeaa93, center: 0xc5e5a0, selected: 0xf4f7d0 };
const clonePose = pose => JSON.parse(JSON.stringify(pose));
const validArray = (value, count) => Array.isArray(value) && value.length === count && value.every(Number.isFinite);

/**
 * Direct controls for the real character rig. Positions match
 * motion.getEditableHandles(): model local space, Three.js Y-up. Rotations are
 * model local except the waist quaternion, which is relative to bodyQuaternion
 * and carries that parentQuaternion. World markers and the transform proxy
 * apply/remove the model and parent frames at the editor boundary; the waist
 * rotation gizmo uses local space.
 */
export function createPoseEditor({ scene, camera, renderer, orbit, motion, onChange, onSelection }) {
  if (!motion?.getEditableHandles || !motion?.editHandle || !motion?.capturePose) throw new Error('人物姿势编辑接口尚未准备好。');
  const canvas = renderer.domElement;
  const documentTarget = canvas.ownerDocument;
  const initialTouchAction = canvas.style.touchAction;
  const initialCursor = canvas.style.cursor;
  const model = motion.group;
  const markers = new THREE.Group();markers.name = 'Pose editor · operation points';markers.visible = false;
  scene.add(markers);
  const proxy = new THREE.Object3D();proxy.name = 'Pose editor · selected transform';markers.add(proxy);
  const pointGeometry = new THREE.SphereGeometry(1, 12, 8);
  const points = new Map();
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const modelQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
  const temporaryPosition = new THREE.Vector3(), cameraDirection = new THREE.Vector3(), cameraPosition = new THREE.Vector3();
  const controls = new TransformControls(camera, canvas);
  const helper = controls.getHelper();helper.name = 'Pose editor · transform gizmo';scene.add(helper);
  controls.enabled = false;controls.detach();controls.disconnect();canvas.style.touchAction = initialTouchAction;
  controls.setSpace('world');
  const gizmoSize=()=>THREE.MathUtils.clamp(480/(canvas.getBoundingClientRect().height||600),.36,1.12);
  controls.setSize(gizmoSize());

  let enabled = false, disposed = false, connected = false, synchronizing = false;
  let selected = null, mode = 'translate', handles = [], activePointer = null;
  let orbitSnapshot = null, dragPose = null, dragSession = false, lastError = null;

  const selectedHandle = () => handles.find(handle => handle.id === selected);
  function getState() {
    const handle = selectedHandle();
    return {
      enabled, dragging: Boolean(controls.dragging), selected, mode, axis: controls.axis,
      handles: handles.map(value => ({ ...value, position: [...value.position], quaternion: [...value.quaternion] })),
      position: handle ? [...handle.position] : null,
      quaternion: handle ? [...handle.quaternion] : null,
      canRotate: Boolean(handle?.canRotate), label: handle?.label ?? '',
      space: 'model', error: lastError,
    };
  }
  const notifySelection = () => { if (!disposed) onSelection?.(getState()); };
  const emit = (phase, error = null) => {
    if (!disposed) onChange?.({ phase, pose: motion.capturePose(), state: getState(), ...(error ? { error } : {}) });
  };
  function lockOrbit() {
    if (orbitSnapshot || !orbit) return;
    orbitSnapshot = { enabled: orbit.enabled, autoRotate: orbit.autoRotate };
    orbit.enabled = false;orbit.autoRotate = false;
  }
  function restoreOrbit() {
    if (!orbitSnapshot || !orbit) return;
    orbit.enabled = orbitSnapshot.enabled;orbit.autoRotate = orbitSnapshot.autoRotate;orbitSnapshot = null;
  }
  function releasePointer(pointerId = activePointer) {
    if (pointerId === null) return;
    try { if (canvas.hasPointerCapture?.(pointerId)) canvas.releasePointerCapture(pointerId); } catch { /* An ended/cancelled pointer may already have released capture. */ }
  }
  function restartControlListeners() {
    if (!connected) return;
    controls.disconnect();controls.connect();
  }
  function worldPoint(position, target = new THREE.Vector3()) {
    target.fromArray(position);model?.updateMatrixWorld(true);
    return model ? model.localToWorld(target) : target;
  }
  function markerScale(point) {
    if (!enabled) return;
    const rect = canvas.getBoundingClientRect();if (!rect.height) return;
    const radiusPixels = point.userData.id === selected ? 6.8 : 4.8;
    let unitsPerPixel;
    if (camera.isOrthographicCamera) unitsPerPixel = (camera.top - camera.bottom) / (camera.zoom * rect.height);
    else {
      camera.getWorldPosition(cameraPosition);camera.getWorldDirection(cameraDirection);
      point.getWorldPosition(temporaryPosition);
      const depth = Math.max(.05, temporaryPosition.sub(cameraPosition).dot(cameraDirection));
      unitsPerPixel = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth / (camera.zoom * rect.height);
    }
    const groupScale = markers.getWorldScale(temporaryPosition);
    point.scale.setScalar(radiusPixels * unitsPerPixel / Math.max(groupScale.x, groupScale.y, groupScale.z, 1e-6));
  }
  function refresh() {
    if (disposed) return getState();
    synchronizing = true;
    try {
      handles = motion.getEditableHandles().map(handle => {
        if (!validArray(handle.position, 3) || !validArray(handle.quaternion, 4)) throw new Error(`控制点 ${handle.id} 包含无效坐标。`);
        return { ...handle, position: [...handle.position], quaternion: [...handle.quaternion] };
      });
      const currentIds = new Set(handles.map(handle => handle.id));
      for (const [id, point] of points) if (!currentIds.has(id)) { markers.remove(point);point.material.dispose();points.delete(id); }
      markers.updateMatrixWorld(true);
      for (const handle of handles) {
        let point = points.get(handle.id);
        if (!point) {
          const side = handle.id.startsWith('left') ? 'left' : handle.id.startsWith('right') ? 'right' : 'center';
          point = new THREE.Mesh(pointGeometry, new THREE.MeshBasicMaterial({ color: COLORS[side], depthTest: false, depthWrite: false, transparent: true, opacity: .93, toneMapped: false }));
          point.name = handle.label;point.userData = { id: handle.id, side };point.renderOrder = 100;point.frustumCulled = false;
          point.onBeforeRender = () => markerScale(point);points.set(handle.id, point);markers.add(point);
        }
        point.position.copy(markers.worldToLocal(worldPoint(handle.position)));
        point.material.color.setHex(handle.id === selected ? COLORS.selected : COLORS[point.userData.side]);
        point.material.opacity = handle.id === selected ? 1 : .93;
      }
      if (!currentIds.has(selected)) selected = null;
      const handle = selectedHandle();
      if (enabled && handle) {
        if (!handle.canRotate && mode === 'rotate') { mode = 'translate';controls.setMode(mode); }
        proxy.position.copy(markers.worldToLocal(worldPoint(handle.position)));
        model?.getWorldQuaternion(modelQuaternion);if (!model) modelQuaternion.identity();
        markers.getWorldQuaternion(parentQuaternion);
        proxy.quaternion.copy(parentQuaternion.invert().multiply(modelQuaternion));
        if (handle.parentQuaternion) proxy.quaternion.multiply(new THREE.Quaternion().fromArray(handle.parentQuaternion));
        proxy.quaternion.multiply(new THREE.Quaternion().fromArray(handle.quaternion)).normalize();
        controls.setSpace(handle.id === 'waist' ? 'local' : 'world');
        proxy.updateMatrixWorld(true);
        if (controls.object !== proxy) controls.attach(proxy);
        helper.visible = true;
      } else { controls.detach();helper.visible = false; }
      markers.updateMatrixWorld(true);for (const point of points.values()) markerScale(point);
      helper.updateMatrixWorld(true);
    } finally { synchronizing = false; }
    notifySelection();return getState();
  }
  function select(id) {
    if (!enabled || disposed) return getState();
    if (id !== null && !handles.some(handle => handle.id === id)) return getState();
    if (controls.dragging) finishDrag(false);
    selected = id;lastError = null;refresh();return getState();
  }
  function setTransformMode(value) {
    if (disposed || !['translate', 'rotate'].includes(value)) return getState();
    if (controls.dragging) finishDrag(false);
    mode = value === 'rotate' && !selectedHandle()?.canRotate ? 'translate' : value;
    controls.setMode(mode);notifySelection();return getState();
  }
  function setValue({ position, quaternion } = {}) {
    if (!enabled || disposed || !selectedHandle()) return getState();
    if (controls.dragging) finishDrag(false);
    const value = {};
    if (position !== undefined) {
      if (!validArray(position, 3)) throw new Error('位置需要三个有限数值。');
      value.position = [...position];
    }
    if (quaternion !== undefined && selectedHandle().canRotate) {
      if (!validArray(quaternion, 4) || Math.hypot(...quaternion) < 1e-8) throw new Error('方向需要有效的四元数。');
      value.quaternion = new THREE.Quaternion().fromArray(quaternion).normalize().toArray();
    }
    if (!Object.keys(value).length) return getState();
    try { motion.editHandle(selected, value);lastError = null; }
    catch (error) { lastError = error.message;refresh();throw error; }
    refresh();emit('commit');return getState();
  }
  function onObjectChange() {
    if (!enabled || disposed || synchronizing || !selectedHandle()) return;
    model?.updateMatrixWorld(true);
    const position = proxy.getWorldPosition(new THREE.Vector3());
    if (model) model.worldToLocal(position);
    const value = mode === 'translate' ? { position: position.toArray() } : {};
    if (mode === 'rotate' && selectedHandle().canRotate) {
      const rotation = proxy.getWorldQuaternion(new THREE.Quaternion());
      model?.getWorldQuaternion(modelQuaternion);if (!model) modelQuaternion.identity();
      const local = modelQuaternion.invert().multiply(rotation);
      const parent = selectedHandle().parentQuaternion;
      if (parent) local.premultiply(new THREE.Quaternion().fromArray(parent).invert());
      value.quaternion = local.normalize().toArray();
    }
    try { motion.editHandle(selected, value);lastError = null; }
    catch (error) { lastError = error.message; }
    refresh();emit('update', lastError);
  }
  function onMouseDown() {
    if (!enabled || disposed) return;
    lockOrbit();dragPose = clonePose(motion.capturePose());dragSession = true;lastError = null;
    emit('start');
  }
  function onDraggingChanged(event) {
    if (event.value) { lockOrbit();return; }
    restoreOrbit();activePointer = null;
    if (dragSession) { dragSession = false;dragPose = null;refresh();emit('end'); }
  }
  function finishDrag(cancel) {
    const pointerId = activePointer;
    if (cancel && dragPose && motion.applyPose) {
      synchronizing = true;
      try { controls.reset();motion.applyPose(dragPose);lastError = null; }
      finally { synchronizing = false; }
      refresh();
    }
    controls.pointerUp({ button: 0 });
    restoreOrbit();releasePointer(pointerId);activePointer = null;
    // Public disconnect/connect also removes the gesture's pointermove listener.
    restartControlListeners();
  }
  function pointerCoordinates(event) {
    const rect = canvas.getBoundingClientRect();if (!rect.width || !rect.height) return null;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    return { x: pointer.x, y: pointer.y, button: event.button };
  }
  function hitPoint(event) {
    const coordinates = pointerCoordinates(event);if (!coordinates) return null;
    markers.updateMatrixWorld(true);camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects([...points.values()], false);
    if (intersections.length) return intersections[0].object.userData.id;
    // A screen-space hit area stays usable on a phone and when zooming out.
    const rect = canvas.getBoundingClientRect(), radius = event.pointerType === 'touch' ? 24 : 15;
    let closest = radius * radius, result = null;
    for (const point of points.values()) {
      const projected = point.getWorldPosition(new THREE.Vector3()).project(camera);
      if (projected.z < -1 || projected.z > 1) continue;
      const x = (projected.x + 1) * rect.width / 2 + rect.left, y = (1 - projected.y) * rect.height / 2 + rect.top;
      const distance = (x - event.clientX) ** 2 + (y - event.clientY) ** 2;
      if (distance < closest) { closest = distance;result = point.userData.id; }
    }
    return result;
  }
  function onPointerDown(event) {
    if (!enabled || disposed || event.button !== 0) return;
    if (activePointer !== null && event.pointerId !== activePointer) { event.preventDefault();event.stopImmediatePropagation();return; }
    helper.updateMatrixWorld(true);
    const coordinates = pointerCoordinates(event);
    if (coordinates && controls.object) controls.pointerHover(coordinates);
    if (controls.axis !== null) {
      activePointer = event.pointerId;lockOrbit();return;
    }
    const id = hitPoint(event);
    if (id) { select(id);event.preventDefault();event.stopImmediatePropagation(); }
  }
  function onPointerMove(event) {
    if (!enabled || disposed) return;
    if (activePointer !== null && event.pointerId !== activePointer) { event.preventDefault();event.stopImmediatePropagation();return; }
    if (!controls.dragging && !event.buttons) canvas.style.cursor = hitPoint(event) ? 'pointer' : 'grab';
  }
  function onPointerUp(event) {
    if (!enabled || disposed || event.pointerId !== activePointer) return;
    // Native TransformControls handles the actual drag completion afterward.
    if (!controls.dragging) { restoreOrbit();activePointer = null; }
  }
  function onPointerCancel(event) {
    if (enabled && !disposed && event.pointerId === activePointer) finishDrag(false);
  }
  function onKeyDown(event) {
    if (!enabled || !controls.dragging || event.key !== 'Escape') return;
    event.preventDefault();event.stopPropagation();finishDrag(true);
  }
  function onControlChange() { if (enabled && !disposed && !synchronizing) notifySelection(); }
  function updateSizes() { if (enabled) {const size=gizmoSize();if(Math.abs(controls.size-size)>.01)controls.setSize(size);for (const point of points.values()) markerScale(point);} }
  function setEnabled(value) {
    if (disposed) return getState();
    const next = Boolean(value);if (next === enabled) return getState();
    if (!next && controls.dragging) finishDrag(false);
    enabled = next;markers.visible = enabled;controls.enabled = enabled;
    if (enabled) {
      if (!connected) { controls.connect();connected = true; }
      refresh();selected = handles.some(handle => handle.id === selected) ? selected : handles.find(handle => handle.id === 'pelvis')?.id ?? handles[0]?.id ?? null;
      controls.setMode(mode);refresh();
    } else {
      controls.detach();helper.visible = false;
      if (connected) { controls.disconnect();connected = false; }
      releasePointer();activePointer = null;restoreOrbit();canvas.style.touchAction = initialTouchAction;canvas.style.cursor = initialCursor;notifySelection();
    }
    return getState();
  }
  function dispose() {
    if (disposed) return;
    setEnabled(false);disposed = true;
    canvas.removeEventListener('pointerdown', onPointerDown, true);
    canvas.removeEventListener('pointermove', onPointerMove, true);
    canvas.removeEventListener('pointerup', onPointerUp, true);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('lostpointercapture', onPointerCancel);
    documentTarget?.removeEventListener('keydown', onKeyDown, true);
    orbit?.removeEventListener('change', updateSizes);
    controls.removeEventListener('objectChange', onObjectChange);
    controls.removeEventListener('mouseDown', onMouseDown);
    controls.removeEventListener('dragging-changed', onDraggingChanged);
    controls.removeEventListener('change', onControlChange);
    controls.dispose();scene.remove(helper, markers);
    pointGeometry.dispose();for (const point of points.values()) point.material.dispose();points.clear();
    canvas.style.touchAction = initialTouchAction;canvas.style.cursor = initialCursor;
  }

  controls.addEventListener('objectChange', onObjectChange);
  controls.addEventListener('mouseDown', onMouseDown);
  controls.addEventListener('dragging-changed', onDraggingChanged);
  controls.addEventListener('change', onControlChange);
  canvas.addEventListener('pointerdown', onPointerDown, true);
  canvas.addEventListener('pointermove', onPointerMove, true);
  canvas.addEventListener('pointerup', onPointerUp, true);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('lostpointercapture', onPointerCancel);
  documentTarget?.addEventListener('keydown', onKeyDown, true);
  orbit?.addEventListener('change', updateSizes);
  return { setEnabled, select, setTransformMode, setValue, refresh, getState, dispose };
}
