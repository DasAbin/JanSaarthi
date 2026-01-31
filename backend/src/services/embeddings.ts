import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// This service is a thin abstraction around:
// - Gemini 1.5 Flash for generative reasoning / JSON outputs.
// - Sentence-transformers + ChromaDB for embeddings (TODO).

type GoogleModel = {
  name?: string; // e.g. "models/gemini-1.5-flash"
  supportedGenerationMethods?: string[]; // e.g. ["generateContent", ...]
  displayName?: string;
};

let cachedWorkingTextModel: string | null = null;

export class GeminiService {
  private apiKey = process.env.GEMINI_API_KEY || "";
  private preferredModel =
    process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private async listModelsViaRest(): Promise<GoogleModel[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
      this.apiKey
    )}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to list models: HTTP ${res.status}`);
    }
    const json = (await res.json()) as { models?: GoogleModel[] };
    return Array.isArray(json.models) ? json.models : [];
  }

  private scoreModelName(name: string): number {
    const n = name.toLowerCase();
    let score = 0;
    // Prefer "flash" for cost/speed, then "pro"
    if (n.includes("flash")) score += 100;
    if (n.includes("pro")) score += 60;
    // Prefer newer models if available
    if (n.includes("2.0")) score += 40;
    if (n.includes("1.5")) score += 30;
    // Penalize older/legacy
    if (n.includes("1.0") || n.includes("pro-vision")) score -= 10;
    return score;
  }

  private async getWorkingModelName(): Promise<string> {
    if (cachedWorkingTextModel) return cachedWorkingTextModel;

    const explicit = (this.preferredModel || "").trim();
    if (explicit) {
      try {
        const m = this.genAI!.getGenerativeModel({ model: explicit });
        await m.generateContent("ping");
        cachedWorkingTextModel = explicit;
        return explicit;
      } catch {
        // fall through to discovery
      }
    }

    const models = await this.listModelsViaRest();
    const candidates = models
      .filter((m) => {
        const methods = m.supportedGenerationMethods || [];
        return (
          typeof m.name === "string" && methods.includes("generateContent")
        );
      })
      .map((m) => String(m.name).replace(/^models\//, ""));

    if (candidates.length === 0) {
      cachedWorkingTextModel = explicit || "gemini-1.5-flash-latest";
      return cachedWorkingTextModel;
    }

    candidates.sort((a, b) => this.scoreModelName(b) - this.scoreModelName(a));
    cachedWorkingTextModel = candidates[0];
    return cachedWorkingTextModel;
  }

  async generateJson(prompt: string): Promise<string> {
    if (!this.apiKey || !this.genAI) {
      // No API key; return a generic dummy JSON object string.
      return JSON.stringify({
        summary: "AI summary will be available once Gemini API key is configured.",
        eli10: "This document contains information. Configure Gemini API to get detailed explanations.",
        keyPoints: ["Configure Gemini API key in .env file", "Add GEMINI_API_KEY=your_key"],
        steps: ["Set up API key", "Restart the server"]
      });
    }

    try {
      const modelName = await this.getWorkingModelName();
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      // Add instruction to return JSON
      const fullPrompt = `${prompt}\n\nImportant: Return ONLY valid JSON, no markdown, no code blocks, just the raw JSON object.`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to extract JSON from response (in case it's wrapped in markdown)
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      // Validate it's valid JSON
      JSON.parse(jsonText);
      return jsonText;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Gemini API error:", error);
      // Return fallback JSON on error
      return JSON.stringify({
        summary: "Error generating AI summary. Please check your API key and try again.",
        eli10: "Unable to process document with AI at this time.",
        keyPoints: ["API error occurred", "Check API key configuration"],
        steps: ["Verify API key", "Check API quota"]
      });
    }
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    // TODO: Use sentence-transformers or Gemini embeddings, then store in ChromaDB.
    return texts.map(() => [0, 0, 0]);
  }
}

