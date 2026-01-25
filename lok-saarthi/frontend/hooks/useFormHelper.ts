"use client";

import { useMutation } from "@tanstack/react-query";
import { explainForm } from "../app/api/client";

export function useFormHelper() {
  return useMutation({
    mutationFn: async ({ image }: { image: File }) => {
      const res = await explainForm(image);
      return res.data;
    }
  });
}

