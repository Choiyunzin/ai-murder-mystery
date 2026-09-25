import gameState from './GameState.js';
import { Registry } from './Registry.js';
import { evaluateUnlocks } from './UnlockSystem.js';

/**
 * 대화/조사 결과의 effects 를 GameState 에 반영하고 알림 목록을 돌려준다.
 * effects: { evidence, clues, statements, contradictions, flags }
 */
export function applyEffects(effects) {
  const notices = [];
  if (!effects) return notices;

  for (const id of effects.evidence ?? []) {
    if (gameState.add('evidence', id)) {
      notices.push({ type: 'evidence', text: `증거 획득: ${Registry.evidences[id].title}`, evidenceId: id });
    }
  }
  for (const id of effects.clues ?? []) {
    if (gameState.add('clues', id)) notices.push({ type: 'clue', text: `단서 발견: ${Registry.clues[id].title}` });
  }
  for (const id of effects.statements ?? []) {
    if (gameState.add('statements', id)) notices.push({ type: 'statement', text: `진술 기록: ${Registry.statements[id].speaker}` });
  }
  for (const id of effects.contradictions ?? []) {
    if (gameState.add('contradictions', id)) {
      notices.push({ type: 'contradiction', text: `모순 발견: ${Registry.contradictions[id].title}` });
    }
  }
  for (const id of effects.flags ?? []) gameState.setFlag(id, true);

  return notices.concat(evaluateUnlocks());
}
