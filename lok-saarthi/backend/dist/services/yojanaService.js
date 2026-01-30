"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YojanaService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const storage_1 = require("../utils/storage");
const llm_1 = require("./llm");
class YojanaService {
    constructor() {
        this.schemes = [];
        this.schemesLoaded = false;
    }
    async loadSchemes() {
        if (this.schemesLoaded)
            return;
        const schemesPath = (0, storage_1.storagePath)("knowledge", "schemes.json");
        try {
            const data = await promises_1.default.readFile(schemesPath, "utf-8");
            const parsed = JSON.parse(data);
            this.schemes = Array.isArray(parsed) ? parsed : parsed.schemes || [];
            this.schemesLoaded = true;
            console.log(`[YojanaService] Loaded ${this.schemes.length} schemes`);
        }
        catch (error) {
            console.error("[YojanaService] Failed to load schemes:", error);
            this.schemes = [];
            this.schemesLoaded = true;
        }
    }
    async checkEligibility(profile) {
        await this.loadSchemes();
        if (this.schemes.length === 0) {
            return [{
                    scheme: {
                        id: "none",
                        name: "No schemes available",
                        description: "Schemes database not loaded",
                        eligibility_rules: [],
                        documents_required: [],
                        benefit: "",
                        steps: []
                    },
                    score: 0,
                    eligible: false,
                    reasons: ["Schemes database not configured"],
                    documentsNeeded: [],
                    howToApply: []
                }];
        }
        // Use Gemini to score eligibility for each scheme
        const results = [];
        for (const scheme of this.schemes) {
            const result = await this.scoreScheme(profile, scheme);
            results.push(result);
        }
        // Sort by score descending and return top 5
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 5);
    }
    async scoreScheme(profile, scheme) {
        const prompt = `Given this user profile and this scheme eligibility, score eligibility 0–100. Explain briefly why eligible or not. Return JSON only.

User Profile:
- Age: ${profile.age || "Not specified"}
- Gender: ${profile.gender || "Not specified"}
- Annual Income: ₹${profile.income || "Not specified"}
- State: ${profile.state || "Not specified"}
- District: ${profile.district || "Not specified"}
- Caste Category: ${profile.caste || "Not specified"}
- Occupation: ${profile.occupation || "Not specified"}
- Ration Card Type: ${profile.rationCard || "Not specified"}
- Disability: ${profile.disability ? "Yes" : "No"}
- Married: ${profile.married ? "Yes" : "No"}
- Education: ${profile.education || "Not specified"}
- BPL Card: ${profile.bplCard ? "Yes" : "No"}
- Farm Size: ${profile.farmSize || "Not specified"} acres

Scheme:
Name: ${scheme.name}
Description: ${scheme.description}
Eligibility Rules: ${scheme.eligibility_rules.join("; ")}
Benefits: ${scheme.benefit}

Return only this JSON (no other text):
{
  "score": <0-100 number>,
  "eligible": <true or false>,
  "reasons": ["brief reason 1", "reason 2", "reason 3"],
  "documentsNeeded": ["Document 1", "Document 2"],
  "howToApply": ["Step 1", "Step 2"]
}`;
        try {
            const resultStr = await (0, llm_1.askLLM)(prompt, { json: true });
            const result = JSON.parse(resultStr);
            return {
                scheme,
                score: typeof result.score === "number" ? result.score : 50,
                eligible: result.eligible === true,
                reasons: Array.isArray(result.reasons) ? result.reasons : ["Analysis completed"],
                documentsNeeded: Array.isArray(result.documentsNeeded)
                    ? result.documentsNeeded
                    : scheme.documents_required,
                howToApply: Array.isArray(result.howToApply)
                    ? result.howToApply
                    : scheme.steps
            };
        }
        catch (error) {
            console.error(`[YojanaService] Error scoring scheme ${scheme.id}:`, error);
            // Fallback: Simple rule-based matching
            const score = this.simpleRuleMatch(profile, scheme);
            return {
                scheme,
                score,
                eligible: score >= 50,
                reasons: score >= 50
                    ? ["May be eligible based on basic criteria"]
                    : ["May not meet all eligibility criteria"],
                documentsNeeded: scheme.documents_required,
                howToApply: scheme.steps
            };
        }
    }
    simpleRuleMatch(profile, scheme) {
        let score = 50; // Base score
        const rules = scheme.eligibility_rules.join(" ").toLowerCase();
        // Age checks
        if (profile.age) {
            if (rules.includes("senior") && profile.age >= 60)
                score += 20;
            if (rules.includes("youth") && profile.age >= 18 && profile.age <= 35)
                score += 15;
            if (rules.includes("woman") && profile.gender?.toLowerCase() === "female")
                score += 20;
        }
        // Income checks
        if (profile.income) {
            if (rules.includes("bpl") && profile.income < 100000)
                score += 15;
            if (rules.includes("below poverty") && profile.income < 50000)
                score += 20;
        }
        // Caste checks
        if (profile.caste) {
            const caste = profile.caste.toLowerCase();
            if (rules.includes("sc") && caste.includes("sc"))
                score += 10;
            if (rules.includes("st") && caste.includes("st"))
                score += 10;
            if (rules.includes("obc") && caste.includes("obc"))
                score += 10;
        }
        // Occupation checks
        if (profile.occupation) {
            const occ = profile.occupation.toLowerCase();
            if (rules.includes("farmer") && occ.includes("farmer"))
                score += 15;
            if (rules.includes("student") && occ.includes("student"))
                score += 15;
        }
        // Disability
        if (profile.disability && rules.includes("disability"))
            score += 20;
        // BPL
        if (profile.bplCard && rules.includes("bpl"))
            score += 15;
        return Math.min(100, Math.max(0, score));
    }
    async getSchemeDetails(schemeId) {
        await this.loadSchemes();
        return this.schemes.find((s) => s.id === schemeId) || null;
    }
    async listSchemes() {
        await this.loadSchemes();
        return this.schemes.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category || "General"
        }));
    }
}
exports.YojanaService = YojanaService;
//# sourceMappingURL=yojanaService.js.map