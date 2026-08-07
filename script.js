const canvas = document.querySelector("#networkCanvas");
const ctx = canvas.getContext("2d");
const form = document.querySelector(".contact-form");
const settingsToggle = document.querySelector(".settings-toggle");
const panelClose = document.querySelector(".panel-close");

const defaults = {
  words: [
    "Equity Swap",
    "Covered Call",
    "Cash Sweep",
    "Bond Ladder",
    "Credit Hedge",
    "Index Fund",
    "Income Trust",
    "Delta Hedge",
    "Treasury Bill",
    "Yield Curve",
    "Forward Contract",
    "Futures Spread",
    "Asset Allocation",
    "Risk Parity",
    "Carry Trade",
    "Straddle Option",
    "Collateral Loan",
    "Dividend Capture",
    "Currency Hedge",
    "Private Equity",
    "Venture Debt",
    "Mezzanine Loan",
    "Zero Coupon",
    "Repo Agreement",
    "Money Market",
    "Growth Fund",
    "Value Fund",
    "Leveraged Loan",
    "Synthetic Option",
    "Inflation Swap",
    "Credit Default",
    "Buyback Plan",
    "Tax Harvesting",
    "Factor Investing",
    "Volatility Fund",
    "Mortgage Bond",
    "Bridge Loan",
    "Capital Buffer",
    "Callable Bond",
    "Structured Note",
  ],
  count: 40,
  appearInterval: 0.35,
  speed: 80,
  linkDistance: 260,
  cutRadius: 130,
  cursorForce: 84,
  gravity: 50,
  escapeSpeed: 20,
  textColor: "#ffffff",
  lineColor: "#00e5e5",
  lineWidth: 1.5,
  curveAmount: 0,
};

const controls = {
  words: document.querySelector("#wordsInput"),
  count: document.querySelector("#countInput"),
  appear: document.querySelector("#appearInput"),
  speed: document.querySelector("#speedInput"),
  distance: document.querySelector("#distInput"),
  cut: document.querySelector("#cutInput"),
  cursorForce: document.querySelector("#cursorForceInput"),
  gravity: document.querySelector("#gravityInput"),
  escape: document.querySelector("#escapeInput"),
  textColor: document.querySelector("#textColorInput"),
  lineColor: document.querySelector("#lineColorInput"),
  lineWidth: document.querySelector("#lineWidthInput"),
  curve: document.querySelector("#curveInput"),
  reset: document.querySelector("#resetBtn"),
};

const labels = {
  count: document.querySelector("#countVal"),
  appear: document.querySelector("#appearVal"),
  speed: document.querySelector("#speedVal"),
  distance: document.querySelector("#distVal"),
  cut: document.querySelector("#cutVal"),
  cursorForce: document.querySelector("#cursorForceVal"),
  gravity: document.querySelector("#gravityVal"),
  escape: document.querySelector("#escapeVal"),
  lineWidth: document.querySelector("#lineWidthVal"),
  curve: document.querySelector("#curveVal"),
};

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  nodes: [],
  mouse: { x: null, y: null },
  spawnStart: 0,
};

let config = structuredClone(defaults);

const font = '15px "SF Mono", Menlo, Consolas, monospace';
const maxForce = 0.05;
const maxCursorForce = 0.4;
const equilibrium = 34;
const maxSpeed = 4;

function speedToPxPerFrame(value) {
  return 0.02 + (value / 100) * 1.58;
}

