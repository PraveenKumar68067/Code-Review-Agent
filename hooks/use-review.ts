"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ReviewResult } from "@/lib/models";

type ReviewPayload = {
  code: string;
  diff: string;
  language: string;
  userLevel: "beginner" | "intermediate" | "advanced";
  memoryEnabled: boolean;
  userId: string;
  workspaceId: string;
  persist?: boolean;
};

export function useReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ReviewPayload) => {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { ok: boolean; data?: ReviewResult; error?: string };
      if (!response.ok || !data.ok || !data.data) {
        throw new Error(data.error ?? "Review request failed");
      }
      return data.data;
    },
    onSuccess: async (_result, variables) => {
      if (!variables.persist) return;
      await queryClient.invalidateQueries({
        queryKey: ["history", variables.userId, variables.workspaceId],
      });
    },
  });
}
