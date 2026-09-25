import { ui, h } from './UIRoot.js';
import { openEvidence } from './EvidenceViewer.js';
import { Registry } from '../systems/Registry.js';
import gameState from '../systems/GameState.js';

const TABS = [
  { id: 'evidence', label: '증거' },
  { id: 'clues', label: '단서' },
  { id: 'statements', label: '진술' },
  { id: 'contradictions', label: '모순' }
];

let current = null;
let lastTab = 'evidence';

/** 수첩(인벤토리): 증거 / 단서 / 진술 / 모순 */
export function toggleNotebook() {
  if (current) {
    ui.close(current);
    return;
  }
  openNotebook();
}

export function openNotebook(tab = lastTab) {
  const modal = {};
  current = modal;
  const bodyEl = h('div', { class: 'nb-body' });
  const tabsEl = h('div', { class: 'nb-tabs', role: 'tablist' });
  const statsEl = h('span', { class: 'nb-stats' });
  const close = () => ui.close(modal);

  const select = (id) => {
    lastTab = id;
    tabsEl.replaceChildren(
      ...TABS.map((t, i) =>
        h('button', { class: 'nb-tab', role: 'tab', 'aria-selected': String(t.id === id), onclick: () => select(t.id) }, `${i + 1}. ${t.label} ${count(t.id)}`)
      )
    );
    bodyEl.replaceChildren(...RENDER[id]());
  };

  const refresh = () => {
    statsEl.textContent = `대화한 인물 ${gameState.talkedCount()}/6 · 방문 ${gameState.visitedRooms.length}/6`;
    select(lastTab);
  };
  const off = gameState.on(refresh);

  modal.el = h(
    'div',
    { class: 'ui-modal', style: 'inset:0' },
    h('div', { class: 'ui-dim', onclick: close }),
    h(
      'section',
      { class: 'ui-modal notebook', role: 'dialog', 'aria-label': '수첩' },
      h('div', { class: 'nb-head' }, h('span', { class: 'nb-title' }, '수사 수첩'), statsEl, h('button', { class: 'nb-close', onclick: close }, '닫기 (I / Esc)')),
      tabsEl,
      bodyEl
    )
  );
  modal.onKey = (e) => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'i') {
      close();
      return true;
    }
    if (/^[1-4]$/.test(e.key)) {
      select(TABS[Number(e.key) - 1].id);
      return true;
    }
    return ['e', 'E', ' '].includes(e.key);
  };
  modal.onClose = () => {
    off();
    current = null;
  };
  ui.open(modal);
  lastTab = tab;
  refresh();
}

function count(tab) {
  const total = { evidence: Object.keys(Registry.evidences).length, contradictions: Object.keys(Registry.contradictions).length }[tab];
  const n = gameState[tab].length;
  return total ? `${n}/${total}` : String(n);
}

const empty = (text) => [h('p', { class: 'nb-empty' }, text)];

const RENDER = {
  evidence() {
    return Object.entries(Registry.evidences).map(([id, ev]) =>
      gameState.hasEvidence(id)
        ? h(
            'button',
            { class: 'nb-item', onclick: () => openEvidence(id) },
            h('span', { class: 'nb-item-title' }, ev.title),
            h('span', { class: 'nb-item-sub' }, `${ev.location} · 클릭해서 열람`)
          )
        : h('div', { class: 'nb-item missing' }, h('span', { class: 'nb-item-title' }, '??? — 아직 확보하지 못한 증거'))
    );
  },
  clues() {
    if (!gameState.clues.length) return empty('아직 발견한 단서가 없다. 방 안의 소품을 살펴보자.');
    return gameState.clues.map((id) => {
      const c = Registry.clues[id];
      return h('div', { class: 'nb-item' }, h('span', { class: 'nb-item-title' }, c.title), h('span', { class: 'nb-item-text' }, c.text));
    });
  },
  statements() {
    if (!gameState.statements.length) return empty('아직 기록된 진술이 없다. 인물들과 대화해 보자.');
    const bySpeaker = new Map();
    for (const id of gameState.statements) {
      const s = Registry.statements[id];
      if (!bySpeaker.has(s.npcId)) bySpeaker.set(s.npcId, []);
      bySpeaker.get(s.npcId).push(s);
    }
    return [...bySpeaker.entries()].flatMap(([npcId, list]) => [
      h('div', { class: 'nb-group' }, `${Registry.characters[npcId].name} · ${Registry.characters[npcId].role}`),
      ...list.map((s) => h('div', { class: 'nb-item' }, h('span', { class: 'nb-item-text' }, `“${s.text}”`)))
    ]);
  },
  contradictions() {
    const total = Object.keys(Registry.contradictions).length;
    const found = gameState.contradictions.map((id) => {
      const c = Registry.contradictions[id];
      return h('div', { class: 'nb-item ct' }, h('span', { class: 'nb-item-title' }, c.title), h('span', { class: 'nb-item-text' }, c.summary));
    });
    const hint = h('p', { class: 'nb-empty' }, `발견한 모순 ${found.length}/${total} · 서로 다른 진술과 증거가 맞물리면, 해당 인물에게 증거를 제시해 모순을 확인할 수 있다.`);
    return [...found, hint];
  }
};
