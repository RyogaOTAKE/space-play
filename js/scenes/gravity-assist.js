/**
 * 惑星近傍を通過する探査機のスイングバイを体験します。
 */
import { createStarfield, drawStarfield } from "../starfield.js";

/**
 * 重力アシスト シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createGravityAssistScene() {
  const stars = createStarfield(140);
  let time = 0;
  let aim = -36;
  let craft = null;
  let planet = { x: 0, y: 0, vx: 38 };
  let setBrief = () => {};
  let peak = 0;

  /**
   * 探査機と惑星を初期位置へ戻します。
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @returns {void}
   */
  function place(width, height) {
    planet = { x: width * 0.28, y: height * 0.5, vx: 46 };
    craft = {
      x: 36,
      y: height * 0.5 + aim,
      vx: 62,
      vy: 0,
      trail: [],
      done: false,
    };
    peak = 62;
    time = 0;
  }

  /**
   * 速度変化から解説を更新します。
   * @param {number} speed - 現在速度
   * @returns {void}
   */
  function refreshBrief(speed) {
    const gained = speed - 62;
    setBrief({
      kicker: "SWINGBY",
      title: gained > 8 ? "加速を受け取っています" : "惑星の重力井戸へ接近中",
      body: "探査機は惑星に引かれながら追い風側を通過すると、公転速度の一部をもらって加速します。狙いの上下を変えると、減速側にも回せます。",
    });
  }

  /**
   * 狙いオフセットのスライダーを作ります。
   * @returns {HTMLLabelElement[]} コントロール
   */
  function controls() {
    const label = document.createElement("label");
    label.className = "speed";
    label.innerHTML = "<span>狙いの高さ</span>";
    const input = document.createElement("input");
    input.type = "range";
    input.min = "-90";
    input.max = "90";
    input.value = String(aim);
    const out = document.createElement("output");
    out.textContent = `${aim} px`;
    input.addEventListener("input", () => {
      aim = Number(input.value);
      out.textContent = `${aim} px`;
    });
    label.append(input, out);
    return [label];
  }

  return {
    id: "assist",
    kicker: "SWINGBY",
    title: "重力アシスト",
    hint: "通過で加速を受け取る",
    body: "探査機が惑星のそばを通過すると、速さのやり取りが起きます。",
    mount({ setBrief: brief }) {
      setBrief = brief;
      return controls();
    },
    start(width, height) {
      place(width, height);
    },
    reset(width, height) {
      place(width, height);
    },
    update(dt, width, height) {
      if (!craft) {
        place(width, height);
      }
      time += dt;
      planet.x += planet.vx * dt;
      if (planet.x > width + 80) {
        place(width, height);
        craft.y = height * 0.5 + aim;
      }

      const dx = planet.x - craft.x;
      const dy = planet.y - craft.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      const accel = 22000 / Math.max(90, r2);
      craft.vx += (dx / r) * accel * dt;
      craft.vy += (dy / r) * accel * dt;
      craft.x += craft.vx * dt;
      craft.y += craft.vy * dt;
      const speed = Math.hypot(craft.vx, craft.vy);
      peak = Math.max(peak, speed);
      craft.trail.push({ x: craft.x, y: craft.y });
      if (craft.trail.length > 120) {
        craft.trail.shift();
      }
      if (r < 18) {
        place(width, height);
        craft.y = height * 0.5 + aim;
      }
      refreshBrief(speed);
    },
    draw(ctx, width, height) {
      drawStarfield(ctx, width, height, stars, time);
      if (!craft) {
        return;
      }

      ctx.strokeStyle = "rgba(143, 208, 220, 0.18)";
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#c46a4a";
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e7e1d4";
      ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("惑星", planet.x - 12, planet.y + 36);

      ctx.strokeStyle = "rgba(196, 161, 90, 0.7)";
      ctx.beginPath();
      craft.trail.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.stroke();

      ctx.fillStyle = "#8fd0dc";
      ctx.beginPath();
      ctx.arc(craft.x, craft.y, 4, 0, Math.PI * 2);
      ctx.fill();

      const speed = Math.hypot(craft.vx, craft.vy);
      ctx.fillStyle = "#8fd0dc";
      ctx.font = "12px 'IBM Plex Mono', monospace";
      ctx.fillText(`速度 ${speed.toFixed(1)}  (出発 62 / 最大 ${peak.toFixed(1)})`, 20, 28);
    },
    readout() {
      if (!craft) {
        return "SWINGBY STANDBY";
      }
      const speed = Math.hypot(craft.vx, craft.vy);
      return `探査機速度 ${speed.toFixed(1)}  |  最大 ${peak.toFixed(1)}  |  狙い ${aim}px`;
    },
  };
}
