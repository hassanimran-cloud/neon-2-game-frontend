import { createRoomCode, GameRoom } from "../game/GameRoom.js";

const rooms = new Map();

function findRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return null;
}

export function registerSockets(io) {
  io.on("connection", (socket) => {
    socket.on("createRoom", ({ name } = {}, ack) => {
      try {
        let code = createRoomCode();
        while (rooms.has(code)) code = createRoomCode();
        const room = new GameRoom(code, io);
        room.addPlayer(socket.id, name);
        rooms.set(code, room);
        socket.join(code);
        const payload = room.lobbyPayload();
        socket.emit("roomCreated", payload);
        io.to(code).emit("lobbyUpdate", payload);
        ack?.({ ok: true, ...payload });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("joinRoom", ({ code, name } = {}, ack) => {
      try {
        const room = rooms.get(String(code || "").toUpperCase());
        if (!room) throw new Error("Room not found");
        room.addPlayer(socket.id, name);
        socket.join(room.code);
        const payload = room.lobbyPayload();
        io.to(room.code).emit("lobbyUpdate", payload);
        ack?.({ ok: true, ...payload });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("playerReady", ({ ready } = {}) => {
      const room = findRoomBySocket(socket.id);
      if (!room) return;
      room.setReady(socket.id, ready !== false);
      io.to(room.code).emit("lobbyUpdate", room.lobbyPayload());
    });

    socket.on("playerInput", (input = {}) => {
      const room = findRoomBySocket(socket.id);
      if (!room) return;
      room.setInput(socket.id, input);
    });

    socket.on("disconnect", () => {
      const room = findRoomBySocket(socket.id);
      if (!room) return;
      room.removePlayer(socket.id);
      if (room.players.size === 0) {
        room.stopTick();
        rooms.delete(room.code);
        return;
      }
      io.to(room.code).emit("lobbyUpdate", room.lobbyPayload());
      if (room.status === "matchEnd") {
        io.to(room.code).emit("opponentLeft", { message: "Opponent disconnected." });
      }
    });
  });
}
