// One "更多" menu for every secondary tool. Items only proxy the existing
// controls (mode buttons, drawer toggles, capture, fullscreen, about), so no
// feature logic lives here. Phone: bottom sheet with a scrim. Desktop:
// popover under the header button.
export function createAppMenu({ refreshIcons } = {}) {
  const button = document.querySelector('#menu-button'), menu = document.querySelector('#app-menu'), scrim = document.querySelector('#app-menu-scrim');
  if (!button || !menu) return null;
  let open = false;
  function sync() {
    const mode = document.body.dataset.mode;
    menu.querySelectorAll('[data-menu-mode]').forEach(item => item.setAttribute('aria-checked', String(item.dataset.menuMode === mode)));
    for (const item of menu.querySelectorAll('[data-menu-proxy]')) {
      const target = document.querySelector(item.dataset.menuProxy);
      item.disabled = !target || target.disabled;
      const expanded = target?.getAttribute('aria-expanded') ?? target?.getAttribute('aria-pressed');
      if (expanded != null) item.setAttribute('aria-checked', expanded);
    }
  }
  function setOpen(next, { focusButton = false, keyboard = false } = {}) {
    open = Boolean(next);
    if (open) sync();
    menu.hidden = !open;scrim.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    document.body.dataset.menuOpen = String(open);
    // keyboard users land on the first item; pointer users keep focus where it was
    if (open && keyboard) requestAnimationFrame(() => menu.querySelector('button:not(:disabled)')?.focus({ preventScroll: true }));
    else if (focusButton) button.focus({ preventScroll: true });
  }
  button.addEventListener('click', event => setOpen(!open, { keyboard: event.detail === 0 }));
  scrim.addEventListener('click', () => setOpen(false));
  menu.addEventListener('click', event => {
    const item = event.target.closest('button');if (!item || item.disabled) return;
    setOpen(false);
    if (item.dataset.menuMode) document.querySelector(`.mode-nav [data-mode="${item.dataset.menuMode}"]`)?.click();
    else if (item.dataset.menuProxy) document.querySelector(item.dataset.menuProxy)?.click();
  });
  document.addEventListener('keydown', event => { if (open && event.key === 'Escape') { event.preventDefault();setOpen(false, { focusButton: true }); } });
  document.addEventListener('pointerdown', event => { if (open && !menu.contains(event.target) && !button.contains(event.target) && event.target !== scrim) setOpen(false); }, true);
  refreshIcons?.();
  return { setOpen, get open() { return open; } };
}
