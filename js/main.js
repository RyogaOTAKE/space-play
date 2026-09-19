/**
 * Space Play の観測卓を起動します。
 */
import { Engine } from "./engine.js";
import { createSolarSystemScene } from "./scenes/solar-system.js";
import { createBlackHoleScene } from "./scenes/black-hole.js";
import { createEclipseScene } from "./scenes/eclipse.js";
import { createGravityAssistScene } from "./scenes/gravity-assist.js";

const scenes = [
  createSolarSystemScene(),
  createBlackHoleScene(),
  createEclipseScene(),
  createGravityAssistScene(),
];

const canvas = document.querySelector("#stage");
const nav = document.querySelector("#scene-nav");
const briefKicker = document.querySelector("#brief-kicker");
const briefTitle = document.querySelector("#brief-title");
const briefBody = document.querySelector("#brief-body");
const readout = document.querySelector("#readout");
const extra = document.querySelector("#extra-controls");
const pauseBtn = document.querySelector("#btn-pause");
const resetBtn = document.querySelector("#btn-reset");
const speed = document.querySelector("#speed");
const speedOut = document.querySelector("#speed-out");

/**
 * 解説カードの文言を反映します。
 * @param {{ kicker: string, title: string, body: string }} payload - 表示内容
 * @returns {void}
 */
function setBrief(payload) {
  briefKicker.textContent = payload.kicker;
  briefTitle.textContent = payload.title;
  briefBody.textContent = payload.body;
}

/**
 * フッタのテレメトリを反映します。
 * @param {string} text - 表示文字列
 * @returns {void}
 */
function setReadout(text) {
  readout.textContent = text;
}

/**
 * シーン固有コントロールを差し替えます。
 * @param {HTMLElement[]} nodes - 追加する要素
 * @returns {void}
 */
function setExtraControls(nodes) {
  extra.replaceChildren(...nodes);
}

const engine = new Engine({
  canvas,
  setReadout,
  setBrief,
  setExtraControls,
});

/**
 * ミッション一覧のボタンを描画します。
 * @param {string} activeId - 選択中シーンの ID
 * @returns {void}
 */
function renderNav(activeId) {
  nav.replaceChildren();
  for (const scene of scenes) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `scene-btn${scene.id === activeId ? " is-active" : ""}`;
    button.innerHTML = `<span class="scene-btn__name">${scene.title}</span><span class="scene-btn__hint">${scene.body}</span>`;
    button.addEventListener("click", () => selectScene(scene.id));
    nav.append(button);
  }
}

/**
 * 指定 ID のシーンへ切り替えます。
 * @param {string} id - シーン ID
 * @returns {void}
 */
function selectScene(id) {
  const scene = scenes.find((item) => item.id === id) ?? scenes[0];
  renderNav(scene.id);
  engine.load(scene);
}

pauseBtn.addEventListener("click", () => {
  const paused = engine.togglePause();
  pauseBtn.textContent = paused ? "再生" : "一時停止";
});

resetBtn.addEventListener("click", () => engine.reset());

speed.addEventListener("input", () => {
  engine.speed = Number(speed.value);
  speedOut.textContent = `${engine.speed.toFixed(2)}×`;
});

/**
 * テレメトリを定期的に吸い上げます。
 * @returns {void}
 */
function pumpReadout() {
  const scene = engine.scene;
  if (scene?.readout) {
    setReadout(scene.readout(engine.size.width, engine.size.height));
  }
  requestAnimationFrame(pumpReadout);
}

selectScene("solar");
engine.start();
pumpReadout();