function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const value = Number.parseInt(cleanHex, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function measure(text) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function createNodes() {
  const activeWords = config.words.length ? config.words : ["CCC"];
  state.spawnStart = performance.now();
  state.nodes = Array.from({ length: Math.max(1, config.count) }, (_, index) => {
    const text = activeWords[index % activeWords.length];
    const width = measure(text);
    const angle = Math.random() * Math.PI * 2;
    const speedFactor = 0.5 + Math.random();
    const speed = speedToPxPerFrame(config.speed) * speedFactor;

    return {
      text,
      w: width,
      h: 18,
      x: Math.random() * Math.max(1, state.width - width) + width / 2,
      y: Math.random() * state.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      speedFactor,
      baseAlpha: 0.28 + Math.random() * 0.46,
      pulse: Math.random() * Math.PI * 2,
      spawnDelay: index * config.appearInterval * 1000,
      active: false,
      spawnAlpha: 0,
    };
  });
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function cursorCuts(a, b) {
  if (state.mouse.x === null || config.cutRadius <= 0) return false;
  return (
    pointToSegmentDistance(state.mouse.x, state.mouse.y, a.x, a.y, b.x, b.y) <
    config.cutRadius
  );
}

function applyPhysics() {
  const count = state.nodes.length;
  const now = performance.now();
  const ax = new Float64Array(count);
  const ay = new Float64Array(count);
  const bondSum = new Float64Array(count);
  const forceScale = (config.gravity / 100) * maxForce;
  const escapeSpeedPx = 0.05 + (config.escapeSpeed / 100) * 1.5;

  for (let i = 0; i < count; i += 1) {
    const node = state.nodes[i];
    if (!node.active && now - state.spawnStart >= node.spawnDelay) node.active = true;
  }

  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const a = state.nodes[i];
      const b = state.nodes[j];
      if (!a.active || !b.active || cursorCuts(a, b)) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);
      if (distance >= config.linkDistance) continue;
      if (distance < 0.001) distance = 0.001;

      const ux = dx / distance;
      const uy = dy / distance;
      const relativeSpeed = Math.hypot(a.vx - b.vx, a.vy - b.vy);
      const bondFactor = Math.max(0, Math.min(1, 1 - relativeSpeed / escapeSpeedPx));
      if (bondFactor <= 0 || forceScale <= 0) continue;

      const closeness = 1 - distance / config.linkDistance;
      const spring = (forceScale * bondFactor * (distance - equilibrium)) / config.linkDistance;
      ax[i] += ux * spring;
      ay[i] += uy * spring;
      ax[j] -= ux * spring;
      ay[j] -= uy * spring;

      const alignFactor = 0.05 * bondFactor * closeness;
      const averageVx = (a.vx + b.vx) / 2;
      const averageVy = (a.vy + b.vy) / 2;
      ax[i] += (averageVx - a.vx) * alignFactor;
      ay[i] += (averageVy - a.vy) * alignFactor;
      ax[j] += (averageVx - b.vx) * alignFactor;
      ay[j] += (averageVy - b.vy) * alignFactor;

      bondSum[i] += bondFactor * closeness;
      bondSum[j] += bondFactor * closeness;
    }
  }

  const cursorForceScale = (config.cursorForce / 100) * maxCursorForce;
  if (state.mouse.x !== null && config.cutRadius > 0 && cursorForceScale > 0) {
    for (let i = 0; i < count; i += 1) {
      const node = state.nodes[i];
      if (!node.active) continue;
      const dx = node.x - state.mouse.x;
      const dy = node.y - state.mouse.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      if (distance >= config.cutRadius) continue;
      const push = cursorForceScale * (1 - distance / config.cutRadius);
      ax[i] += (dx / distance) * push;
      ay[i] += (dy / distance) * push;
    }
  }

  for (let i = 0; i < count; i += 1) {
    const node = state.nodes[i];
    if (!node.active) continue;

    node.spawnAlpha = Math.min(1, node.spawnAlpha + 0.04);
    node.vx += ax[i];
    node.vy += ay[i];

    const baseSpeed = speedToPxPerFrame(config.speed) * node.speedFactor;
    const currentSpeed = Math.hypot(node.vx, node.vy) || 0.0001;
    const clusterFactor = bondSum[i] > 0.02 ? Math.max(0.15, 1 - bondSum[i] * 0.4) : 1;
    const targetSpeed = baseSpeed * clusterFactor;
    const easing = bondSum[i] > 0.02 ? 0.03 : 0.02;
    const newSpeed = currentSpeed + (targetSpeed - currentSpeed) * easing;
    node.vx *= newSpeed / currentSpeed;
    node.vy *= newSpeed / currentSpeed;

    const speed = Math.hypot(node.vx, node.vy);
    if (speed > maxSpeed) {
      node.vx = (node.vx / speed) * maxSpeed;
      node.vy = (node.vy / speed) * maxSpeed;
    }

    node.x += node.vx;
    node.y += node.vy;

    if (node.x - node.w / 2 < 0 || node.x + node.w / 2 > state.width) node.vx *= -1;
    if (node.y - node.h < 0 || node.y + node.h > state.height) node.vy *= -1;
    node.x = Math.max(node.w / 2, Math.min(state.width - node.w / 2, node.x));
    node.y = Math.max(node.h, Math.min(state.height, node.y));
    node.pulse += 0.008;
  }
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  const lineRgb = hexToRgb(config.lineColor);
  const textRgb = hexToRgb(config.textColor);
  const curveFactor = (config.curveAmount / 100) * 0.65;

  for (let i = 0; i < state.nodes.length; i += 1) {
    for (let j = i + 1; j < state.nodes.length; j += 1) {
      const a = state.nodes[i];
      const b = state.nodes[j];
      if (!a.active || !b.active || cursorCuts(a, b)) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= config.linkDistance) continue;

      const alpha = (1 - distance / config.linkDistance) * 0.5 * Math.min(a.spawnAlpha, b.spawnAlpha);
      ctx.strokeStyle = `rgba(${lineRgb[0]}, ${lineRgb[1]}, ${lineRgb[2]}, ${alpha})`;
      ctx.lineWidth = config.lineWidth;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      if (config.curveAmount > 0) {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const direction = (i + j) % 2 === 0 ? 1 : -1;
        ctx.quadraticCurveTo(
          midX - dy * curveFactor * direction,
          midY + dx * curveFactor * direction,
          b.x,
          b.y,
        );
      } else {
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
    }
  }

  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  for (const node of state.nodes) {
    if (!node.active) continue;
    const flicker = 0.12 * Math.sin(node.pulse);
    const alpha = Math.max(0.1, node.baseAlpha + flicker) * node.spawnAlpha;
    ctx.fillStyle = `rgba(${textRgb[0]}, ${textRgb[1]}, ${textRgb[2]}, ${alpha})`;
    ctx.fillText(node.text, node.x - node.w / 2, node.y);
  }
}

