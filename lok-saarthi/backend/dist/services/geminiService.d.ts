/**
 * Thin wrapper over askLLM for backward compatibility.
 * All text and vision generation goes through askLLM (Gemini 1.5 Flash + OpenAI fallback).
 */
export declare class GeminiService {
    generateJson(prompt: string): Promise<string>;
    generateText(prompt: string): Promise<string>;
    extractTextFromImage(filePath: string, language: string): Promise<string>;
}
export declare const geminiService: GeminiService;
