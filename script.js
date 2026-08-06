const canvas = document.querySelector("#marketCanvas");
const context = canvas.getContext("2d");
const form = document.querySelector(".lead-form");

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  points: [],
  time: 0,
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = Math.max(window.innerHeight, 720);
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  seedPoints();
}

function seedPoints() {
  const count = Math.round(Math.max(34, state.width / 30));
  state.points = Array.from({ length: count }, (_, index) => ({
    x: randomBetween(-80, state.width + 80),
    y: randomBetween(80, state.height - 40),
    radius: randomBetween(1.6, 3.8),
    drift: randomBetween(0.15, 0.55),
    phase: index * 0.9 + Math.random() * 2,
  }));
}

function draw() {
  state.time += 0.012;
  context.clearRect(0, 0, state.width, state.height);

  const gridGap = 86;
  context.strokeStyle = "rgb(36 85 58 / 0.09)";
  context.lineWidth = 1;
  for (let x = -gridGap; x < state.width + gridGap; x += gridGap) {
    context.beginPath();
    context.moveTo(x + Math.sin(state.time) * 10, 0);
    context.lineTo(x - 140, state.height);
    context.stroke();
  }

  context.lineWidth = 1.2;
  for (let i = 0; i < state.points.length; i += 1) {
    const a = state.points[i];
    const ax = a.x + Math.sin(state.time * a.drift + a.phase) * 18;
    const ay = a.y + Math.cos(state.time * a.drift + a.phase) * 10;

    for (let j = i + 1; j < state.points.length; j += 1) {
      const b = state.points[j];
      const bx = b.x + Math.sin(state.time * b.drift + b.phase) * 18;
      const by = b.y + Math.cos(state.time * b.drift + b.phase) * 10;
      const distance = Math.hypot(ax - bx, ay - by);
      if (distance > 185) continue;
      context.strokeStyle = `rgb(200 113 40 / ${0.22 - distance / 1100})`;
      context.beginPath();
      context.moveTo(ax, ay);
      context.lineTo(bx, by);
      context.stroke();
    }

    context.fillStyle = "rgb(36 85 58 / 0.52)";
    context.beginPath();
    context.arc(ax, ay, a.radius, 0, Math.PI * 2);
    context.fill();
  }

  drawCurve();
  requestAnimationFrame(draw);
}

function drawCurve() {
  const baseY = state.height * 0.62;
  context.strokeStyle = "rgb(19 32 24 / 0.24)";
  context.lineWidth = 2;
  context.beginPath();
  for (let x = -20; x <= state.width + 20; x += 14) {
    const y =
      baseY -
      Math.sin(x * 0.008 + state.time * 0.7) * 42 -
      Math.cos(x * 0.016 + state.time) * 16;
    if (x === -20) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.textContent = "Contacto registrado";
  button.disabled = true;
});

window.addEventListener("resize", resize);
resize();
draw();
