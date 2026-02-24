import fs from "fs/promises";
import { storagePath } from "../utils/storage";
import { askLLM } from "./llm";

export type Scheme = {
  id: string;
  name: string;
  description: string;
  eligibility_rules: string[];
  documents_required: string[];
  benefit: string;
  steps: string[];
  category?: string;
  state?: string;
};

export type UserProfile = {
  age?: number;
  gender?: string;
  income?: number;
  state?: string;
  district?: string;
  caste?: string;
  occupation?: string;
  rationCard?: string;
  disability?: boolean;
  married?: boolean;
  education?: string;
  landOwnership?: string;
  bplCard?: boolean;
  farmSize?: number;
};

export type EligibilityResult = {
  scheme: Scheme;
  score: number;
  eligible: boolean;
  reasons: string[];
  documentsNeeded: string[];
  howToApply: string[];
};

export class YojanaService {
  private schemes: Scheme[] = [];
  private schemesLoaded = false;

  private async loadSchemes(): Promise<void> {
    if (this.schemesLoaded) return;
    
    const schemesPath = storagePath("knowledge", "schemes.json");
    try {
      const data = await fs.readFile(schemesPath, "utf-8");
      const parsed = JSON.parse(data);
      this.schemes = Array.isArray(parsed) ? parsed : parsed.schemes || [];
      this.schemesLoaded = true;
      console.log(`[YojanaService] Loaded ${this.schemes.length} schemes`);
    } catch (error) {
      console.error("[YojanaService] Failed to load schemes:", error);
      this.schemes = [];
      this.schemesLoaded = true;
    }
  }

  async checkEligibility(profile: UserProfile): Promise<EligibilityResult[]> {
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

    // Single LLM call to score all schemes (stays within free-tier rate limit)
    try {
      const results = await this.scoreAllSchemesBatch(profile);
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, 5);
    } catch (error) {
      console.error("[YojanaService] Batch scoring failed, using rule-based fallback:", error);
    }

    // Fallback: rule-based scoring for all schemes
    const results: EligibilityResult[] = this.schemes.map((scheme) => {
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
    });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 5);
  }

  /** Score all schemes in one LLM call to avoid rate limits (e.g. 5 req/min free tier). */
  private async scoreAllSchemesBatch(profile: UserProfile): Promise<EligibilityResult[]> {
    const profileBlock = `User Profile:
- Age: ${profile.age ?? "Not specified"}
- Gender: ${profile.gender ?? "Not specified"}
- Annual Income: ₹${profile.income ?? "Not specified"}
- State: ${profile.state ?? "Not specified"}
- District: ${profile.district ?? "Not specified"}
- Caste Category: ${profile.caste ?? "Not specified"}
- Occupation: ${profile.occupation ?? "Not specified"}
- Ration Card Type: ${profile.rationCard ?? "Not specified"}
- Disability: ${profile.disability ? "Yes" : "No"}
- Married: ${profile.married ? "Yes" : "No"}
- Education: ${profile.education ?? "Not specified"}
- BPL Card: ${profile.bplCard ? "Yes" : "No"}
- Farm Size: ${profile.farmSize ?? "Not specified"} acres`;

    const schemesBlock = this.schemes
      .map(
        (s) =>
          `[${s.id}] ${s.name}\nEligibility: ${s.eligibility_rules.join("; ")}\nBenefit: ${s.benefit}`
      )
      .join("\n\n");

    const prompt = `You are an assistant helping Indian citizens find government schemes.
${profileBlock}

Schemes:
${schemesBlock}

For each scheme id, score eligibility 0–100 and explain briefly. Return a JSON array of objects with keys: "id", "score", "eligible", "reasons" (array of strings), "documentsNeeded" (array), "howToApply" (array). One object per scheme, same order as above. Return ONLY the JSON array, no other text.`;

    const resultStr = await askLLM(prompt, { json: true });
    const parsed = JSON.parse(resultStr) as Array<{
      id: string;
      score: number;
      eligible: boolean;
      reasons: string[];
      documentsNeeded: string[];
      howToApply: string[];
    }>;

    const schemeById = new Map(this.schemes.map((s) => [s.id, s]));
    const results: EligibilityResult[] = [];
    for (const item of parsed) {
      const scheme = schemeById.get(item.id);
      if (!scheme) continue;
      results.push({
        scheme,
        score: typeof item.score === "number" ? item.score : 50,
        eligible: item.eligible === true,
        reasons: Array.isArray(item.reasons) ? item.reasons : ["Analysis completed"],
        documentsNeeded: Array.isArray(item.documentsNeeded) ? item.documentsNeeded : scheme.documents_required,
        howToApply: Array.isArray(item.howToApply) ? item.howToApply : scheme.steps
      });
    }
    // If LLM skipped some schemes, add them with rule-based score
    for (const scheme of this.schemes) {
      if (results.some((r) => r.scheme.id === scheme.id)) continue;
      const score = this.simpleRuleMatch(profile, scheme);
      results.push({
        scheme,
        score,
        eligible: score >= 50,
        reasons: score >= 50 ? ["May be eligible based on basic criteria"] : ["May not meet all eligibility criteria"],
        documentsNeeded: scheme.documents_required,
        howToApply: scheme.steps
      });
    }
    return results;
  }

  private simpleRuleMatch(profile: UserProfile, scheme: Scheme): number {
    let score = 50; // Base score
    
    const rules = scheme.eligibility_rules.join(" ").toLowerCase();
    
    // Age checks
    if (profile.age) {
      if (rules.includes("senior") && profile.age >= 60) score += 20;
      if (rules.includes("youth") && profile.age >= 18 && profile.age <= 35) score += 15;
      if (rules.includes("woman") && profile.gender?.toLowerCase() === "female") score += 20;
    }
    
    // Income checks
    if (profile.income) {
      if (rules.includes("bpl") && profile.income < 100000) score += 15;
      if (rules.includes("below poverty") && profile.income < 50000) score += 20;
    }
    
    // Caste checks
    if (profile.caste) {
      const caste = profile.caste.toLowerCase();
      if (rules.includes("sc") && caste.includes("sc")) score += 10;
      if (rules.includes("st") && caste.includes("st")) score += 10;
      if (rules.includes("obc") && caste.includes("obc")) score += 10;
    }
    
    // Occupation checks
    if (profile.occupation) {
      const occ = profile.occupation.toLowerCase();
      if (rules.includes("farmer") && occ.includes("farmer")) score += 15;
      if (rules.includes("student") && occ.includes("student")) score += 15;
    }
    
    // Disability
    if (profile.disability && rules.includes("disability")) score += 20;
    
    // BPL
    if (profile.bplCard && rules.includes("bpl")) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }

  async getSchemeDetails(schemeId: string): Promise<Scheme | null> {
    await this.loadSchemes();
    return this.schemes.find((s) => s.id === schemeId) || null;
  }

  async listSchemes(): Promise<Pick<Scheme, "id" | "name" | "category">[]> {
    await this.loadSchemes();
    return this.schemes.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category || "General"
    }));
  }

  async compareSchemes(schemeIds: string[]): Promise<Scheme[]> {
    await this.loadSchemes();
    const ids = new Set(schemeIds);
    return this.schemes.filter((s) => ids.has(s.id)).slice(0, 5);
  }
}
