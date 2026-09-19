/**
 * 太陽と惑星の公転を、圧縮した距離で体験します。
 */
import { createStarfield, drawStarfield } from "../starfield.js";

const PLANETS = [
  { name: "水星", au: 0.39, year: 0.241, radius: 3.2, color: "#c5c0b8" },
  { name: "金星", au: 0.72, year: 0.615, radius: 4.6, color: "#e4c48a" },
  { name: "地球", au: 1.0, year: 1.0, radius: 4.8, color: "#6ea6d9" },
  { name: "火星", au: 1.52, year: 1.881, radius: 4.0, color: "#c46a4a" },
  { name: "木星", au: 5.2, year: 11.86, radius: 9.5, color: "#d7b48c" },
  { name: "土星", au: 9.58, year: 29.46, radius: 8.2, color: "#e0cba0", ring: true },
  { name: "天王星", au: 19.2, year: 84.0, radius: 6.4, color: "#9fd3d8" },
  { name: "海王星", au: 30.05, year: 164.8, radius: 6.2, color: "#4d74d9" },
];

/**
 * 天文単位を画面上の軌道半径へ圧縮します。
 * @param {number} au - 太陽からの距離 (天文単位)
 * @param {number} maxR - 画面上で使える最大半径
 * @returns {number} 軌道半径 (ピクセル)
 */
function orbitRadius(au, maxR) {
  const t = Math.sqrt(au / 30.05);
  return 46 + t * (maxR - 58);
}

/**
 * 太陽系クルーズ シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createSolarSystemScene() {
  const stars = createStarfield(160);
  let time = 0;
  let selected = 2;
  let setBrief = () => {};
  let view = { width: 800, height: 600 };

  /**
   * 選択中の惑星に合わせた解説を更新します。
   * @param {number} years - 経過した地球年
   * @returns {void}
   */
  function refreshBrief(years) {
    const planet = PLANETS[selected];
    const laps = years / planet.year;
    setBrief({
      kicker: "SOLAR CRUISE",
      title: `${planet.name}を追っています`,
      body: `太陽を 1 周するのに地球年で ${planet.year} 年かかります。いま ${laps.toFixed(2)} 周目です。内側の惑星ほど速く回り、ケプラーの法則を目で追えます。`,
    });
  }

  /**
   * 惑星どうしの並びを短い観測メモにします。
   * @param {number} years - 経過した地球年
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @returns {string} テレメトリ文字列
   */
  function telemetry(years, width, height) {
    const earth = PLANETS[2];
    const earthAngle = (years / earth.year) * Math.PI * 2;
    let closest = { name: "—", diff: 99 };
    for (const planet of PLANETS) {
      if (planet.name === "地球") {
        continue;
      }
      const angle = (years / planet.year) * Math.PI * 2;
      let diff = Math.abs(Math.atan2(Math.sin(angle - earthAngle), Math.cos(angle - earthAngle)));
      if (diff < closest.diff) {
        closest = { name: planet.name, diff };
      }
    }
    const note = closest.diff < 0.18 ? `${closest.name} が地球から見て太陽方向に近い` : "各惑星は異なる角速度で公転中";
    return `T+${years.toFixed(2)} 地球年  |  ${note}  |  ${width}×${height}`;
  }

  return {
    id: "solar",
    kicker: "SOLAR CRUISE",
    title: "太陽系クルーズ",
    hint: "公転の速さの差を追う",
    body: "惑星をクリックすると追跡対象が変わります。時間倍率を上げると、内側と外側の速さの差がはっきりします。",
    mount({ setBrief: brief }) {
      setBrief = brief;
      return [];
    },
    start() {
      time = 0;
      refreshBrief(0);
    },
    reset() {
      time = 0;
      selected = 2;
      refreshBrief(0);
    },
    update(dt, width, height) {
      view = { width, height };
      time += dt * 0.28;
      refreshBrief(time);
    },
    onPointer(type, point) {
      if (type !== "down") {
        return;
      }
      const { width, height } = view;
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.46;
      let best = selected;
      let bestDist = Infinity;
      PLANETS.forEach((planet, index) => {
        const r = orbitRadius(planet.au, maxR);
        const angle = (time / planet.year) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const dist = Math.hypot(point.x - x, point.y - y);
        const hitR = planet.radius + 16;
        if (dist <= hitR && dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      if (bestDist !== Infinity) {
        selected = best;
      }
      refreshBrief(time);
    },
    draw(ctx, width, height) {
      drawStarfield(ctx, width, height, stars, time);
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.46;

      ctx.strokeStyle = "rgba(196, 161, 90, 0.18)";
      ctx.lineWidth = 1;
      for (const planet of PLANETS) {
        const r = orbitRadius(planet.au, maxR);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 38);
      glow.addColorStop(0, "#fff6c8");
      glow.addColorStop(0.35, "#f0c14a");
      glow.addColorStop(1, "rgba(240, 193, 74, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6d56a";
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      PLANETS.forEach((planet, index) => {
        const r = orbitRadius(planet.au, maxR);
        const angle = (time / planet.year) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (planet.ring) {
          ctx.strokeStyle = "rgba(224, 203, 160, 0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, y, planet.radius + 6, planet.radius * 0.45, -0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
        ctx.fill();
        if (index === selected) {
          ctx.strokeStyle = "#8fd0dc";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, planet.radius + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = index === selected ? "#e7e1d4" : "#8d877b";
        ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
        ctx.fillText(planet.name, x + planet.radius + 6, y - 4);
      });
    },
    readout(width, height) {
      return telemetry(time, width, height);
    },
  };
}
