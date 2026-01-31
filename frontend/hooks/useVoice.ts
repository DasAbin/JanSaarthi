"use client";

import { useMutation } from "@tanstack/react-query";
import { stt, ttsGet } from "../app/api/client";

/** Multilingual TTS/STT: Indian languages for Listen and Tap to Speak. */
export const VOICE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी (Hindi)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "or", name: "ଓଡ଼ିଆ (Odia)" }
] as const;

export function useSTT() {
  return useMutation({
    mutationFn: async ({ audio, language }: { audio: Blob; language?: string }) => {
      const res = await stt(audio, language || "en-IN");
      return res.data as { text: string; engine?: string };
    }
  });
}

/** TTS: uses GET /api/voice/tts?text=...&lang=xx (low-bandwidth). Returns base64 audio or empty for browser fallback. */
export function useTTS() {
  return useMutation({
    mutationFn: async ({ text, lang = "en" }: { text: string; lang?: string }) => {
      const res = await ttsGet(text, lang);
      const data = res.data;
      const format = (data?.format || "wav").replace("audio/", "") || "wav";
      const audioUrl = data?.audioBase64
        ? `data:audio/${format};base64,${data.audioBase64}`
        : "";
      return { audioUrl, ...data };
    }
  });
}

