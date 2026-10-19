import { GameRoom } from "../src/game/GameRoom.js";
import { KILLS_TO_WIN, TOTAL_ROUNDS } from "../src/game/constants.js";

class FakeIo {
  constructor() {
    this.events = [];
  }
  to() {
    return {
      emit: (event, payload) => {
        this.events.push({ event, payload });
      },
    };
  }
}

let now = 1_000_000;
const realNow = Date.now;
Date.now = () => now;

const io = new FakeIo();
const room = new GameRoom("TEST01", io);
room.addPlayer("p1", "Red");
room.addPlayer("p2", "Green");
room.setReady("p1", true);
room.setReady("p2", true);
room.stopTick();

function fireUntilRoundOver(attackerId) {
  const attacker = room.players.get(attackerId);
  const defender = [...room.players.values()].find((p) => p.id !== attackerId);
  for (let i = 0; i < KILLS_TO_WIN + 2 && room.status === "playing"; i += 1) {
    defender.x = attacker.x + 70;
    defender.y = attacker.y;
    defender.alive = true;
    room.setInput(attackerId, { fire: true, aim: 0 });
    now += 200;
    attacker.lastFire = 0;
    room.tick();
    now += 50;
    room.tick();
    now += 50;
    room.tick();
  }
}

for (let round = 1; round <= TOTAL_ROUNDS; round += 1) {
  if (room.status === "roundEnd") {
    room.round += 1;
    room.resetRoundPositions();
    room.status = "playing";
  }
  const attacker = round % 2 === 1 ? "p1" : "p2";
  fireUntilRoundOver(attacker);
}

if (room.status === "roundEnd") {
  await room.completeMatch();
}

Date.now = realNow;

const p1 = room.playerBySlot(1);
const p2 = room.playerBySlot(2);
console.log(
  JSON.stringify(
    {
      status: room.status,
      winner: room.winnerName,
      rounds: room.roundHistory.length,
      p1: { kills: p1.totalKills, wins: p1.roundWins },
      p2: { kills: p2.totalKills, wins: p2.roundWins },
    },
    null,
    2
  )
);

if (room.status !== "matchEnd" || room.roundHistory.length !== 4) {
  process.exitCode = 1;
}
