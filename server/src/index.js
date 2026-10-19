import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";
import { connectDb } from "./config/db.js";
import { matchesRouter } from "./routes/matches.js";
import { registerSockets } from "./sockets/index.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api/matches", matchesRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

registerSockets(io);

await connectDb(process.env.MONGODB_URI);

server.listen(PORT, () => {
  console.log(`Arena server listening on http://localhost:${PORT}`);
});
