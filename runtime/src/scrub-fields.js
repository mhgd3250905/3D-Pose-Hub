/**
 * Drag-to-scrub for numeric fields (Blender / Figma style).
 * Press on the label of any `.pose-values` field and drag horizontally:
 * 1 px ≈ 0.25 step, Shift ×10, Alt ×0.1. The input receives live `change`
 * events (throttled to one per frame) so the 3D figure follows the drag;
 * panels ask `scrubCheckpoint()` so one drag becomes a single undo step.
 */
let session = 0, active = false, consumed = -1;
export const scrubCheckpoint = () => {
  if (!active) return true;
  if (consumed === session) return false;
  consumed = session;return true;
};

export function installScrubFields(root = document) {
  root.addEventListener('pointerdown', event => {
    const label = event.target.closest?.('.pose-values label');
    if (!label || event.target.tagName === 'INPUT' || event.button !== 0) return;
    const input = label.querySelector('input[type="number"]');
    if (!input || input.disabled) return;
    event.preventDefault();
    const step = Number(input.step) || 1, startX = event.clientX, start = Number(input.value) || 0;
    const decimals = (String(step).split('.')[1] || '').length;
    let frame = 0, moved = false;
    session += 1;active = true;
    label.setPointerCapture?.(event.pointerId);
    label.classList.add('is-scrubbing');document.body.classList.add('is-scrubbing');
    const fire = () => { frame = 0;input.dispatchEvent(new Event('change', { bubbles: true })); };
    const move = moveEvent => {
      const dx = moveEvent.clientX - startX;
      if (!moved && Math.abs(dx) < 3) return;
      moved = true;
      const factor = moveEvent.shiftKey ? 10 : moveEvent.altKey ? .1 : 1;
      const precision = moveEvent.altKey ? decimals + 1 : decimals;
      const next = start + Math.round(dx / 4) * step * factor;
      const text = next.toFixed(Math.max(0, precision));
      if (input.value !== text) { input.value = text;if (!frame) frame = requestAnimationFrame(fire); }
    };
    const end = () => {
      label.removeEventListener('pointermove', move);label.removeEventListener('pointerup', end);label.removeEventListener('pointercancel', end);
      label.classList.remove('is-scrubbing');document.body.classList.remove('is-scrubbing');
      if (frame) { cancelAnimationFrame(frame);fire(); }
      active = false;
      if (!moved) { input.focus();input.select(); }
    };
    label.addEventListener('pointermove', move);label.addEventListener('pointerup', end);label.addEventListener('pointercancel', end);
  });
}
