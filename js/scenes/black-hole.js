/**
 * 降着円盤の物質が事象の地平線へ落ち、探針も吸収される様子を体験します。
 */
import { createStarfield, drawStarfield } from "../starfield.js";

const RS = 32;
const PHOTON = RS * 1.5;

/**
 * ブラックホール シーンを生成します。
 * @returns {object} シーン オブジェクト
 */
export function createBlackHoleScene() {
  const stars = createStarfield(190);
  let particles = [];
  let probes = [];
  let flashes = [];
  let time = 0;
  let swallowed = 0;
  let setBrief = () => {};

  /**
   * 円盤の外側に粒子を 1 つ置きます。
   * @returns {{ r: number, a: number, heat: number }} 粒子
   */
  function spawnParticle() {
    return {
      r: RS * 3.2 + Math.random() * 150,
      a: Math.random() * Math.PI * 2,
      heat: 0.2 + Math.random() * 0.3,
    };
  }

  /**
   * 降着円盤を初期化します。
   * @returns {void}
   */
  function seedDisk() {
    particles = [];
    for (let i = 0; i < 280; i += 1) {
      const particle = spawnParticle();
      particle.r = RS * 1.2 + Math.random() * 190;
      particles.push(particle);
    }
  }

  /**
   * 探針を接線方向へ打ち出します。
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
    if (r < RS * 1.05) {
      return;
    }
    const nx = -dy / r;
    const ny = dx / r;
    probes.push({
      x,
      y,
      vx: nx * 38,
      vy: ny * 38,
      alive: true,
      fade: 1,
      trail: [],
    });
  }

  /**
   * 吸収フラッシュを残します。
   * @param {number} x - X
   * @param {number} y - Y
   * @returns {void}
   */
  function swallowAt(x, y) {
    swallowed += 1;
    flashes.push({ x, y, life: 1 });
  }

  /**
   * 解説文を更新します。
   * @param {object | null} probe - 最新の探針
   * @param {number} cx - 中心 X
   * @param {number} cy - 中心 Y
   * @returns {void}
   */
  function refreshBrief(probe, cx, cy) {
    if (!probe) {
      setBrief({
        kicker: "EVENT HORIZON",
        title: "降着円盤が地平線へ落ちています",
        body: "明るい点はブラックホールへ螺旋を描いて落ちるガスです。地平線 (黒い円) を越えると光も戻れず、画面から消えます。クリックした探針も、軌道が内側へ落ちれば吸収されます。",
      });
      return;
    }
    const r = Math.hypot(probe.x - cx, probe.y - cy);
    if (!probe.alive) {
      setBrief({
        kicker: "EVENT HORIZON",
        title: "探針は事象の地平線の向こうです",
        body: "シュバルツシルト半径の内側では、外へ向かう光の進路も中心へ折れます。遠方の観測者からは、落ちる物体は赤く暗くなり、やがて見えなくなります。",
      });
      return;
    }
    const dilation = r > RS ? Math.sqrt(Math.max(0, 1 - RS / r)) : 0;
    setBrief({
      kicker: "EVENT HORIZON",
      title: r < PHOTON ? "光子球の内側です。軌道が不安定です" : "探針が重力井戸を螺旋降下しています",
      body: `中心まで ${r.toFixed(0)} px、地平線は ${RS} px です。遠方から見た時間の進みは約 ${dilation.toFixed(2)} 倍です。円盤のガスと同じく、十分近づくと吸収されます。`,
    });
  }

  return {
    id: "hole",
    kicker: "EVENT HORIZON",
    title: "事象の地平線",
    hint: "ガスも探針も地平線へ落ちる",
    body: "降着円盤のガスが黒い円の内側へ消え、クリックした探針も吸収されます。",
    mount({ setBrief: brief }) {
      setBrief = brief;
      return [];
    },
    start() {
      time = 0;
      swallowed = 0;
      probes = [];
      flashes = [];
      seedDisk();
    },
    reset() {
      time = 0;
      swallowed = 0;
      probes = [];
      flashes = [];
      seedDisk();
    },
    update(dt, width, height) {
      time += dt;
      const cx = width / 2;
      const cy = height / 2;

      for (const particle of particles) {
        const omega = 90 / Math.pow(Math.max(RS * 1.02, particle.r), 1.15);
        particle.a += omega * dt;
        particle.r -= dt * (10 + 220 / Math.max(particle.r, RS));
        particle.heat = Math.min(1, particle.heat + dt * 0.25);
        if (particle.r <= RS) {
          const x = cx + Math.cos(particle.a) * RS * 0.92;
          const y = cy + Math.sin(particle.a) * RS * 0.4;
          swallowAt(x, y);
          const next = spawnParticle();
          particle.r = next.r;
          particle.a = next.a;
          particle.heat = next.heat;
        }
      }

      for (const probe of probes) {
        if (!probe.alive) {
          probe.fade = Math.max(0, probe.fade - dt * 0.8);
          continue;
        }
        const dx = cx - probe.x;
        const dy = cy - probe.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(Math.max(16, r2));
        const accel = 22000 / r2;
        probe.vx += (dx / r) * accel * dt;
        probe.vy += (dy / r) * accel * dt;
        probe.vx *= Math.max(0, 1 - 0.1 * dt);
        probe.vy *= Math.max(0, 1 - 0.1 * dt);
        probe.x += probe.vx * dt;
        probe.y += probe.vy * dt;
        probe.trail.push({ x: probe.x, y: probe.y });
        if (probe.trail.length > 100) {
          probe.trail.shift();
        }
        if (r < RS) {
          probe.alive = false;
          probe.fade = 1;
          swallowAt(probe.x, probe.y);
        }
      }

      flashes = flashes.filter((flash) => {
        flash.life -= dt * 1.8;
        return flash.life > 0;
      });

      const living = probes.filter((probe) => probe.alive);
      const latest = living[living.length - 1] ?? probes[probes.length - 1] ?? null;
      refreshBrief(latest, cx, cy);
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
        const heat = Math.max(0.25, 1.2 - particle.r / 210);
        const alpha = 0.4 + heat * 0.5;
        ctx.fillStyle = `rgba(255, ${Math.floor(90 + (1 - heat) * 90)}, 48, ${alpha})`;
        const size = particle.r < PHOTON ? 2.4 : 1.7;
        ctx.fillRect(x, y, size, size);
      }

      ctx.strokeStyle = "rgba(143, 208, 220, 0.5)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, PHOTON, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#8fd0dc";
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillText("光子球", cx + PHOTON + 8, cy + 4);

      const glow = ctx.createRadialGradient(cx, cy, RS * 0.2, cx, cy, RS * 1.8);
      glow.addColorStop(0, "rgba(0, 0, 0, 1)");
      glow.addColorStop(0.55, "rgba(0, 0, 0, 1)");
      glow.addColorStop(1, "rgba(211, 107, 78, 0.18)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, RS * 1.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx, cy, RS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(211, 107, 78, 0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#d36b4e";
      ctx.font = "12px 'Zen Kaku Gothic New', sans-serif";
      ctx.fillText("事象の地平線 (吸収される境界)", cx - 86, cy + RS + 18);

      for (const flash of flashes) {
        ctx.fillStyle = `rgba(255, 170, 90, ${flash.life})`;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, 6 + (1 - flash.life) * 10, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const probe of probes) {
        ctx.strokeStyle = `rgba(231, 225, 212, ${0.55 * probe.fade})`;
        ctx.beginPath();
        probe.trail.forEach((p, i) => {
          if (i === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        });
        ctx.stroke();
        if (probe.fade > 0) {
          const r = Math.hypot(probe.x - cx, probe.y - cy);
          const redshift = r < PHOTON ? 80 : 220;
          ctx.fillStyle = `rgba(255, ${redshift}, ${redshift - 40}, ${probe.fade})`;
          ctx.beginPath();
          ctx.arc(probe.x, probe.y, 3.4 * probe.fade, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    readout() {
      const living = probes.filter((probe) => probe.alive).length;
      const falling = particles.filter((particle) => particle.r < PHOTON).length;
      return `吸収 ${swallowed}  |  探針 生存 ${living}  |  光子球より内側のガス ${falling}  |  Rs=${RS}px`;
    },
  };
}
