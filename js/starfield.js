/**
 * 遠景の星と、ごく遅い視差ドリフトを描きます。
 */

/**
 * 星野を生成します。
 * @param {number} count - 星の個数
 * @returns {{ x: number, y: number, z: number, shade: number }[]} 正規化座標の星配列
 */
export function createStarfield(count) {
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      z: 0.25 + Math.random() * 0.75,
      shade: 0.35 + Math.random() * 0.65,
    });
  }
  return stars;
}

/**
 * 星野を描画します。時間とともにごく小さく流れます。
 * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
 * @param {number} width - 幅 (CSS ピクセル)
 * @param {number} height - 高さ (CSS ピクセル)
 * @param {{ x: number, y: number, z: number, shade: number }[]} stars - 星配列
 * @param {number} time - 経過秒
 * @returns {void}
 */
export function drawStarfield(ctx, width, height, stars, time) {
  ctx.fillStyle = "#05060a";
  ctx.fillRect(0, 0, width, height);

  for (const star of stars) {
    const drift = (time * 0.004 * star.z) % 1;
    const x = ((star.x + drift) % 1) * width;
    const y = star.y * height;
    const size = star.z * 1.5;
    ctx.fillStyle = `rgba(231, 225, 212, ${star.shade})`;
    ctx.fillRect(x, y, size, size);
  }
}
