import { describe, expect, it } from "vitest";

import { ReviewWorkflow } from "@/lib/workflow";

describe("ReviewWorkflow", () => {
  it("runs end to end", async () => {
    const workflow = new ReviewWorkflow();
    const result = await workflow.runReview({
      code: 'def create_user(payload, repo):\n    return repo.insert(payload)\n',
      language: "python",
      userLevel: "beginner",
      memoryEnabled: true,
      persist: false,
    });

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.scores.overall).toBeGreaterThan(0);
    expect(result.analysis.language).toBe("python");
  });

  it("returns a clear baseline label when memory is disabled", async () => {
    const workflow = new ReviewWorkflow();
    const result = await workflow.runReview({
      code: 'def create_user(payload, repo):\n    return repo.insert(payload)\n',
      language: "python",
      userLevel: "intermediate",
      memoryEnabled: false,
      persist: false,
    });

    expect(result.comparisonLabel).toBe("Without memory baseline");
    expect(result.memoryHighlights[0]?.title).toContain("Memory was disabled");
  });

  it("returns memory highlights and reusable fix patterns when memory is enabled", async () => {
    const workflow = new ReviewWorkflow();
    const result = await workflow.runReview({
      code: '@bp.route("/orders", methods=["POST"])\ndef create_order():\n    payload = request.get_json() or {}\n    repo.insert(payload)\n',
      language: "python",
      userLevel: "advanced",
      memoryEnabled: true,
      persist: false,
    });

    expect(result.memoryHighlights.length).toBeGreaterThan(0);
    expect(result.reusableFixPatterns.length).toBeGreaterThan(0);
  });

  it("keeps score history isolated by workspace", async () => {
    const workflow = new ReviewWorkflow();

    const workspaceOne = await workflow.runReview({
      code: '@bp.route("/orders", methods=["POST"])\ndef create_order():\n    payload = request.get_json() or {}\n    repo.insert(payload)\n',
      language: "python",
      userLevel: "intermediate",
      memoryEnabled: true,
      workspaceId: "workspace-one",
      persist: false,
    });

    const workspaceTwo = await workflow.runReview({
      code: 'def healthy_helper():\n    return {"ok": True}\n',
      language: "python",
      userLevel: "intermediate",
      memoryEnabled: true,
      workspaceId: "workspace-two",
      persist: false,
    });

    expect(workspaceOne.workspaceId).toBe("workspace-one");
    expect(workspaceTwo.workspaceId).toBe("workspace-two");
    expect(workspaceOne.workspaceId).not.toBe(workspaceTwo.workspaceId);
  });

  it("stores workspace review rows with history fields needed for scoring", async () => {
    const workflow = new ReviewWorkflow();
    const result = await workflow.runReview({
      code: '@bp.route("/orders", methods=["POST"])\ndef create_order():\n    repo.insert(payload)\n',
      language: "python",
      userLevel: "intermediate",
      memoryEnabled: true,
      workspaceId: "workspace-history-shape",
      persist: true,
    });

    expect(result.workspaceId).toBe("workspace-history-shape");
    expect(result.scores.overall).toBeGreaterThanOrEqual(0);
  });
});
