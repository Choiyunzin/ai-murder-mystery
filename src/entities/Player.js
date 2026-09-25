import Phaser from 'phaser';
import { PLAYER_SPEED } from '../config/gameConfig.js';
import { virtualInput } from '../ui/TouchControls.js';
import { audio } from '../systems/AudioSystem.js';

const STEP_FRAME_MS = 140;
const STEP_SOUND_MS = 280;

/** 탐정(플레이어). 키보드 + 가상 조이스틱 입력, 걷기 2프레임, 좌우 반전. */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.6);
    this.setCollideWorldBounds(true);
    // 충돌은 발밑 원으로 판정 (3/4 시점에서 머리가 벽 위로 겹쳐 보이도록)
    this.body.setCircle(10, 6, 28);

    const kb = scene.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D');
    this.frozen = false;
    this.walkTime = 0;
    this.stepTime = 0;
    this.frame_ = 0;
  }

  freeze() {
    this.frozen = true;
    this.setVelocity(0, 0);
    this.setTexture('player_0');
  }

  update(time, delta) {
    this.setDepth(this.y + 20);
    if (this.frozen) return;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    const dir = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0) + virtualInput.x, (down ? 1 : 0) - (up ? 1 : 0) + virtualInput.y);
    const moving = dir.lengthSq() > 0.01;
    if (moving) {
      dir.normalize().scale(PLAYER_SPEED);
      if (Math.abs(dir.x) > 1) this.setFlipX(dir.x < 0);
    } else {
      dir.set(0, 0);
    }
    this.setVelocity(dir.x, dir.y);
    this.animateWalk(moving && this.body.speed > 20, delta);
  }

  animateWalk(moving, delta = 16) {
    if (!moving) {
      if (this.frame_ !== 0) this.setTexture('player_0');
      this.frame_ = 0;
      this.walkTime = STEP_FRAME_MS;
      return;
    }
    this.walkTime += delta;
    this.stepTime += delta;
    if (this.walkTime >= STEP_FRAME_MS) {
      this.walkTime = 0;
      this.frame_ = 1 - this.frame_;
      this.setTexture(`player_${this.frame_}`);
    }
    if (this.stepTime >= STEP_SOUND_MS) {
      this.stepTime = 0;
      audio.sfx('step');
    }
  }
}
