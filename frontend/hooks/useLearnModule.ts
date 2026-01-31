"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchModule } from "../app/api/client";

export function useLearnModule(moduleId: string) {
  return useQuery({
    queryKey: ["learn-module", moduleId],
    queryFn: async () => {
      const res = await fetchModule(moduleId);
      return res.data;
    }
  });
}

