import { ui, h } from './UIRoot.js';
import { Registry } from '../systems/Registry.js';

/** 증거 문서 열람 */
export function openEvidence(evidenceId) {
  const ev = Registry.evidences[evidenceId];
  const modal = {};
  const close = () => ui.close(modal);
  modal.el = h(
    'div',
    { class: 'ui-modal', style: 'inset:0' },
    h('div', { class: 'ui-dim', onclick: close }),
    h(
      'article',
      { class: 'ui-modal doc', role: 'dialog', 'aria-label': ev.title },
      h('div', { class: 'doc-kind' }, `EVIDENCE · ${ev.location}`),
      h('h2', { class: 'doc-title' }, ev.title),
      h('div', { class: 'doc-meta' }, ev.meta.map((m) => h('span', {}, m))),
      h('div', { class: 'doc-body' }, ev.body.join('\n')),
      h('div', { class: 'doc-foot' }, h('button', { onclick: close }, '닫기 (Esc)'))
    )
  );
  modal.onKey = (e) => {
    if (['Escape', 'e', 'E', ' ', 'Enter'].includes(e.key)) {
      close();
      return true;
    }
    return false;
  };
  return ui.open(modal);
}
