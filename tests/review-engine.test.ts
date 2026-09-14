import { describe, expect, it } from "vitest";

import { buildHabitProfile } from "@/lib/habits-analyzer";
import { parseCode } from "@/lib/parser";
import { buildReviewIssues } from "@/lib/review-engine";
import { buildTrendSummary } from "@/lib/trend-analyzer";
import { MemoryManager } from "@/services/memory-manager";

describe("buildReviewIssues", () => {
  it("creates an architecture issue for heavy routes", async () => {
    const code = `
@bp.route("/orders", methods=["POST"])
def create_order():
    payload = request.get_json()
    repo.insert(payload)
`;
    const manager = new MemoryManager();
    const history = await manager.getUserHistory("demo_user");
    const issues = buildReviewIssues({
      codeText: code,
      analysis: parseCode(code, "python"),
      userLevel: "intermediate",
      memoryEnabled: true,
      relevantMemories: await manager.getRelevantMemories(code, "python"),
      similarPastIssues: await manager.getSimilarPastIssues(code, "python"),
      trendSummary: buildTrendSummary(history, [], 60),
      habitProfile: buildHabitProfile(history),
    });

    expect(issues.some((issue) => issue.category === "architecture")).toBe(true);
  });

  it("makes memory-on reviews more team-aware than memory-off reviews", async () => {
    const code = `
@bp.route("/orders", methods=["POST"])
def create_order():
    payload = request.get_json() or {}
    total = 0
    for item in payload.get("items", []):
        total += item["price"]
    repo.insert(payload)
    return {"total": total}
`;
    const manager = new MemoryManager();
    const history = await manager.getUserHistory("demo_user");
    const analysis = parseCode(code, "python");
    const relevantMemories = await manager.getRelevantMemories(code, "python", "demo_user");
    const similarPastIssues = await manager.getSimilarPastIssues(code, "python");
    const trendSummary = buildTrendSummary(history, [], 60);
    const habitProfile = buildHabitProfile(history);

    const baselineIssues = buildReviewIssues({
      codeText: code,
      analysis,
      userLevel: "intermediate",
      memoryEnabled: false,
      relevantMemories: [],
      similarPastIssues: [],
      trendSummary,
      habitProfile,
    });

    const memoryIssues = buildReviewIssues({
      codeText: code,
      analysis,
      userLevel: "intermediate",
      memoryEnabled: true,
      relevantMemories,
      similarPastIssues,
      trendSummary,
      habitProfile,
    });

    expect(baselineIssues[0]?.explanation).toContain("baseline review is intentionally generic");
    expect(memoryIssues[0]?.explanation).toContain("Team memory matched");
  });

  it("adapts explanation style clearly for beginner and advanced reviewers", async () => {
    const code = `
def register_user(payload, repo):
    email = payload["email"]
    return repo.save_user({"email": email})
`;
    const manager = new MemoryManager();
    const history = await manager.getUserHistory("demo_user");
    const analysis = parseCode(code, "python");
    const trendSummary = buildTrendSummary(history, [], 60);
    const habitProfile = buildHabitProfile(history);

    const beginnerIssues = buildReviewIssues({
      codeText: code,
      analysis,
      userLevel: "beginner",
      memoryEnabled: false,
      relevantMemories: [],
      similarPastIssues: [],
      trendSummary,
      habitProfile,
    });

    const advancedIssues = buildReviewIssues({
      codeText: code,
      analysis,
      userLevel: "advanced",
      memoryEnabled: false,
      relevantMemories: [],
      similarPastIssues: [],
      trendSummary,
      habitProfile,
    });

    expect(beginnerIssues[0]?.explanation).toContain("Beginner coaching:");
    expect(advancedIssues[0]?.explanation).toContain("Advanced review:");
  });
});
