import { ui, h } from './UIRoot.js';
import { SaveSystem } from '../systems/SaveSystem.js';

const fmt = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
};

const asText = (list) =>
  list.map((r, i) => `${i + 1}. [${fmt(r.savedAt)} · ${r.outcome === 'solved' ? '해결' : '미제'} · 등급 ${r.grade ?? '-'}]\n${r.text}`).join('\n\n');

/**
 * 이 브라우저에 저장한 "다음 교육에서 가장 먼저 바꿔야 할 것" 답변 목록.
 * 서버가 없으므로 다른 사람의 답변은 볼 수 없다. 복사해서 공유하도록 안내한다.
 */
export function openReflections() {
  const list = SaveSystem.reflections().slice().reverse();
  const modal = {};
  const close = () => ui.close(modal);
  const statusEl = h('span', { class: 'saved', role: 'status' });

  const copy = async () => {
    const text = `다음 리더십 교육에서 가장 먼저 바꿔야 할 것 — 내 답변\n\n${asText(list)}`;
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = '복사했습니다. 메일이나 메신저에 붙여 넣어 공유하세요.';
    } catch {
      area.hidden = false;
      area.value = text;
      area.select();
      statusEl.textContent = '자동 복사가 막혀 있습니다. 아래 글을 선택해 복사하세요.';
    }
  };
  const area = h('textarea', { class: 'refl-copy', readonly: true, hidden: true, 'aria-label': '복사할 답변' });

  const items = list.length
    ? list.map((r) =>
        h(
          'div',
          { class: 'nb-item' },
          h('span', { class: 'nb-item-sub' }, `${fmt(r.savedAt)} · ${r.outcome === 'solved' ? 'CASE CLOSED' : '미제'} · 등급 ${r.grade ?? '-'}`),
          h('span', { class: 'nb-item-text refl-text' }, r.text)
        )
      )
    : [h('p', { class: 'nb-empty' }, '아직 저장한 답변이 없습니다. 사건을 해결한 뒤 엔딩 화면에서 답변을 저장해 보세요.')];

  modal.el = h(
    'div',
    { class: 'ui-modal', style: 'inset:0' },
    h('div', { class: 'ui-dim', onclick: close }),
    h(
      'section',
      { class: 'ui-modal notebook', role: 'dialog', 'aria-label': '저장한 답변' },
      h('div', { class: 'nb-head' }, h('span', { class: 'nb-title' }, '저장한 답변'), h('span', { class: 'nb-stats' }, `${list.length}개 · 이 브라우저에만 저장됨`), h('button', { class: 'nb-close', onclick: close }, '닫기 (Esc)')),
      h(
        'div',
        { class: 'nb-body' },
        h('p', { class: 'nb-empty' }, '질문: 그렇다면 다음 리더십 교육에서 가장 먼저 바꿔야 할 것은 무엇일까요?'),
        ...items,
        list.length ? h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: copy }, '전체 복사'), statusEl) : null,
        area
      )
    )
  );
  modal.onKey = (e) => {
    if (e.key === 'Escape') {
      close();
      return true;
    }
    return false;
  };
  ui.open(modal);
}
