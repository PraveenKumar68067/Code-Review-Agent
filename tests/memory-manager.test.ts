import { describe, expect, it } from "vitest";

import { MemoryManager } from "@/services/memory-manager";

describe("MemoryManager", () => {
  it("returns relevant memories", async () => {
    const manager = new MemoryManager();
    const memories = await manager.getRelevantMemories("route handler calls repo and skips validation", "python");
    expect(memories.length).toBeGreaterThan(0);
    expect(memories.some((item) => ["architecture", "validation"].includes(item.category))).toBe(true);
  });

  it("returns reviews isolated to the requested workspace", async () => {
    const manager = new MemoryManager();

    const defaultHistory = await manager.getUserHistory("demo_user", "workspace-default");
    const otherHistory = await manager.getUserHistory("demo_user", "workspace-1776473585389");

    expect(defaultHistory.workspaceId).toBe("workspace-default");
    expect(otherHistory.workspaceId).toBe("workspace-1776473585389");
    expect(defaultHistory.reviews.every((review) => review.workspaceId === "workspace-default")).toBe(true);
    expect(otherHistory.reviews.every((review) => review.workspaceId === "workspace-1776473585389")).toBe(true);
  });
});
