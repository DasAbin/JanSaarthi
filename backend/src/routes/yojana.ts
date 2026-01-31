import { Router } from "express";
import { YojanaService } from "../services/yojanaService";

export const yojanaRouter = Router();
const yojanaService = new YojanaService();

yojanaRouter.post("/check", async (req, res) => {
  try {
    const profile = req.body;
    const result = await yojanaService.checkEligibility(profile);
    return res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/yojana/check:", err);
    return res.status(500).json({ error: "Failed to evaluate schemes" });
  }
});

