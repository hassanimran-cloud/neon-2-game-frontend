const ARENA_W = 1280;
const ARENA_H = 720;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export function interpolateSnapshots(prev, next, now) {
  if (!next) return prev;
  if (!prev) return next;
  const span = Math.max(1, next.t - prev.t);
  const t = Math.max(0, Math.min(1.25, (now - next.t + span) / span));

  const prevPlayers = new Map((prev.players || []).map((p) => [p.id, p]));
  const players = (next.players || []).map((p) => {
    const last = prevPlayers.get(p.id);
    if (!last) return p;
    return {
      ...p,
      x: lerp(last.x, p.x, t),
      y: lerp(last.y, p.y, t),
      aim: lerpAngle(last.aim, p.aim, t),
    };
  });

  const prevBullets = new Map((prev.bullets || []).map((b) => [b.id, b]));
  const bullets = (next.bullets || []).map((b) => {
    const last = prevBullets.get(b.id);
    if (!last) return b;
    return { ...b, x: lerp(last.x, b.x, t), y: lerp(last.y, b.y, t) };
  });

  return { ...next, players, bullets };
}

export function drawArena(ctx, snapshot, localId) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const arenaW = snapshot?.arena?.width || ARENA_W;
  const arenaH = snapshot?.arena?.height || ARENA_H;
  const scale = Math.min(width / arenaW, height / arenaH);
  const ox = (width - arenaW * scale) / 2;
  const oy = (height - arenaH * scale) / 2;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#070914";
  ctx.fillRect(0, 0, arenaW, arenaH);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= arenaW; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, arenaH);
    ctx.stroke();
  }
  for (let y = 0; y <= arenaH; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(arenaW, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, arenaW - 12, arenaH - 12);
  ctx.shadowBlur = 0;

  if (!snapshot) {
    ctx.restore();
    return;
  }

  for (const bullet of snapshot.bullets || []) {
    ctx.beginPath();
    ctx.fillStyle = bullet.ownerSlot === 1 ? "#ff6b9a" : "#9aff7a";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const player of snapshot.players || []) {
    ctx.globalAlpha = player.alive ? 1 : 0.28;
    ctx.beginPath();
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 18;
    ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = player.id === localId ? "#ffffff" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
    ctx.stroke();

    const nx = player.x + Math.cos(player.aim) * 26;
    const ny = player.y + Math.sin(player.aim) * 26;
    ctx.beginPath();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(nx, ny);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x, player.y - 28);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
