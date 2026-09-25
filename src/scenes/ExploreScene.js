import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, INTERACT_DISTANCE, FADE_MS, FONT_FAMILY, HUD_HEIGHT } from '../config/gameConfig.js';
import Player from '../entities/Player.js';
import InteractionPrompt from '../ui/InteractionPrompt.js';
import RoleBadge from '../ui/RoleBadge.js';

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

  addObstacle({ x, y, w, h, color, label }) {
    const rect = this.add.rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(color).color).setStrokeStyle(1, 0x000000, 0.6).setDepth(3);
    this.walls.add(rect);
    if (label) {
      this.add
        .text(x, y, label, { fontFamily: FONT_FAMILY, fontSize: '11px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(3);
    }
    return rect;
  }

  spawnPlayer(x, y) {
    this.player = new Player(this, x, y);
    this.physics.add.collider(this.player, this.walls);
    return this.player;
  }

  /**
   * 상호작용 대상 등록.
   * target: { x, y, prompt, promptX, promptY, onInteract }
   */
  addInteractable(target) {
    this.interactables.push(target);
    return target;
  }

  findNearestInteractable() {
    if (!this.player) return null;
    let best = null;
    let bestDist = INTERACT_DISTANCE;
    for (const target of this.interactables) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
      if (d <= bestDist) {
        best = target;
        bestDist = d;
      }
    }
    return best;
  }

  isInRange(target) {
    return this.findNearestInteractable() === target;
  }

  tryInteract() {
    const target = this.findNearestInteractable();
    if (target) this.activate(target);
  }

  activate(target) {
    if (this.transitioning) return;
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
    this.player?.update();
    const target = this.findNearestInteractable();
    if (target) this.prompt.show(target);
    else this.prompt.hide();
  }
}
