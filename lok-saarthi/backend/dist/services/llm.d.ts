export type AskLLMOptions = {
    /** For vision/OCR: base64-encoded image or document */
    imageBase64?: string;
    /** MIME type when imageBase64 is provided (e.g. image/png, application/pdf) */
    mimeType?: string;
    /** Request JSON-only response and strip markdown code blocks */
    json?: boolean;
    /** Prefer fastest model: try OpenAI o3-mini first, then Gemini (for document simplification speed) */
    preferFast?: boolean;
};
/**
 * Single LLM entry point: Gemini (model discovered via ListModels) primary, OpenAI fallback when configured.
 * Uses your key's actual model list to avoid 404; only uses OpenAI if OPENAI_API_KEY is a real key.
 */
export declare function askLLM(prompt: string, options?: AskLLMOptions): Promise<string>;
