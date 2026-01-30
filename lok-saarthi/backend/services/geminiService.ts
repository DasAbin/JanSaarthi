import fs from "fs/promises";
import path from "path";
import { askLLM } from "./llm";

/**
 * Thin wrapper over askLLM for backward compatibility.
 * All text and vision generation goes through askLLM (Gemini 1.5 Flash + OpenAI fallback).
 */
export class GeminiService {
  async generateJson(prompt: string): Promise<string> {
    try {
      return await askLLM(prompt, { json: true });
    } catch (error) {
      console.error("GeminiService.generateJson error:", error);
      return JSON.stringify({
        summary: "AI summary unavailable. Check GEMINI_API_KEY and OPENAI_API_KEY.",
        eli10: "Configure API keys for detailed explanations.",
        keyPoints: ["Set GEMINI_API_KEY and OPENAI_API_KEY in .env"],
        steps: ["Set up API keys", "Restart server"]
      });
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      return await askLLM(prompt);
    } catch (error) {
      console.error("GeminiService.generateText error:", error);
      return "AI response unavailable. Check API keys.";
    }
  }

  async extractTextFromImage(filePath: string, language: string): Promise<string> {
    try {
      await fs.access(filePath);
      const fileData = await fs.readFile(filePath);
      const base64Data = fileData.toString("base64");

      const ext = path.extname(filePath).toLowerCase();
      let mimeType = "image/png";
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".pdf") mimeType = "application/pdf";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".gif") mimeType = "image/gif";

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

      const text = await askLLM(prompt, {
        imageBase64: base64Data,
        mimeType
      });
      return text || "No text could be extracted.";
    } catch (error) {
      console.error("GeminiService.extractTextFromImage error:", error);
      return `Error extracting text: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
}

export const geminiService = new GeminiService();
