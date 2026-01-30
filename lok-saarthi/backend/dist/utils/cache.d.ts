export type CachedSimplifyResult = {
    summary: string;
    eli10: string;
    keyPoints: string[];
    steps: string[];
    language: string;
    sourceFile: string;
    rawText?: string;
    ocrEngine?: string;
    cachedAt: number;
};
/**
 * Hash file contents for cache key (SHA-256, first 16 chars).
 */
export declare function hashFile(filePath: string): Promise<string>;
/**
 * Get cached simplify result by file hash. Returns null if miss or expired (7 days).
 */
export declare function getCachedSimplify(hashKey: string): Promise<CachedSimplifyResult | null>;
/**
 * Store simplify result in cache by file hash.
 */
export declare function setCachedSimplify(hashKey: string, result: Omit<CachedSimplifyResult, "cachedAt">): Promise<void>;
