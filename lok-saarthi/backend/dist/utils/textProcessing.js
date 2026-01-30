"use strict";
/**
 * Text processing utilities for document analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.removeArtifacts = removeArtifacts;
exports.extractSentences = extractSentences;
exports.detectLanguage = detectLanguage;
exports.truncateToTokens = truncateToTokens;
exports.extractKeyPhrases = extractKeyPhrases;
exports.formatForDisplay = formatForDisplay;
/**
 * Normalize whitespace and line breaks
 */
function normalizeText(text) {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[\t ]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
/**
 * Remove common document artifacts
 */
function removeArtifacts(text) {
    let result = text;
    // Remove page numbers
    result = result.replace(/\bPage\s*\d+\s*(of\s*\d+)?\b/gi, "");
    result = result.replace(/^\s*\d+\s*$/gm, "");
    // Remove common header/footer patterns
    result = result.replace(/^(Government of India|भारत सरकार).*$/gim, "");
    result = result.replace(/^(Ministry of|विभाग).*$/gim, "");
    // Remove excessive punctuation
    result = result.replace(/[.]{3,}/g, "...");
    result = result.replace(/[-_=]{3,}/g, "---");
    return normalizeText(result);
}
/**
 * Extract sentences from text
 */
function extractSentences(text) {
    const normalized = normalizeText(text);
    // Split on sentence boundaries
    const sentences = normalized
        .split(/(?<=[.!?।॥])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
    return sentences;
}
/**
 * Detect language based on script
 */
function detectLanguage(text) {
    const sample = text.slice(0, 1000);
    // Count Devanagari characters
    const devanagariCount = (sample.match(/[\u0900-\u097F]/g) || []).length;
    // Count Latin characters
    const latinCount = (sample.match(/[a-zA-Z]/g) || []).length;
    const total = devanagariCount + latinCount;
    if (total === 0)
        return "unknown";
    const devanagariRatio = devanagariCount / total;
    if (devanagariRatio > 0.5) {
        // Could be Hindi or Marathi - check for common Marathi words
        const marathiPatterns = /आहे|आहेत|नाही|असते|करणे|होते/;
        if (marathiPatterns.test(sample))
            return "mr";
        return "hi";
    }
    if (latinCount > devanagariCount)
        return "en";
    return "unknown";
}
/**
 * Truncate text to approximate token limit
 */
function truncateToTokens(text, maxTokens) {
    // Rough estimate: 1 token ≈ 4 characters for English, 2 for Indic
    const hasIndic = /[\u0900-\u097F]/.test(text);
    const charsPerToken = hasIndic ? 2 : 4;
    const maxChars = maxTokens * charsPerToken;
    if (text.length <= maxChars)
        return text;
    // Try to truncate at sentence boundary
    const truncated = text.slice(0, maxChars);
    const lastSentence = truncated.lastIndexOf("।") >= 0
        ? truncated.lastIndexOf("।")
        : truncated.lastIndexOf(".");
    if (lastSentence > maxChars * 0.8) {
        return truncated.slice(0, lastSentence + 1);
    }
    return truncated + "...";
}
/**
 * Extract key phrases from text (simple approach)
 */
function extractKeyPhrases(text, maxPhrases = 10) {
    const words = text
        .toLowerCase()
        .replace(/[^\w\s\u0900-\u097F]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3);
    // Count word frequencies
    const freq = new Map();
    for (const word of words) {
        freq.set(word, (freq.get(word) || 0) + 1);
    }
    // Filter out common stop words
    const stopWords = new Set([
        "the", "and", "for", "that", "this", "with", "from", "have", "will", "are", "was", "were",
        "been", "being", "has", "had", "does", "did", "doing", "would", "could", "should",
        "का", "की", "के", "है", "हैं", "में", "से", "को", "पर", "और", "या", "एक", "इस", "उस"
    ]);
    // Sort by frequency and filter
    const sorted = [...freq.entries()]
        .filter(([word]) => !stopWords.has(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxPhrases)
        .map(([word]) => word);
    return sorted;
}
/**
 * Format text for display (add proper spacing)
 */
function formatForDisplay(text) {
    let result = normalizeText(text);
    // Add spacing after punctuation if missing
    result = result.replace(/([.!?।॥])([A-Za-z\u0900-\u097F])/g, "$1 $2");
    // Capitalize first letter of sentences
    result = result.replace(/(^|[.!?।॥]\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());
    return result;
}
//# sourceMappingURL=textProcessing.js.map