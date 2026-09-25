import Phaser from 'phaser';

const hex = (c) => Phaser.Display.Color.HexStringToColor(c).color;
const shade = (c, amt) => {
  const col = Phaser.Display.Color.HexStringToColor(c);
  const f = (v) => Phaser.Math.Clamp(Math.round(v * (1 + amt)), 0, 255);
  return Phaser.Display.Color.GetColor(f(col.red), f(col.green), f(col.blue));
};

const BOOKS = [0x8a3b3b, 0x3b5a8a, 0x4f7a3f, 0xb08a3a, 0x6a4a8a, 0x2f6f6f];

/** 소품 종류별 placeholder 일러스트. (x, y)는 좌상단. */
export function drawProp(g, kind, x, y, w, h, color) {
  const c = hex(color);
  const dark = shade(color, -0.3);
  const light = shade(color, 0.18);
  // 공통 그림자
  g.fillStyle(0x000000, 0.22).fillRoundedRect(x + 3, y + 5, w, h, 4);

  const wood = (fill = color) => {
    g.fillStyle(shade(fill, -0.3), 1).fillRoundedRect(x, y, w, h, 3);
    g.fillStyle(hex(fill), 1).fillRoundedRect(x, y, w, h - 5, 3);
    g.fillStyle(shade(fill, 0.15), 1).fillRect(x + 3, y + 3, w - 6, 2);
  };

  switch (kind) {
    case 'desk':
    case 'table':
    case 'reception':
    case 'execDesk': {
      wood();
      if (kind === 'reception') {
        g.fillStyle(0xd9b45a, 1).fillRect(x + w / 2 - 22, y + h - 14, 44, 6);
        g.fillStyle(0xf1ead8, 1).fillRect(x + 10, y + 8, 18, 12).fillRect(x + w - 34, y + 7, 22, 14);
      }
      if (kind === 'execDesk') {
        g.fillStyle(0x2d6a3f, 1).fillRect(x + 12, y + 8, 60, 22);
        g.fillStyle(0xf1ead8, 1).fillRect(x + w - 70, y + 10, 26, 18).fillRect(x + w - 40, y + 12, 22, 15);
        g.fillStyle(0xd9b45a, 1).fillRect(x + w / 2 - 12, y + 12, 24, 5);
      }
      if (kind === 'table') {
        for (let i = 0; i < 4; i++) g.fillStyle(0xf1ead8, 0.9).fillRect(x + 30 + i * 70, y + 12, 18, 13);
      }
      break;
    }
    case 'laptopDesk':
      wood('#6b5540');
      drawLaptop(g, x + w / 2 - 20, y + 8, 40, 26);
      break;
    case 'laptop':
      drawLaptop(g, x, y, w, h);
      break;
    case 'monitor':
      g.fillStyle(0x15171c, 1).fillRoundedRect(x, y, w, h, 2);
      g.fillStyle(0x2f4f7a, 1).fillRect(x + 3, y + 3, w - 6, h - 6);
      break;
    case 'whiteboard':
      g.fillStyle(0x9aa0a8, 1).fillRect(x, y, w, h);
      g.fillStyle(0xf8f8f6, 1).fillRect(x + 2, y + 2, w - 4, h - 4);
      g.lineStyle(1, 0x3a6ab0, 0.7);
      if (w > h) {
        g.lineBetween(x + 14, y + h / 2, x + w * 0.35, y + h / 2 - 3);
        g.lineStyle(1, 0xc04040, 0.7).lineBetween(x + w * 0.45, y + h / 2 + 2, x + w * 0.7, y + h / 2 - 2);
      } else {
        g.lineBetween(x + w / 2 - 3, y + 14, x + w / 2 + 2, y + h * 0.4);
      }
      break;
    case 'screen':
      g.fillStyle(0x3a3d46, 1).fillRect(x - 4, y, w + 8, 4);
      g.fillStyle(0xe8eef6, 1).fillRect(x, y + 3, w, h - 3);
      g.fillStyle(0x3b5a8a, 1).fillRect(x + 12, y + 6, w * 0.4, 4);
      g.fillStyle(0x8a3b3b, 1).fillRect(x + w - 26, y + 6, 14, 8);
      break;
    case 'papers':
    case 'papersTable':
      if (kind === 'papersTable') wood('#6b5540');
      else g.fillStyle(dark, 1).fillRoundedRect(x, y, w, h, 3).fillStyle(c, 1).fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 3);
      for (let i = 0; i < 3; i++) {
        const px = x + 8 + i * Math.max(10, (w - 30) / 3);
        const py = y + 6 + (i % 2) * 5;
        g.fillStyle(0xf4efe2, 1).fillRect(px, py, Math.min(22, w - 12), Math.min(16, h - 12));
        g.fillStyle(0x9a9384, 1).fillRect(px + 3, py + 4, 12, 1).fillRect(px + 3, py + 8, 9, 1);
      }
      break;
    case 'files':
    case 'bookshelf': {
      g.fillStyle(dark, 1).fillRect(x, y, w, h);
      const rows = Math.max(2, Math.floor(h / 28));
      for (let r = 0; r < rows; r++) {
        const ry = y + 4 + r * (h / rows);
        g.fillStyle(shade(color, -0.45), 1).fillRect(x + 3, ry, w - 6, h / rows - 6);
        for (let bx = x + 5, i = 0; bx < x + w - 8; bx += 7, i++) {
          const bh = h / rows - 10 - ((i * 3) % 5);
          g.fillStyle(kind === 'files' ? [0x3b5a8a, 0xb08a3a, 0x8a3b3b][i % 3] : BOOKS[(i + r) % BOOKS.length], 1).fillRect(bx, ry + (h / rows - 6) - bh, 5, bh);
        }
      }
      break;
    }
    case 'cabinet':
      g.fillStyle(dark, 1).fillRoundedRect(x, y, w, h, 3);
      g.fillStyle(c, 1).fillRoundedRect(x + 2, y + 2, w - 4, h - 6, 3);
      for (let i = 0; i < 2; i++) {
        g.lineStyle(1, dark, 1).strokeRect(x + 6, y + 6 + i * (h / 2 - 3), w - 12, h / 2 - 9);
        g.fillStyle(0xd9b45a, 1).fillRect(x + w / 2 - 6, y + 12 + i * (h / 2 - 3), 12, 3);
      }
      break;
    case 'corkboard':
      g.fillStyle(0x6b4f2a, 1).fillRect(x, y, w, h);
      g.fillStyle(0xc8a066, 1).fillRect(x + 2, y + 2, w - 4, h - 4);
      for (let i = 0; i < 6; i++) {
        g.fillStyle(i === 2 ? 0xf4efe2 : 0xf1e3a8, 1).fillRect(x + 10 + i * ((w - 30) / 5), y + 3, 14, h - 6);
        g.fillStyle(0xc04040, 1).fillCircle(x + 17 + i * ((w - 30) / 5), y + 4, 1.5);
      }
      break;
    case 'sofa':
      g.fillStyle(dark, 1).fillRoundedRect(x, y, w, h, 8);
      g.fillStyle(c, 1).fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 6);
      g.fillStyle(light, 1);
      if (w >= h) for (let i = 0; i < 3; i++) g.fillRoundedRect(x + 8 + i * ((w - 16) / 3), y + 8, (w - 16) / 3 - 4, h - 18, 4);
      else for (let i = 0; i < 3; i++) g.fillRoundedRect(x + 8, y + 8 + i * ((h - 16) / 3), w - 18, (h - 16) / 3 - 4, 4);
      break;
    case 'plant':
      g.fillStyle(0x8a5a3a, 1).fillRect(x + w * 0.25, y + h * 0.55, w * 0.5, h * 0.45);
      g.fillStyle(0x2f6a34, 1).fillCircle(x + w / 2, y + h * 0.35, w * 0.38);
      g.fillStyle(0x3f8a44, 1).fillCircle(x + w * 0.35, y + h * 0.3, w * 0.22).fillCircle(x + w * 0.65, y + h * 0.42, w * 0.2);
      break;
    default:
      g.fillStyle(c, 1).fillRect(x, y, w, h);
  }
}

function drawLaptop(g, x, y, w, h) {
  g.fillStyle(0x9aa0a8, 1).fillRoundedRect(x, y + h * 0.45, w, h * 0.55, 2);
  g.fillStyle(0x2a2d36, 1).fillRoundedRect(x + 2, y, w - 4, h * 0.5, 2);
  g.fillStyle(0x3f7fd1, 1).fillRect(x + 4, y + 2, w - 8, h * 0.5 - 4);
  g.fillStyle(0xbfd8f4, 0.8).fillRect(x + 6, y + 4, (w - 12) * 0.6, 2);
}
