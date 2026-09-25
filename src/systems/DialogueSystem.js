import gameState from './GameState.js';
import { meets } from './Conditions.js';
import { applyEffects } from './Effects.js';
import { Registry } from './Registry.js';

const rules = Registry.gameRules;

/** 증거/단서를 제시하는 질문은 경계 게이지 최고조에서도 막히지 않는다. */
function isPresentation(topic) {
  return !!(topic.requires?.evidence?.length || topic.requires?.clues?.length);
}

function costOf(topic) {
  return topic.cost ?? 1;
}

export function pointsLeft(npcId) {
  return rules.questionPoints - gameState.npc(npcId).pointsUsed;
}

export function isGuarded(npcId) {
  return gameState.npc(npcId).alert >= rules.alert.max;
}

/** 대화 시작: 첫 만남이면 인사말과 그 효과를, 재방문이면 짧은 인사를 돌려준다. */
export function greet(npcId) {
  const tree = Registry.dialogues[npcId];
  const state = gameState.npc(npcId);
  if (state.greeted) return { lines: tree.returnGreeting ?? tree.greeting.lines, notices: [] };
  state.greeted = true;
  return { lines: tree.greeting.lines, notices: applyEffects(tree.greeting.effects) };
}

/**
 * 선택지 목록과 상태.
 * status: available | locked | noPoints | done | guarded
 */
export function getTopics(npcId) {
  const tree = Registry.dialogues[npcId];
  const state = gameState.npc(npcId);
  const left = pointsLeft(npcId);
  const guarded = isGuarded(npcId);

  return tree.topics
    .map((topic) => {
      const asked = state.asked[topic.id] ?? 0;
      let status = 'available';
      if (!meets(topic.requires)) status = topic.lockedLabel ? 'locked' : 'hidden';
      else if (topic.once && asked > 0) status = 'done';
      else if (costOf(topic) > left) status = 'noPoints';
      else if (guarded && !isPresentation(topic)) status = 'guarded';
      return { topic, status, asked, cost: costOf(topic), label: status === 'locked' ? topic.lockedLabel : topic.label };
    })
    .filter((t) => t.status !== 'hidden');
}

/** 질문 실행: 포인트/경계 게이지를 반영하고 대사와 알림을 돌려준다. */
export function ask(npcId, topicId) {
  const tree = Registry.dialogues[npcId];
  const topic = tree.topics.find((t) => t.id === topicId);
  const state = gameState.npc(npcId);
  const repeated = (state.asked[topicId] ?? 0) > 0;
  const wasGuarded = isGuarded(npcId);
  const wasWarned = state.alert >= rules.alert.warnAt;

  state.pointsUsed += costOf(topic);
  state.asked[topicId] = (state.asked[topicId] ?? 0) + 1;
  state.talked = true;

  let lines;
  let notices = [];
  if (repeated) {
    lines = tree.repeat;
    state.wasted = (state.wasted ?? 0) + 1;
    state.alert += (topic.alert ?? 0) + rules.alert.repeatPenalty;
  } else if (wasGuarded && !isPresentation(topic)) {
    lines = tree.evasive;
    state.wasted = (state.wasted ?? 0) + 1;
  } else {
    lines = topic.lines;
    state.alert += topic.alert ?? 0;
    notices = applyEffects(topic.effects);
  }
  state.alert = Math.min(state.alert, rules.alert.max);

  if (!wasWarned && state.alert >= rules.alert.warnAt && !isGuarded(npcId)) {
    notices.push({ type: 'warning', text: `${Registry.characters[npcId].name}이(가) 경계하기 시작했다.` });
  }
  if (!wasGuarded && isGuarded(npcId)) {
    notices.push({ type: 'warning', text: `${Registry.characters[npcId].name}의 경계가 최고조다. 이제 대부분 회피한다.` });
  }
  gameState.emit();
  return { lines, notices };
}
