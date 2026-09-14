import { describe, expect, it } from "vitest";

import { calculateScores } from "@/lib/scoring";
import type { ReviewIssue } from "@/lib/models";

describe("calculateScores", () => {
  it("penalizes high severity issues", () => {
    const issues: ReviewIssue[] = [
      {
        id: "1",
        title: "Heavy route",
        severity: "high",
        category: "architecture",
        explanation: "",
        whyItMatters: "",
        suggestion: "",
        fixExample: "",
        architectureGuidance: "",
        learningNote: "",
        similarFixPattern: "",
        memoryUsed: [],
        repeatedIssue: false,
        similarPastIssue: false,
        architectureMatch: true,
        seenBefore: false,
      },
    ];
    const scores = calculateScores(issues, 70);
    expect(scores.overall).toBeLessThan(90);
    expect(scores.previousOverall).toBe(70);
    expect(scores.architectureAlignment).toBeLessThan(100);
  });

  it("returns explicit perfect scores when no issues are detected", () => {
    const scores = calculateScores([], 92);
    expect(scores.overall).toBe(100);
    expect(scores.reliability).toBe(100);
    expect(scores.maintainability).toBe(100);
    expect(scores.readability).toBe(100);
    expect(scores.architectureAlignment).toBe(100);
    expect(scores.teamAlignment).toBe(100);
  });
});
