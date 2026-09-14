import { describe, expect, it } from "vitest";

import { buildTrendSummary } from "@/lib/trend-analyzer";
import { MemoryManager } from "@/services/memory-manager";

describe("buildTrendSummary", () => {
  it("returns readable summary lines", async () => {
    const history = await new MemoryManager().getUserHistory("demo_user", "workspace-default");
    const trend = buildTrendSummary(history, ["reliability"], 68);
    expect(trend.summaryLines.length).toBeGreaterThan(0);
    expect(["improving", "stable", "declining"]).toContain(trend.scoreDirection);
  });
});
