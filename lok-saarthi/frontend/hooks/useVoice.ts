"use client";

import { useMutation } from "@tanstack/react-query";
import { stt, tts } from "../app/api/client";

export function useSTT() {
  return useMutation({
    mutationFn: async (audio: Blob) => {
      const res = await stt(audio);
      return res.data as { text: string };
    }
  });
}

export function useTTS() {
  return useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const res = await tts(text);
      return res.data as { audioUrl: string };
    }
  });
}

