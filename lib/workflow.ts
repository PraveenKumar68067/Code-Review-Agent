import { buildHabitProfile } from "@/lib/habits-analyzer";
import { parseCode } from "@/lib/parser";
import { buildReviewIssues } from "@/lib/review-engine";
import { calculateScores } from "@/lib/scoring";
import { buildTrendSummary } from "@/lib/trend-analyzer";
import type { ImprovementItem, ReviewResult, ReusableFixPattern } from "@/lib/models";
import { reviewRequestSchema } from "@/lib/models";
import { makeId } from "@/lib/utils";
import { MemoryManager } from "@/services/memory-manager";

function buildMemoryHighlights(memories: ReviewResult["memoriesUsed"], similarPastIssues: ReviewResult["similarPastIssues"]): ImprovementItem[] {
  const highlights: ImprovementItem[] = [];
  if (memories.length > 0) {
    highlights.push({
      title: `${memories.length} memory items influenced this review`,
      detail: `Top memories: ${memories.slice(0, 3).map((memory) => memory.title).join(", ")}`,
      direction: "up",
    });
  }
  if (similarPastIssues.length > 0) {
    highlights.push({
      title: `${similarPastIssues.length} similar past issues were matched`,
      detail: "The agent reused historical context instead of reviewing this code like a blank slate.",
      direction: "up",
    });
  }
  const acceptedPatterns = memories.filter((memory) => `${memory.metadata?.status ?? ""}`.includes("accept"));
  if (acceptedPatterns.length > 0) {
    highlights.push({
      title: `${acceptedPatterns.length} accepted fix patterns were reused`,
      detail: acceptedPatterns.slice(0, 2).map((item) => item.title).join(", "),
      direction: "up",
    });
  }
  const teamRules = memories.filter((memory) => memory.kind === "team_rule" || memory.kind === "architecture_preference");
  if (teamRules.length > 0) {
    highlights.push({
      title: `${teamRules.length} team rules were applied`,
      detail: teamRules.slice(0, 2).map((item) => item.title).join(", "),
      direction: "up",
    });
  }
  return highlights;
}

function buildImprovementSinceLastReview(
  scores: ReviewResult["scores"],
  trendSummary: ReviewResult["trendSummary"],
  habitProfile: ReviewResult["habitProfile"],
): ImprovementItem[] {
  const items: ImprovementItem[] = [
    {
      title: "Overall quality score movement",
      detail: scores.delta >= 0 ? `Up ${scores.delta} points since the last saved review.` : `Down ${Math.abs(scores.delta)} points since the last saved review.`,
      direction: scores.delta > 0 ? "up" : scores.delta < 0 ? "down" : "flat",
    },
  ];

  if (trendSummary.strengthAreas.length > 0) {
    items.push({
      title: "What improved most",
      detail: `Current strengths are strongest in ${trendSummary.strengthAreas.join(", ")}.`,
      direction: "up",
    });
  }

  if (habitProfile.weakHabits.length > 0) {
    items.push({
      title: "Still needs focus",
      detail: `The biggest habits still dragging scores are ${habitProfile.weakHabits.slice(0, 3).join(", ")}.`,
      direction: "flat",
    });
  }

  return items;
}

function buildRepeatedMistakes(issues: ReviewResult["issues"], similarPastIssues: ReviewResult["similarPastIssues"]): ImprovementItem[] {
  const repeated = issues.filter((issue) => issue.repeatedIssue || issue.similarPastIssue || issue.seenBefore);
  return repeated.slice(0, 4).map((issue) => {
    const relatedCount = similarPastIssues.filter((pastIssue) => pastIssue.category === issue.category).length;
    return {
      title: issue.title,
      detail: relatedCount > 0
        ? `This issue family has appeared ${relatedCount} time(s) in similar past reviews.`
        : "This issue lines up with a recurring pattern in review history.",
      direction: "down",
    };
  });
}

function buildReusableFixPatterns(result: Pick<ReviewResult, "issues" | "memoriesUsed">): ReusableFixPattern[] {
  const patterns: ReusableFixPattern[] = [];

  for (const issue of result.issues) {
    if (!issue.similarFixPattern && !issue.fixExample) continue;
    patterns.push({
      title: issue.title,
      category: issue.category,
      applyWhen: issue.repeatedIssue || issue.similarPastIssue
        ? "Use this when the same mistake shows up again in a similar route, service, or helper flow."
        : "Use this when another endpoint or backend module shows the same structural smell.",
      reusablePattern: issue.fixExample
        ? `${issue.similarFixPattern || "Refactor pattern"}\n\nSuggested starting point:\n${issue.fixExample}`
        : issue.similarFixPattern,
      source: issue.memoryUsed.length > 0 ? `Memory-backed: ${issue.memoryUsed.join(", ")}` : "Deterministic fallback pattern",
    });
  }

  for (const memory of result.memoriesUsed.filter((item) => item.kind === "optimization_pattern").slice(0, 2)) {
    patterns.push({
      title: memory.title,
      category: memory.category,
      applyWhen: "Use this when a future review matches the same category or structure.",
      reusablePattern: memory.content,
      source: `Accepted historical pattern from ${memory.source}`,
    });
  }

  return patterns.slice(0, 5);
}

