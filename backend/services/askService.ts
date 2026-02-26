import fs from "fs/promises";
import { storagePath } from "../utils/storage";
import { askLLM } from "./llm";
import { languageInstruction } from "../utils/language";

export type AskRequest = {
  question: string;
  language?: string;
  userProfile?: Record<string, unknown>;
};

export type AskResponse = {
  answer: string;
  sources?: { schemeId?: string; schemeName?: string; excerpt?: string }[];
};

export class AskService {
  private schemes: Array<Record<string, unknown>> = [];
  private loaded = false;

  private async loadSchemes(): Promise<void> {
    if (this.loaded) return;
    try {
      const p = storagePath("knowledge", "schemes.json");
      const raw = await fs.readFile(p, "utf-8");
      const parsed = JSON.parse(raw);
      this.schemes = Array.isArray(parsed) ? parsed : parsed.schemes || [];
      this.loaded = true;
    } catch {
      this.schemes = [];
      this.loaded = true;
    }
  }

  async ask(req: AskRequest): Promise<AskResponse> {
    const { question, language = "en", userProfile } = req;

    await this.loadSchemes();

    const langInstr = languageInstruction(language);

    const schemesContext = this.schemes
      .slice(0, 15)
      .map(
        (s: Record<string, unknown>) =>
          `- ${s.name}: ${s.description}. Benefits: ${s.benefit}. Eligibility: ${Array.isArray(s.eligibility_rules) ? s.eligibility_rules.join("; ") : ""}`
      )
      .join("\n");

    const profileStr = userProfile
      ? `\nUser profile (use for personalized advice): ${JSON.stringify(userProfile)}`
      : "";

    const prompt = `You are JanSaarthi, an AI assistant helping Indian citizens understand government schemes and civic services.
${langInstr}
${profileStr}

Available schemes:
${schemesContext}

Question: ${question}

Answer clearly and helpfully. If the question is about eligibility or a specific scheme, mention the scheme name and give practical steps. Keep it simple for rural citizens. If you cannot find relevant information, say so politely and suggest visiting a CSC or government office for detailed help.

Respond in 2-4 short paragraphs.`;

    try {
      const answer = await askLLM(prompt, { preferFast: true });
      const sources = this.schemes
        .filter(
          (s) =>
            question.toLowerCase().includes((s.name as string)?.toLowerCase() || "") ||
            (s.name as string)?.toLowerCase().includes(question.toLowerCase().slice(0, 20))
        )
        .slice(0, 3)
        .map((s) => ({
          schemeId: s.id as string,
          schemeName: s.name as string,
          excerpt: (s.description as string)?.slice(0, 150)
        }));

      return { answer: answer.trim(), sources: sources.length > 0 ? sources : undefined };
    } catch (e) {
      console.error("[AskService] Error:", e);
      return {
        answer: "Sorry, I couldn't process your question right now. Please try again or check your connection.",
        sources: []
      };
    }
  }
}
