import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, INTERACT_DISTANCE, FADE_MS, FONT_FAMILY, HUD_HEIGHT } from '../config/gameConfig.js';
import Player from '../entities/Player.js';
import InteractionPrompt from '../ui/InteractionPrompt.js';
import RoleBadge from '../ui/RoleBadge.js';
import { ui } from '../ui/UIRoot.js';
import { toggleNotebook } from '../ui/InventoryPanel.js';
import { openNarration } from '../ui/DialogueBox.js';
import { inspect } from '../systems/EvidenceSystem.js';
import gameState from '../systems/GameState.js';
import { audio } from '../systems/AudioSystem.js';
import { makeFloorTexture } from '../gfx/Textures.js';
import { drawProp } from '../gfx/Props.js';

// 소품은 크기가 제각각이라 중심점이 아닌 가장자리까지의 거리로 판정한다
const PROP_DISTANCE = 44;

/**
 * 로비와 각 방이 공유하는 탐색 Scene 베이스.
 * - 바닥/벽/소품 그리기와 collision
 * - 플레이어 생성 및 이동, 깊이 정렬
 * - 근접 상호작용 대상 탐색 + 프롬프트 + E/Space/클릭/터치 처리
 * - fade 전환, BGM 모드
 */
export default class ExploreScene extends Phaser.Scene {
  initExplore({ floorColor, floorStyle = 'tile', obstacles = [], music = 'room' }) {
    this.transitioning = false;
    this.interactables = [];
    ui.closeAll();
    ui.setHotkey('i', () => {
      if (!this.transitioning) toggleNotebook();
    });
    ui.setActionHandler(() => this.tryInteract());
    audio.setMode(music);

    this.cameras.main.setBackgroundColor('#0b0c10');
    // 월드 좌표(0,0)가 HUD 띠 바로 아래에 오도록 카메라를 올린다
    this.cameras.main.setScroll(0, -HUD_HEIGHT);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.walls = this.physics.add.staticGroup();

    const floorKey = makeFloorTexture(this, `floor_${this.scene.key}`, floorColor, floorStyle);
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, floorKey).setOrigin(0).setDepth(-10);
    // 가장자리 비네팅
    const vignette = this.add.graphics().setDepth(-9);
    for (let i = 0; i < 6; i++) vignette.lineStyle(14, 0x000000, 0.05).strokeRect(24 + i * 7, 24 + i * 7, GAME_WIDTH - 48 - i * 14, GAME_HEIGHT - 48 - i * 14);

    this.buildOuterWalls();
    obstacles.forEach((o) => this.addObstacle(o));

    this.prompt = new InteractionPrompt(this);
    this.prompt.onClick((target) => this.activate(target));
    this.roleBadge = new RoleBadge(this);

    this.input.keyboard.on('keydown-E', () => this.tryInteract());
    this.input.keyboard.on('keydown-SPACE', () => this.tryInteract());

