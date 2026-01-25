import path from "path";
import fs from "fs/promises";
import { GeminiService } from "./embeddings"; // will expose LLM helper as well

export interface UserProfile {
  name?: string;
  age?: number;
  gender?: string;
  income?: number;
  state?: string;
  occupation?: string;
  caste?: string;
  disability?: string;
  [key: string]: unknown;
}

export interface Scheme {
  id: string;
  name: string;
  description: string;
  eligibility_rules: string;
  documents_required: string[];
  benefit: string;
  steps: string[];
}

export interface YojanaResult {
  scheme: Scheme;
  score: number;
  explanation: string;
}

export class YojanaService {
  private schemesCache: Scheme[] | null = null;
  private gemini = new GeminiService();

  private async loadSchemes(): Promise<Scheme[]> {
    if (this.schemesCache) return this.schemesCache;
    const schemesPath = path.join(
      __dirname,
      "..",
      "storage",
      "knowledge",
      "schemes.json"
    );
    const data = await fs.readFile(schemesPath, "utf-8");
    this.schemesCache = JSON.parse(data) as Scheme[];
    return this.schemesCache;
  }

  async checkEligibility(profile: UserProfile): Promise<YojanaResult[]> {
    const schemes = await this.loadSchemes();

    // Use LLM to reason about eligibility. For now, we use a simple heuristic
    // plus a TODO Gemini call stub.
    const prompt = `
You are an assistant helping Indian citizens find government schemes.
User profile: ${JSON.stringify(profile, null, 2)}

Schemes:
${schemes
  .map(
    (s) =>
      `- [${s.id}] ${s.name}\nEligibility: ${s.eligibility_rules}\nBenefit: ${s.benefit}`
  )
  .join("\n\n")}

Return a JSON array of at most 3 objects:
[{ "id": string, "score": number (0-1), "explanation": string }]
sorted by score descending, explaining why the user is or is not eligible.
`;

    const llmRaw = await this.gemini.generateJson(prompt);

    let parsed: { id: string; score: number; explanation: string }[] = [];
    try {
      parsed = JSON.parse(llmRaw);
    } catch {
      // Fallback: naive scoring
      parsed = schemes.slice(0, 3).map((s, idx) => ({
        id: s.id,
        score: 0.5 - idx * 0.1,
        explanation:
          "Fallback heuristic scoring because LLM response could not be parsed."
      }));
    }

    const mapped: YojanaResult[] = parsed
      .map((p) => {
        const scheme = schemes.find((s) => s.id === p.id);
        if (!scheme) return null;
        return {
          scheme,
          score: p.score,
          explanation: p.explanation
        };
      })
      .filter((x): x is YojanaResult => Boolean(x));

    return mapped.slice(0, 3);
  }
}

