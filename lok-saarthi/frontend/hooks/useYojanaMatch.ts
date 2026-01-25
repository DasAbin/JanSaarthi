"use client";

import { useMutation } from "@tanstack/react-query";
import { checkYojana } from "../app/api/client";

export function useYojanaMatch() {
  return useMutation({
    mutationFn: async (profile: Record<string, unknown>) => {
      const res = await checkYojana(profile);
      return res.data;
    }
  });
}

