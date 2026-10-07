// The palette groups movement tasks. It never represents measured effort.
export const MOVEMENT_PALETTE = Object.freeze({ support: 0x72d6ff, core: 0xb49bfa, hips: 0xd8ef70 });
const SUPPORT = new Set(['shoulders', 'scapular', 'arms', 'chest']);
export function movementRegionColour(region) {
  return region.kind === 'core' || region.group === 'core' ? MOVEMENT_PALETTE.core
    : SUPPORT.has(region.group) ? MOVEMENT_PALETTE.support : MOVEMENT_PALETTE.hips;
}

/** A small contextual heading over the existing animation, with no own clock. */
export function createMovementStage({ container }) {
  const document = container?.ownerDocument;
  if (!document?.createElement || !container?.appendChild) return { setVisible() {}, update() {}, dispose() {} };
  const node = (tag, className, text) => {
    const value = document.createElement(tag);value.className = className;
    if (text !== undefined) value.textContent = text;return value;
  };
  const root = node('section', 'movement-stage-head');root.hidden = true;
  root.setAttribute('aria-label', '当前动作导览');
  const copy = node('div', 'movement-stage-copy');
  const overline = node('p', 'movement-stage-overline', 'FLARE / 动作导览');
  const heading = node('div', 'movement-stage-heading');
  const step = node('span', 'movement-stage-node', '09');
  const title = node('h2', 'movement-stage-title', '后侧支撑');heading.append(step, title);
  const hint = node('p', 'movement-stage-hint', '悬浮速览，点击看肌群 3D');copy.append(overline, heading, hint);
  const aside = node('div', 'movement-stage-aside');
  const state = node('span', 'movement-stage-state', '暂停观察');state.dataset.playing = 'false';
  const legend = node('div', 'movement-stage-legend');legend.setAttribute('aria-label', '青蓝支撑、淡紫协调、青柠摆腿');
  for (const [id, label] of [['support', '支撑'], ['core', '协调'], ['hips', '摆腿']]) {
    const entry = node('span', `movement-stage-key movement-stage-key-${id}`, label);legend.append(entry);
  }
  aside.append(state, legend);root.append(copy, aside);container.append(root);
  const write = (element, text) => { if (element.textContent !== text) element.textContent = text; };
  return {
    setVisible(value) { root.hidden = !value;container.dataset.movementTeaching = String(Boolean(value)); },
    update(profile, metrics, playing) {
      if (!profile) return;
      write(step, String(profile.sourceStepNumber).padStart(2, '0'));
      write(title, String(profile.title).replace(/^原第\s*\d+\s*步\s*·\s*/, '').split(' · ')[0] || '动作观察');
      const hands = metrics?.supportHands ?? profile.supportHands ?? [];
      const contact = hands.length === 2 ? '双手支撑' : hands.length === 1 ? `${hands[0] === 'left' ? '左' : '右'}手支撑` : '换手过渡';
      write(hint, `${contact} · 悬浮速览，点击看肌群 3D`);
      write(state, playing ? '动态跟随' : '暂停观察');state.dataset.playing = String(Boolean(playing));
    },
    dispose() { root.remove();delete container.dataset.movementTeaching; },
  };
}
