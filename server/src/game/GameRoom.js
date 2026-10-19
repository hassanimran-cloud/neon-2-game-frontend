import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BULLET_RADIUS,
  BULLET_SPEED,
  FIRE_COOLDOWN_MS,
  KILLS_TO_WIN,
  PLAYER_COLORS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  RESPAWN_MS,
  ROUND_BREAK_MS,
  SPAWNS,
  TICK_MS,
  TOTAL_ROUNDS,
} from "./constants.js";
import mongoose from "mongoose";
import { Match } from "../models/Match.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class GameRoom {
  constructor(code, io) {
    this.code = code;
    this.io = io;
    this.players = new Map();
    this.bullets = [];
    this.round = 1;
    this.status = "lobby";
    this.roundHistory = [];
    this.winnerName = null;
    this.bulletSeq = 0;
    this.tickTimer = null;
    this.roundBreakTimer = null;
    this.createdAt = Date.now();
  }

  emit(event, payload) {
    this.io.to(this.code).emit(event, payload);
  }

  getPlayerList() {
    return [...this.players.values()].map((p) => ({
      id: p.id,
      slot: p.slot,
      name: p.name,
      color: p.color,
      ready: p.ready,
      roundKills: p.roundKills,
      totalKills: p.totalKills,
      roundWins: p.roundWins,
    }));
  }

  lobbyPayload() {
    return {
      code: this.code,
      invitePath: `/join/${this.code}`,
      status: this.status,
      players: this.getPlayerList(),
    };
  }

  scorePayload() {
    const p1 = this.playerBySlot(1);
    const p2 = this.playerBySlot(2);
    return {
      round: this.round,
      totalRounds: TOTAL_ROUNDS,
      killsToWin: KILLS_TO_WIN,
      status: this.status,
      p1: p1
        ? {
            name: p1.name,
            color: p1.color,
            kills: p1.roundKills,
            roundWins: p1.roundWins,
            totalKills: p1.totalKills,
          }
        : null,
      p2: p2
        ? {
            name: p2.name,
            color: p2.color,
            kills: p2.roundKills,
            roundWins: p2.roundWins,
            totalKills: p2.totalKills,
          }
        : null,
    };
  }

  snapshot() {
    return {
      t: Date.now(),
      status: this.status,
      round: this.round,
      arena: { width: ARENA_WIDTH, height: ARENA_HEIGHT },
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        slot: p.slot,
        name: p.name,
        color: p.color,
        x: p.x,
        y: p.y,
        aim: p.aim,
        alive: p.alive,
      })),
      bullets: this.bullets.map((b) => ({
        id: b.id,
        x: b.x,
        y: b.y,
        ownerSlot: b.ownerSlot,
      })),
    };
  }

  playerBySlot(slot) {
    return [...this.players.values()].find((p) => p.slot === slot);
  }

  addPlayer(socketId, name) {
    if (this.players.size >= 2) {
      throw new Error("Room is full");
    }
    if (this.status !== "lobby") {
      throw new Error("Match already started");
    }

    const slot = this.players.size === 0 ? 1 : 2;
    const spawn = SPAWNS[slot];
    const player = {
      id: socketId,
      slot,
      name: (name || `Player ${slot}`).slice(0, 16),
      color: PLAYER_COLORS[slot],
      ready: false,
      x: spawn.x,
      y: spawn.y,
      aim: slot === 1 ? 0 : Math.PI,
      input: { up: false, down: false, left: false, right: false, aim: slot === 1 ? 0 : Math.PI, fire: false },
      alive: true,
      respawnAt: 0,
      lastFire: 0,
      roundKills: 0,
      totalKills: 0,
      roundWins: 0,
    };
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (this.status === "playing" || this.status === "roundEnd") {
      const remaining = [...this.players.values()][0];
      if (remaining) {
        this.finishMatch(remaining.name, "forfeit");
      } else {
        this.stopTick();
        this.status = "matchEnd";
      }
    }
  }

  setReady(socketId, ready) {
    const player = this.players.get(socketId);
    if (!player || this.status !== "lobby") return;
    player.ready = Boolean(ready);
    if (this.players.size === 2 && [...this.players.values()].every((p) => p.ready)) {
      this.startMatch();
    }
  }

  setInput(socketId, input) {
    const player = this.players.get(socketId);
    if (!player) return;
    player.input = {
      up: Boolean(input.up),
      down: Boolean(input.down),
      left: Boolean(input.left),
      right: Boolean(input.right),
      aim: Number.isFinite(input.aim) ? input.aim : player.aim,
      fire: Boolean(input.fire),
    };
    player.aim = player.input.aim;
  }

  startMatch() {
    this.round = 1;
    this.roundHistory = [];
    this.winnerName = null;
    this.resetRoundPositions();
    this.status = "playing";
    this.emit("gameStart", { ...this.scorePayload(), snapshot: this.snapshot() });
    this.startTick();
  }

  resetRoundPositions() {
    this.bullets = [];
    const now = Date.now();
    for (const player of this.players.values()) {
      const spawn = SPAWNS[player.slot];
      player.x = spawn.x;
      player.y = spawn.y;
      player.aim = player.slot === 1 ? 0 : Math.PI;
      player.alive = true;
      player.respawnAt = 0;
      player.lastFire = now;
      player.roundKills = 0;
      player.input.fire = false;
    }
  }

  startTick() {
    this.stopTick();
    this.tickTimer = setInterval(() => this.tick(), TICK_MS);
  }

  stopTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.roundBreakTimer) {
      clearTimeout(this.roundBreakTimer);
      this.roundBreakTimer = null;
    }
  }

  tick() {
    if (this.status !== "playing") {
      this.emit("state", this.snapshot());
      this.emit("scoreUpdate", this.scorePayload());
      return;
    }

    const dt = TICK_MS / 1000;
    const now = Date.now();

    for (const player of this.players.values()) {
      if (!player.alive) {
        if (now >= player.respawnAt) {
          const spawn = SPAWNS[player.slot];
          player.x = spawn.x;
          player.y = spawn.y;
          player.alive = true;
        }
        continue;
      }

      let vx = 0;
      let vy = 0;
      if (player.input.up) vy -= 1;
      if (player.input.down) vy += 1;
      if (player.input.left) vx -= 1;
      if (player.input.right) vx += 1;
      const mag = Math.hypot(vx, vy);
      if (mag > 0) {
        vx = (vx / mag) * PLAYER_SPEED;
        vy = (vy / mag) * PLAYER_SPEED;
      }
      player.x = clamp(player.x + vx * dt, PLAYER_RADIUS, ARENA_WIDTH - PLAYER_RADIUS);
      player.y = clamp(player.y + vy * dt, PLAYER_RADIUS, ARENA_HEIGHT - PLAYER_RADIUS);
      player.aim = player.input.aim;

      if (player.input.fire && now - player.lastFire >= FIRE_COOLDOWN_MS) {
        player.lastFire = now;
        const nose = PLAYER_RADIUS + BULLET_RADIUS + 2;
        this.bullets.push({
          id: ++this.bulletSeq,
          ownerId: player.id,
          ownerSlot: player.slot,
          x: player.x + Math.cos(player.aim) * nose,
          y: player.y + Math.sin(player.aim) * nose,
          vx: Math.cos(player.aim) * BULLET_SPEED,
          vy: Math.sin(player.aim) * BULLET_SPEED,
        });
      }
    }

    const nextBullets = [];
    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (
        bullet.x < -20 ||
        bullet.y < -20 ||
        bullet.x > ARENA_WIDTH + 20 ||
        bullet.y > ARENA_HEIGHT + 20
      ) {
        continue;
      }

      let hit = false;
      for (const target of this.players.values()) {
        if (!target.alive || target.id === bullet.ownerId) continue;
        const dist = Math.hypot(target.x - bullet.x, target.y - bullet.y);
        if (dist <= PLAYER_RADIUS + BULLET_RADIUS) {
          hit = true;
          target.alive = false;
          target.respawnAt = now + RESPAWN_MS;
          const killer = this.players.get(bullet.ownerId);
          if (killer) {
            killer.roundKills += 1;
            killer.totalKills += 1;
            if (killer.roundKills >= KILLS_TO_WIN) {
              this.endRound(killer);
            }
          }
          break;
        }
      }
      if (!hit && this.status === "playing") {
        nextBullets.push(bullet);
      }
    }
    this.bullets = nextBullets;

    this.emit("state", this.snapshot());
    this.emit("scoreUpdate", this.scorePayload());
  }

  endRound(winner) {
    if (this.status !== "playing") return;
    this.status = "roundEnd";
    winner.roundWins += 1;
    const p1 = this.playerBySlot(1);
    const p2 = this.playerBySlot(2);
    const roundRecord = {
      roundNumber: this.round,
      winnerName: winner.name,
      p1Kills: p1?.roundKills ?? 0,
      p2Kills: p2?.roundKills ?? 0,
    };
    this.roundHistory.push(roundRecord);
    this.bullets = [];

    this.emit("roundEnd", {
      ...roundRecord,
      roundWins: {
        p1: p1?.roundWins ?? 0,
        p2: p2?.roundWins ?? 0,
      },
      score: this.scorePayload(),
    });
    this.emit("scoreUpdate", this.scorePayload());
    this.emit("state", this.snapshot());

    if (this.round >= TOTAL_ROUNDS) {
      this.roundBreakTimer = setTimeout(() => this.completeMatch(), 1600);
      return;
    }

    this.roundBreakTimer = setTimeout(() => {
      this.round += 1;
      this.resetRoundPositions();
      this.status = "playing";
      this.emit("roundStart", this.scorePayload());
      this.emit("scoreUpdate", this.scorePayload());
    }, ROUND_BREAK_MS);
  }

  completeMatch() {
    const p1 = this.playerBySlot(1);
    const p2 = this.playerBySlot(2);
    let winnerName = "draw";
    if ((p1?.roundWins ?? 0) > (p2?.roundWins ?? 0)) winnerName = p1.name;
    else if ((p2?.roundWins ?? 0) > (p1?.roundWins ?? 0)) winnerName = p2.name;
    this.finishMatch(winnerName, "completed");
  }

  async finishMatch(winnerName, reason) {
    this.stopTick();
    this.status = "matchEnd";
    this.winnerName = winnerName;
    const p1 = this.playerBySlot(1);
    const p2 = this.playerBySlot(2);

    const payload = {
      reason,
      winnerName,
      rounds: this.roundHistory,
      score: this.scorePayload(),
    };
    this.emit("matchEnd", payload);
    this.emit("scoreUpdate", this.scorePayload());

    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB not connected — match result not saved.");
      return;
    }
    try {
      await Match.create({
        roomCode: this.code,
        players: [p1, p2].filter(Boolean).map((p) => ({
          name: p.name,
          color: p.color,
          roundWins: p.roundWins,
          totalKills: p.totalKills,
        })),
        rounds: this.roundHistory,
        winnerName,
        finishedAt: new Date(),
      });
    } catch (err) {
      console.warn("Failed to persist match:", err.message);
    }
  }
}

export function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
