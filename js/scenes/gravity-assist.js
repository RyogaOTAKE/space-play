/**
 * 惑星の前を通るか後ろを通るかで、太陽基準の速さが増減するスイングバイを体験します。
 * 通過の途中では消さず、結果を残してから次の試行に入ります。
 */
import { createStarfield, drawStarfield } from "../starfield.js";
import { drawArrow, drawMeter } from "../draw.js";

const PLANET_R = 24;
const PLANET_V = 48;
const CRAFT_VX = 8;
const CRAFT_VY = -52;

/**
 * 重力アシスト シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createGravityAssistScene() {
  const stars = createStarfield(140);
  let time = 0;
  let course = "boost";
  let craft = null;
  let planet = { x: 0, y: 0, vx: PLANET_V, vy: 0 };
  let setBrief = () => {};
  let phase = "fly";
  let resultAt = 0;
  let inboundSun = Math.hypot(CRAFT_VX, CRAFT_VY);
  let inboundRel = 0;
  let closest = 999;
  let periPassed = false;
  let boostBtn = null;
  let brakeBtn = null;
  let view = { width: 800, height: 600 };
  let ghost = [];

  /**
   * コースを切り替えて通過をやり直します。
   * @param {"boost" | "brake"} next - 加速または減速
   * @returns {void}
   */
  function applyCourse(next) {
    course = next;
    if (boostBtn && brakeBtn) {
      boostBtn.classList.toggle("is-active", course === "boost");
      brakeBtn.classList.toggle("is-active", course === "brake");
    }
    place(view.width, view.height);
  }

  /**
   * 探査機と惑星を初期位置へ戻します。
   * 加速は惑星の後ろ、減速は惑星の前を通るように開始位置を変えます。
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @returns {void}
   */
  function place(width, height) {
    const midY = height * 0.46;
    const crossX = width * 0.5;
    planet = {
      x: course === "boost" ? crossX - 170 : Math.max(36, crossX - 360),
      y: midY,
      vx: PLANET_V,
      vy: 0,
    };
    craft = {
      x: crossX,
      y: height * 0.88,
      vx: CRAFT_VX,
      vy: CRAFT_VY,
      trail: [],
    };
    ghost = [];
    for (let t = 0; t < 12; t += 0.2) {
      ghost.push({ x: craft.x + CRAFT_VX * t, y: craft.y + CRAFT_VY * t });
    }
    time = 0;
    phase = "fly";
    inboundSun = Math.hypot(CRAFT_VX, CRAFT_VY);
    inboundRel = Math.hypot(CRAFT_VX - PLANET_V, CRAFT_VY);
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
    if (phase === "crash") {
      setBrief({
        kicker: "SWINGBY",
        title: "近すぎて衝突しました",
        body: "重力アシストは衝突せずに向きだけをもらう通過です。加速コースか減速コースを押し直してください。",
      });
      return;
    }
    if (phase === "result") {
      const gained = dv >= 0;
      setBrief({
        kicker: "SWINGBY",
        title: gained
          ? `太陽基準で ${dv.toFixed(1)} 加速しました`
          : `太陽基準で ${Math.abs(dv).toFixed(1)} 減速しました`,
        body: `惑星から見た速さは進入 ${inboundRel.toFixed(1)}、いま ${relSpeed.toFixed(1)} でほぼ同じです。重力は向きだけを変え、惑星自身の運動と合成された結果が太陽基準の速さになります。`,
      });
      return;
    }
    if (!periPassed && closest > 110) {
      setBrief({
        kicker: "SWINGBY",
        title: course === "boost" ? "惑星の後ろ側 (追い風) を通ります" : "惑星の前側 (向かい風) を通ります",
        body: "点線は重力が無いときの直進です。右上で、太陽から見た速さと惑星から見た速さを比べてください。後者は通過の前後でほぼ一定です。",
      });
      return;
    }
    if (!periPassed) {
      setBrief({
        kicker: "SWINGBY",
        title: "最近点で向きが大きく変わります",
        body: "惑星基準では、落ちて上がるだけで速さはほぼ戻ります。変わるのは進行方向です。",
      });
      return;
    }
    setBrief({
      kicker: "SWINGBY",
      title: dv >= 0 ? "曲がった先が惑星の進行方向に寄っています" : "曲がった先が惑星の進行方向と逆です",
      body: "後ろ側を通ると惑星に押されるように加速し、前側を通ると引き戻されるように減速します。",
    });
  }

  /**
   * 加速 / 減速コースのボタンを作ります。
   * @returns {HTMLButtonElement[]} コントロール
   */
  function controls() {
    boostBtn = document.createElement("button");
    brakeBtn = document.createElement("button");
    boostBtn.type = "button";
    brakeBtn.type = "button";
    boostBtn.className = "chip is-active";
    brakeBtn.className = "chip";
    boostBtn.textContent = "加速コース (後ろ側)";
    brakeBtn.textContent = "減速コース (前側)";
    boostBtn.addEventListener("click", () => applyCourse("boost"));
    brakeBtn.addEventListener("click", () => applyCourse("brake"));
    return [boostBtn, brakeBtn];
  }

  return {
    id: "assist",
    kicker: "SWINGBY",
    title: "重力アシスト",
    hint: "前を通るか、後ろを通るか",
    body: "惑星の後ろ側を通ると加速し、前側を通ると減速します。",
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
        if (performance.now() - resultAt > 4800) {
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
      const accel = 24000 / (r * r);
      craft.vx += (dx / r) * accel * dt;
      craft.vy += (dy / r) * accel * dt;
      craft.x += craft.vx * dt;
      craft.y += craft.vy * dt;
      if (!periPassed && closest < 140 && dist > closest + 6) {
        periPassed = true;
      }

      craft.trail.push({ x: craft.x, y: craft.y });
      if (craft.trail.length > 320) {
        craft.trail.shift();
      }

      const sunSpeed = Math.hypot(craft.vx, craft.vy);
      const relSpeed = Math.hypot(craft.vx - planet.vx, craft.vy - planet.vy);
      const finished =
        periPassed &&
        (craft.y < 28 || craft.x > width - 24 || craft.x < 12 || craft.y > height - 12);
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

      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(231, 225, 212, 0.28)";
      ctx.beginPath();
      ghost.forEach((p, i) => {
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#8d877b";
      ctx.font = "11px 'Zen Kaku Gothic New', sans-serif";
      if (ghost.length > 8) {
        ctx.fillText("重力が無い直進", ghost[8].x + 8, ghost[8].y);
      }

      ctx.fillStyle = "rgba(196, 161, 90, 0.1)";
      ctx.fillRect(planet.x, planet.y - 64, 86, 128);
      ctx.fillStyle = "rgba(143, 208, 220, 0.1)";
      ctx.fillRect(planet.x - 86, planet.y - 64, 86, 128);
      ctx.fillStyle = "#8fd0dc";
      ctx.font = "11px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("後ろ (加速)", planet.x - 78, planet.y - 72);
      ctx.fillStyle = "#c4a15a";
      ctx.fillText("前 (減速)", planet.x + 10, planet.y - 72);

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
      drawArrow(ctx, planet.x, planet.y, planet.vx * 1.6, 0, "#c4a15a", "惑星の速度");

      ctx.strokeStyle = "rgba(196, 161, 90, 0.8)";
      ctx.lineWidth = 1.5;
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
      drawArrow(ctx, craft.x, craft.y, craft.vx * 1.15, craft.vy * 1.15, "#8fd0dc", "探査機の速度");

      const sunSpeed = Math.hypot(craft.vx, craft.vy);
      const relSpeed = Math.hypot(craft.vx - planet.vx, craft.vy - planet.vy);
      const panelX = 18;
      ctx.fillStyle = "rgba(6, 7, 11, 0.72)";
      ctx.fillRect(panelX - 8, 14, 268, 92);
      ctx.strokeStyle = "rgba(196, 161, 90, 0.28)";
      ctx.strokeRect(panelX - 8, 14, 268, 92);
      drawMeter(
        ctx,
        panelX,
        36,
        244,
        sunSpeed / 90,
        "#8fd0dc",
        `太陽から見た速さ  ${sunSpeed.toFixed(1)}  (出発 ${inboundSun.toFixed(1)})`,
      );
      drawMeter(
        ctx,
        panelX,
        76,
        244,
        relSpeed / 90,
        "#c4a15a",
        `惑星から見た速さ  ${relSpeed.toFixed(1)}  (進入 ${inboundRel.toFixed(1)})`,
      );
    },
    readout() {
      if (!craft) {
        return "SWINGBY STANDBY";
      }
      const sunSpeed = Math.hypot(craft.vx, craft.vy);
      const relSpeed = Math.hypot(craft.vx - planet.vx, craft.vy - planet.vy);
      const dv = sunSpeed - inboundSun;
      const tag = phase === "result" ? "通過完了" : phase === "crash" ? "衝突" : "通過中";
      const side = course === "boost" ? "後ろ側" : "前側";
      return `${tag}  |  ${side}  |  Δv ${dv >= 0 ? "+" : ""}${dv.toFixed(1)}  |  惑星基準 ${relSpeed.toFixed(1)}  |  最近点 ${closest.toFixed(0)}px`;
    },
  };
}
