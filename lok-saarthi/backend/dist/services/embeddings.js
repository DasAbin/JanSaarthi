"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingService = exports.geminiService = exports.GeminiService = exports.EmbeddingService = void 0;
const geminiService_1 = require("./geminiService");
Object.defineProperty(exports, "geminiService", { enumerable: true, get: function () { return geminiService_1.geminiService; } });
/**
 * Simple in-memory embedding service using bag-of-words approach.
 * This is a lightweight fallback when sentence-transformers is not available.
 * For production, integrate sentence-transformers via Python subprocess.
 */
class EmbeddingService {
    constructor() {
        this.vocabulary = new Map();
        this.vocabSize = 0;
        this.maxVocabSize = 10000;
    }
    /**
     * Generate simple word frequency based embedding
     * Returns normalized vector suitable for cosine similarity
     */
    embed(text) {
        const words = this.tokenize(text);
        const wordCounts = new Map();
        for (const word of words) {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            if (!this.vocabulary.has(word) && this.vocabSize < this.maxVocabSize) {
                this.vocabulary.set(word, this.vocabSize++);
            }
        }
        // Create sparse embedding (project to fixed dimensions for simplicity)
        const dim = 384; // same as all-MiniLM-L6-v2
        const embedding = new Array(dim).fill(0);
        for (const [word, count] of wordCounts.entries()) {
            const idx = this.vocabulary.get(word);
            if (idx !== undefined) {
                // Hash word to fixed dimension space
                const hashIdx = Math.abs(this.hashString(word)) % dim;
                embedding[hashIdx] += count / words.length;
            }
        }
        // L2 normalize
        const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0)) || 1;
        return embedding.map((v) => v / norm);
    }
    /**
     * Embed multiple texts
     */
    embedBatch(texts) {
        return texts.map((text) => ({
            text,
            embedding: this.embed(text)
        }));
    }
    /**
     * Calculate cosine similarity between two embeddings
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom > 0 ? dot / denom : 0;
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s\u0900-\u097F\u0980-\u09FF]/g, " ") // keep English, Hindi, Bengali chars
            .split(/\s+/)
            .filter((w) => w.length > 1);
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash;
    }
}
exports.EmbeddingService = EmbeddingService;
// Re-export GeminiService for backward compatibility
var geminiService_2 = require("./geminiService");
Object.defineProperty(exports, "GeminiService", { enumerable: true, get: function () { return geminiService_2.GeminiService; } });
exports.embeddingService = new EmbeddingService();
//# sourceMappingURL=embeddings.js.map