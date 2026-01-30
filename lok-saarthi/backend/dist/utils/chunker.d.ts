export type Chunk = {
    id: string;
    text: string;
    tokenCount: number;
    startChar: number;
    endChar: number;
};
export type ChunkOptions = {
    minTokens?: number;
    maxTokens?: number;
    overlapTokens?: number;
};
export declare function estimateTokens(text: string): number;
export declare class Chunker {
    chunk(text: string, opts?: ChunkOptions): Chunk[];
    private takeLastTokens;
}