function loop() {
  applyPhysics();
  draw();
  requestAnimationFrame(loop);
}

function syncLabels() {
  labels.count.textContent = config.count;
  labels.appear.textContent = `${config.appearInterval.toFixed(2)}s`;
  labels.speed.textContent = config.speed;
  labels.distance.textContent = `${config.linkDistance}px`;
  labels.cut.textContent = `${config.cutRadius}px`;
  labels.cursorForce.textContent = config.cursorForce;
  labels.gravity.textContent = config.gravity;
  labels.escape.textContent = config.escapeSpeed;
  labels.lineWidth.textContent = `${config.lineWidth}px`;
  labels.curve.textContent = config.curveAmount;
}

function syncControls() {
  controls.words.value = config.words.join("\n");
  controls.count.value = config.count;
  controls.appear.value = config.appearInterval;
  controls.speed.value = config.speed;
  controls.distance.value = config.linkDistance;
  controls.cut.value = config.cutRadius;
  controls.cursorForce.value = config.cursorForce;
  controls.gravity.value = config.gravity;
  controls.escape.value = config.escapeSpeed;
  controls.textColor.value = config.textColor;
  controls.lineColor.value = config.lineColor;
  controls.lineWidth.value = config.lineWidth;
  controls.curve.value = config.curveAmount;
  syncLabels();
}

function rebuildFromControls() {
  config = {
    words: controls.words.value
      .split("\n")
      .map((word) => word.trim())
      .filter(Boolean),
    count: Number(controls.count.value),
    appearInterval: Number(controls.appear.value),
    speed: Number(controls.speed.value),
    linkDistance: Number(controls.distance.value),
    cutRadius: Number(controls.cut.value),
    cursorForce: Number(controls.cursorForce.value),
    gravity: Number(controls.gravity.value),
    escapeSpeed: Number(controls.escape.value),
    textColor: controls.textColor.value,
    lineColor: controls.lineColor.value,
    lineWidth: Number(controls.lineWidth.value),
    curveAmount: Number(controls.curve.value),
  };
  syncLabels();
  createNodes();
}

function updateLiveConfig() {
  config.speed = Number(controls.speed.value);
  config.linkDistance = Number(controls.distance.value);
  config.cutRadius = Number(controls.cut.value);
  config.cursorForce = Number(controls.cursorForce.value);
  config.gravity = Number(controls.gravity.value);
  config.escapeSpeed = Number(controls.escape.value);
  config.textColor = controls.textColor.value;
  config.lineColor = controls.lineColor.value;
  config.lineWidth = Number(controls.lineWidth.value);
  config.curveAmount = Number(controls.curve.value);
  syncLabels();
}

function setPanel(open) {
  document.body.classList.toggle("settings-open", open);
  settingsToggle.setAttribute("aria-expanded", String(open));
}

window.addEventListener("resize", () => {
  resize();
  createNodes();
});

window.addEventListener("mousemove", (event) => {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
});

window.addEventListener("mouseleave", () => {
  state.mouse.x = null;
  state.mouse.y = null;
});

window.addEventListener(
  "touchmove",
  (event) => {
    if (!event.touches.length) return;
    state.mouse.x = event.touches[0].clientX;
    state.mouse.y = event.touches[0].clientY;
  },
  { passive: true },
);

window.addEventListener("touchend", () => {
  state.mouse.x = null;
  state.mouse.y = null;
});

settingsToggle.addEventListener("click", () => setPanel(true));
panelClose.addEventListener("click", () => setPanel(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setPanel(false);
});

[
  controls.speed,
  controls.distance,
  controls.cut,
  controls.cursorForce,
  controls.gravity,
  controls.escape,
  controls.textColor,
  controls.lineColor,
  controls.lineWidth,
  controls.curve,
].forEach((control) => control.addEventListener("input", updateLiveConfig));

[controls.words, controls.count, controls.appear].forEach((control) => {
  control.addEventListener("input", rebuildFromControls);
});

controls.reset.addEventListener("click", () => {
  config = structuredClone(defaults);
  syncControls();
  createNodes();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.textContent = "Consulta enviada";
  button.disabled = true;
});

resize();
syncControls();
createNodes();
loop();
