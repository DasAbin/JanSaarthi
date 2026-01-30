export type SimplifyRequest = {
    filePath: string;
    originalName: string;
    language: string;
};
export type SimplifyResponse = {
    summary: string;
    eli10: string;
    keyPoints: string[];
    steps: string[];
    language: string;
    sourceFile: string;
    rawText?: string;
    ocrEngine?: string;
};
export declare class SimplifyService {
    private ocrService;
    private cleaner;
    private chunker;
    simplifyDocument(req: SimplifyRequest): Promise<SimplifyResponse>;
    /** One-shot LLM summary for long documents (>5 pages); no embeddings/RAG. */
    private oneShotSummary;
}
