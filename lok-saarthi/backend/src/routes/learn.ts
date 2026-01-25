import { Router } from "express";
import path from "path";
import fs from "fs/promises";

export const learnRouter = Router();

learnRouter.get("/:moduleId", async (req, res) => {
  try {
    const { moduleId } = req.params;
    const modulePath = path.join(
      __dirname,
      "..",
      "storage",
      "knowledge",
      "modules",
      `${moduleId}.json`
    );

    const content = await fs.readFile(modulePath, "utf-8");
    const json = JSON.parse(content);
    return res.json(json);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/learn/:moduleId:", err);
    return res.status(404).json({ error: "Module not found" });
  }
});

