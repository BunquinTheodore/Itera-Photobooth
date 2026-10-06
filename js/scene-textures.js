'use strict';

/* scene-textures.js - plain canvas strip textures for the Three.js scene (ES module, no dependencies). */

export const STRIP_THEMES = [
  { bg: '#FBF4F1', cell: '#E8CFCF' },
  { bg: '#E8CFCF', cell: '#FBF4F1' },
  { bg: '#8B1A1F', cell: '#6B1217' }
];

const roundedRectPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const drawStripCanvas = (frames, theme) => {
  const width = 128;
  const height = frames === 2 ? 308 : 590;
  const margin = 10;
  const caption = 34;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  roundedRectPath(ctx, 0, 0, width, height, 6);
  ctx.fillStyle = theme.bg;
  ctx.fill();
  const cellH = (height - caption - margin * (frames + 1)) / frames;
  for (let i = 0; i < frames; i += 1) {
    const y = margin + i * (cellH + margin);
    ctx.fillStyle = theme.cell;
    ctx.fillRect(margin, y, width - margin * 2, cellH);
  }
  return canvas;
};

export const buildPlainTextures = (THREE) => {
  const textures = [];
  [2, 4].forEach((frames) => {
    STRIP_THEMES.forEach((theme) => {
      const texture = new THREE.CanvasTexture(drawStripCanvas(frames, theme));
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push({ frames, texture });
    });
  });
  return textures;
};
