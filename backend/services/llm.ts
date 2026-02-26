import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || "o3-mini";
const BEDROCK_MODEL_ID = (process.env.BEDROCK_MODEL_ID || "").trim();

// Cached model ID discovered from ListModels (avoids 404 for keys with different model names)
let cachedGeminiModelId: string | null = null;

function hasGeminiKey(): boolean {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  return key.length > 10 && !/your_?gemini|placeholder|here\s*$/i.test(key);
}

function hasBedrockConfigured(): boolean {
  return BEDROCK_MODEL_ID.length > 0;
}

function getGenAI(): GoogleGenerativeAI {
  if (!hasGeminiKey()) throw new Error("Missing GEMINI_API_KEY in .env");
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
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

export function isLLMConfigured(): boolean {
  return hasBedrockConfigured() || hasGeminiKey() || hasRealOpenAIKey();
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

function is429(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return e?.status === 429 || (typeof e?.message === "string" && e.message.includes("429"));
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return "{}";
  }
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function extractBlock(prompt: string, label: string, maxChars: number): string {
  const idx = prompt.toLowerCase().indexOf(label.toLowerCase());
  if (idx < 0) return "";
  const after = prompt.slice(idx + label.length);
  return normalizeWhitespace(after).slice(0, maxChars);
}

function splitSentences(text: string): string[] {
  const t = normalizeWhitespace(text);
  if (!t) return [];
  // Simple heuristic sentence split that works "ok" for English/Indic mixed text.
  const parts = t
    .split(/(?<=[.!?।])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [t];
}

function pickKeyPoints(text: string, max: number): string[] {
  const t = normalizeWhitespace(text);
  if (!t) return [];

  const lines = t
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 10 && l.length <= 180);

  const scored = lines.map((l) => {
    const low = l.toLowerCase();
    let score = 0;
    if (/required|must|eligib|benefit|apply|document|deadline|fee|amount|limit|address|aadhaar|income|age/.test(low))
      score += 3;
    if (/^\d+[\).\s]/.test(l) || /^[-*•]/.test(l)) score += 2;
    if (/[₹$]\s*\d/.test(l)) score += 1;
    score += Math.min(2, Math.floor(l.length / 80));
    return { l, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const uniq: string[] = [];
  for (const s of scored) {
    if (uniq.length >= max) break;
    const key = s.l.toLowerCase();
    if (uniq.some((u) => u.toLowerCase() === key)) continue;
    uniq.push(s.l.replace(/^[-*•]\s*/, ""));
  }
  return uniq;
}

function pickSteps(text: string, max: number): string[] {
  const t = normalizeWhitespace(text);
  const candidates = t
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+[\).\s]/.test(l) || /^step\s*\d+/i.test(l));

  const cleaned = candidates.map((c) => c.replace(/^\s*(step\s*)?\d+[\).\s-]*/i, "").trim()).filter(Boolean);
  const uniq = Array.from(new Set(cleaned)).slice(0, max);
  if (uniq.length >= 2) return uniq;
  // Generic civic steps fallback
  return [
    "Gather required documents (ID proof, address proof, income proof)",
    "Visit the official portal or your nearest CSC (Common Service Centre)",
    "Fill the application carefully and attach documents",
    "Submit and note the acknowledgment/reference number",
    "Follow up via helpline/office if you don’t get updates"
  ].slice(0, max);
}

function languageTag(prompt: string): "hi" | "mr" | "en" {
  const p = prompt.toLowerCase();
  if (p.includes("respond in hindi") || p.includes("हिंदी")) return "hi";
  if (p.includes("respond in marathi") || p.includes("मराठी")) return "mr";
  return "en";
}

function offlineText(prompt: string): string {
  const lang = languageTag(prompt);
  const questionMatch = /question:\s*(.+)$/im.exec(prompt);
  const question = (questionMatch?.[1] || "").trim();

  if (lang === "hi") {
    return [
      question ? `आपका सवाल: ${question}` : "आपका सवाल मिला।",
      "इस डेमो में AI API key सेट नहीं है, इसलिए मैं ऑफ़लाइन/लोकल ज्ञान के आधार पर संक्षिप्त मदद दे रहा/रही हूँ।",
      "कृपया योजना/फॉर्म के नाम, राज्य और आपकी आय/उम्र जैसी जानकारी दें ताकि मैं बेहतर मार्गदर्शन दे सकूँ।",
      "यदि आप चाहें तो नज़दीकी CSC (कॉमन सर्विस सेंटर) या संबंधित सरकारी कार्यालय में भी सहायता मिल सकती है।"
    ].join("\n\n");
  }
  if (lang === "mr") {
    return [
      question ? `तुमचा प्रश्न: ${question}` : "तुमचा प्रश्न मिळाला.",
      "या डेमोमध्ये AI API key सेट केलेली नाही, त्यामुळे मी ऑफलाइन/लोकल माहितीवर आधारित थोडक्यात मदत देत आहे.",
      "योजना/फॉर्मचे नाव, राज्य आणि तुमचे उत्पन्न/वय दिल्यास मी अधिक अचूक मार्गदर्शन करू शकतो.",
      "गरज असल्यास जवळच्या CSC (कॉमन सर्व्हिस सेंटर) मध्ये मदत मिळू शकते."
    ].join("\n\n");
  }
  return [
    question ? `Your question: ${question}` : "Got your question.",
    "This demo is running without an AI API key, so I’m responding using an offline fallback.",
    "Share your state, age, income, and the scheme/form name for more precise guidance.",
    "For official help, you can also visit a nearby CSC (Common Service Centre) or the relevant government office."
  ].join("\n\n");
}

function offlineJson(prompt: string): string {
  const lang = languageTag(prompt);
  const text =
    extractBlock(prompt, "Full text excerpt:", 9000) ||
    extractBlock(prompt, "I extracted the following text", 9000) ||
    extractBlock(prompt, "Context:", 9000) ||
    prompt.slice(0, 6000);

  const sentences = splitSentences(text);
  const summary = sentences.slice(0, 2).join(" ").slice(0, 400) || "Summary not available.";

  const eli10 =
    lang === "hi"
      ? "सरल भाषा में: यह दस्तावेज़/फॉर्म सरकार की किसी सेवा/योजना से जुड़ा है। मुख्य बातों को नीचे सरल रूप में बताया गया है।"
      : lang === "mr"
        ? "सोप्या भाषेत: हा दस्तऐवज/फॉर्म सरकारी सेवा/योजनेसंबंधी आहे. मुख्य मुद्दे खाली सोप्या पद्धतीने दिले आहेत."
        : "In simple words: this document/form is about a government service/scheme. The key points are listed below.";

  const keyPoints = pickKeyPoints(text, 5);
  const steps = pickSteps(text, 5);

  // Form-style response shape (title/fields/tips) if prompt looks like a form helper request
  if (prompt.toLowerCase().includes("\"fields\"") && prompt.toLowerCase().includes("identify all the fields")) {
    const fields = [
      { field: lang === "hi" ? "नाम (Name)" : lang === "mr" ? "नाव (Name)" : "Name", meaning: "Your full name as per ID", example: "Rahul Kumar", required: true, tips: "Use the same spelling as Aadhaar/ID" },
      { field: lang === "hi" ? "पता (Address)" : lang === "mr" ? "पत्ता (Address)" : "Address", meaning: "Your current address", example: "Village, Post, District, State", required: true, tips: "Include PIN code" },
      { field: "Mobile Number", meaning: "10-digit phone number", example: "98XXXXXXXX", required: true, tips: "Use a number linked to your ID if possible" },
      { field: lang === "hi" ? "जन्म तिथि (DOB)" : lang === "mr" ? "जन्मतारीख (DOB)" : "Date of Birth", meaning: "Birth date", example: "DD/MM/YYYY", required: true, tips: "Match your documents" },
      { field: "Signature / Thumb", meaning: "Sign or thumb impression", example: "Signature", required: true, tips: "Sign inside the box" }
    ];

    return safeJsonStringify({
      title: "Government Form",
      description: "Offline analysis (AI key not configured). Detected common fields.",
      fields,
      tips: [
        "Fill all required fields carefully",
        "Keep photocopies of all documents",
        "Submit at the portal/office/CSC and keep acknowledgment"
      ]
    });
  }

  // Summary-style response shape (summary/eli10/keyPoints/steps)
  return safeJsonStringify({
    summary,
    eli10,
    keyPoints,
    steps
  });
}

function offlineFallback(prompt: string, options?: AskLLMOptions): string {
  const opts = options || {};
  if (opts.json) return offlineJson(prompt);
  // If user tried to pass an audio/image, be explicit that offline fallback can't parse it.
  if (opts.imageBase64 && opts.mimeType?.startsWith("audio/")) return "[Audio unclear]";
  if (opts.imageBase64 && (opts.mimeType?.startsWith("image/") || opts.mimeType === "application/pdf"))
    return "Offline mode: OCR/vision is not configured. Please enable OCR engine or AI keys, or upload a text-based PDF.";
  return offlineText(prompt);
}

async function askBedrock(prompt: string, wantsJson: boolean): Promise<string> {
  if (!hasBedrockConfigured()) throw new Error("Missing BEDROCK_MODEL_ID in .env");

  const region = (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1").trim();
  const client = new BedrockRuntimeClient({ region });

  const finalPrompt = wantsJson
    ? `${prompt}\n\nImportant: Return ONLY valid JSON, no markdown, no code blocks, just the raw JSON.`
    : prompt;

  const res = await client.send(
    new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [
        {
          role: "user",
          content: [{ text: finalPrompt }]
        }
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.2
      }
    })
  );

  const content = res.output?.message?.content || [];
  const text = content.map((c) => ("text" in c && typeof c.text === "string" ? c.text : "")).join("").trim();
  if (!text) throw new Error("Empty Bedrock response");
  return wantsJson ? stripJsonMarkdown(text) : text;
}

