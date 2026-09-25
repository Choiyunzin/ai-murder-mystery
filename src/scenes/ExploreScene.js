import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, INTERACT_DISTANCE, FADE_MS, FONT_FAMILY, HUD_HEIGHT } from '../config/gameConfig.js';
import Player from '../entities/Player.js';
import InteractionPrompt from '../ui/InteractionPrompt.js';
import RoleBadge from '../ui/RoleBadge.js';
import { ui } from '../ui/UIRoot.js';
import { toggleNotebook } from '../ui/InventoryPanel.js';
import { openNarration } from '../ui/DialogueBox.js';
import { inspect } from '../systems/EvidenceSystem.js';

// 소품은 크기가 제각각이라 중심점이 아닌 가장자리까지의 거리로 판정한다
const PROP_DISTANCE = 44;

/**
 * 로비와 각 방이 공유하는 탐색 Scene 베이스.
 * - 외벽/장애물 collision
 * - 플레이어 생성 및 이동
 * - 근접 상호작용 대상 탐색 + 프롬프트 + E/Space/클릭 처리
 * - fade 전환
 */
export default class ExploreScene extends Phaser.Scene {
  initExplore({ floorColor, obstacles = [] }) {
    this.transitioning = false;
    this.interactables = [];
    ui.closeAll();
    ui.setHotkey('i', () => {
      if (!this.transitioning) toggleNotebook();
    });

    this.cameras.main.setBackgroundColor(floorColor);
    // 월드 좌표(0,0)가 HUD 띠 바로 아래에 오도록 카메라를 올린다
    this.cameras.main.setScroll(0, -HUD_HEIGHT);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.walls = this.physics.add.staticGroup();

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
    const color = 0x15171c;
    [
      [GAME_WIDTH / 2, t / 2, GAME_WIDTH, t],
      [GAME_WIDTH / 2, GAME_HEIGHT - t / 2, GAME_WIDTH, t],
      [t / 2, GAME_HEIGHT / 2, t, GAME_HEIGHT],
      [GAME_WIDTH - t / 2, GAME_HEIGHT / 2, t, GAME_HEIGHT]
    ].forEach(([x, y, w, h]) => {
      const wall = this.add.rectangle(x, y, w, h, color).setDepth(4);
      this.walls.add(wall);
    });
  }

  addObstacle({ x, y, w, h, color, label, interaction }) {
    const rect = this.add
      .rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(color).color)
      .setStrokeStyle(interaction ? 2 : 1, interaction ? 0xd9b45a : 0x000000, interaction ? 0.8 : 0.6)
      .setDepth(3);
    this.walls.add(rect);
    if (label) {
      this.add
        .text(x, y, label, { fontFamily: FONT_FAMILY, fontSize: '11px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(3);
    }
    if (interaction) this.addProp(rect, label, interaction);
    return rect;
  }

  /** 조사 가능한 소품 등록: 근접 + E/Space/클릭 → 내레이션, 증거면 문서 열람 */
  addProp(rect, label, interactionId) {
    const target = this.addInteractable({
      x: rect.x,
      y: rect.y,
      bounds: rect.getBounds(),
      prompt: `[E] 살펴보기: ${label}`,
      promptX: rect.x,
      promptY: rect.y - rect.height / 2 - 6,
      onInteract: () => {
        const { lines, notices } = inspect(interactionId);
        openNarration(label, lines, notices);
      }
    });
    rect.setInteractive({ useHandCursor: true }).on('pointerdown', (pointer, lx, ly, event) => {
      event?.stopPropagation();
      if (this.isInRange(target)) this.activate(target);
      else if (!ui.isBlocking()) ui.toast(`${label}에 더 가까이 다가가세요.`);
    });
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

  goToScene(key, data) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.prompt.hide();
    this.player?.freeze();
    this.cameras.main.fadeOut(FADE_MS);
    this.time.delayedCall(FADE_MS, () => this.scene.start(key, data));
  }

  update() {
    if (this.transitioning) return;
    if (ui.isBlocking()) {
      this.player?.setVelocity(0, 0);
      this.prompt.hide();
      return;
    }
    this.player?.update();
    const target = this.findNearestInteractable();
    if (target) this.prompt.show(target);
    else this.prompt.hide();
  }
}
