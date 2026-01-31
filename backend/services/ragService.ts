import { embeddingService } from "./embeddings";
import { askLLM } from "./llm";
import { Chunk } from "../utils/chunker";

export type StoredChunk = {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
};

export type SearchResult = {
  chunk: StoredChunk;
  score: number;
};

export type SummarizeFromChunksRequest = {
  chunks: Chunk[];
  originalText: string;
  language: string;
  documentName?: string;
};

export type SummarizeFromChunksResponse = {
  summary: string;
  eli10: string;
  keyPoints: string[];
  steps: string[];
};

/**
 * In-memory vector store with RAG capabilities
 * For production, replace with ChromaDB
 */
export class RagService {
  private collections = new Map<string, StoredChunk[]>();

  /**
   * Create or get a collection
   */
  getCollection(name: string): StoredChunk[] {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
    return this.collections.get(name)!;
  }

  /**
   * Add chunks to a collection with embeddings
   */
  addChunks(
    collectionName: string,
    chunks: Chunk[],
    metadata?: Record<string, unknown>
  ): void {
    const collection = this.getCollection(collectionName);
    
    for (const chunk of chunks) {
      const embedding = embeddingService.embed(chunk.text);
      collection.push({
        id: chunk.id,
        text: chunk.text,
        embedding,
        metadata
      });
    }
  }

  /**
   * Search for similar chunks
   */
  search(
    collectionName: string,
    query: string,
    topK: number = 5
  ): SearchResult[] {
    const collection = this.getCollection(collectionName);
    if (collection.length === 0) return [];

    const queryEmbedding = embeddingService.embed(query);
    
    const scored = collection.map((chunk) => ({
      chunk,
      score: embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Clear a collection
   */
  clearCollection(name: string): void {
    this.collections.delete(name);
  }

  /**
   * Summarize document from chunks using Gemini
   */
  async summarizeFromChunks(req: SummarizeFromChunksRequest): Promise<SummarizeFromChunksResponse> {
    const { chunks, originalText, language, documentName } = req;

    // Build context from chunks (limit to avoid token overflow)
    const contextChunks = chunks.slice(0, 5);
    const context = contextChunks.map((c) => c.text).join("\n\n---\n\n");
    const truncatedText = originalText.slice(0, 8000);

    const languageInstruction = language === "hi" 
      ? "Respond in Hindi (हिंदी में जवाब दें)."
      : language === "mr"
        ? "Respond in Marathi (मराठी मध्ये उत्तर द्या)."
        : "Respond in simple English.";

    const prompt = `You are a helpful assistant that simplifies government documents for rural citizens.
${languageInstruction}

Document: ${documentName || "Government Document"}

Full text excerpt:
${truncatedText}

Key sections:
${context}

Generate a JSON response with these fields:
{
  "summary": "A clear 2-3 sentence summary of what this document is about",
  "eli10": "Explain the document as if talking to a 10-year-old villager, using simple words and examples",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "steps": ["Step 1: What to do first", "Step 2: Next action", "Step 3: etc."]
}

Make the explanation practical and actionable. Focus on what matters to a common citizen.`;

    try {
      const jsonStr = await askLLM(prompt, { json: true, preferFast: true });
      const parsed = JSON.parse(jsonStr) as SummarizeFromChunksResponse;
      
      return {
        summary: parsed.summary || "Summary not available.",
        eli10: parsed.eli10 || "Simple explanation not available.",
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : []
      };
    } catch (error) {
      console.error("RAG summarization error:", error);
      return {
        summary: "Unable to generate summary. Please try again.",
        eli10: "Sorry, I couldn't explain this document right now.",
        keyPoints: ["Document processing failed"],
        steps: ["Please try uploading again"]
      };
    }
  }

  /**
   * Answer a question based on stored context
   */
  async answerQuestion(
    collectionName: string,
    question: string,
    language: string = "en"
  ): Promise<string> {
    const results = this.search(collectionName, question, 3);
    
    if (results.length === 0) {
      return "No relevant information found.";
    }

    const context = results.map((r) => r.chunk.text).join("\n\n");
    
    const languageInstruction = language === "hi" 
      ? "Answer in Hindi (हिंदी में जवाब दें)."
      : language === "mr"
        ? "Answer in Marathi (मराठी मध्ये उत्तर द्या)."
        : "Answer in simple English.";

    const prompt = `Based on the following context, answer the question.
${languageInstruction}

Context:
${context}

Question: ${question}

Provide a clear, helpful answer based only on the context provided.`;

    return askLLM(prompt);
  }
}

export const ragService = new RagService();
