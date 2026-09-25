import characters from '../data/characters.json';
import evidences from '../data/evidences.json';
import clues from '../data/clues.json';
import gameRules from '../data/gameRules.json';
import dialogues from '../data/dialogues/index.js';

/** 데이터 파일 조회 헬퍼. 진술 텍스트는 각 NPC 대화 파일에 정의되어 있다. */
const statements = {};
for (const [npcId, tree] of Object.entries(dialogues)) {
  for (const [id, text] of Object.entries(tree.statements ?? {})) {
    statements[id] = { id, npcId, speaker: characters[npcId].name, text };
  }
}

export const Registry = {
  characters,
  evidences,
  clues,
  gameRules,
  dialogues,
  statements,
  contradictions: gameRules.contradictions
};
