"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = exports.GeminiService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const llm_1 = require("./llm");
/**
 * Thin wrapper over askLLM for backward compatibility.
 * All text and vision generation goes through askLLM (Gemini 1.5 Flash + OpenAI fallback).
 */
class GeminiService {
    async generateJson(prompt) {
        try {
            return await (0, llm_1.askLLM)(prompt, { json: true });
        }
        catch (error) {
            console.error("GeminiService.generateJson error:", error);
            return JSON.stringify({
                summary: "AI summary unavailable. Check GEMINI_API_KEY and OPENAI_API_KEY.",
                eli10: "Configure API keys for detailed explanations.",
                keyPoints: ["Set GEMINI_API_KEY and OPENAI_API_KEY in .env"],
                steps: ["Set up API keys", "Restart server"]
            });
        }
    }
    async generateText(prompt) {
        try {
            return await (0, llm_1.askLLM)(prompt);
        }
        catch (error) {
            console.error("GeminiService.generateText error:", error);
            return "AI response unavailable. Check API keys.";
        }
    }
    async extractTextFromImage(filePath, language) {
        try {
            await promises_1.default.access(filePath);
            const fileData = await promises_1.default.readFile(filePath);
            const base64Data = fileData.toString("base64");
            const ext = path_1.default.extname(filePath).toLowerCase();
            let mimeType = "image/png";
            if (ext === ".jpg" || ext === ".jpeg")
                mimeType = "image/jpeg";
            else if (ext === ".pdf")
                mimeType = "application/pdf";
            else if (ext === ".webp")
                mimeType = "image/webp";
            else if (ext === ".gif")
                mimeType = "image/gif";
            const fileSizeMB = fileData.length / (1024 * 1024);
            if (mimeType === "application/pdf" && fileSizeMB > 2) {
                return `Error: PDF too large (${fileSizeMB.toFixed(2)}MB). Max 2MB.`;
            }
            if (fileSizeMB > 20) {
                return `Error: File too large (${fileSizeMB.toFixed(2)}MB). Max 20MB.`;
            }
            const prompt = `Extract all text from this document/image.
Preserve structure, line breaks, and formatting.
If multiple languages (English, Hindi, Marathi, etc.), extract all.
Return only extracted text, no explanations.`;
            const text = await (0, llm_1.askLLM)(prompt, {
                imageBase64: base64Data,
                mimeType
            });
            return text || "No text could be extracted.";
        }
        catch (error) {
            console.error("GeminiService.extractTextFromImage error:", error);
            return `Error extracting text: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }
}
exports.GeminiService = GeminiService;
exports.geminiService = new GeminiService();
//# sourceMappingURL=geminiService.js.map