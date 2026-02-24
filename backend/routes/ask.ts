import { Router } from "express";
import { AskService } from "../services/askService";

export const askRouter = Router();
const askService = new AskService();

askRouter.post("/", async (req, res) => {
  try {
    const { question, language, userProfile } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question is required" });
    }

    const result = await askService.ask({
      question: question.trim(),
      language: language || "en",
      userProfile
    });

    return res.json(result);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