/**
 * Single LLM entry point: Gemini (model discovered via ListModels) primary, OpenAI fallback when configured.
 * Uses your key's actual model list to avoid 404; only uses OpenAI if OPENAI_API_KEY is a real key.
 */
export async function askLLM(prompt: string, options?: AskLLMOptions): Promise<string> {
  const opts = options || {};
  const wantsJson = opts.json === true;

  // Offline fallback: keep the demo fully working without any API keys.
  if (!isLLMConfigured()) {
    return offlineFallback(prompt, opts);
  }

  // Prefer AWS Bedrock when configured (no external API keys; works great on AWS)
  // Note: we only support text prompts here; image/audio stays on Gemini/offline.
  if (hasBedrockConfigured() && !opts.imageBase64) {
    try {
      return await askBedrock(prompt, wantsJson);
    } catch (e) {
      console.warn("[LLM] Bedrock failed, falling back:", (e as Error)?.message || e);
    }
  }

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

  // 1) Use Gemini with model ID from ListModels (or GEMINI_MODEL env); retry once on 429
  let lastErr: unknown;
  const maxGeminiAttempts = 2;
  for (let attempt = 1; attempt <= maxGeminiAttempts; attempt++) {
    try {
      const modelId = await getWorkingGeminiModelId();
      if (attempt === 1) console.log("[LLM] Using Gemini", modelId);
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
      if (is429(err) && attempt < maxGeminiAttempts) {
        const waitMs = 5200; // 5.2s to respect "retry in 4s"
        console.warn("[LLM] Rate limited (429), retrying after", waitMs / 1000, "s");
        await sleepMs(waitMs);
        continue;
      }
      if (!is429(err)) cachedGeminiModelId = null;
      console.error("[LLM] Gemini failed", (err as Error)?.message || err);
      break;
    }
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

  // If we had keys but providers failed (rate limits, outages), return a safe offline fallback.
  console.warn("[LLM] Providers failed; returning offline fallback");
  return offlineFallback(prompt, opts);
}
