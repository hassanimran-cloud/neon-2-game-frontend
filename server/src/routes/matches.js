import { Router } from "express";
import { Match } from "../models/Match.js";

export const matchesRouter = Router();

matchesRouter.get("/", async (_req, res) => {
  try {
    const matches = await Match.find().sort({ finishedAt: -1 }).limit(20).lean();
    res.json(matches);
  } catch (err) {
    res.status(503).json({ error: "Match history unavailable", detail: err.message });
  }
});
