import Phaser from 'phaser';

/**
 * 외부 에셋 없이 Graphics 로 캐릭터·바닥 텍스처를 그린다.
 * 캐릭터는 3/4 정면 도트풍 인물(32×48), 걷기 2프레임.
 */
const W = 32;
const H = 48;

const hex = (c) => Phaser.Display.Color.HexStringToColor(c).color;
const shade = (c, amt) => {
  const col = Phaser.Display.Color.HexStringToColor(c);
  const f = (v) => Phaser.Math.Clamp(Math.round(v * (1 + amt)), 0, 255);
  return Phaser.Display.Color.GetColor(f(col.red), f(col.green), f(col.blue));
};

function drawPerson(g, look, frame) {
  const { outfit, hair, hairStyle, skin = '#f0c8a0', accessory, hat, pants = '#2b2d36' } = look;
  // 그림자
  g.fillStyle(0x000000, 0.28).fillEllipse(16, 44, 22, 7);
  // 다리 (프레임 1은 보폭)
  g.fillStyle(hex(pants), 1);
  if (frame === 0) {
    g.fillRect(11, 36, 4, 8).fillRect(17, 36, 4, 8);
  } else {
    g.fillRect(9, 36, 4, 7).fillRect(19, 35, 4, 8);
  }
  g.fillStyle(0x1a1a1a, 1);
  if (frame === 0) g.fillRect(10, 43, 5, 2).fillRect(17, 43, 5, 2);
  else g.fillRect(8, 42, 5, 2).fillRect(19, 42, 5, 2);
  // 몸통
  g.fillStyle(hex(outfit), 1).fillRoundedRect(8, 21, 16, 17, 4);
  g.fillStyle(shade(outfit, -0.25), 1).fillRect(8, 33, 16, 3);
  // 팔
  const armY = frame === 0 ? 23 : 22;
  g.fillStyle(shade(outfit, -0.12), 1).fillRoundedRect(5, armY, 4, 12, 2).fillRoundedRect(23, frame === 0 ? 23 : 24, 4, 12, 2);
  g.fillStyle(hex(skin), 1).fillRect(5, armY + 11, 4, 3).fillRect(23, (frame === 0 ? 23 : 24) + 11, 4, 3);
  // 셔츠 깃 / 액세서리
  g.fillStyle(0xf2f2f2, 1).fillTriangle(13, 21, 19, 21, 16, 26);
  if (accessory === 'tie') g.fillStyle(0x8a2b2b, 1).fillRect(15, 23, 2, 9);
  if (accessory === 'lanyard') {
    g.lineStyle(1, 0x3f7fd1, 1).lineBetween(12, 21, 16, 29).lineBetween(20, 21, 16, 29);
    g.fillStyle(0xffffff, 1).fillRect(14, 29, 4, 5);
  }
  // 머리
  g.fillStyle(hex(skin), 1).fillCircle(16, 13, 8);
  // 머리카락
  const cap = (cx, cy, r, a0, a1) => {
    g.beginPath();
    g.slice(cx, cy, r, a0, a1, false);
    g.fillPath();
  };
  g.fillStyle(hex(hair), 1);
  switch (hairStyle) {
    case 'long':
      g.fillRect(8, 9, 3, 14).fillRect(21, 9, 3, 14);
      cap(16, 13, 8.5, Math.PI, 0);
      break;
    case 'bob':
      g.fillRect(8, 9, 3, 9).fillRect(21, 9, 3, 9);
      cap(16, 13, 8.5, Math.PI, 0);
      g.fillRect(9, 8, 14, 3);
      break;
    case 'slick':
      cap(16, 12, 8.5, Math.PI * 1.05, -0.05);
      g.fillStyle(shade(hair, 0.25), 1).fillRect(11, 6, 7, 1);
      break;
    case 'side':
      cap(16, 12, 8.5, Math.PI, 0);
      g.fillTriangle(8, 12, 16, 7, 8, 16);
      break;
    default:
      cap(16, 12, 8.5, Math.PI, 0);
      g.fillRect(8, 10, 2, 4).fillRect(22, 10, 2, 4);
  }
  // 모자(탐정)
  if (hat) {
    g.fillStyle(hex(hat), 1).fillEllipse(16, 8, 22, 5).fillRoundedRect(10, 1, 12, 8, 3);
    g.fillStyle(0x1a1410, 1).fillRect(10, 6, 12, 2);
  }
  // 얼굴
  g.fillStyle(0x2a1f1a, 1).fillRect(12, 14, 2, 2).fillRect(18, 14, 2, 2);
  if (accessory === 'glasses') {
    g.lineStyle(1, 0x1a1a1a, 1).strokeRect(10.5, 12.5, 5, 4).strokeRect(16.5, 12.5, 5, 4).lineBetween(15.5, 14, 16.5, 14);
  }
  g.fillStyle(0xc98f7a, 1).fillRect(15, 18, 3, 1);
}

export function makeCharacterTextures(scene, key, look) {
  for (const frame of [0, 1]) {
    const tk = `${key}_${frame}`;
    if (scene.textures.exists(tk)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    drawPerson(g, look, frame);
    g.generateTexture(tk, W, H);
    g.destroy();
  }
}

export const PLAYER_LOOK = { outfit: '#b89a6a', hair: '#2a1f18', hairStyle: 'short', hat: '#4a3a2a', pants: '#3a3228', accessory: null };

/** 바닥 타일 텍스처 (tile | wood | carpet) */
export function makeFloorTexture(scene, key, color, style) {
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const base = hex(color);
  const S = 48;
  g.fillStyle(base, 1).fillRect(0, 0, S, S);
  if (style === 'wood') {
    for (let i = 0; i < 4; i++) {
      g.fillStyle(shade(color, i % 2 ? 0.08 : -0.04), 1).fillRect(0, i * 12, S, 12);
      g.fillStyle(shade(color, -0.3), 1).fillRect(0, i * 12 + 11, S, 1);
      g.fillRect(((i * 17) % 40) + 4, i * 12, 1, 11);
    }
  } else if (style === 'carpet') {
    for (let y = 0; y < S; y += 4) for (let x = (y / 4) % 2 ? 0 : 2; x < S; x += 4) g.fillStyle(shade(color, 0.07), 1).fillRect(x, y, 1, 1);
    g.fillStyle(shade(color, -0.12), 1).fillRect(0, 0, S, 1).fillRect(0, 0, 1, S);
  } else {
    g.fillStyle(shade(color, 0.05), 1).fillRect(1, 1, 22, 22).fillRect(25, 25, 22, 22);
    g.fillStyle(shade(color, -0.22), 1).fillRect(0, 23, S, 2).fillRect(23, 0, 2, S);
  }
  g.generateTexture(key, S, S);
  g.destroy();
  return key;
}
