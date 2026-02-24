"use client";

import { useMutation } from "@tanstack/react-query";
import { askQuestion } from "../app/api/client";

export function useAskChat() {
  return useMutation({
    mutationFn: async (params: { question: string; language?: string; userProfile?: Record<string, unknown> }) => {
      const res = await askQuestion(params.question, {
        language: params.language ?? "en",
        userProfile: params.userProfile
      });
      return res.data;
    }
  });
}
