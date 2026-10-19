import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, required: true },
    roundWins: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 },
  },
  { _id: false }
);

const roundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true },
    winnerName: { type: String, required: true },
    p1Kills: { type: Number, required: true },
    p2Kills: { type: Number, required: true },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, index: true },
  players: { type: [playerSchema], required: true },
  rounds: { type: [roundSchema], default: [] },
  winnerName: { type: String, required: true },
  finishedAt: { type: Date, default: Date.now },
});

export const Match = mongoose.model("Match", matchSchema);