    this.cameras.main.fadeIn(FADE_MS);
  }

  buildOuterWalls() {
    const t = WALL_THICKNESS;
    const g = this.add.graphics().setDepth(1);
    // 윗벽은 벽면이 보이도록 밝은 띠 + 걸레받이
    g.fillStyle(0x2a2d36, 1).fillRect(0, 0, GAME_WIDTH, t);
    g.fillStyle(0x3a3e4a, 1).fillRect(0, 4, GAME_WIDTH, t - 10);
    g.fillStyle(0x15171c, 1).fillRect(0, t - 5, GAME_WIDTH, 5);
    const side = this.add.graphics().setDepth(GAME_HEIGHT + 40);
    side.fillStyle(0x15171c, 1).fillRect(0, 0, t, GAME_HEIGHT).fillRect(GAME_WIDTH - t, 0, t, GAME_HEIGHT).fillRect(0, GAME_HEIGHT - t, GAME_WIDTH, t);
    side.fillStyle(0x2a2d36, 1).fillRect(t - 3, t, 3, GAME_HEIGHT - 2 * t).fillRect(GAME_WIDTH - t, t, 3, GAME_HEIGHT - 2 * t).fillRect(t, GAME_HEIGHT - t, GAME_WIDTH - 2 * t, 3);

    [
      [GAME_WIDTH / 2, t / 2, GAME_WIDTH, t],
      [GAME_WIDTH / 2, GAME_HEIGHT - t / 2, GAME_WIDTH, t],
      [t / 2, GAME_HEIGHT / 2, t, GAME_HEIGHT],
      [GAME_WIDTH - t / 2, GAME_HEIGHT / 2, t, GAME_HEIGHT]
    ].forEach(([x, y, w, h]) => this.walls.add(this.add.rectangle(x, y, w, h).setVisible(false)));
  }

  addObstacle({ x, y, w, h, color, label, kind, interaction, action }) {
    // 충돌용 사각형은 보이지 않게 두고, 그림은 Graphics 로 그린다
    const rect = this.add.rectangle(x, y, w, h).setVisible(false);
    this.walls.add(rect);
    const bottom = y + h / 2;
    const g = this.add.graphics().setDepth(bottom);
    drawProp(g, kind, x - w / 2, y - h / 2, w, h, color);

    const interactive = interaction || action;
    if (label) {
      this.add
        .text(x, bottom + 3, label, {
          fontFamily: FONT_FAMILY,
          fontSize: '11px',
          color: interactive ? '#f3dc9a' : '#c9c3b3',
          stroke: '#000000',
          strokeThickness: 3
        })
        .setOrigin(0.5, 0)
        .setDepth(bottom + 1);
    }
    if (interaction) this.addProp(rect, label, interaction);
    if (action) this.addProp(rect, label, null, () => this.onAction(action, label));
    return rect;
  }

  /** rooms.json 의 action 소품 처리. 필요한 Scene 에서 재정의한다. */
  onAction() {}

  /** 조사 가능한 소품 등록: 근접 + E/Space/클릭 → 내레이션, 증거면 문서 열람 */
  addProp(rect, label, interactionId, onInteract = null) {
    const target = this.addInteractable({
      x: rect.x,
      y: rect.y,
      bounds: rect.getBounds(),
      prompt: onInteract ? `[E] ${label}` : `[E] 살펴보기: ${label}`,
      promptX: rect.x,
      promptY: rect.y - rect.height / 2 - 6,
      onInteract:
        onInteract ??
        (() => {
          const { lines, notices } = inspect(interactionId);
          openNarration(label, lines, notices);
        })
    });
    rect.setVisible(true).setFillStyle(0x000000, 0.001);
    rect.setInteractive({ useHandCursor: true }).on('pointerdown', (pointer, lx, ly, event) => {
      event?.stopPropagation();
      if (this.isInRange(target)) this.activate(target);
      else if (!ui.isBlocking()) ui.toast(`${label}에 더 가까이 다가가세요.`);
    });

    // 아직 살펴보지 않은 소품 위의 '?' 표시
    if (interactionId) {
      const marker = this.add
        .text(rect.x, rect.y - rect.height / 2 - 4, '?', { fontFamily: FONT_FAMILY, fontSize: '13px', fontStyle: 'bold', color: '#17140c', backgroundColor: '#d9b45a', padding: { x: 4, y: 0 } })
        .setOrigin(0.5, 1)
        .setDepth(950);
      this.tweens.add({ targets: marker, y: marker.y - 4, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const refresh = () => marker.setVisible(!gameState.has('inspected', interactionId));
      refresh();
      const off = gameState.on(refresh);
      this.events.once('shutdown', off);
    }
  }

  spawnPlayer(x, y) {
    this.player = new Player(this, x, y);
    this.physics.add.collider(this.player, this.walls);
    return this.player;
  }

  /**
   * 상호작용 대상 등록.
   * target: { x, y, bounds?, prompt, promptX, promptY, onInteract }
   */
  addInteractable(target) {
    this.interactables.push(target);
    return target;
  }

  findNearestInteractable() {
    if (!this.player) return null;
    let best = null;
    let bestScore = Infinity;
    for (const target of this.interactables) {
      const d = this.distanceTo(target);
      const range = target.bounds ? PROP_DISTANCE : INTERACT_DISTANCE;
      // 범위 대비 비율로 비교해 소품과 NPC/문 중 더 가까운 쪽을 고른다
      if (d <= range && d / range < bestScore) {
        best = target;
        bestScore = d / range;
      }
    }
    return best;
  }

  distanceTo(target) {
    const { x, y } = this.player;
    const b = target.bounds;
    if (!b) return Phaser.Math.Distance.Between(x, y, target.x, target.y);
    const dx = Math.max(b.left - x, 0, x - b.right);
    const dy = Math.max(b.top - y, 0, y - b.bottom);
    return Math.hypot(dx, dy);
  }

  isInRange(target) {
    return this.findNearestInteractable() === target;
  }

  tryInteract() {
    if (ui.isBlocking()) return;
    const target = this.findNearestInteractable();
    if (target) this.activate(target);
  }

  activate(target) {
    if (this.transitioning || ui.isBlocking()) return;
    target.onInteract();
  }

  showRoleBadge(npc) {
    this.roleBadge.show(npc);
  }

  goToScene(key, data, door = null) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.prompt.hide();
    this.player?.freeze();
    door?.open();
    audio.sfx('door');
    this.cameras.main.fadeOut(FADE_MS);
    this.time.delayedCall(FADE_MS, () => this.scene.start(key, data));
  }

  update(time, delta) {
    if (this.transitioning) return;
    if (ui.isBlocking()) {
      this.player?.setVelocity(0, 0);
      this.player?.animateWalk(false);
      this.prompt.hide();
      return;
    }
    this.player?.update(time, delta);
    const target = this.findNearestInteractable();
    if (target) this.prompt.show(target);
    else this.prompt.hide();
  }
}
