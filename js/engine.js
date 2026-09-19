/**
 * Canvas 上の体験ループと、ポインタ入力の橋渡しを担当します。
 */

/**
 * デバイス ピクセル比を反映した Canvas サイズを合わせます。
 * @param {HTMLCanvasElement} canvas - 対象 Canvas
 * @returns {{ ctx: CanvasRenderingContext2D, width: number, height: number }} 描画コンテキストと CSS ピクセルサイズ
 */
export function fitCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

/**
 * ポインタ位置を Canvas の CSS 座標へ変換します。
 * @param {HTMLCanvasElement} canvas - 対象 Canvas
 * @param {PointerEvent} event - ポインタ イベント
 * @returns {{ x: number, y: number }} Canvas 左上原点の座標
 */
export function pointerOnCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

/**
 * 体験シーンの再生エンジンです。
 */
export class Engine {
  /**
   * @param {object} options - 初期化オプション
   * @param {HTMLCanvasElement} options.canvas - 描画先
   * @param {(text: string) => void} options.setReadout - テレメトリ文字列の反映先
   * @param {(payload: { kicker: string, title: string, body: string }) => void} options.setBrief - 解説カードの反映先
   * @param {(nodes: HTMLElement[]) => void} options.setExtraControls - シーン固有コントロールの反映先
   */
  constructor({ canvas, setReadout, setBrief, setExtraControls }) {
    this.canvas = canvas;
    this.setReadout = setReadout;
    this.setBrief = setBrief;
    this.setExtraControls = setExtraControls;
    this.scene = null;
    this.paused = false;
    this.speed = 1;
    this.lastTs = 0;
    this.size = { width: 1, height: 1 };
    this.running = false;

    window.addEventListener("resize", () => this.resize());
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener("pointerdown", (event) => {
      this.scene?.onPointer?.("down", pointerOnCanvas(canvas, event), event);
    });
    canvas.addEventListener("pointermove", (event) => {
      this.scene?.onPointer?.("move", pointerOnCanvas(canvas, event), event);
    });
    canvas.addEventListener("pointerup", (event) => {
      this.scene?.onPointer?.("up", pointerOnCanvas(canvas, event), event);
    });
  }

  /**
   * Canvas サイズを再計算します。
   * @returns {void}
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (this._fitted && width === this.size.width && height === this.size.height) {
      return;
    }
    this._fitted = true;
    const fitted = fitCanvas(this.canvas);
    this.size = { width: fitted.width, height: fitted.height };
    this.scene?.onResize?.(this.size.width, this.size.height);
  }

  /**
   * 体験シーンを切り替えます。
   * @param {object} scene - シーン オブジェクト
   * @returns {void}
   */
  load(scene) {
    this.scene?.teardown?.();
    this.scene = scene;
    this.resize();
    const extras = scene.mount?.({
      setReadout: this.setReadout,
      setBrief: this.setBrief,
    }) ?? [];
    this.setExtraControls(extras);
    this.setBrief({
      kicker: scene.kicker,
      title: scene.title,
      body: scene.body,
    });
    scene.start?.(this.size.width, this.size.height);
  }

  /**
   * 再生を開始します。
   * @returns {void}
   */
  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTs = performance.now();
    const tick = (ts) => {
      if (!this.running) {
        return;
      }
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      const ctx = this.canvas.getContext("2d");
      const { width, height } = this.size;
      if (!this.paused) {
        this.scene?.update?.(dt * this.speed, width, height);
      }
      this.scene?.draw?.(ctx, width, height);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /**
   * 一時停止状態を切り替えます。
   * @returns {boolean} 停止中なら true
   */
  togglePause() {
    this.paused = !this.paused;
    return this.paused;
  }

  /**
   * シーンを初期状態へ戻します。
   * @returns {void}
   */
  reset() {
    this.scene?.reset?.(this.size.width, this.size.height);
  }
}
