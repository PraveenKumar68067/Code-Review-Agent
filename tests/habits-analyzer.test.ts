import { describe, expect, it } from "vitest";

import { buildHabitProfile } from "@/lib/habits-analyzer";
import { MemoryManager } from "@/services/memory-manager";

describe("buildHabitProfile", () => {
  it("returns habit scores and weak habits", async () => {
    const history = await new MemoryManager().getUserHistory("demo_user");
    const profile = buildHabitProfile(history);
    expect(Object.keys(profile.habitScores).length).toBeGreaterThan(0);
    expect(Array.isArray(profile.weakHabits)).toBe(true);
  });
});
