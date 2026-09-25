# CASE 026 — 리더십 교육 만족도 급락 사건

Phaser 3 + Vite 기반 2D 탐정 어드벤처 게임. 교육 만족도가 4.8에서 2.1로 떨어진 원인을
진술·문서·모순의 관계로 추론한다. 정답은 "범인 한 명"이 아니라 배후 → 실행 → 결과의 구조다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 로 빌드
```

## 온라인에서 플레이

https://choiyunzin.github.io/ai-murder-mystery/

`main` 브랜치에 푸시하면 GitHub Actions(`.github/workflows/deploy-pages.yml`)가 빌드해 GitHub Pages 로 배포한다.
처음 한 번은 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 설정해야 한다.

## 조작

| | 데스크톱 | 모바일 |
|---|---|---|
| 이동 | WASD / 방향키 | 좌하단 조이스틱 |
| 대화 · 조사 · 문 | E / Space / 프롬프트 클릭 | 조사 버튼 |
| 선택지 | 숫자키 / 클릭 | 탭 |
| 수첩 | I / HUD 버튼 | 수첩 버튼 |
| 역할 확인 | 인물 클릭 (거리 무관) | 인물 탭 |
| 소리 | M / 우상단 버튼 | 우상단 버튼 |

개발용: `?debug=unlock` 으로 임원실 잠금 해제, `?touch=1` 로 터치 컨트롤 강제 표시.

## 캐릭터 초상화

`src/assets/characters/` 에 `jung.png`, `jo.png`, `park.png`, `lee.png`, `choi.png`, `kim.png`,
`player.png` 를 넣으면 대화창 초상화, 맵 토큰, 역할 배지, 추론 보드에 자동 적용된다.
없는 인물은 코드로 그린 도트 캐릭터를 쓴다. 규격은 그 폴더의 README 참고.

## 진행 상황

- [x] Phase 1 — 맵/Scene/이동/문
- [x] Phase 2 — NPC 대화 트리, 질문 포인트(인물당 4), 경계 게이지
- [x] Phase 3 — 증거 4종, 단서, 수첩(증거/단서/진술/모순), 문서 뷰어
- [x] Phase 4 — 임원실 해금, 진술 모순 3종(증거 제시로 확인)
- [x] Phase 5 — 최종 추론(3단계, 최대 2회), 점수·등급, 엔딩, 성찰 질문 저장
- [x] Phase 6 — 그래픽·애니메이션, 합성 BGM·효과음, 모바일 컨트롤, 타이틀·이어하기, 목표 안내, 초상화 지원
- [ ] Phase 7 (선택) — 백엔드, Anthropic API 프록시, 실시간 AI NPC

## 규칙 요약

- 질문은 인물당 4회. 같은 질문 반복, 경계 최고조 상태의 질문은 낭비로 집계된다.
- 증거·단서 제시는 포인트를 쓰지 않고, 경계 최고조에서도 막히지 않는다.
- 임원실: 예산 조정 메모 + "AI 파트 문서 부재" 단서가 있어야 열린다.
- 최종 추론: 전원과 대화, 증거 4종, 모순 2개 이상. 로비의 사건 보고 데스크에서 시작.

## 구조

```text
src/
├─ main.js                  Phaser 설정, UI 레이어·자동저장·터치 컨트롤 마운트
├─ assets/characters/       (선택) 인물 초상화 이미지
├─ config/gameConfig.js     화면 크기, 속도, 상호작용 거리
├─ data/                    게임 내용은 모두 데이터 파일
│  ├─ characters.json       인물(이름·역할·외형)
│  ├─ rooms.json            로비·방 배치, 소품, 문
│  ├─ interactions.json     소품 조사 결과(조건부)
│  ├─ evidences.json        증거 문서
│  ├─ clues.json            단서
│  ├─ portraits.json        초상화 → 맵 토큰 얼굴 크롭
│  ├─ gameRules.json        포인트·경계·해금·모순·추론·점수·목표
│  └─ dialogues/*.json      인물별 대화 트리
├─ systems/                 GameState, Conditions, DialogueSystem, EvidenceSystem,
│                           UnlockSystem, Effects, ScoringSystem, SaveSystem,
│                           MissionSystem, AudioSystem, Registry
├─ entities/                Player, NPC, Door
├─ gfx/                     도트 캐릭터·바닥 텍스처, 소품 그림, 초상화 토큰
├─ ui/                      DOM UI(대화창, 수첩, 문서, 추론 보드, 엔딩, 메뉴, 터치) + Phaser HUD
└─ scenes/                  Boot, Menu, Lobby, 6개 방(RoomScene 공통), Deduction, Ending
```
