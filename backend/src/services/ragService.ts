import { GeminiService } from "./embeddings";

export interface IndexDocumentRequest {
  documentId: string;
  chunks: string[];
  metadata?: Record<string, unknown>;
}

export interface SummarizeFromChunksRequest {
  chunks: string[];
  language: string;
}

export interface SummarizeFromChunksResponse {
  summary: string;
  eli10: string;
  keyPoints: string[];
  steps: string[];
}

// NOTE: This is a light abstraction over ChromaDB and embeddings.
// For now, it mocks vector storage and focuses on prompting Gemini correctly.

export class RagService {
  private gemini = new GeminiService();

  // TODO: Replace with real ChromaDB persistence and sentence-transformer embeddings.
  async indexDocument(_req: IndexDocumentRequest): Promise<void> {
    // Intentionally a no-op placeholder.
  }

  async summarizeFromChunks(
    req: SummarizeFromChunksRequest
  ): Promise<SummarizeFromChunksResponse> {
    const joined = req.chunks.join("\n\n");

    const prompt = `
You are helping Indian citizens understand an official document.
Write in very simple, clear language suitable for someone with basic literacy.
Prefer ${req.language} language, but you may include short English terms where needed.

Document:
${joined}

Return a JSON object:
{
  "summary": string,
  "eli10": string,
  "keyPoints": string[],
  "steps": string[]
}
`;

    const llmRaw = await this.gemini.generateJson(prompt);

    try {
      const parsed = JSON.parse(llmRaw) as SummarizeFromChunksResponse;
      // Ensure keyPoints and steps are always arrays
      return {
        summary: parsed.summary || "Summary not available.",
        eli10: parsed.eli10 || "Explanation not available.",
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : []
      };
    } catch {
      return {
        summary:
          "Could not parse AI summary. This is a fallback placeholder summary.",
        eli10:
          "This document talks about some government rules. The AI summary will work once Gemini is configured.",
        keyPoints: [
          "Setup of Gemini API is pending",
          "Once configured, you will get real summaries here"
        ],
        steps: [
          "Collect all required documents.",
          "Visit your nearest government office or online portal."
        ]
      };
    }
  }
}

