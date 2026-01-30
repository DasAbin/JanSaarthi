"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragService = exports.RagService = void 0;
const embeddings_1 = require("./embeddings");
const llm_1 = require("./llm");
/**
 * In-memory vector store with RAG capabilities
 * For production, replace with ChromaDB
 */
class RagService {
    constructor() {
        this.collections = new Map();
    }
    /**
     * Create or get a collection
     */
    getCollection(name) {
        if (!this.collections.has(name)) {
            this.collections.set(name, []);
        }
        return this.collections.get(name);
    }
    /**
     * Add chunks to a collection with embeddings
     */
    addChunks(collectionName, chunks, metadata) {
        const collection = this.getCollection(collectionName);
        for (const chunk of chunks) {
            const embedding = embeddings_1.embeddingService.embed(chunk.text);
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
    search(collectionName, query, topK = 5) {
        const collection = this.getCollection(collectionName);
        if (collection.length === 0)
            return [];
        const queryEmbedding = embeddings_1.embeddingService.embed(query);
        const scored = collection.map((chunk) => ({
            chunk,
            score: embeddings_1.embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding)
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
    /**
     * Clear a collection
     */
    clearCollection(name) {
        this.collections.delete(name);
    }
    /**
     * Summarize document from chunks using Gemini
     */
    async summarizeFromChunks(req) {
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
            const jsonStr = await (0, llm_1.askLLM)(prompt, { json: true, preferFast: true });
            const parsed = JSON.parse(jsonStr);
            return {
                summary: parsed.summary || "Summary not available.",
                eli10: parsed.eli10 || "Simple explanation not available.",
                keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
                steps: Array.isArray(parsed.steps) ? parsed.steps : []
            };
        }
        catch (error) {
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
    async answerQuestion(collectionName, question, language = "en") {
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
        return (0, llm_1.askLLM)(prompt);
    }
}
exports.RagService = RagService;
exports.ragService = new RagService();
//# sourceMappingURL=ragService.js.map