"use client";

import { useMutation } from "@tanstack/react-query";
import { explainForm } from "../app/api/client";

export function useFormHelper() {
  return useMutation({
    mutationFn: async ({ image, language = "en" }: { image: File; language?: string }) => {
      const res = await explainForm(image, language);
      return res.data;
    }
  });
}

