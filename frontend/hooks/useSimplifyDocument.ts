"use client";

import { useMutation } from "@tanstack/react-query";
import { simplifyDocument } from "../app/api/client";

interface SimplifyPayload {
  file: File;
  language: string;
}

export function useSimplifyDocument() {
  return useMutation({
    mutationFn: async ({ file, language }: SimplifyPayload) => {
      const res = await simplifyDocument({ file, language });
      return res.data;
    }
  });
}

