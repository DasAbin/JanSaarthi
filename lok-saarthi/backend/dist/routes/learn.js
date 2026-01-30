"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learnRouter = void 0;
const express_1 = require("express");
const learnService_1 = require("../services/learnService");
exports.learnRouter = (0, express_1.Router)();
const learn = new learnService_1.LearnService();
/**
 * GET /api/learn
 * List all available learning modules
 */
exports.learnRouter.get("/", async (_req, res) => {
    try {
        const modules = await learn.listModules();
        return res.json({ modules });
    }
    catch (err) {
        console.error("[API ERROR]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
/**
 * GET /api/learn/:moduleId
 * Get a specific learning module with all lessons
 */
exports.learnRouter.get("/:moduleId", async (req, res) => {
    try {
        const { moduleId } = req.params;
        if (!moduleId || moduleId.trim() === "") {
            return res.status(400).json({ error: "moduleId is required" });
        }
        const mod = await learn.getModule(moduleId);
        return res.json(mod);
    }
    catch (err) {
        console.error("[API ERROR]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=learn.js.map