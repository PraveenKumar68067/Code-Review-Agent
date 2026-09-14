"use client";

import { useQuery } from "@tanstack/react-query";

export function useHistory(userId: string, workspaceId: string) {
  return useQuery({
    queryKey: ["history", userId, workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/history?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = (await response.json()) as { ok: boolean; workspaceId?: string; data?: Record<string, unknown>; error?: string };
      if (!response.ok || !data.ok || !data.data || !data.workspaceId) {
        throw new Error(data.error ?? "History request failed");
      }
      return {
        workspaceId: data.workspaceId,
        history: data.data,
      };
    },
  });
}
