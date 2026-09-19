/**
 * 太陽・地球・月の配置と、空に見える欠けを並べて食を体験します。
 */
import { createStarfield, drawStarfield } from "../starfield.js";

const OMEGA = 0.32;
const ORBIT = 132;

/**
 * 食シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createEclipseScene() {
  const stars = createStarfield(110);
  let time = 0;
  let mode = "solar";
  let setBrief = () => {};
  let solarBtn = null;
  let lunarBtn = null;

  /**
   * 日食または月食の直前へ時刻を送ります。
   * @returns {void}
   */
  function seekNearEvent() {
    if (mode === "solar") {
      time = (Math.PI - 0.55) / OMEGA;
      return;
    }
    time = (0 - 0.55) / OMEGA;
  }

  /**
   * 太陽・地球・月の配置と、空に見える欠け量を返します。
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @returns {object} 配置と見え方
   */
  function layout(width, height) {
    const earth = { x: width * 0.46, y: height * 0.52, r: 36 };
    const sun = { x: width * 0.16, y: height * 0.52, r: 46 };
    const phase = time * OMEGA;
    const moon = {
      x: earth.x + Math.cos(phase) * ORBIT,
      y: earth.y + Math.sin(phase) * ORBIT * 0.22,
      r: 13,
    };
    const across = moon.y - earth.y;
    const betweenSunAndEarth = moon.x < earth.x - 8 && moon.x > sun.x + 8;
    const beyondEarth = moon.x > earth.x + 8;
    let coverage = 0;
    let skyOffset = across * 1.8;
    if (mode === "solar" && betweenSunAndEarth) {
      coverage = Math.max(0, 1 - Math.abs(across) / 18);
    }
    if (mode === "lunar" && beyondEarth) {
      coverage = Math.max(0, 1 - Math.abs(across) / 22);
    }
    return { sun, earth, moon, coverage, skyOffset, phase };
  }

  /**
   * 局面に合わせた解説を更新します。
   * @param {number} coverage - 0 から 1 の欠け
   * @returns {void}
   */
  function refreshBrief(coverage) {
    if (mode === "solar") {
      setBrief({
        kicker: "ECLIPSE",
        title:
          coverage > 0.92
            ? "右の丸が皆既日食の見え方です"
            : coverage > 0.15
              ? "右の丸で、太陽が欠けていくのが見えます"
              : "月が太陽と地球の間へ入るところです",
        body: "左は配置、右上は地球から見た太陽です。月の黒い円が黄色い太陽に重なったところが日食です。地球の表面の暗い斑点が、その影の地点です。",
      });
      return;
    }
    setBrief({
      kicker: "ECLIPSE",
      title:
        coverage > 0.92
          ? "右の丸が皆既月食の見え方です"
          : coverage > 0.15
            ? "右の丸で、月が地球の影に入っていくのが見えます"
            : "月が地球の影へ近づくところです",
      body: "左は配置、右上は地上から見た月です。地球の影 (本影) に月が重なったところが月食です。月が赤くなるのは、地球の大気を通った光だけが届くからです。",
    });
  }

  /**
   * 日食 / 月食の切替ボタンを作ります。
   * @returns {HTMLButtonElement[]} コントロール
   */
  function controls() {
    solarBtn = document.createElement("button");
    lunarBtn = document.createElement("button");
    solarBtn.className = "chip is-active";
    lunarBtn.className = "chip";
    solarBtn.textContent = "日食";
    lunarBtn.textContent = "月食";
    solarBtn.addEventListener("click", () => {
      mode = "solar";
      solarBtn.classList.add("is-active");
      lunarBtn.classList.remove("is-active");
      seekNearEvent();
    });
    lunarBtn.addEventListener("click", () => {
      mode = "lunar";
      lunarBtn.classList.add("is-active");
      solarBtn.classList.remove("is-active");
      seekNearEvent();
    });
    return [solarBtn, lunarBtn];
  }

  /**
   * 本影の円錐を描きます。
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {{ x: number, y: number, r: number }} occulter - 影を作る天体
   * @param {{ x: number, y: number, r: number }} sun - 太陽
   * @param {number} length - 円錐の長さ
   * @returns {void}
   */
  function drawUmbra(ctx, occulter, sun, length) {
    const dx = occulter.x - sun.x;
    const dy = occulter.y - sun.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;
    const endX = occulter.x + ux * length;
    const endY = occulter.y + uy * length;
    ctx.fillStyle = "rgba(20, 12, 28, 0.45)";
    ctx.beginPath();
    ctx.moveTo(occulter.x + px * occulter.r, occulter.y + py * occulter.r);
    ctx.lineTo(occulter.x - px * occulter.r, occulter.y - py * occulter.r);
    ctx.lineTo(endX, endY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d36b4e";
    ctx.font = "11px 'Zen Kaku Gothic New', sans-serif";
    ctx.fillText("本影 (いちばん暗い影)", endX - 70, endY - 10);
  }

  /**
   * 地球または月から見た空を、枠付きで描きます。
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} x - 枠の左
   * @param {number} y - 枠の上
   * @param {number} size - 枠の一辺
   * @param {object} view - coverage と skyOffset
   * @returns {void}
   */
  function drawSkyView(ctx, x, y, size, view) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    ctx.fillStyle = "rgba(6, 7, 11, 0.88)";
    ctx.fillRect(x, y, size, size + 28);
    ctx.strokeStyle = "#8fd0dc";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size + 28);
    ctx.fillStyle = "#8fd0dc";
    ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
    const caption = mode === "solar" ? "地球から見た太陽  ← 欠けはここ" : "地球から見た月  ← 欠けはここ";
    ctx.fillText(caption, x + 10, y + size + 18);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#07080d";
    ctx.fillRect(x, y, size, size);

    if (mode === "solar") {
      ctx.fillStyle = "#f6d56a";
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#05060a";
      ctx.beginPath();
      ctx.arc(cx + view.skyOffset, cy, 33, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const redden = view.coverage;
      const g = Math.floor(210 - redden * 140);
      const b = Math.floor(198 - redden * 150);
      ctx.fillStyle = `rgb(220, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(20, 8, 18, ${0.2 + redden * 0.7})`;
      ctx.beginPath();
      ctx.arc(cx - 20 + view.skyOffset * 0.4, cy, 48, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "#8fd0dc";
    ctx.font = "12px 'IBM Plex Mono', monospace";
    ctx.fillText(`欠け ${(view.coverage * 100).toFixed(0)}%`, x + 10, y + 18);
  }

  return {
    id: "eclipse",
    kicker: "ECLIPSE",
    title: "日食と月食",
    hint: "配置と、空の欠けを同時に見る",
    body: "左の配置と右上の空の見え方を、同時に動かして食を見ます。",
    mount({ setBrief: brief }) {
      setBrief = brief;
      return controls();
    },
    start() {
      mode = "solar";
      if (solarBtn && lunarBtn) {
        solarBtn.classList.add("is-active");
        lunarBtn.classList.remove("is-active");
      }
      seekNearEvent();
    },
    reset() {
      seekNearEvent();
    },
    update(dt, width, height) {
      time += dt;
      const { coverage } = layout(width, height);
      refreshBrief(coverage);
    },
    draw(ctx, width, height) {
      drawStarfield(ctx, width, height, stars, time);
      const view = layout(width, height);
      const { sun, earth, moon, coverage } = view;

      ctx.strokeStyle = "rgba(196, 161, 90, 0.22)";
      ctx.beginPath();
      ctx.ellipse(earth.x, earth.y, ORBIT, ORBIT * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = "rgba(143, 208, 220, 0.35)";
      ctx.beginPath();
      ctx.moveTo(sun.x, sun.y);
      ctx.lineTo(earth.x + ORBIT + 24, earth.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#8d877b";
      ctx.font = "11px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("一直線になると食が起きる", sun.x, sun.y - 62);

      if (mode === "solar") {
        drawUmbra(ctx, moon, sun, 90);
      } else {
        drawUmbra(ctx, earth, sun, 150);
      }

      const sunGlow = ctx.createRadialGradient(sun.x, sun.y, 8, sun.x, sun.y, 64);
      sunGlow.addColorStop(0, "#fff3b0");
      sunGlow.addColorStop(0.4, "#f0c14a");
      sunGlow.addColorStop(1, "rgba(240, 193, 74, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, 64, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6d56a";
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3d6cae";
      ctx.beginPath();
      ctx.arc(earth.x, earth.y, earth.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6fbf6a";
      ctx.beginPath();
      ctx.arc(earth.x - 8, earth.y - 4, 12, 0, Math.PI * 2);
      ctx.fill();

      if (mode === "solar" && coverage > 0.12) {
        const spotX = earth.x - 14;
        const spotY = earth.y + (moon.y - earth.y) * 0.4;
        ctx.fillStyle = `rgba(4, 6, 12, ${0.45 + coverage * 0.5})`;
        ctx.beginPath();
        ctx.arc(spotX, spotY, 7 + coverage * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d36b4e";
        ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
        ctx.fillText("← 日食の地点 (影)", spotX + 14, spotY + 4);
      }

      const moonColor = mode === "lunar" && coverage > 0.35 ? `rgb(${180 + coverage * 40}, ${70 + (1 - coverage) * 80}, 70)` : "#d9d3c6";
      ctx.fillStyle = moonColor;
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
      ctx.fill();
      if (mode === "lunar" && coverage > 0.12) {
        ctx.fillStyle = "#d36b4e";
        ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
        ctx.fillText("← 欠けている月", moon.x + moon.r + 8, moon.y + 4);
      }

      ctx.fillStyle = "#8d877b";
      ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("太陽", sun.x - 12, sun.y + sun.r + 18);
      ctx.fillText("地球", earth.x - 12, earth.y + earth.r + 18);
      ctx.fillText("月", moon.x - 6, moon.y + moon.r + 16);

      const skySize = Math.min(240, Math.max(180, width * 0.22));
      drawSkyView(ctx, width - skySize - 18, 16, skySize, view);
    },
    readout(width, height) {
      const { coverage } = layout(width, height);
      return `${mode === "solar" ? "日食" : "月食"}  |  右上の欠け ${(coverage * 100).toFixed(0)}%  |  月位相 ${((time * OMEGA) % (Math.PI * 2)).toFixed(2)} rad`;
    },
  };
}
