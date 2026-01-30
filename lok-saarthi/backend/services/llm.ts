import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "o3-mini";

// Cached model ID discovered from ListModels (avoids 404 for keys with different model names)
let cachedGeminiModelId: string | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY in .env");
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/** Call Gemini REST API to list models your key can use; prefer flash, then generateContent. */
async function getWorkingGeminiModelId(): Promise<string> {
  if (cachedGeminiModelId) return cachedGeminiModelId;

  const explicit = (process.env.GEMINI_MODEL || "").trim();
  if (explicit) {
    cachedGeminiModelId = explicit.replace(/^models\//, "");
    return cachedGeminiModelId;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in .env");

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[LLM] ListModels failed", res.status, "(will not cache fallback)");
      return "gemini-1.5-flash"; // try once, don't cache
    }
    const json = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const models = Array.isArray(json.models) ? json.models : [];
    const withGenerate = models.filter(
      (m) => m.name && (m.supportedGenerationMethods || []).includes("generateContent")
    );
    // Prefer flash > pro, strip "models/" prefix
    const byPreference = withGenerate.sort((a, b) => {
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      if (an.includes("flash") && !bn.includes("flash")) return -1;
      if (!an.includes("flash") && bn.includes("flash")) return 1;
      return 0;
    });
    const chosen = byPreference[0]?.name?.replace(/^models\//, "");
    if (chosen) {
      cachedGeminiModelId = chosen;
      console.log("[LLM] Using discovered Gemini model:", chosen);
      return chosen;
    }
  } catch (e) {
    console.warn("[LLM] ListModels error", (e as Error)?.message);
  }

  // No cache: return fallback so we try once; on 404 cache is cleared and next request retries ListModels
  return "gemini-1.5-flash";
}

function hasRealOpenAIKey(): boolean {
  const key = process.env.OPENAI_API_KEY || "";
  return key.length > 20 && !/your_?openai|placeholder|here\s*$/i.test(key);
}

function getOpenAI(): OpenAI | null {
  if (!hasRealOpenAIKey()) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

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

function stripJsonMarkdown(text: string): string {
  let t = text.trim();
  if (t.startsWith("```json")) t = t.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  else if (t.startsWith("```")) t = t.replace(/^```\s*/, "").replace(/\s*```$/, "");
  return t;
}

/**
 * Single LLM entry point: Gemini (model discovered via ListModels) primary, OpenAI fallback when configured.
 * Uses your key's actual model list to avoid 404; only uses OpenAI if OPENAI_API_KEY is a real key.
 */
export async function askLLM(prompt: string, options?: AskLLMOptions): Promise<string> {
  const opts = options || {};
  const wantsJson = opts.json === true;

  // When preferFast: try OpenAI o3-mini first (fastest), then Gemini
  if (opts.preferFast && !opts.imageBase64) {
    const openai = getOpenAI();
    if (openai) {
      try {
        let completion = await openai.chat.completions.create({
          model: OPENAI_FALLBACK_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096
        });
        let output = completion.choices[0]?.message?.content?.trim() || "";
        if (!output && OPENAI_FALLBACK_MODEL === "o3-mini") {
          try {
            completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 4096
            });
            output = completion.choices[0]?.message?.content?.trim() || "";
          } catch {
            // ignore
          }
        }
        if (wantsJson && output) return stripJsonMarkdown(output);
        if (output) return output;
      } catch {
        // fall through to Gemini
      }
    }
  }

  // 1) Use Gemini with model ID from ListModels (or GEMINI_MODEL env)
  let lastErr: unknown;
  try {
    const modelId = await getWorkingGeminiModelId();
    console.log("[LLM] Using Gemini", modelId);
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: modelId });

    let result: { response: { text: () => string } };
    if (opts.imageBase64 && opts.mimeType) {
      const fullPrompt = wantsJson
        ? `${prompt}\n\nImportant: Return ONLY valid JSON, no markdown, no code blocks, just the raw JSON.`
        : prompt;
      result = await model.generateContent([
        fullPrompt,
        { inlineData: { data: opts.imageBase64, mimeType: opts.mimeType } }
      ]);
    } else {
      const fullPrompt = wantsJson
        ? `${prompt}\n\nImportant: Return ONLY valid JSON, no markdown, no code blocks, just the raw JSON.`
        : prompt;
      result = await model.generateContent(fullPrompt);
    }

    const text = result.response.text().trim();
    if (wantsJson && text) return stripJsonMarkdown(text);
    return text;
  } catch (err) {
    lastErr = err;
    // If 404, clear cache so next request can try ListModels again (in case env changed)
    cachedGeminiModelId = null;
    console.error("[LLM] Gemini failed", (err as Error)?.message || err);
  }

  // 2) Fallback: OpenAI only if a real API key is set (not placeholder)
  const openai = getOpenAI();
  if (openai) {
    try {
      console.log("[LLM] Gemini failed → falling back to OpenAI");
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "user", content: [] }];
      const textContent: OpenAI.Chat.ChatCompletionContentPartText = { type: "text", text: prompt };
      const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [textContent];

      const isImageOrPdf = opts.mimeType && (opts.mimeType.startsWith("image/") || opts.mimeType === "application/pdf");
      if (opts.imageBase64 && isImageOrPdf) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${opts.mimeType};base64,${opts.imageBase64}` }
        });
      }
      (messages[0] as OpenAI.Chat.ChatCompletionUserMessageParam).content = contentParts;

      let completion = await openai.chat.completions.create({
        model: OPENAI_FALLBACK_MODEL,
        messages,
        max_tokens: 4096
      });

      let output = completion.choices[0]?.message?.content?.trim() || "";
      if (!output && OPENAI_FALLBACK_MODEL === "o3-mini") {
        try {
          completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 4096
          });
          output = completion.choices[0]?.message?.content?.trim() || "";
        } catch {
          // ignore
        }
      }
      if (wantsJson && output) output = stripJsonMarkdown(output);
      return output;
    } catch (openaiErr) {
      if (OPENAI_FALLBACK_MODEL === "o3-mini") {
        try {
          const openai2 = getOpenAI();
          if (openai2) {
            const completion = await openai2.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 4096
            });
            let output = completion.choices[0]?.message?.content?.trim() || "";
            if (wantsJson && output) output = stripJsonMarkdown(output);
            return output;
          }
        } catch {
          // fall through
        }
      }
      console.error("[LLM] OpenAI fallback failed", (openaiErr as Error)?.message || openaiErr);
    }
  } else {
    console.error("[LLM] OpenAI fallback skipped (no valid OPENAI_API_KEY in .env)");
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
