import { io } from "socket.io-client";

const url = process.env.VITE_SOCKET_URL || "http://localhost:3001";

function connect() {
  return new Promise((resolve, reject) => {
    const socket = io(url, { transports: ["websocket"] });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
    setTimeout(() => reject(new Error("connect timeout")), 5000);
  });
}

function ack(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (!res?.ok) reject(new Error(res?.error || event));
      else resolve(res);
    });
  });
}

function waitFor(socket, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${event}`)), timeout);
    socket.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

const a = await connect();
const b = await connect();
const created = await ack(a, "createRoom", { name: "Alpha" });
await ack(b, "joinRoom", { code: created.code, name: "Bravo" });

const started = waitFor(a, "gameStart");
a.emit("playerReady", { ready: true });
b.emit("playerReady", { ready: true });
const start = await started;

let snapshots = 0;
a.on("state", () => {
  snapshots += 1;
});

a.emit("playerInput", { right: true, aim: 0, fire: true });
await new Promise((r) => setTimeout(r, 400));
const score = await new Promise((resolve) => {
  a.once("scoreUpdate", resolve);
  a.emit("playerInput", { fire: true, aim: 0 });
});

a.close();
b.close();

console.log(
  JSON.stringify(
    {
      room: created.code,
      players: created.players?.length,
      gameStart: Boolean(start),
      snapshots,
      round: score.round,
      status: score.status,
    },
    null,
    2
  )
);

if (!start || snapshots < 1) process.exitCode = 1;
