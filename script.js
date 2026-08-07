const canvas = document.querySelector("#networkCanvas");
const ctx = canvas.getContext("2d");
const form = document.querySelector(".contact-form");

const words = [
  "Put OTC",
  "Acumulador",
  "Step Up",
  "Digital Booster",
  "Piso",
  "Techo",
  "Duplo",
  "Prima",
  "Hedge",
  "ROFEX",
  "Futuros",
  "Opciones",
  "Cobertura",
  "Originacion",
  "Market data",
  "Riesgo",
  "Pricing",
  "Back office",
  "Trazabilidad",
  "Forward",
  "Commodities",
  "Margenes",
  "Ejecucion",
  "Lifecycle",
];

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  nodes: [],
  mouse: { x: null, y: null },
  startedAt: 0,
};

const config = {
  count: 42,
  speed: 0.52,
  linkDistance: 230,
  cutRadius: 82,
  gravity: 0.018,
  cursorForce: 0.34,
  lineColor: [255, 122, 47],
  textColor: [255, 255, 255],
};

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  createNodes();
}

function measure(text) {
  ctx.font = font();
  return ctx.measureText(text).width;
}

function font() {
  return '13px "SF Mono", Menlo, Consolas, monospace';
}

function createNodes() {
  state.startedAt = performance.now();
  const count = Math.max(28, Math.round(Math.min(56, state.width / 26)));
  state.nodes = Array.from({ length: count }, (_, index) => {
    const text = words[index % words.length];
    const angle = Math.random() * Math.PI * 2;
    const speed = config.speed * (0.5 + Math.random() * 0.9);
    const textWidth = measure(text);
    return {
      text,
      w: textWidth,
      h: 16,
      x: Math.random() * Math.max(1, state.width - textWidth) + textWidth / 2,
      y: Math.random() * state.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 0.28 + Math.random() * 0.48,
      pulse: Math.random() * Math.PI * 2,
      delay: index * 120,
      visible: false,
      fade: 0,
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
  if (state.mouse.x === null) return false;
  return (
    pointToSegmentDistance(state.mouse.x, state.mouse.y, a.x, a.y, b.x, b.y) <
    config.cutRadius
  );
}

function applyPhysics() {
  const now = performance.now();
  const ax = new Float64Array(state.nodes.length);
  const ay = new Float64Array(state.nodes.length);

  for (let i = 0; i < state.nodes.length; i += 1) {
    const node = state.nodes[i];
    if (!node.visible && now - state.startedAt > node.delay) node.visible = true;
    if (!node.visible) continue;
    node.fade = Math.min(1, node.fade + 0.025);
  }

  for (let i = 0; i < state.nodes.length; i += 1) {
    for (let j = i + 1; j < state.nodes.length; j += 1) {
      const a = state.nodes[i];
      const b = state.nodes[j];
      if (!a.visible || !b.visible || cursorCuts(a, b)) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      if (distance > config.linkDistance || distance < 0.001) continue;

      const closeness = 1 - distance / config.linkDistance;
      const force = config.gravity * closeness;
      const ux = dx / distance;
      const uy = dy / distance;
      ax[i] += ux * force;
      ay[i] += uy * force;
      ax[j] -= ux * force;
      ay[j] -= uy * force;
    }
  }

  if (state.mouse.x !== null) {
    for (let i = 0; i < state.nodes.length; i += 1) {
      const node = state.nodes[i];
      const dx = node.x - state.mouse.x;
      const dy = node.y - state.mouse.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      if (distance > config.cutRadius) continue;
      const push = config.cursorForce * (1 - distance / config.cutRadius);
      ax[i] += (dx / distance) * push;
      ay[i] += (dy / distance) * push;
    }
  }

  for (let i = 0; i < state.nodes.length; i += 1) {
    const node = state.nodes[i];
    if (!node.visible) continue;
    node.vx += ax[i];
    node.vy += ay[i];

    const speed = Math.hypot(node.vx, node.vy);
    if (speed > 2.2) {
      node.vx = (node.vx / speed) * 2.2;
      node.vy = (node.vy / speed) * 2.2;
    }

    node.x += node.vx;
    node.y += node.vy;

    if (node.x - node.w / 2 < 0 || node.x + node.w / 2 > state.width) node.vx *= -1;
    if (node.y - node.h < 0 || node.y + node.h > state.height) node.vy *= -1;
    node.x = Math.max(node.w / 2, Math.min(state.width - node.w / 2, node.x));
    node.y = Math.max(node.h, Math.min(state.height, node.y));
    node.pulse += 0.012;
  }
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.font = font();
  ctx.textBaseline = "alphabetic";

  for (let i = 0; i < state.nodes.length; i += 1) {
    for (let j = i + 1; j < state.nodes.length; j += 1) {
      const a = state.nodes[i];
      const b = state.nodes[j];
      if (!a.visible || !b.visible || cursorCuts(a, b)) continue;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      if (distance > config.linkDistance) continue;

      const alpha = (1 - distance / config.linkDistance) * 0.42 * Math.min(a.fade, b.fade);
      ctx.strokeStyle = `rgba(${config.lineColor[0]}, ${config.lineColor[1]}, ${config.lineColor[2]}, ${alpha})`;
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const bow = ((i * 11 + j * 5) % 2 === 0 ? 1 : -1) * distance * 0.18;
      ctx.quadraticCurveTo(midX - dy * 0.002 * bow, midY + dx * 0.002 * bow, b.x, b.y);
      ctx.stroke();
    }
  }

  for (const node of state.nodes) {
    if (!node.visible) continue;
    const flicker = 0.12 * Math.sin(node.pulse);
    const alpha = Math.max(0.12, node.alpha + flicker) * node.fade;
    ctx.fillStyle = `rgba(${config.textColor[0]}, ${config.textColor[1]}, ${config.textColor[2]}, ${alpha})`;
    ctx.fillText(node.text, node.x - node.w / 2, node.y);
  }
}

function loop() {
  applyPhysics();
  draw();
  requestAnimationFrame(loop);
}

function setMouse(event) {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
}

window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", setMouse);
canvas.addEventListener("mouseleave", () => {
  state.mouse.x = null;
  state.mouse.y = null;
});
canvas.addEventListener(
  "touchmove",
  (event) => {
    if (!event.touches.length) return;
    state.mouse.x = event.touches[0].clientX;
    state.mouse.y = event.touches[0].clientY;
  },
  { passive: true },
);
canvas.addEventListener("touchend", () => {
  state.mouse.x = null;
  state.mouse.y = null;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.textContent = "Consulta enviada";
  button.disabled = true;
});

resize();
loop();
