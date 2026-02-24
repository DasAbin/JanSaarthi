import { Router } from "express";
import { YojanaService, UserProfile } from "../services/yojanaService";

export const yojanaRouter = Router();
const yojana = new YojanaService();

/**
 * GET /api/yojana
 * List all available schemes
 */
yojanaRouter.get("/", async (_req, res) => {
  try {
    const schemes = await yojana.listSchemes();
    return res.json({ schemes });
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/yojana/:schemeId
 * Get details of a specific scheme
 */
yojanaRouter.get("/:schemeId", async (req, res) => {
  try {
    const { schemeId } = req.params;
    
    if (!schemeId || schemeId.trim() === "") {
      return res.status(400).json({ error: "schemeId is required" });
    }
    
    const scheme = await yojana.getSchemeDetails(schemeId);
    
    if (!scheme) {
      return res.status(404).json({ error: "Scheme not found" });
    }
    
    return res.json(scheme);
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/yojana/check
 * Check eligibility for schemes based on user profile
 */
/**
 * POST /api/yojana/compare
 * Compare multiple schemes side by side
 */
yojanaRouter.post("/compare", async (req, res) => {
  try {
    const { schemeIds } = req.body;
    if (!Array.isArray(schemeIds) || schemeIds.length === 0) {
      return res.status(400).json({ error: "schemeIds array is required" });
    }

    const schemes = await yojana.compareSchemes(schemeIds.map(String).slice(0, 5));
    return res.json({ schemes });
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

yojanaRouter.post("/check", async (req, res) => {
  try {
    const profile = req.body as UserProfile;
    
    if (!profile || typeof profile !== "object") {
      return res.status(400).json({ error: "User profile JSON is required in request body" });
    }
    
    // Validate at least some profile data is provided
    const hasData = profile.age || profile.gender || profile.income || 
                    profile.state || profile.occupation || profile.caste;
    
    if (!hasData) {
      return res.status(400).json({ 
        error: "Please provide at least one profile field (age, gender, income, state, occupation, or caste)" 
      });
    }
    
    const results = await yojana.checkEligibility(profile);
    
    return res.json({ 
      results,
      profileSummary: {
        age: profile.age,
        gender: profile.gender,
        state: profile.state,
        income: profile.income,
        caste: profile.caste,
        occupation: profile.occupation
      }
    });
  } catch (err) {
    console.error("[API ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
