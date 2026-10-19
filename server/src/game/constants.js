export const ARENA_WIDTH = 1280;
export const ARENA_HEIGHT = 720;
export const PLAYER_RADIUS = 18;
export const PLAYER_SPEED = 280;
export const BULLET_SPEED = 640;
export const BULLET_RADIUS = 5;
export const FIRE_COOLDOWN_MS = 180;
export const TICK_RATE = 30;
export const TICK_MS = 1000 / TICK_RATE;
export const KILLS_TO_WIN = 20;
export const TOTAL_ROUNDS = 4;
export const RESPAWN_MS = 900;
export const ROUND_BREAK_MS = 4000;
export const PLAYER_COLORS = {
  1: "#ff2d6a",
  2: "#39ff14",
};
export const SPAWNS = {
  1: { x: 180, y: ARENA_HEIGHT / 2 },
  2: { x: ARENA_WIDTH - 180, y: ARENA_HEIGHT / 2 },
};
