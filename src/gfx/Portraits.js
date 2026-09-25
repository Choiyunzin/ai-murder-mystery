import portraitCrops from '../data/portraits.json';

/**
 * 인물 초상화 이미지 (선택).
 * src/assets/characters/{id}.png|jpg|webp 를 넣으면 빌드 시 자동으로 포함된다.
 * id: jung, jo, park, lee, choi, kim, player
 * 이미지가 없는 인물은 코드로 그린 도트 캐릭터를 그대로 쓴다.
 */
const files = import.meta.glob('../assets/characters/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' });

export const portraitUrls = {};
for (const [path, url] of Object.entries(files)) {
  const id = path.split('/').pop().replace(/\.[^.]+$/, '');
  portraitUrls[id] = url;
}

export function hasPortrait(id) {
  return !!portraitUrls[id];
}

export function preloadPortraits(scene) {
  for (const [id, url] of Object.entries(portraitUrls)) scene.load.image(`portrait_${id}`, url);
}

const TOKEN = 64; // 토큰 텍스처 크기
const RADIUS = 24;
const CENTER_Y = 26;

/**
 * 초상화에서 얼굴 부분을 원형으로 잘라 '받침대 위 토큰' 텍스처를 만든다.
 * 맵 위 캐릭터로 쓰며, 몸통 충돌은 받침대(하단) 기준.
 */
export function makeTokenTexture(scene, id, ringColor) {
  const key = `token_${id}`;
  if (scene.textures.exists(key) || !scene.textures.exists(`portrait_${id}`)) return scene.textures.exists(key) ? key : null;
  const img = scene.textures.get(`portrait_${id}`).getSourceImage();
  const crop = { ...portraitCrops.default, ...(portraitCrops[id] ?? {}) };
  const side = img.width * crop.size;
  const sx = Math.max(0, Math.min(img.width - side, img.width * crop.cx - side / 2));
  const sy = Math.max(0, Math.min(img.height - side, img.height * crop.cy - side / 2));

  const tex = scene.textures.createCanvas(key, TOKEN, TOKEN);
  const ctx = tex.getContext();
  // 받침대 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(TOKEN / 2, TOKEN - 7, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // 받침대
  ctx.fillStyle = '#1b1d24';
  ctx.fillRect(TOKEN / 2 - 3, CENTER_Y + RADIUS - 2, 6, TOKEN - 10 - (CENTER_Y + RADIUS - 2));
  ctx.beginPath();
  ctx.ellipse(TOKEN / 2, TOKEN - 9, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // 원형 얼굴
  ctx.save();
  ctx.beginPath();
  ctx.arc(TOKEN / 2, CENTER_Y, RADIUS, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#20232b';
  ctx.fill();
  ctx.clip();
  ctx.drawImage(img, sx, sy, side, side, TOKEN / 2 - RADIUS, CENTER_Y - RADIUS, RADIUS * 2, RADIUS * 2);
  ctx.restore();
  // 테두리(인물 색)
  ctx.lineWidth = 3;
  ctx.strokeStyle = ringColor;
  ctx.beginPath();
  ctx.arc(TOKEN / 2, CENTER_Y, RADIUS - 1, 0, Math.PI * 2);
  ctx.stroke();
  tex.refresh();
  return key;
}

/** 토큰 텍스처 안에서의 기준점/충돌 원 (Player/NPC 가 사용) */
export const TOKEN_LAYOUT = { origin: [0.5, 0.6], body: { r: 10, x: 22, y: 43 }, headTop: 2 };

/** DOM 에서 쓸 초상화 주소. 이미지가 없으면 도트 캐릭터 텍스처를 base64 로 돌려준다. */
export function portraitSrc(game, id) {
  if (portraitUrls[id]) return { src: portraitUrls[id], pixel: false };
  const key = id === 'player' ? 'player_0' : `npc_${id}_0`;
  try {
    return { src: game.textures.getBase64(key), pixel: true };
  } catch {
    return { src: '', pixel: true };
  }
}
