import { geminiService } from "./geminiService";
export type EmbeddingResult = {
    text: string;
    embedding: number[];
};
/**
 * Simple in-memory embedding service using bag-of-words approach.
 * This is a lightweight fallback when sentence-transformers is not available.
 * For production, integrate sentence-transformers via Python subprocess.
 */
export declare class EmbeddingService {
    private vocabulary;
    private vocabSize;
    private maxVocabSize;
    /**
     * Generate simple word frequency based embedding
     * Returns normalized vector suitable for cosine similarity
     */
    embed(text: string): number[];
    /**
     * Embed multiple texts
     */
    embedBatch(texts: string[]): EmbeddingResult[];
    /**
     * Calculate cosine similarity between two embeddings
     */
    cosineSimilarity(a: number[], b: number[]): number;
    private tokenize;
    private hashString;
}
export { GeminiService } from "./geminiService";
export { geminiService };
export declare const embeddingService: EmbeddingService;
