# CASE 026 — 리더십 교육 만족도 급락 사건

Phaser 3 + Vite 기반 2D 탐정 어드벤처 게임.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 로 빌드
```

## 조작

- 이동: WASD / 방향키
- 상호작용(문 입장·나가기): E / Space / 문 또는 프롬프트 클릭 (근접 시)
- NPC 클릭: 이름 + 역할 배지 표시 (거리 무관, 대화와 별개)

개발용: `?debug=unlock` 을 붙여 접속하면 잠긴 임원실도 열린다.

## 진행 상황

- [x] Phase 1 — 맵/Scene/이동/문
- [ ] Phase 2 — NPC/Dialogue Tree
- [ ] Phase 3 — Evidence/Inventory
- [ ] Phase 4 — Unlock/Contradiction
- [ ] Phase 5 — Final Deduction/Scoring
- [ ] Phase 6 — UI polish/animation/audio/mobile

## 구조

```text
src/
├─ main.js                 Phaser 게임 설정
├─ config/gameConfig.js    화면 크기, 속도, 상호작용 거리 등
├─ data/                   characters.json, rooms.json (NPC·방·문·소품 데이터)
├─ systems/GameState.js    중앙 게임 상태 (Scene 전환 후에도 유지)
├─ entities/               Player, NPC, Door
├─ ui/                     InteractionPrompt, RoleBadge, Hud
└─ scenes/                 BootScene, LobbyScene, ExploreScene(공통 베이스),
                           RoomScene(방 공통) + 6개 방 Scene
```
