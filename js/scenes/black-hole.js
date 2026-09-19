/**
 * 降着円盤と、事象の地平線へ落ちる探針を体験します。
 */
import { createStarfield, drawStarfield } from "../starfield.js";

/**
 * ブラックホール シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createBlackHoleScene() {
  const stars = createStarfield(190);
  const rs = 28;
  let particles = [];
  let probes = [];
  let time = 0;
  let setBrief = () => {};

  /**
   * 円盤粒子を初期化します。
   * @returns {void}
   */
  function seedDisk() {
    particles = [];
    for (let i = 0; i < 240; i += 1) {
      const r = rs * 2.4 + Math.random() * 160;
      particles.push({
        r,
        a: Math.random() * Math.PI * 2,
        speed: 48 / Math.pow(r, 0.75),
        heat: Math.random(),
      });
    }
  }

  /**
   * 探針を指定座標から接線方向へ打ち出します。
   * @param {number} x - Canvas X
   * @param {number} y - Canvas Y
   * @param {number} cx - 中心 X
   * @param {number} cy - 中心 Y
   * @returns {void}
   */
  function launchProbe(x, y, cx, cy) {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.hypot(dx, dy);
    if (r < rs * 1.2) {
      return;
    }
    const nx = -dy / r;
    const ny = dx / r;
    const speed = 42;
    probes.push({
      x,
      y,
      vx: nx * speed,
      vy: ny * speed,
      alive: true,
      trail: [],
    });
  }

  /**
   * 解説文を探針の状態から組み立てます。
   * @param {number} cx - 中心 X
   * @param {number} cy - 中心 Y
   * @returns {void}
   */
  function refreshBrief(cx, cy) {
    const living = probes.filter((probe) => probe.alive);
    if (living.length === 0) {
      setBrief({
        kicker: "EVENT HORIZON",
        title: "事象の地平線",
        body: "画面をクリックすると探針を打ち出します。光子球の内側では軌道が不安定になり、シュバルツシルト半径を越えると光も戻れません。",
      });
      return;
    }
    const probe = living[living.length - 1];
    const r = Math.hypot(probe.x - cx, probe.y - cy);
    const dilation = r > rs ? Math.sqrt(Math.max(0, 1 - rs / r)) : 0;
    setBrief({
      kicker: "EVENT HORIZON",
      title: r <= rs ? "探針は地平線の向こうです" : "探針が重力井戸を落ちています",
      body: `中心までの距離は ${r.toFixed(0)} px、シュバルツシルト半径は ${rs} px です。遠方から見た時間の進みは約 ${dilation.toFixed(2)} 倍です。`,
    });
  }

  return {
    id: "hole",
    kicker: "EVENT HORIZON",
    title: "事象の地平線",
    hint: "探針を地平線へ落とす",
    body: "画面をクリックすると探針を打ち出します。",
    mount({ setBrief: brief }) {
      setBrief = brief;
      return [];
    },
    start() {
      time = 0;
      probes = [];
      seedDisk();
    },
    reset() {
      time = 0;
      probes = [];
      seedDisk();
    },
    update(dt, width, height) {
      time += dt;
      const cx = width / 2;
      const cy = height / 2;
      for (const particle of particles) {
        particle.a += particle.speed * dt;
        particle.r -= dt * 1.8;
        if (particle.r < rs * 1.05) {
          particle.r = rs * 2.4 + Math.random() * 160;
          particle.a = Math.random() * Math.PI * 2;
        }
      }
      for (const probe of probes) {
        if (!probe.alive) {
          continue;
        }
        const dx = cx - probe.x;
        const dy = cy - probe.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);
        const accel = 14000 / Math.max(80, r2);
        probe.vx += (dx / r) * accel * dt;
        probe.vy += (dy / r) * accel * dt;
        probe.x += probe.vx * dt;
        probe.y += probe.vy * dt;
        probe.trail.push({ x: probe.x, y: probe.y });
        if (probe.trail.length > 80) {
          probe.trail.shift();
        }
        if (r < rs) {
          probe.alive = false;
        }
      }
      refreshBrief(cx, cy);
    },
    onPointer(type, point) {
      if (type !== "down") {
        return;
      }
      this._pendingLaunch = point;
    },
    draw(ctx, width, height) {
      drawStarfield(ctx, width, height, stars, time);
      const cx = width / 2;
      const cy = height / 2;
      if (this._pendingLaunch) {
        launchProbe(this._pendingLaunch.x, this._pendingLaunch.y, cx, cy);
        this._pendingLaunch = null;
      }

      for (const particle of particles) {
        const x = cx + Math.cos(particle.a) * particle.r;
        const y = cy + Math.sin(particle.a) * particle.r * 0.42;
        const heat = Math.max(0.2, 1.15 - particle.r / 220);
        ctx.fillStyle = `rgba(255, ${Math.floor(140 + heat * 80)}, 80, ${0.35 + heat * 0.45})`;
        ctx.fillRect(x, y, 2, 2);
      }

      ctx.strokeStyle = "rgba(143, 208, 220, 0.45)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, rs * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#8fd0dc";
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillText("光子球", cx + rs * 1.5 + 10, cy + 4);

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx, cy, rs, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(211, 107, 78, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#d36b4e";
      ctx.fillText("事象の地平線", cx - 36, cy + rs + 16);

      for (const probe of probes) {
        ctx.strokeStyle = "rgba(231, 225, 212, 0.55)";
        ctx.beginPath();
        probe.trail.forEach((p, i) => {
          if (i === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        });
        ctx.stroke();
        if (probe.alive) {
          ctx.fillStyle = "#e7e1d4";
          ctx.beginPath();
          ctx.arc(probe.x, probe.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    readout() {
      const living = probes.filter((probe) => probe.alive).length;
      const lost = probes.length - living;
      return `探針 生存 ${living} / 地平線越え ${lost}  |  Rs=${rs}px  |  円盤粒子 ${particles.length}`;
    },
  };
}
