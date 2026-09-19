/**
 * 矢印と短いラベルを Canvas に描きます。
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {number} x - 始点 X
 * @param {number} y - 始点 Y
 * @param {number} dx - 方向 X
 * @param {number} dy - 方向 Y
 * @param {string} color - 線色
 * @param {string} [label] - 矢印横のラベル
 * @returns {void}
 */
export function drawArrow(ctx, x, y, dx, dy, color, label) {
  const len = Math.hypot(dx, dy);
  if (len < 2) {
    return;
  }
  const ux = dx / len;
  const uy = dy / len;
  const ex = x + dx;
  const ey = y + dy;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ux * 8 - uy * 4, ey - uy * 8 + ux * 4);
  ctx.lineTo(ex - ux * 8 + uy * 4, ey - uy * 8 - ux * 4);
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = "11px 'Zen Kaku Gothic New', sans-serif";
    ctx.fillText(label, ex + 6, ey - 6);
  }
}

/**
 * 横棒のメーターを描きます。
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {number} x - 左
 * @param {number} y - 上
 * @param {number} width - 幅
 * @param {number} ratio - 0 から 1 の割合
 * @param {string} color - バー色
 * @param {string} label - ラベル
 * @returns {void}
 */
export function drawMeter(ctx, x, y, width, ratio, color, label) {
  ctx.fillStyle = "rgba(231, 225, 212, 0.12)";
  ctx.fillRect(x, y, width, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), 8);
  ctx.fillStyle = "#e7e1d4";
  ctx.font = "11px 'IBM Plex Mono', monospace";
  ctx.fillText(label, x, y - 5);
}
