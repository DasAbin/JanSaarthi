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
export declare class RagService {
    private collections;
    /**
     * Create or get a collection
     */
    getCollection(name: string): StoredChunk[];
    /**
     * Add chunks to a collection with embeddings
     */
    addChunks(collectionName: string, chunks: Chunk[], metadata?: Record<string, unknown>): void;
    /**
     * Search for similar chunks
     */
    search(collectionName: string, query: string, topK?: number): SearchResult[];
    /**
     * Clear a collection
     */
    clearCollection(name: string): void;
    /**
     * Summarize document from chunks using Gemini
     */
    summarizeFromChunks(req: SummarizeFromChunksRequest): Promise<SummarizeFromChunksResponse>;
    /**
     * Answer a question based on stored context
     */
    answerQuestion(collectionName: string, question: string, language?: string): Promise<string>;
}
export declare const ragService: RagService;
