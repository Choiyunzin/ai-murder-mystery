import Phaser from 'phaser';
import { PLAYER_SPEED } from '../config/gameConfig.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.setCollideWorldBounds(true);
    this.body.setCircle(14, 2, 2);

    const kb = scene.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D');
    this.frozen = false;
  }

  freeze() {
    this.frozen = true;
    this.setVelocity(0, 0);
  }

  update() {
    if (this.frozen) return;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    const dir = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
    if (dir.lengthSq() > 0) {
      dir.normalize().scale(PLAYER_SPEED);
      this.setRotation(dir.angle());
    }
    this.setVelocity(dir.x, dir.y);
  }
}
