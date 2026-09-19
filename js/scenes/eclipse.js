/**
 * 太陽・地球・月の配置を動かし、日食と月食の影を体験します。
 */
import { createStarfield, drawStarfield } from "../starfield.js";

/**
 * 食シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createEclipseScene() {
  const stars = createStarfield(120);
  let time = 0;
  let mode = "solar";
  let setBrief = () => {};

  /**
   * 影の重なり具合から解説を更新します。
   * @param {number} coverage - 0 から 1 の食分
   * @returns {void}
   */
  function refreshBrief(coverage) {
    if (mode === "solar") {
      setBrief({
        kicker: "ECLIPSE",
        title: coverage > 0.92 ? "皆既日食です" : coverage > 0.2 ? "部分日食が進んでいます" : "月が太陽に近づいています",
        body: "月が地球と太陽の間に入ると、月の本影が地表を横切って日食になります。時間を動かすと、欠け方が連続して変わります。",
      });
      return;
    }
    setBrief({
      kicker: "ECLIPSE",
      title: coverage > 0.92 ? "皆既月食です" : coverage > 0.2 ? "部分月食が進んでいます" : "月が地球の影へ入ろうとしています",
      body: "地球が太陽と月の間に入ると、地球の影が月面を覆います。本影の中では月が赤く見えることがあります。",
    });
  }

  /**
   * 太陽・地球・月の配置を返します。
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @returns {{ sun: object, earth: object, moon: object, coverage: number }} 天体位置
   */
  function layout(width, height) {
    const earth = { x: width * 0.52, y: height * 0.52, r: 34 };
    const sun = { x: width * 0.16, y: height * 0.52, r: 48 };
    const orbit = 118;
    const phase = time * 0.55;
    const moon = {
      x: earth.x + Math.cos(phase) * orbit,
      y: earth.y + Math.sin(phase) * orbit * 0.34,
      r: 12,
    };

    const align = Math.cos(phase);
    let coverage = 0;
    if (mode === "solar") {
      const dist = Math.hypot(moon.x - sun.x, moon.y - sun.y);
      coverage = align < -0.72 ? Math.max(0, 1 - Math.abs(dist - (earth.x - sun.x)) / 90) : 0;
    } else {
      coverage = align > 0.72 ? Math.min(1, (align - 0.72) / 0.28) : 0;
    }
    return { sun, earth, moon, coverage: Math.max(0, Math.min(1, coverage)) };
  }

  /**
   * 日食 / 月食の切替ボタンを作ります。
   * @returns {HTMLButtonElement[]} コントロール
   */
  function controls() {
    const solar = document.createElement("button");
    const lunar = document.createElement("button");
    solar.className = "chip is-active";
    lunar.className = "chip";
    solar.textContent = "日食";
    lunar.textContent = "月食";
    solar.addEventListener("click", () => {
      mode = "solar";
      solar.classList.add("is-active");
      lunar.classList.remove("is-active");
    });
    lunar.addEventListener("click", () => {
      mode = "lunar";
      lunar.classList.add("is-active");
      solar.classList.remove("is-active");
    });
    return [solar, lunar];
  }

  return {
    id: "eclipse",
    kicker: "ECLIPSE",
    title: "日食と月食",
    body: "月の公転を動かすと、太陽・地球・月の一直線が食を作ります。",
    mount({ setBrief: brief }) {
      setBrief = brief;
      return controls();
    },
    start() {
      time = 5.2;
      mode = "solar";
    },
    reset() {
      time = 5.2;
    },
    update(dt, width, height) {
      time += dt;
      const { coverage } = layout(width, height);
      refreshBrief(coverage);
    },
    draw(ctx, width, height) {
      drawStarfield(ctx, width, height, stars, time);
      const { sun, earth, moon, coverage } = layout(width, height);

      ctx.strokeStyle = "rgba(196, 161, 90, 0.25)";
      ctx.beginPath();
      ctx.ellipse(earth.x, earth.y, 118, 40, 0, 0, Math.PI * 2);
      ctx.stroke();

      const sunGlow = ctx.createRadialGradient(sun.x, sun.y, 8, sun.x, sun.y, 70);
      sunGlow.addColorStop(0, "#fff3b0");
      sunGlow.addColorStop(0.4, "#f0c14a");
      sunGlow.addColorStop(1, "rgba(240, 193, 74, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6d56a";
      ctx.beginPath();
      ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
      ctx.fill();

      if (mode === "solar" && coverage > 0.05) {
        ctx.fillStyle = `rgba(5, 6, 10, ${0.25 + coverage * 0.55})`;
        ctx.beginPath();
        ctx.arc(earth.x, earth.y, earth.r + 18, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#3d6cae";
      ctx.beginPath();
      ctx.arc(earth.x, earth.y, earth.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6fbf6a";
      ctx.beginPath();
      ctx.arc(earth.x - 8, earth.y - 4, 11, 0, Math.PI * 2);
      ctx.fill();

      if (mode === "lunar") {
        ctx.fillStyle = `rgba(20, 10, 30, ${0.2 + coverage * 0.45})`;
        ctx.beginPath();
        ctx.arc(earth.x + 90, earth.y, 52, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = mode === "lunar" && coverage > 0.6 ? "#a24a3a" : "#d9d3c6";
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8d877b";
      ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("太陽", sun.x - 12, sun.y + sun.r + 18);
      ctx.fillText("地球", earth.x - 12, earth.y + earth.r + 18);
      ctx.fillText("月", moon.x - 6, moon.y + moon.r + 16);

      ctx.fillStyle = "#8fd0dc";
      ctx.font = "12px 'IBM Plex Mono', monospace";
      ctx.fillText(`食分 ${(coverage * 100).toFixed(0)}%`, 20, 28);
    },
    readout(width, height) {
      const { coverage } = layout(width, height);
      return `${mode === "solar" ? "日食" : "月食"}  |  食分 ${(coverage * 100).toFixed(0)}%  |  月位相 ${((time * 0.55) % (Math.PI * 2)).toFixed(2)} rad`;
    },
  };
}
