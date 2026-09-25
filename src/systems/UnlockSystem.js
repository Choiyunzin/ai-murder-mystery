import gameState from './GameState.js';
import { meets } from './Conditions.js';
import { Registry } from './Registry.js';

/**
 * 파생 단서(clueRules)와 공간 해금(unlocks)을 평가한다.
 * 새로 충족된 항목에 대한 알림 목록을 돌려준다.
 */
export function evaluateUnlocks() {
  const notices = [];
  const { clueRules = [], unlocks = [] } = Registry.gameRules;

  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of clueRules) {
      if (!gameState.has('clues', rule.clue) && meets(rule.requires)) {
        gameState.add('clues', rule.clue);
        notices.push({ type: 'clue', text: `단서 발견: ${Registry.clues[rule.clue].title}` });
        changed = true;
      }
    }
  }

  for (const rule of unlocks) {
    if (gameState.isLocked(rule.room) && meets(rule.requires)) {
      gameState.unlockRoom(rule.room);
      notices.push({ type: 'unlock', text: rule.message });
    }
  }
  return notices;
}
