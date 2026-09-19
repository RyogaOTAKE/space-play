/**
 * 惑星近傍のスイングバイを、原理の説明と一緒に体験します。
 * 途中で消さず、通過の結果が出るまで軌道を残します。
 */
import { createStarfield, drawStarfield } from "../starfield.js";
import { drawArrow, drawMeter } from "../draw.js";

const PLANET_R = 22;
const CRAFT_V0 = 72;
const PLANET_V = 36;

/**
 * 重力アシスト シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createGravityAssistScene() {
  const stars = createStarfield(140);
  let time = 0;
  let aim = -48;
  let craft = null;
  let planet = { x: 0, y: 0, vx: PLANET_V, vy: 0 };
  let setBrief = () => {};
  let phase = "fly";
  let resultAt = 0;
  let inboundSun = CRAFT_V0;
  let inboundRel = CRAFT_V0 - PLANET_V;
  let closest = 999;
  let periPassed = false;
  let aimInput = null;
  let aimOut = null;
  let boostBtn = null;
  let brakeBtn = null;
  let view = { width: 800, height: 600 };

  /**
   * 狙いを反映し、通過をやり直します。
   * @param {number} next - 新しい狙い (Canvas の上下)
   * @returns {void}
   */
  function applyAim(next) {
    aim = next;
    if (aimInput) {
      aimInput.value = String(aim);
    }
    if (aimOut) {
      aimOut.textContent = aim < 0 ? "上側" : "下側";
    }
    if (boostBtn && brakeBtn) {
      boostBtn.classList.toggle("is-active", aim < 0);
      brakeBtn.classList.toggle("is-active", aim > 0);
    }
    place(view.width, view.height);
  }

  /**
   * 探査機と惑星を初期位置へ戻します。
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @returns {void}
   */
  function place(width, height) {
    planet = { x: width * 0.18, y: height * 0.48, vx: PLANET_V, vy: 0 };
    craft = {
      x: 48,
      y: planet.y + aim,
      vx: CRAFT_V0,
      vy: 0,
      trail: [],
    };
    time = 0;
    phase = "fly";
    inboundSun = CRAFT_V0;
    inboundRel = Math.abs(CRAFT_V0 - PLANET_V);
    closest = 999;
    periPassed = false;
  }

  /**
   * いまの局面に合わせた解説を更新します。
   * @param {number} sunSpeed - 太陽基準の速さ
   * @param {number} relSpeed - 惑星基準の速さ
   * @returns {void}
   */
  function refreshBrief(sunSpeed, relSpeed) {
    const dv = sunSpeed - inboundSun;
    const side = aim < 0 ? "惑星の進行方向に対して上側" : "惑星の進行方向に対して下側";
    if (phase === "crash") {
      setBrief({
        kicker: "SWINGBY",
        title: "近すぎて衝突しました",
        body: "重力アシストは、衝突せずに向きだけをもらう通過です。狙いを惑星から少し離してください。惑星の重力は速さの大小ではなく、進行方向の向きを変えます。",
      });
      return;
    }
    if (phase === "result") {
      const gained = dv >= 0;
      setBrief({
        kicker: "SWINGBY",
        title: gained ? `太陽基準で ${dv.toFixed(1)} 加速しました` : `太陽基準で ${Math.abs(dv).toFixed(1)} 減速しました`,
        body: `惑星から見た速さは進入 ${inboundRel.toFixed(1)}、いま ${relSpeed.toFixed(1)} で、ほぼ同じです。向きが惑星の進行方向に寄ると太陽から見た速さは増え、逆だと減ります。これがスイングバイです。`,
      });
      return;
    }
    if (!periPassed && closest > 90) {
      setBrief({
        kicker: "SWINGBY",
        title: "惑星に追いつくところです",
        body: `${side}を通ります。惑星の重力は探査機を引き、軌道の向きを曲げます。太陽から見た速さと、惑星から見た速さを右上のメーターで比べてください。`,
      });
      return;
    }
    if (!periPassed) {
      setBrief({
        kicker: "SWINGBY",
        title: "重力井戸の底に入っています",
        body: "最近点では向きが大きく変わります。惑星基準の速さは位置エネルギーと行き来するだけで、通過の前後ではほぼ元に戻ります。",
      });
      return;
    }
    setBrief({
      kicker: "SWINGBY",
      title: dv >= 0 ? "向きが変わり、速さを受け取っています" : "向きが変わり、速さを渡しています",
      body: "惑星も動いているので、曲がった先が惑星の進行方向に近いと太陽基準の速さは増えます。追い風側を通るか、向かい風側を通るかの違いです。",
    });
  }

  /**
   * コース選択と狙いスライダーを作ります。
   * @returns {HTMLElement[]} コントロール
   */
  function controls() {
    boostBtn = document.createElement("button");
    brakeBtn = document.createElement("button");
    boostBtn.type = "button";
    brakeBtn.type = "button";
    boostBtn.className = "chip is-active";
    brakeBtn.className = "chip";
    boostBtn.textContent = "加速コース (上側)";
    brakeBtn.textContent = "減速コース (下側)";
    const label = document.createElement("label");
    label.className = "speed";
    label.innerHTML = "<span>狙い</span>";
    const input = document.createElement("input");
    input.type = "range";
    input.min = "-80";
    input.max = "80";
    input.value = String(aim);
    const out = document.createElement("output");
    out.textContent = aim < 0 ? "上側" : "下側";
    aimInput = input;
    aimOut = out;
    boostBtn.addEventListener("click", () => applyAim(-48));
    brakeBtn.addEventListener("click", () => applyAim(48));
    input.addEventListener("input", () => {
      aim = Number(input.value);
      out.textContent = aim < 0 ? "上側" : "下側";
      boostBtn.classList.toggle("is-active", aim < 0);
      brakeBtn.classList.toggle("is-active", aim > 0);
    });
    input.addEventListener("change", () => applyAim(Number(input.value)));
    label.append(input, out);
    return [boostBtn, brakeBtn, label];
  }

  return {
    id: "assist",
    kicker: "SWINGBY",
    title: "重力アシスト",
    hint: "向きが変わると速さが変わる",
    body: "惑星の重力は向きを変え、動いている惑星から速さを分けてもらいます。",
    mount({ setBrief: brief }) {
      setBrief = brief;
      return controls();
    },
    start(width, height) {
      view = { width, height };
      place(width, height);
    },
    reset(width, height) {
      view = { width, height };
      place(width, height);
    },
    update(dt, width, height) {
      view = { width, height };
      if (!craft) {
        place(width, height);
      }
      if (phase === "result" || phase === "crash") {
        if (performance.now() - resultAt > 4200) {
          place(width, height);
        }
        refreshBrief(
          Math.hypot(craft.vx, craft.vy),
          Math.hypot(craft.vx - planet.vx, craft.vy - planet.vy),
        );
        return;
      }

      time += dt;
      planet.x += planet.vx * dt;

      const dx = planet.x - craft.x;
      const dy = planet.y - craft.y;
      const dist = Math.hypot(dx, dy);
      closest = Math.min(closest, dist);
      if (dist < PLANET_R) {
        phase = "crash";
        resultAt = performance.now();
        refreshBrief(0, 0);
        return;
      }
      const r = Math.max(dist, PLANET_R);
      const accel = 28000 / (r * r);
      craft.vx += (dx / r) * accel * dt;
      craft.vy += (dy / r) * accel * dt;
      craft.x += craft.vx * dt;
      craft.y += craft.vy * dt;
      if (!periPassed && closest < 120 && dist > closest + 6) {
        periPassed = true;
      }

      craft.trail.push({ x: craft.x, y: craft.y });
      if (craft.trail.length > 280) {
        craft.trail.shift();
      }

      const sunSpeed = Math.hypot(craft.vx, craft.vy);
      const relSpeed = Math.hypot(craft.vx - planet.vx, craft.vy - planet.vy);
      const finished =
        periPassed && (craft.x > width - 36 || craft.x < -40 || Math.abs(craft.y - planet.y) > height * 0.46);
      if (finished) {
        phase = "result";
        resultAt = performance.now();
      }
      refreshBrief(sunSpeed, relSpeed);
    },
    draw(ctx, width, height) {
      drawStarfield(ctx, width, height, stars, time);
      if (!craft) {
        return;
      }

      ctx.fillStyle = "rgba(196, 161, 90, 0.08)";
      ctx.fillRect(planet.x, planet.y - 70, 90, 140);
      ctx.fillStyle = "rgba(143, 208, 220, 0.08)";
      ctx.fillRect(planet.x - 90, planet.y - 70, 90, 140);
      ctx.fillStyle = "#c4a15a";
      ctx.font = "11px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("向かい風側 (減速)", planet.x + 10, planet.y - 78);
      ctx.fillStyle = "#8fd0dc";
      ctx.fillText("追い風側 (加速)", planet.x - 86, planet.y - 78);

      ctx.strokeStyle = "rgba(143, 208, 220, 0.2)";
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, 78, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#c46a4a";
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, PLANET_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e7e1d4";
      ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("惑星", planet.x - 12, planet.y + PLANET_R + 16);
      drawArrow(ctx, planet.x, planet.y, planet.vx * 1.7, 0, "#c4a15a", "惑星の速度");

      ctx.strokeStyle = "rgba(196, 161, 90, 0.75)";
      ctx.lineWidth = 1.4;
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
      ctx.arc(craft.x, craft.y, 5, 0, Math.PI * 2);
      ctx.fill();
      drawArrow(ctx, craft.x, craft.y, craft.vx * 1.1, craft.vy * 1.1, "#8fd0dc", "探査機の速度");

      const sunSpeed = Math.hypot(craft.vx, craft.vy);
      const relSpeed = Math.hypot(craft.vx - planet.vx, craft.vy - planet.vy);
      const panelX = width - 268;
      ctx.fillStyle = "rgba(6, 7, 11, 0.7)";
      ctx.fillRect(panelX - 12, 16, 260, 92);
      ctx.strokeStyle = "rgba(196, 161, 90, 0.28)";
      ctx.strokeRect(panelX - 12, 16, 260, 92);
      drawMeter(ctx, panelX, 38, 236, sunSpeed / 120, "#8fd0dc", `太陽から見た速さ  ${sunSpeed.toFixed(1)}  (出発 ${inboundSun.toFixed(1)})`);
      drawMeter(ctx, panelX, 78, 236, relSpeed / 80, "#c4a15a", `惑星から見た速さ  ${relSpeed.toFixed(1)}  (進入 ${inboundRel.toFixed(1)})`);
    },
    readout() {
      if (!craft) {
        return "SWINGBY STANDBY";
      }
      const sunSpeed = Math.hypot(craft.vx, craft.vy);
      const relSpeed = Math.hypot(craft.vx - planet.vx, craft.vy - planet.vy);
      const dv = sunSpeed - inboundSun;
      const tag = phase === "result" ? "通過完了" : phase === "crash" ? "衝突" : "通過中";
      return `${tag}  |  Δv ${dv >= 0 ? "+" : ""}${dv.toFixed(1)}  |  惑星基準 ${relSpeed.toFixed(1)}  |  最近点 ${closest.toFixed(0)}px`;
    },
  };
}