export class ReviewWorkflow {
  constructor(private memoryManager = new MemoryManager()) {}

  async runReview(input: Partial<{
    code: string;
    diff: string;
    language: string;
    userLevel: "beginner" | "intermediate" | "advanced";
    userId: string;
    memoryEnabled: boolean;
    persist: boolean;
  }>): Promise<ReviewResult> {
    const request = reviewRequestSchema.parse(input);
    const analysis = parseCode(request.code, request.language, request.diff);
    const history = await this.memoryManager.getUserHistory(request.userId, request.workspaceId);
    const habitProfile = buildHabitProfile(history);
    const memories = request.memoryEnabled ? await this.memoryManager.getRelevantMemories(request.code, request.language, request.userId, request.workspaceId) : [];
    const similarPastIssues = request.memoryEnabled
      ? await this.memoryManager.getSimilarPastIssues(request.code, request.language, request.workspaceId)
      : [];
    const previousOverall = (history.trends.at(-1) as { overall?: number } | undefined)?.overall ?? 0;

    const provisionalTrend = buildTrendSummary(history, [], previousOverall || 60);
    const issues = buildReviewIssues({
      codeText: request.code,
      analysis,
      userLevel: request.userLevel,
      memoryEnabled: request.memoryEnabled,
      relevantMemories: memories,
      similarPastIssues,
      trendSummary: provisionalTrend,
      habitProfile,
    });

    const scores = calculateScores(issues, previousOverall);
    const trendSummary = buildTrendSummary(history, issues.map((issue) => issue.category), scores.overall);

    const result: ReviewResult = {
      reviewId: makeId("review"),
      userId: request.userId,
      workspaceId: request.workspaceId,
      language: request.language,
      userLevel: request.userLevel,
      memoryEnabled: request.memoryEnabled,
      issues,
      scores,
      trendSummary,
      habitProfile,
      memoriesUsed: memories,
      similarPastIssues,
      analysis,
      memoryHighlights: [],
      improvementSinceLastReview: [],
      repeatedMistakes: [],
      reusableFixPatterns: [],
      comparisonLabel: request.memoryEnabled ? "With team memory and review history" : "Without memory baseline",
    };

    result.memoryHighlights = request.memoryEnabled
      ? buildMemoryHighlights(result.memoriesUsed, result.similarPastIssues)
      : [
          {
            title: "Memory was disabled for this run",
            detail: "This baseline intentionally ignores team rules, prior feedback, and repeated mistakes so you can compare the lift afterward.",
            direction: "flat",
          },
        ];
    result.improvementSinceLastReview = buildImprovementSinceLastReview(result.scores, result.trendSummary, result.habitProfile);
    result.repeatedMistakes = buildRepeatedMistakes(result.issues, result.similarPastIssues);
    result.reusableFixPatterns = buildReusableFixPatterns(result);

    if (request.persist) {
      await this.persistResult(result);
    }

    return result;
  }

  private async persistResult(result: ReviewResult) {
    const reviewRow = {
      reviewId: result.reviewId,
      scope: "workspace",
      workspaceId: result.workspaceId,
      userId: result.userId,
      timestamp: new Date().toISOString(),
      language: result.language,
      summary: result.issues.slice(0, 3).map((issue) => issue.title).join("; "),
      issueCount: result.issues.length,
      issues: result.issues.map((issue) => ({
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        status: "open",
        keywords: issue.memoryUsed.length > 0 ? issue.memoryUsed : [issue.category],
      })),
      scores: {
        overall: result.scores.overall,
        maintainability: result.scores.maintainability,
        architectureAlignment: result.scores.architectureAlignment,
        reliability: result.scores.reliability,
        readability: result.scores.readability,
        teamAlignment: result.scores.teamAlignment,
      },
    };

    await this.memoryManager.saveReviewHistory(reviewRow);
    await this.memoryManager.updateUserTrends(result.userId, result.workspaceId, reviewRow.scores);
    await this.memoryManager.updateCodingHabits(result.userId, result.workspaceId, result.issues.map((issue) => ({ category: issue.category })));
  }
}
