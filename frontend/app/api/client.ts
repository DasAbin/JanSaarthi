import axios from "axios";

const ENV_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();
// Default to same-origin in the browser (works behind a reverse proxy on AWS)
// and localhost in server/SSR contexts.
const BACKEND_BASE_URL =
  ENV_URL || (typeof window !== "undefined" ? "" : "http://localhost:4000");

export const api = axios.create({
  baseURL: BACKEND_BASE_URL || undefined
});

export function simplifyDocument(payload: {
  file: File;
  language: string;
}) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("language", payload.language);

  return api.post("/api/simplify", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function checkYojana(profile: Record<string, unknown>) {
  return api.post("/api/yojana/check", profile);
}

export function explainForm(image: File, language = "en") {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("language", language);

  return api.post("/api/form-helper", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function listModules() {
  return api.get<{ modules: { id: string; title: string; description: string }[] }>("/api/learn");
}

export function fetchModule(moduleId: string) {
  return api.get(`/api/learn/${moduleId}`);
}

/** STT: send audio blob via FormData (audio/webm;codecs=opus). Backend uses Vosk then Gemini. */
export function stt(audio: Blob, language = "en-IN") {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  formData.append("language", language);
  return api.post("/api/voice/stt", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

/** TTS POST (for compatibility). */
export function tts(text: string, lang = "en") {
  return api.post("/api/voice/tts", {
    text,
    languageCode: lang.includes("-") ? lang : `${lang}-IN`,
    lang
  });
}

/** TTS GET — low-bandwidth: no body, returns base64 audio. Prefer for Listen feature. */
export function ttsGet(text: string, lang = "en") {
  const code = lang.includes("-") ? lang : `${lang}-IN`;
  return api.get<{ audioBase64?: string; format?: string; language?: string; engine?: string }>("/api/voice/tts", {
    params: { text, lang: code }
  });
}

/** Ask: conversational Q&A about government schemes. */
export function askQuestion(question: string, options?: { language?: string; userProfile?: Record<string, unknown> }) {
  return api.post<{ answer: string; sources?: { schemeId?: string; schemeName?: string; excerpt?: string }[] }>(
    "/api/ask",
    { question, language: options?.language ?? "en", userProfile: options?.userProfile }
  );
}/** List schemes for comparison. */
export function listSchemes() {
  return api.get<{ schemes: { id: string; name: string; category?: string }[] }>("/api/yojana");
}/** Compare schemes by IDs. */
export function compareSchemes(schemeIds: string[]) {
  return api.post<{ schemes: Array<Record<string, unknown>> }>("/api/yojana/compare", { schemeIds });
}
