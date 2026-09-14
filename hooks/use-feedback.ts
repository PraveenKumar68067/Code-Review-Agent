"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type FeedbackPayload = {
  issueId: string;
  issueTitle: string;
  action: string;
  category: string;
  userId: string;
  workspaceId: string;
  notes?: string;
  language?: string;
};

export function useFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FeedbackPayload) => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Feedback request failed");
      }
      return data;
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["history", variables.userId, variables.workspaceId],
      });
    },
  });
}
