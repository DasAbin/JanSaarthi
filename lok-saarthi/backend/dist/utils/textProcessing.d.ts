/**
 * Text processing utilities for document analysis
 */
/**
 * Normalize whitespace and line breaks
 */
export declare function normalizeText(text: string): string;
/**
 * Remove common document artifacts
 */
export declare function removeArtifacts(text: string): string;
/**
 * Extract sentences from text
 */
export declare function extractSentences(text: string): string[];
/**
 * Detect language based on script
 */
export declare function detectLanguage(text: string): "en" | "hi" | "mr" | "unknown";
/**
 * Truncate text to approximate token limit
 */
export declare function truncateToTokens(text: string, maxTokens: number): string;
/**
 * Extract key phrases from text (simple approach)
 */
export declare function extractKeyPhrases(text: string, maxPhrases?: number): string[];
/**
 * Format text for display (add proper spacing)
 */
export declare function formatForDisplay(text: string): string;
