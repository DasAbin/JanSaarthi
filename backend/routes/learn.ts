import { Router } from "express";
import { LearnService } from "../services/learnService";

export const learnRouter = Router();
const learn = new LearnService();

/**
 * GET /api/learn
 * List all available learning modules
 */
learnRouter.get("/", async (_req, res) => {
  try {
    const modules = await learn.listModules();
    return res.json({ modules });
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/learn/:moduleId
 * Get a specific learning module with all lessons
 */
learnRouter.get("/:moduleId", async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    if (!moduleId || moduleId.trim() === "") {
      return res.status(400).json({ error: "moduleId is required" });
    }
    
    const mod = await learn.getModule(moduleId);
    return res.json(mod);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
