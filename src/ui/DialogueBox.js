import { ui, h } from './UIRoot.js';
import { openEvidence } from './EvidenceViewer.js';
import { Registry } from '../systems/Registry.js';
import gameState from '../systems/GameState.js';
import * as Dialogue from '../systems/DialogueSystem.js';
import { audio } from '../systems/AudioSystem.js';

const STATUS_TAG = {
  locked: '잠김',
  noPoints: '질문 포인트 없음',
  done: '확인함',
  guarded: '경계 중 · 회피할 것'
};

/**
 * 하단 대화창. 대사를 한 줄씩 넘기고(E/Space/Enter/클릭),
 * 대사가 끝나면 선택지를 보여 준다(숫자키/클릭, Esc 종료).
 * speaker 가 없으면 소품 조사용 내레이션 모드로 동작한다.
 */
class DialogueBox {
  constructor({ npcId = null, title = null }) {
    this.npcId = npcId;
    this.queue = [];
    this.askedLabel = null;
    this.choices = [];
    this.pendingEvidence = [];
    this.onDone = null;

    const npc = npcId ? Registry.characters[npcId] : null;
    this.nameEl = h('span', { class: 'dlg-name', style: npc ? `color:${npc.color}` : '' }, npc ? npc.name : title ?? '조사');
    this.metaEl = h('div', { class: 'dlg-meta' });
    this.bodyEl = h('div', { class: 'dlg-body', onclick: () => this.advance() });
    this.choicesEl = h('ol', { class: 'choices' });

    this.modal = {
      el: h(
        'section',
        { class: 'ui-modal dlg', role: 'dialog', 'aria-label': npc ? `${npc.name}와의 대화` : '조사' },
        h('div', { class: 'dlg-head' }, this.nameEl, npc ? h('span', { class: 'dlg-role' }, npc.role) : null, this.metaEl),
        this.bodyEl,
        this.choicesEl
      ),
      onKey: (e) => this.onKey(e),
      onClose: () => this.onDone?.()
    };
    ui.open(this.modal);
    audio.sfx('open');
  }

  close() {
    ui.close(this.modal);
  }

  onKey(e) {
    if (e.key === 'Escape') {
      if (this.npcId) this.close();
      else this.finishNarration();
      return true;
    }
    if ([' ', 'e', 'E', 'Enter'].includes(e.key)) {
      if (!e.repeat) this.advance();
      return true;
    }
    if (/^[1-9]$/.test(e.key) && !this.queue.length) {
      const c = this.choices[Number(e.key) - 1];
      if (c && !c.disabled) c.run();
      return true;
    }
    return false;
  }

  say(lines, askedLabel = null) {
    this.queue = [...lines];
    this.askedLabel = askedLabel;
    this.advance();
  }

  advance() {
    if (!this.queue.length) {
      // 내레이션 모드는 마지막 대사 이후 닫힌다
      if (!this.npcId) this.finishNarration();
      return;
    }
    const line = this.queue.shift();
    audio.sfx('blip');
    this.bodyEl.replaceChildren(
      ...[
        this.askedLabel ? h('div', { class: 'dlg-asked' }, `▶ ${this.askedLabel}`) : null,
        h('div', { class: 'dlg-line' }, line),
        h('div', { class: 'dlg-next' }, this.queue.length || !this.npcId ? '▼ 계속 (E / Space)' : '')
      ].filter(Boolean)
    );
    this.choicesEl.replaceChildren();
    this.choices = [];
    if (!this.queue.length && this.npcId) this.renderChoices();
  }

  finishNarration() {
    this.close();
    const evs = this.pendingEvidence;
    this.pendingEvidence = [];
    evs.forEach((id) => openEvidence(id));
  }

  renderMeta() {
    if (!this.npcId) return;
    const state = gameState.npc(this.npcId);
    const max = Registry.gameRules.alert.max;
    const pct = Math.round((state.alert / max) * 100);
    const cls = state.alert >= max ? 'max' : state.alert >= Registry.gameRules.alert.warnAt ? 'warn' : '';
    this.metaEl.replaceChildren(
      h('span', { class: 'dlg-points' }, '질문 가능 ', h('b', {}, String(Dialogue.pointsLeft(this.npcId))), ` / ${Registry.gameRules.questionPoints}`),
      h('span', { class: 'gauge', title: `경계 게이지 ${state.alert} / ${max}` }, '경계', h('span', { class: 'gauge-bar' }, h('span', { class: `gauge-fill ${cls}`, style: `width:${pct}%;display:block` })))
    );
  }

  renderChoices() {
    this.renderMeta();
    const topics = Dialogue.getTopics(this.npcId);
    this.choices = topics.map((t) => ({
      disabled: ['locked', 'noPoints', 'done'].includes(t.status),
      run: () => this.choose(t)
    }));
    this.choices.push({ disabled: false, run: () => this.close() });

    const items = topics.map((t, i) => {
      const present = t.cost === 0;
      const tag = STATUS_TAG[t.status] ?? (present ? '제시 · 포인트 소모 없음' : t.asked ? '✓ 물어봄 · 반복 시 경계↑' : '');
      return h(
        'li',
        {},
        h(
          'button',
          {
            class: `choice${present ? ' present' : ''}${t.status === 'guarded' ? ' guarded' : ''}`,
            disabled: this.choices[i].disabled,
            onclick: (e) => {
              e.currentTarget.blur();
              this.choices[i].run();
            }
          },
          h('span', { class: 'num' }, String(i + 1)),
          h('span', {}, t.label),
          tag ? h('span', { class: 'tag' }, tag) : null
        )
      );
    });
    const endIndex = this.choices.length;
    items.push(
      h('li', {}, h('button', { class: 'choice end', onclick: () => this.close() }, h('span', { class: 'num' }, endIndex <= 9 ? String(endIndex) : ''), h('span', {}, '대화 종료 (Esc)')))
    );
    this.choicesEl.replaceChildren(...items);
  }

  choose(t) {
    audio.sfx('select');
    const { lines, notices } = Dialogue.ask(this.npcId, t.topic.id);
    ui.notify(notices);
    this.renderMeta();
    this.say(lines, t.topic.label);
  }
}

export function openConversation(npcId, onDone) {
  const box = new DialogueBox({ npcId });
  box.onDone = onDone;
  const { lines, notices } = Dialogue.greet(npcId);
  ui.notify(notices);
  box.renderMeta();
  box.say(lines);
  return box;
}

/** 소품 조사 결과를 내레이션으로 보여 주고, 새로 얻은 증거는 이어서 문서로 연다. */
export function openNarration(title, lines, notices = []) {
  const box = new DialogueBox({ title });
  box.pendingEvidence = notices.filter((n) => n.evidenceId).map((n) => n.evidenceId);
  ui.notify(notices);
  box.say(lines);
  return box;
}
